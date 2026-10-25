"use client";

import { useActionState } from "react";
import { type ActionResult, confirmIdentity, sendToVerification } from "@/app/actions";

interface Props {
  caseId: string;
  recordId: string;
  score: number;
  canVerify: boolean;
  canConfirm: boolean;
}

export function MatchActions({ caseId, recordId, score, canVerify, canConfirm }: Props) {
  const [verifyState, verify, verifying] = useActionState<ActionResult | null, FormData>(
    sendToVerification,
    null,
  );
  const [confirmState, confirm, confirming] = useActionState<ActionResult | null, FormData>(
    confirmIdentity,
    null,
  );
  const error =
    (verifyState && !verifyState.ok && verifyState.error) ||
    (confirmState && !confirmState.ok && confirmState.error);

  const hidden = (
    <>
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="recordId" value={recordId} />
      <input type="hidden" name="score" value={score} />
    </>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canVerify && (
        <form action={verify}>
          {hidden}
          <button
            type="submit"
            disabled={verifying}
            className="rounded border border-line px-3 py-1 text-sm font-semibold hover:border-accent disabled:opacity-50"
          >
            {verifying ? "Enviando…" : "Enviar a verificación"}
          </button>
        </form>
      )}
      {canConfirm ? (
        <form action={confirm}>
          {hidden}
          <button
            type="submit"
            disabled={confirming}
            className="rounded bg-accent px-3 py-1 text-sm font-semibold text-surface disabled:opacity-50"
          >
            {confirming ? "Confirmando…" : "Confirmar identidad y notificar familia"}
          </button>
        </form>
      ) : (
        <span className="text-xs text-muted">Confirmar requiere Fiscalía / INACIF.</span>
      )}
      {error && (
        <p role="alert" className="w-full text-sm text-st-verificacion">
          {error}
        </p>
      )}
    </div>
  );
}
