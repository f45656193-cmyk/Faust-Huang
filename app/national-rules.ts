export const NATIONAL_PARTICIPANTS_MIN = 580;
export const NATIONAL_PARTICIPANTS_MAX = 620;
export const NATIONAL_EXPERIMENT_CUTOFF = 240;
export const NATIONAL_TRAINING_TEAM_CUTOFF = 50;
export const NATIONAL_GOLD_CUTOFF = 150;
export const NATIONAL_TRUE_SILVER_START = 151;
export const NATIONAL_TRUE_SILVER_END = 240;
export const NATIONAL_SILVER_CUTOFF = 410;

export type NationalMedal = "金牌" | "银牌" | "铜牌";

export function nationalParticipantCount(seedValue: number) {
  const span = NATIONAL_PARTICIPANTS_MAX - NATIONAL_PARTICIPANTS_MIN + 1;
  return NATIONAL_PARTICIPANTS_MIN + (Math.abs(seedValue) % span);
}

export function nationalMedalForRank(rank: number): NationalMedal {
  if (rank <= NATIONAL_GOLD_CUTOFF) return "金牌";
  if (rank <= NATIONAL_SILVER_CUTOFF) return "银牌";
  return "铜牌";
}

export function isTrueSilverRank(rank: number | null) {
  return (
    rank !== null &&
    rank >= NATIONAL_TRUE_SILVER_START &&
    rank <= NATIONAL_TRUE_SILVER_END
  );
}
