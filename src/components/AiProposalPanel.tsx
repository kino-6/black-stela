import type { Translator } from "../i18n";

interface AiProposalPanelProps {
  status: string;
  prose: string;
  rejected: boolean;
  t: Translator;
}

export function AiProposalPanel({ status, prose, rejected, t }: AiProposalPanelProps) {
  return (
    <section className="ai-proposal-panel" aria-labelledby="ai-proposal-heading" aria-live="polite">
      <div className="section-title">
        <h3 id="ai-proposal-heading">{t("ai.proposal")}</h3>
        <span>{rejected ? t("ai.rejected") : prose ? t("ai.accepted") : t("ai.noProposal")}</span>
      </div>
      <small>{status || t("log.narratorIdle")}</small>
      {prose && <p>{prose}</p>}
    </section>
  );
}
