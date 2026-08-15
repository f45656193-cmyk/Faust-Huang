import assert from "node:assert/strict";
import test from "node:test";
import {
  causalEligibility,
  recordNarrativeMemory,
  validateCausalCatalog,
  withCausalContinuity,
} from "../app/narrative-causality.ts";
import { linkedStoryDeveloperEvents } from "../app/event-library.ts";
import { causalLifeEvents } from "../app/causal-life-events.ts";
import {
  defaultRelationship,
  normalizeRelationship,
  settleRelationshipWeek,
} from "../app/relationship-content.ts";

test("因果目录不存在断开的前置事件或不可能的时间窗", () => {
  const issues = validateCausalCatalog([
    ...linkedStoryDeveloperEvents,
    ...causalLifeEvents,
  ]);
  assert.deepEqual(issues, []);
});

test("后续节点不会早于前因，也不会在有效窗口外补触发", () => {
  const event = linkedStoryDeveloperEvents.find(
    (item) => item.id === "chain-isolation-02",
  );
  assert(event);
  const memory = recordNarrativeMemory({
    eventId: "chain-isolation-01",
    week: 10,
    choiceId: "isolation-1-active",
    choiceTitle: "主动确认发生了什么",
    result: "你直接询问遗漏通知的原因。至少问题开始有了名字。",
    tags: ["chain:isolation:1:done"],
    chainId: "isolation",
    chainStep: 1,
  });
  assert.equal(
    causalEligibility(event, {
      week: 11,
      resolvedEvents: [memory.eventId],
      memories: [memory],
    }).eligible,
    false,
  );
  assert.equal(
    causalEligibility(event, {
      week: 12,
      resolvedEvents: [memory.eventId],
      memories: [memory],
    }).eligible,
    true,
  );
  assert.equal(
    causalEligibility(event, {
      week: 29,
      resolvedEvents: [memory.eventId],
      memories: [memory],
    }).eligible,
    false,
  );
});

test("后续事件会显示玩家真实选择和结果，而不是通用前情", () => {
  const event = causalLifeEvents.find(
    (item) => item.id === "keepsake-camera-developed-joined",
  );
  assert(event);
  const memory = recordNarrativeMemory({
    eventId: "keepsake-camera-first-roll",
    week: 18,
    choiceId: "camera-join",
    choiceTitle: "把桌椅推开，和所有人挤进同一张照片",
    result: "你们同时抬头，有人闭眼。照片没有宣传栏那么整齐，却只属于那天的教室。",
    tags: ["camera:first:joined"],
    chainId: "keepsake-camera",
    chainStep: 1,
  });
  const continued = withCausalContinuity(event, [memory]);
  assert.match(continued.body[0], /第18周/);
  assert.match(continued.body[0], /把桌椅推开/);
  assert.match(continued.body[0], /只属于那天的教室/);
});

test("长期不联系会逐渐淡去，稳定维护不会无限抬高关系", () => {
  const starting = normalizeRelationship(
    {
      ...defaultRelationship("DECAY", "npc"),
      route: "friend",
      bond: 62,
      trust: 58,
      familiarity: 55,
      security: 52,
      reciprocity: 51,
      meaningfulInteractions: 12,
      lastInteractionWeek: 1,
      lastMeaningfulWeek: 1,
    },
    "DECAY",
    "npc",
  );
  let neglected = starting;
  for (let week = 2; week <= 40; week += 1)
    neglected = settleRelationshipWeek(neglected, false, week);
  assert(neglected.bond < starting.bond);
  assert(neglected.trust < starting.trust);
  assert(neglected.familiarity < starting.familiarity);
  assert(neglected.security < starting.security);
  assert(neglected.estrangement > starting.estrangement);
  assert(neglected.bond >= 0 && neglected.estrangement <= 100);

  let maintained = starting;
  for (let week = 2; week <= 40; week += 1)
    maintained = settleRelationshipWeek(maintained, week % 3 === 0, week);
  assert(maintained.bond > neglected.bond + 12);
  assert(maintained.security > neglected.security + 8);
  assert(maintained.bond < 78, "普通维护不能每周刷成满好感");
});

test("深交历史只能减缓遗忘，不能让长期失联完全免疫", () => {
  let relation = normalizeRelationship(
    {
      route: "dating",
      bond: 82,
      trust: 76,
      romance: 70,
      familiarity: 78,
      security: 72,
      meaningfulInteractions: 40,
      lastInteractionWeek: 1,
      lastMeaningfulWeek: 1,
    },
    "OLD-LOVE",
    "npc",
  );
  for (let week = 2; week <= 26; week += 1)
    relation = settleRelationshipWeek(relation, false, week);
  assert(relation.bond < 82);
  assert(relation.romance < 70);
  assert(relation.security < 72);
  assert(relation.estrangement > 10);
});
