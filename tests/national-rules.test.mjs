import assert from "node:assert/strict";
import test from "node:test";
import {
  NATIONAL_EXPERIMENT_CUTOFF,
  NATIONAL_GOLD_CUTOFF,
  NATIONAL_PARTICIPANTS_MAX,
  NATIONAL_PARTICIPANTS_MIN,
  NATIONAL_SILVER_CUTOFF,
  NATIONAL_TRAINING_TEAM_CUTOFF,
  NATIONAL_TRUE_SILVER_END,
  NATIONAL_TRUE_SILVER_START,
  isTrueSilverRank,
  nationalMedalForRank,
  nationalParticipantCount,
} from "../app/national-rules.ts";

test("national quotas match the verified 600-player rules", () => {
  assert.equal(NATIONAL_PARTICIPANTS_MIN, 580);
  assert.equal(NATIONAL_PARTICIPANTS_MAX, 620);
  assert.equal(NATIONAL_TRAINING_TEAM_CUTOFF, 50);
  assert.equal(NATIONAL_GOLD_CUTOFF, 150);
  assert.equal(NATIONAL_TRUE_SILVER_START, 151);
  assert.equal(NATIONAL_TRUE_SILVER_END, 240);
  assert.equal(NATIONAL_EXPERIMENT_CUTOFF, 240);
  assert.equal(NATIONAL_SILVER_CUTOFF, 410);

  assert.equal(nationalMedalForRank(1), "金牌");
  assert.equal(nationalMedalForRank(150), "金牌");
  assert.equal(nationalMedalForRank(151), "银牌");
  assert.equal(nationalMedalForRank(240), "银牌");
  assert.equal(nationalMedalForRank(241), "银牌");
  assert.equal(nationalMedalForRank(410), "银牌");
  assert.equal(nationalMedalForRank(411), "铜牌");
  assert.equal(nationalMedalForRank(600), "铜牌");

  assert.equal(isTrueSilverRank(150), false);
  assert.equal(isTrueSilverRank(151), true);
  assert.equal(isTrueSilverRank(240), true);
  assert.equal(isTrueSilverRank(241), false);
});

test("seeded national fields stay close to 600 participants", () => {
  const counts = Array.from({ length: 1000 }, (_, seed) =>
    nationalParticipantCount(seed),
  );
  assert.ok(counts.every((count) => count >= NATIONAL_PARTICIPANTS_MIN));
  assert.ok(counts.every((count) => count <= NATIONAL_PARTICIPANTS_MAX));
  assert.equal(Math.min(...counts), NATIONAL_PARTICIPANTS_MIN);
  assert.equal(Math.max(...counts), NATIONAL_PARTICIPANTS_MAX);
});
