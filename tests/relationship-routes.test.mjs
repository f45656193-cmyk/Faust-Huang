import test from "node:test";
import assert from "node:assert/strict";
import {
  applyRelationshipChoice,
  defaultRelationship,
  nextRelationshipStoryEvent,
  normalizeRelationship,
  relationshipLearningBoost,
  settleRelationshipWeek,
} from "../app/relationship-content.ts";
import {
  nextRelationshipDailyEvent,
  relationshipDailyCount,
  relationshipDailyStageCounts,
} from "../app/relationship-dailies.ts";
import {
  nextPersonalityDailyEvent,
  relationshipPersonalityCounts,
  relationshipPersonalityDailyCount,
} from "../app/relationship-personality-dailies.ts";

const rival = {
  id: "rival-test",
  name: "闻星回",
  school: "本校",
  gradeRelation: "同届",
  scope: "school-peer",
  revealWeek: 1,
  specialty: "module1",
  personality: "安静但可靠",
  studyStyle: "共同复盘",
  hiddenStrength: "证据链完整",
  revealSocial: 0,
};

function context({ seed = "REL-1", gender = "female", relation, resolved = [], week = 8, tags = [], san = 70 } = {}) {
  return {
    week,
    seed,
    playerGender: gender,
    candidates: [{ rival, gender: "male", personalityKey: "reserved" }],
    relationships: { [rival.id]: relation ?? defaultRelationship(seed, rival.id) },
    resolvedEvents: resolved,
    retiredRivalIds: [],
    storyTags: tags,
    san,
    coachFavor: 0,
    familySupport: 55,
  };
}

test("人物线用隐藏后果推进，并能走通朦胧好感到正式恋爱", () => {
  let relation = { ...defaultRelationship("REL-1", rival.id), bond: 12, trust: 3 };
  const resolved = [];
  let event = nextRelationshipStoryEvent(context({ relation, resolved }));
  assert.equal(event.id, "bondstory-rival-test-desk");
  assert.equal(event.concealConsequences, true);
  relation = applyRelationshipChoice(relation, "rel-warm-rival-test", 8);
  resolved.push(event.id);
  relation = settleRelationshipWeek(relation, true, 9);

  event = nextRelationshipStoryEvent(context({ relation, resolved, week: 10 }));
  assert.equal(event.id, "bondstory-rival-test-night");
  relation = applyRelationshipChoice(relation, "rel-listen-rival-test", 10);
  resolved.push(event.id);
  relation = settleRelationshipWeek(relation, true, 11);

  event = nextRelationshipStoryEvent(context({ relation, resolved, week: 12 }));
  assert.equal(event.id, "bondstory-rival-test-turn");
  assert(event.choices.some((choice) => choice.id.startsWith("relationship-crush-")));
  relation = applyRelationshipChoice(relation, "relationship-crush-rival-test", 12);
  resolved.push(event.id);

  event = nextRelationshipStoryEvent(context({ relation, resolved, week: 13 }));
  assert.equal(event.id, "bondstory-rival-test-rain");
  relation = applyRelationshipChoice(relation, "rel-heart-rival-test", 13);
  resolved.push(event.id);

  let confession = null;
  for (let index = 0; index < 30; index += 1) {
    const seed = `CONFESS-${index}`;
    confession = nextRelationshipStoryEvent(context({ seed, relation, resolved, week: 16 }));
    if (confession?.choices[0].id.startsWith("rel-date-")) break;
  }
  assert.equal(confession.id, "bondstory-rival-test-confession");
  assert(confession.choices[0].id.startsWith("rel-date-"));
  relation = applyRelationshipChoice(relation, confession.choices[0].id, 16);
  assert.equal(relation.route, "dating");
  assert(relationshipLearningBoost({ [rival.id]: relation }) > 0);
});

test("十种关系初动文本各自拥有匹配的独立选项", () => {
  const scenes = new Map();
  for (let index = 0; index < 500 && scenes.size < 10; index += 1) {
    const seed = `FIRST-CONTACT-${index}`;
    const relation = { ...defaultRelationship(seed, rival.id), bond: 12, trust: 3 };
    const event = nextRelationshipStoryEvent(context({ seed, relation, week: 8 }));
    assert.equal(event.id, "bondstory-rival-test-desk");
    scenes.set(event.title, event);
  }
  assert.equal(scenes.size, 10);
  for (const event of scenes.values()) {
    assert.equal(event.choices.length, 4);
    assert.equal(new Set(event.choices.map((choice) => choice.title)).size, 4);
    assert(event.choices.every((choice) => choice.id.includes("rival-test")));
    assert(event.choices.every((choice) => ![
      "问TA是否愿意一起讲一遍",
      "接过笔记，约定明天归还",
      "笑着问这算不算私授讲义",
    ].includes(choice.title)));
  }
});

test("同性同届角色仍可成为挚友，但不会出现异性恋爱选项", () => {
  const relation = normalizeRelationship({ bond: 35, trust: 18 }, "SAME", rival.id);
  const event = nextRelationshipStoryEvent({
    ...context({ seed: "SAME", gender: "male", relation, week: 22 }),
    candidates: [{ rival, gender: "male", personalityKey: "warm" }],
    resolvedEvents: ["bondstory-rival-test-desk", "bondstory-rival-test-night"],
  });
  assert.equal(event.id, "bondstory-rival-test-turn");
  assert(!event.choices.some((choice) => choice.id.startsWith("relationship-crush-")));
  assert(event.choices.some((choice) => choice.id.startsWith("relationship-friend-")));
});

