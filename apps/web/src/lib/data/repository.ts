import type {
  Alert,
  CaseEvent,
  Incident911,
  Institution,
  MissingCase,
  PublicCaseView,
  Role,
  UnidentifiedRecord,
} from "@rb/domain";

/**
 * Puerto de datos. La interfaz no sabe si los datos vienen del escenario en
 * memoria o de Supabase; ambas implementaciones aplican las mismas reglas de
 * visibilidad por rol (en Supabase las impone RLS).
 */
export interface Repository {
  role(): Promise<Role>;

  /** Casos completos. Vacío para el rol público. */
  listCases(): Promise<MissingCase[]>;
  getCase(id: string): Promise<MissingCase | null>;
  /** Proyección enmascarada, disponible para cualquier rol. */
  listPublicCases(): Promise<PublicCaseView[]>;

  /** Registros sin identificar visibles para el rol actual, sin vincular. */
  listOpenRecords(): Promise<UnidentifiedRecord[]>;
  listInstitutions(): Promise<Institution[]>;
  listIncidents(): Promise<Incident911[]>;
  listAlerts(): Promise<Alert[]>;
  listCaseEvents(caseId: string): Promise<CaseEvent[]>;

  sendToVerification(caseId: string, recordId: string, score: number): Promise<void>;
  confirmIdentity(caseId: string, recordId: string): Promise<void>;
}

export class ForbiddenError extends Error {
  constructor(action: string) {
    super(`Tu rol no permite: ${action}`);
    this.name = "ForbiddenError";
  }
}
