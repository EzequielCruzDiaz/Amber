import "server-only";
import {
  type Alert,
  type CaseEvent,
  type Incident911,
  type Institution,
  MissingCase,
  type PublicCaseView,
  type Role,
  UnidentifiedRecord,
} from "@rb/domain";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Repository } from "./repository";

type Row = Record<string, unknown>;

const caseFromRow = (r: Row): MissingCase =>
  MissingCase.parse({
    id: r.id,
    fullName: r.full_name,
    sex: r.sex,
    ageYears: r.age_years,
    heightCm: r.height_cm,
    marks: r.marks,
    flags: r.flags,
    lastSeenAt: r.last_seen_at,
    lastSeenPlace: [r.lng, r.lat],
    municipality: r.municipality,
    province: r.province,
    circumstances: r.circumstances,
    channel: r.channel,
    status: r.status,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
  });

const recordFromRow = (r: Row): UnidentifiedRecord =>
  UnidentifiedRecord.parse({
    id: r.id,
    kind: r.kind,
    institutionId: r.institution_id,
    sex: r.sex,
    ageMin: r.age_min,
    ageMax: r.age_max,
    heightCm: r.height_cm,
    marks: r.marks,
    registeredAt: r.registered_at,
    location: [r.lng, r.lat],
    notes: r.notes,
    linkedCaseId: r.linked_case_id,
  });

/**
 * Implementación sobre Supabase. Usa el cliente con la sesión del usuario, así
 * que RLS decide qué filas llegan; este código nunca usa la service role key.
 */
export class SupabaseRepository implements Repository {
  constructor(private readonly db: SupabaseClient) {}

  async role(): Promise<Role> {
    const { data } = await this.db.rpc("current_app_role");
    return (data as Role | null) ?? "publico";
  }

  async listCases() {
    const { data, error } = await this.db
      .from("missing_cases_api")
      .select("*")
      .order("last_seen_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(caseFromRow);
  }

  async getCase(id: string) {
    const { data, error } = await this.db
      .from("missing_cases_api")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? caseFromRow(data) : null;
  }

  async listPublicCases(): Promise<PublicCaseView[]> {
    const { data, error } = await this.db.rpc("public_cases");
    if (error) throw error;
    return ((data as Row[] | null) ?? []).map((r) => ({
      id: String(r.id),
      displayName: String(r.display_name),
      ageYears: Number(r.age_years),
      sex: r.sex as PublicCaseView["sex"],
      municipality: String(r.municipality),
      province: String(r.province),
      lastSeenAt: String(r.last_seen_at),
      status: r.status as PublicCaseView["status"],
      isMinor: Boolean(r.is_minor),
    }));
  }

  async listOpenRecords() {
    const { data, error } = await this.db
      .from("unidentified_records_api")
      .select("*")
      .is("linked_case_id", null);
    if (error) throw error;
    return (data ?? []).map(recordFromRow);
  }

  async listInstitutions(): Promise<Institution[]> {
    const { data, error } = await this.db.from("institutions_api").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      kind: r.kind,
      name: r.name,
      province: r.province,
      location: [r.lng, r.lat],
    }));
  }

  async listIncidents(): Promise<Incident911[]> {
    const since = new Date(Date.now() - 12 * 36e5).toISOString();
    const { data, error } = await this.db.from("incidents_911_api").select("*").gte("at", since);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      at: r.at,
      municipality: r.municipality,
      location: [r.lng, r.lat],
    }));
  }

  async listAlerts(): Promise<Alert[]> {
    const { data, error } = await this.db.from("alerts_api").select("*").is("ended_at", null);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      center: [r.lng, r.lat],
      radiusKm: Number(r.radius_km),
      startedAt: r.started_at,
      endedAt: r.ended_at,
      caseId: r.case_id,
    }));
  }

  async listCaseEvents(caseId: string): Promise<CaseEvent[]> {
    const { data, error } = await this.db
      .from("case_events")
      .select("*")
      .eq("case_id", caseId)
      .order("at");
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      caseId: r.case_id,
      at: r.at,
      actorRole: r.actor_role,
      kind: r.kind,
      text: r.text,
    }));
  }

  async sendToVerification(caseId: string, recordId: string, score: number) {
    const { error: e1 } = await this.db
      .from("matches")
      .upsert(
        { case_id: caseId, record_id: recordId, score, decision: "en_verificacion" },
        { onConflict: "case_id,record_id" },
      );
    if (e1) throw e1;
    const { error: e2 } = await this.db
      .from("missing_cases")
      .update({ status: "en_verificacion" })
      .eq("id", caseId);
    if (e2) throw e2;
  }

  async confirmIdentity(caseId: string, recordId: string) {
    // La base de datos rechaza esta operación si el rol no es fiscalía (trigger + RLS).
    const { data: rec, error: e0 } = await this.db
      .from("unidentified_records")
      .select("kind")
      .eq("id", recordId)
      .single();
    if (e0) throw e0;
    const { error: e1 } = await this.db
      .from("matches")
      .update({ decision: "confirmada" })
      .match({ case_id: caseId, record_id: recordId });
    if (e1) throw e1;
    const { error: e2 } = await this.db
      .from("unidentified_records")
      .update({ linked_case_id: caseId })
      .eq("id", recordId);
    if (e2) throw e2;
    const status = rec.kind === "forense" ? "localizado_fallecido" : "localizado_vivo";
    const { error: e3 } = await this.db.from("missing_cases").update({ status }).eq("id", caseId);
    if (e3) throw e3;
  }
}