test("把告白推迟到赛后不会成为悬空分支", () => {
  const relation = normalizeRelationship(
    { bond: 50, trust: 35, romance: 32, route: "crush" },
    "WAIT",
    rival.id,
  );
  const event = nextRelationshipStoryEvent(
    context({
      seed: "WAIT",
      relation,
      resolved: [
        "bondstory-rival-test-desk",
        "bondstory-rival-test-night",
        "bondstory-rival-test-turn",
        "bondstory-rival-test-rain",
        "bondstory-rival-test-confession",
      ],
      week: 48,
      tags: ["关系:rival-test:等待赛后", "第一次省赛-最终名单确认"],
    }),
  );
  assert.equal(event.id, "bondstory-rival-test-after-exam-answer");
  assert(event.choices.some((choice) => choice.id.startsWith("rel-date-")));
  assert(event.choices.some((choice) => choice.id.startsWith("relationship-friend-")));
});

function dailyContext(route, relationOverrides = {}) {
  return {
    ...context({
      seed: `DAILY-${route}`,
      relation: normalizeRelationship(
        {
          bond: route === "neutral" ? 18 : 56,
          trust: route === "neutral" ? 8 : 42,
          romance: route === "crush" || route === "dating" ? 35 : 0,
          route,
          lastInteractionWeek: 0,
          ...relationOverrides,
        },
        `DAILY-${route}`,
        rival.id,
      ),
      week: 10,
    }),
    isTraining: false,
    pocketMoney: 120,
    weeksToProvincial: 12,
    hasNationalAttempt: false,
  };
}

test("四个关系阶段拥有六十条独立日常，而不是重复一段模板", () => {
  assert.equal(relationshipDailyCount, 60);
  assert.deepEqual(relationshipDailyStageCounts, {
    neutral: 8,
    crush: 21,
    dating: 23,
    friend: 8,
  });
});

test("五类性格各有八条专属剧情，总日常扩展到一百条", () => {
  assert.equal(relationshipPersonalityDailyCount, 40);
  assert.equal(relationshipDailyCount + relationshipPersonalityDailyCount, 100);
  assert.deepEqual(relationshipPersonalityCounts, {
    reserved: 8,
    warm: 8,
    competitive: 8,
    playful: 8,
    curious: 8,
  });
});

test("每类性格都能触发自己的专属暧昧事件", () => {
  for (const personalityKey of ["reserved", "warm", "competitive", "playful", "curious"]) {
    const base = dailyContext("crush");
    let found = null;
    for (let week = 9; week <= 80 && !found; week += 1) {
      found = nextPersonalityDailyEvent({
        ...base,
        seed: `PERSONALITY-${personalityKey}`,
        week,
        candidates: [{
          rival,
          gender: "male",
          personalityKey,
          innerConflictKey: "abandonment",
        }],
      });
    }
    assert(found, `${personalityKey} did not produce a personality event`);
    assert.match(found.label, /性格专属/);
    assert(found.choices.every((choice) => choice.id.includes(`-${personalityKey}-abandonment-`)));
    assert(found.body.join("").length > 80);
  }
});

test("暧昧、恋爱与挚友日常都能在两年流程中稳定出现", () => {
  for (const route of ["crush", "dating", "friend"]) {
    let ctx = dailyContext(route);
    let relation = ctx.relationships[rival.id];
    const resolved = [];
    const storyTags = [];
    const events = [];
    for (let week = 10; week <= 104; week += 1) {
      const event = nextRelationshipDailyEvent({
        ...ctx,
        week,
        relationships: { [rival.id]: relation },
        resolvedEvents: resolved,
        storyTags,
      });
      if (!event) continue;
      events.push(event);
      resolved.push(event.id);
      storyTags.push(`关系日常:发生周:${week}`);
      relation = applyRelationshipChoice(relation, event.choices[0].id, week);
    }
    assert(events.length >= 5, `${route} only produced ${events.length} daily events`);
    assert(events.every((event) => event.concealConsequences && event.visualNovel));
    assert(events.every((event) => event.body.join("").length > 90));
  }
});

test("日常选择以小幅关系变化为主，不会刷出巨额学习属性", () => {
  const before = normalizeRelationship(
    { bond: 50, trust: 40, romance: 30, route: "dating", conflict: 8 },
    "TONE",
    rival.id,
  );
  const cared = applyRelationshipChoice(before, "rel-daily-care-rival-test-example", 30);
  const hurt = applyRelationshipChoice(before, "rel-daily-hurt-rival-test-example", 30);
  assert(cared.bond > before.bond && cared.bond - before.bond <= 3);
  assert(cared.trust > before.trust && cared.romance > before.romance);
  assert(hurt.bond < before.bond && hurt.conflict > before.conflict);
  const warmCare = applyRelationshipChoice(before, "rel-daily-care-warm-caretaking-rival-test-example", 30);
  const competitiveCare = applyRelationshipChoice(before, "rel-daily-care-competitive-caretaking-rival-test-example", 30);
  assert(warmCare.bond > competitiveCare.bond);
});

test("每周和队友共同学习不会反过来封死人物日常", () => {
  const base = dailyContext("crush", { lastInteractionWeek: 10 });
  let found = null;
  for (let week = 10; week <= 40; week += 1) {
    found = nextRelationshipDailyEvent({
      ...base,
      week,
      relationships: {
        [rival.id]: { ...base.relationships[rival.id], lastInteractionWeek: week },
      },
    });
    if (found) break;
  }
  assert(found, "joint study should not permanently suppress daily stories");
});
