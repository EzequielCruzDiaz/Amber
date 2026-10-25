export { DEFAULT_CONFIG, type MatchingConfig } from "./config";
export { haversineKm } from "./geo";
export { type Candidate, rankCasesForRecord, rankRecordsForCase } from "./rank";
export {
  type Factor,
  type FactorKey,
  type RejectionReason,
  type ScoreOutcome,
  scoreMatch,
} from "./score";
