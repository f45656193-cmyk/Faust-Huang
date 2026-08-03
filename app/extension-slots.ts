/**
 * Stable extension contracts for the next content pass.
 * Keeping future relationship, achievement and side-story data separate prevents
 * new writing from changing the exam, save-file or career-state engines.
 */
export type RelationshipStoryHook = {
  id: string;
  rivalId?: string;
  minimumBond?: number;
  minimumTension?: number;
  requiredTags?: string[];
  blockedTags?: string[];
  eventId: string;
};

export type AchievementHook = {
  id: string;
  requiredTags?: string[];
  blockedTags?: string[];
  minimumWeek?: number;
};

export type SideQuestHook = {
  id: string;
  openingEventId: string;
  requiredTags?: string[];
  blockedTags?: string[];
};

export const relationshipStoryHooks: RelationshipStoryHook[] = [];
export const futureAchievementHooks: AchievementHook[] = [];
export const sideQuestHooks: SideQuestHook[] = [];
