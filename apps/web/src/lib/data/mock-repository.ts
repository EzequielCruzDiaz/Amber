import "server-only";
import {
  type CaseEvent,
  canConfirmMatch,
  canSeeRecordKind,
  canSendToVerification,
  type MissingCase,
  type PublicCaseView,
  type Role,
  toPublicView,
} from "@rb/domain";
import { generateScenario, type Scenario } from "@rb/seed";
import { ForbiddenError, type Repository } from "./repository";

/**
 * Estado en memoria del proceso: los cambios duran hasta reiniciar el servidor.
 * Suficiente para una demo sin base de datos.
 */
let state: { scenario: Scenario; events: CaseEvent[] } | null = null;

function getState() {
  if (!state) {
    const scenario = generateScenario();
    const events: CaseEvent[] = scenario.cases.map((c) => ({
      id: `ev-${c.id}`,
      caseId: c.id,
      at: c.createdAt,
      actorRole: "operador",
      kind: "denuncia",
      text: `Denuncia recibida por ${c.channel}.`,
    }));
    state = { scenario, events };
  }
  return state;
}

export class MockRepository implements Repository {
  constructor(private readonly currentRole: Role) {}

  async role() {
    return this.currentRole;
  }

  async listCases(): Promise<MissingCase[]> {
    if (this.currentRole === "publico") return [];
    return getState().scenario.cases;
  }

  async getCase(id: string) {
    if (this.currentRole === "publico") return null;
    return getState().scenario.cases.find((c) => c.id === id) ?? null;
  }

  async listPublicCases(): Promise<PublicCaseView[]> {
    return getState()
      .scenario.cases.map(toPublicView)
      .filter((c): c is PublicCaseView => c !== null);
  }

  async listOpenRecords() {
    return getState().scenario.records.filter(
      (r) => r.linkedCaseId === null && canSeeRecordKind(this.currentRole, r.kind),
    );
  }

  async listInstitutions() {
    return [...getState().scenario.institutions];
  }

  async listIncidents() {
    return this.currentRole === "publico" ? [] : getState().scenario.incidents;
  }

  async listAlerts() {
    const alerts = getState().scenario.alerts.filter((a) => a.endedAt === null);
    return this.currentRole === "publico" ? alerts.filter((a) => a.kind === "menor") : alerts;
  }

  async listCaseEvents(caseId: string) {
    if (this.currentRole === "publico") return [];
    return getState()
      .events.filter((e) => e.caseId === caseId)
      .sort((a, b) => a.at.localeCompare(b.at));
  }

  async sendToVerification(caseId: string, recordId: string, score: number) {
    if (!canSendToVerification(this.currentRole)) throw new ForbiddenError("enviar a verificación");
    const c = this.mustCase(caseId);
    c.status = "en_verificacion";
    this.log(
      caseId,
      "verificacion",
      `Coincidencia ${score}% con ${recordId} enviada a verificación.`,
    );
  }

  async confirmIdentity(caseId: string, recordId: string) {
    if (!canConfirmMatch(this.currentRole)) throw new ForbiddenError("confirmar una identidad");
    const c = this.mustCase(caseId);
    const r = getState().scenario.records.find((x) => x.id === recordId);
    if (!r) throw new Error(`Registro ${recordId} no existe`);
    if (!canSeeRecordKind(this.currentRole, r.kind)) throw new ForbiddenError("ver este registro");
    r.linkedCaseId = caseId;
    c.status = r.kind === "forense" ? "localizado_fallecido" : "localizado_vivo";
    c.resolvedAt = new Date().toISOString();
    this.log(
      caseId,
      "cierre",
      `Identidad confirmada con ${recordId}. Familia notificada por el Ministerio Público.`,
    );
  }

  private mustCase(id: string) {
    const c = getState().scenario.cases.find((x) => x.id === id);
    if (!c) throw new Error(`Caso ${id} no existe`);
    return c;
  }

  private log(caseId: string, kind: CaseEvent["kind"], text: string) {
    getState().events.push({
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      caseId,
      at: new Date().toISOString(),
      actorRole: this.currentRole,
      kind,
      text,
    });
  }
}
