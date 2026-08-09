import test from "node:test";
import assert from "node:assert/strict";
import {
  communityAchievementConditions,
  communityAchievementDefinitions,
  communityAchievementUnlockMethods,
} from "../app/community-achievements.ts";
import { nextFantasyStoryEvent } from "../app/fantasy-content.ts";

function baseContext() {
  return {
    week: 60,
    stats: {
      san: 70,
      mindset: 65,
      social: 60,
      coachFavor: 0,
      peerFavor: 30,
      familySupport: 55,
      slackDependence: 0,
      experiment: 30,
      module1: 60,
      module2: 60,
      module3: 60,
      module4: 60,
      bookStudy: {},
    },
    storyTags: [],
    actionCounts: {},
    currentWeekUses: {},
    chocolateStreak: 0,
    weekRecords: [],
    provincialAttempts: [],
    nationalAttempts: [],
    activeTeamSize: 12,
    relationships: {},
    unlocked: {},
    postCareer: null,
  };
}

test("共创成就编号唯一，署名只出现在有提出者的条目", () => {
  const ids = communityAchievementDefinitions.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(
    communityAchievementDefinitions.find((item) => item.id === "biohazard").creditedBy,
    "扣1送地狱火",
  );
  assert.equal(
    communityAchievementDefinitions.find((item) => item.id === "new-world").creditedBy,
    undefined,
  );
});

test("每个共创成就都有与后台判定分离的真实达成方式", () => {
  const ids = communityAchievementDefinitions.map((item) => item.id).sort();
  assert.deepEqual(Object.keys(communityAchievementUnlockMethods).sort(), ids);
  for (const achievement of communityAchievementDefinitions) {
    const method = communityAchievementUnlockMethods[achievement.id];
    assert.ok(method.length >= 8, `${achievement.id} missing unlock method`);
    assert.notEqual(method, achievement.description);
  }
  assert.match(communityAchievementUnlockMethods["remember-you"], /连续九周/);
  assert.match(communityAchievementUnlockMethods["great-luck"], /160分制/);
  assert.match(communityAchievementUnlockMethods["dream-end"], /省队线后一名/);
});

test("幻想乡加入与聊天成就只按真实标签和次数触发", () => {
  let ctx = baseContext();
  let result = communityAchievementConditions(ctx);
  assert.equal(result["new-world"], false);
  assert.equal(result["elysian-realm"], false);
  ctx = {
    ...ctx,
    storyTags: ["幻想乡:加入"],
    actionCounts: { "fantasy-chat": 12 },
  };
  result = communityAchievementConditions(ctx);
  assert.equal(result["new-world"], true);
  assert.equal(result["elysian-realm"], true);
});

test("巧克力成就要求连续九周，而不是同一周重复食用", () => {
  const sameWeek = communityAchievementConditions({
    ...baseContext(),
    currentWeekUses: { chocolate: 9 },
    chocolateStreak: 1,
  });
  assert.equal(sameWeek["remember-you"], false);

  const consecutiveWeeks = communityAchievementConditions({
    ...baseContext(),
    currentWeekUses: { chocolate: 1 },
    chocolateStreak: 9,
  });
  assert.equal(consecutiveWeeks["remember-you"], true);
});

test("幻想乡是一条有顺序且隐藏后果的群像线", () => {
  let join = null;
  for (let index = 0; index < 100 && !join; index += 1) {
    join = nextFantasyStoryEvent({
      week: 12,
      seed: `SLACK-DISCOVERY-${index}`,
      social: 0,
      peerFavor: 0,
      san: 70,
      slackActions: 1,
      slackedThisWeek: true,
      slackDependence: 1,
      resolvedEvents: [],
      storyTags: [],
      activeTeamSize: 15,
      hasNationalAttempt: false,
    });
  }
  assert.equal(join.id, "fantasy-join");
  assert.equal(join.concealConsequences, true);
  assert.match(join.label, /摸鱼偶遇/);
  const noSlack = nextFantasyStoryEvent({
    week: 20,
    seed: "NO-SLACK",
    social: 100,
    peerFavor: 100,
    san: 70,
    slackActions: 0,
    slackedThisWeek: false,
    slackDependence: 0,
    resolvedEvents: [],
    storyTags: [],
    activeTeamSize: 15,
    hasNationalAttempt: false,
  });
  assert.equal(noSlack, null);
  const first = nextFantasyStoryEvent({
    week: 13,
    seed: "JOINED",
    social: 50,
    peerFavor: 20,
    san: 70,
    slackActions: 1,
    slackedThisWeek: true,
    slackDependence: 1,
    resolvedEvents: ["fantasy-join"],
    storyTags: ["幻想乡:加入"],
    activeTeamSize: 15,
    hasNationalAttempt: false,
  });
  assert.equal(first.id, "fantasy-first-question");
  assert(first.body.join("").length > 100);
  const joinedWithoutSlack = nextFantasyStoryEvent({
    week: 13,
    seed: "JOINED-NO-SLACK",
    social: 50,
    peerFavor: 20,
    san: 70,
    slackActions: 2,
    slackedThisWeek: false,
    slackDependence: 1,
    resolvedEvents: ["fantasy-join"],
    storyTags: ["幻想乡:加入"],
    activeTeamSize: 15,
    hasNationalAttempt: false,
  });
  assert.equal(joinedWithoutSlack, null);
});

test("第一次暂缓加入后会收到一次真正可选择的二次邀请", () => {
  let invite = null;
  for (let index = 0; index < 100 && !invite; index += 1) {
    invite = nextFantasyStoryEvent({
      week: 20,
      seed: `SLACK-RETURN-${index}`,
      social: 50,
      peerFavor: 20,
      san: 70,
      slackActions: 3,
      slackedThisWeek: true,
      slackDependence: 3,
      resolvedEvents: ["fantasy-join"],
      storyTags: ["幻想乡:暂缓加入"],
      activeTeamSize: 12,
      hasNationalAttempt: false,
    });
  }
  assert.equal(invite.id, "fantasy-return-invite");
  assert.equal(invite.choices.length, 3);
  const closed = nextFantasyStoryEvent({
    week: 24,
    seed: "CLOSED",
    social: 50,
    peerFavor: 20,
    san: 70,
    slackActions: 6,
    slackedThisWeek: true,
    slackDependence: 4,
    resolvedEvents: ["fantasy-join", "fantasy-return-invite"],
    storyTags: ["幻想乡:暂缓加入", "幻想乡:明确拒绝"],
    activeTeamSize: 12,
    hasNationalAttempt: false,
  });
  assert.equal(closed, null);
});
