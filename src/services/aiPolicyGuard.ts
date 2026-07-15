import type { GameState, ScenarioWorld } from "../domain/types";

export interface NarrationProposal {
  prose: string;
  source: "local_ai" | "fallback";
  subjectId?: string;
  tone?: "observe" | "warning" | "discovery" | "relief";
}

export interface GuardedNarration {
  accepted: boolean;
  prose: string;
  reason?: string;
}

const forbiddenAgencyPatterns = [
  /\b(I|we)\s+(decide|attack|move|open|cast|think|feel)\b/i,
  /\b(?:says|said|shouts|whispers)\s*["']/i,
  /["'][^"']+["']\s*,?\s*(?:says|said|shouts|whispers)/i,
  /\b(?:moves|attacks|opens|casts|decides)\s+(?:north|south|east|west|forward|the door|a spell)\b/i,
  /(?:言った|話した|叫んだ|囁いた|つぶやいた|決めた|考えた|思った|感じた|攻撃した|呪文を唱えた|扉を開けた)/
];

export function guardNarration(
  state: GameState,
  world: ScenarioWorld,
  proposal: NarrationProposal,
  expectedSubjectId?: string
): GuardedNarration {
  if (expectedSubjectId && proposal.subjectId !== expectedSubjectId) {
    return {
      accepted: false,
      prose: "",
      reason: "Narration changed or omitted the rule-selected subject."
    };
  }

  if (proposal.subjectId && !state.party.some((member) => member.id === proposal.subjectId)) {
    return {
      accepted: false,
      prose: "",
      reason: "Narration referenced an unknown subject."
    };
  }

  const mentionsPcSpeech = state.party.some((member) => {
    const escapedName = escapeRegExp(member.name);
    const pcSpeechPattern = new RegExp(`${escapedName}\\s*(?:says|said|:|\\")`, "i");
    const japanesePcAgencyPattern = new RegExp(
      `${escapedName}(?:は|が)[^。！？]{0,28}(?:言った|話した|叫んだ|囁いた|つぶやいた|決めた|考えた|思った|感じた|攻撃した|唱えた|開けた)`
    );
    return pcSpeechPattern.test(proposal.prose) || japanesePcAgencyPattern.test(proposal.prose);
  });

  if (mentionsPcSpeech || forbiddenAgencyPatterns.some((pattern) => pattern.test(proposal.prose))) {
    return {
      accepted: false,
      prose: "",
      reason: "Narration attempted to speak for or act as a player character."
    };
  }

  if (world.aiPolicy.forbidden.some((rule) => proposal.prose.toLowerCase().includes(rule.split("_").join(" ")))) {
    return {
      accepted: false,
      prose: "",
      reason: "Narration violated the scenario AI policy."
    };
  }

  return {
    accepted: true,
    prose: proposal.prose
  };
}

export function applyNarrationProposal(state: GameState, _proposal: NarrationProposal): GameState {
  return structuredClone(state);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
