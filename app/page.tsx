"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  openingEvent,
  leaveMilestoneEvents,
  rivals,
  textbooks,
  trainingMilestoneEvents,
  weeklyActions,
  weeklySocialEvents,
  type GameEffect,
  type GameEvent,
  type Rival,
  type Textbook,
  type WeeklyAction,
} from "./game-data";
import { linkedStoryDeveloperEvents, linkedWeeklyEvents } from "./event-library";
import { familyWeeklyScenes as familyWeeklySceneCatalog } from "./family-weekly-content";
import { familyCheckpointContent } from "./family-checkpoint-content";
import { developerChangelog } from "./developer-changelog";
import { DeveloperStoryEditor, applyStoryTextOverride, captureStoryEvent, loadStoryTextOverrides } from "./developer-story-editor";
import {
  defaultSupplementaryBookStudy,
  effectiveSupplementaryMastery,
  supplementaryBooks,
  supplementaryExamBonus,
  supplementaryExperimentBonus,
  type SupplementaryBookState,
} from "./supplementary-books";
import {
  drawRealQuestions,
  reviewedQuestionBank,
  scoreRealQuestion,
  type MistakeRecord,
  type RealQuestion,
  type TruthValue,
} from "./real-questions";
import {
  communityAchievementConditions,
  communityAchievementDefinitions,
  communityAchievementUnlockMethods,
} from "./community-achievements";
import {
  applyRelationshipChoice,
  defaultRelationship,
  nextRelationshipStoryEvent,
  normalizeRelationship,
  relationshipLearningBoost,
  relationshipWeeklyMoodEffect,
  relationshipRouteLabel,
  relationshipStoryDeveloperCatalog,
  breakupRelationship,
  attemptRelationshipReunion,
  settleRelationshipWeek,
  type DeepRelationship,
  type PlayerGender,
} from "./relationship-content";
import { nextRelationshipDailyEvent, relationshipDailyDeveloperCatalog } from "./relationship-dailies";
import { nextPersonalityDailyEvent, relationshipPersonalityDeveloperCatalog } from "./relationship-personality-dailies";
import { fantasyStoryDeveloperCatalog, nextFantasyStoryEvent } from "./fantasy-content";
import { achievementStoryDeveloperCatalog, nextAchievementStoryEvent } from "./achievement-events";
import { keepsakeAtlasDataUrl } from "./keepsake-atlas-data";
import {
  displayKeepsake,
  keepsakeById,
  keepsakeDefinitions,
  newlyUnlockedKeepsakes,
  rarityLabels,
  type KeepsakeContext,
  type KeepsakeRarity,
  type KeepsakeRecord,
} from "./keepsakes";
import {
  NATIONAL_EXPERIMENT_CUTOFF,
  isTrueSilverRank,
  nationalMedalForRank,
  nationalParticipantCount,
  type NationalMedal,
} from "./national-rules";
import {
  advancePostCareer,
  createPostCareer,
  getPostScene,
  postKnowledgeTotal,
  postSubjectMaxima,
  type PostCareerInput,
  type PostCareerState,
  type PostSubject,
} from "./post-career";

type Origin = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  story: string;
  upside: string;
  cost: string;
  stats: {
    familyWealth: number;
    familySupport: number;
    schoolSupport: number;
    academics: number;
    social: number;
    resilience: number;
    san: number;
    pocketMoney: number;
    monthlyPocketMoney: number;
  };
  tags: string[];
};

const origins: Origin[] = [
  {
    id: "coach-family",
    number: "01",
    title: "竞赛教练之子",
    subtitle: "你从小就知道，坎贝尔不是一个人名那么简单。",
    story:
      "父母中有一位长期从事学科竞赛训练。你不缺方向，也不缺教材，但餐桌上的每一次闲聊都可能变成训练复盘。",
    upside: "竞赛学习效率 +8%；更容易获得家庭指导与零花钱。",
    cost: "要钱消耗支持度 +20%；竞赛考试失利会额外扣SAN与家庭支持。",
    stats: {
      familyWealth: 58,
      familySupport: 92,
      schoolSupport: 46,
      academics: 72,
      social: 50,
      resilience: 60,
      san: 74,
      pocketMoney: 180,
      monthlyPocketMoney: 80,
    },
    tags: ["路线清晰", "竞赛耳濡目染", "期待压力"],
  },
  {
    id: "top-scorer",
    number: "02",
    title: "中考状元",
    subtitle: "你是被招生老师亲自请进竞赛教室的。",
    story:
      "一张漂亮的中考成绩单让所有人相信你适合竞赛。学校愿意给资源，教练也对你格外关注——尽管你还不知道自己是否真的喜欢生物。",
    upside: "常规学习效率 +15%；学校重视，早期常规退路最宽。",
    cost: "竞赛自学效率 -5%；排名落到后45%会触发光环压力。",
    stats: {
      familyWealth: 55,
      familySupport: 76,
      schoolSupport: 88,
      academics: 94,
      social: 48,
      resilience: 57,
      san: 68,
      pocketMoney: 160,
      monthlyPocketMoney: 65,
    },
    tags: ["高分光环", "重点培养", "尚未确认热爱"],
  },
  {
    id: "elite-school",
    number: "03",
    title: "名校竞赛生",
    subtitle: "你的身边从来不缺比你更早起步的人。",
    story:
      "学校拥有成熟的竞赛传统、稳定的教练和一整柜往年资料。机会很多，但每一个机会前都排着同样优秀的同学。",
    upside: "竞赛学习效率 +5%；竞赛前20%表现会额外增加教练好感。",
    cost: "外培名额、教练注意力和队内位置需要持续竞争。",
    stats: {
      familyWealth: 62,
      familySupport: 70,
      schoolSupport: 91,
      academics: 82,
      social: 55,
      resilience: 58,
      san: 66,
      pocketMoney: 220,
      monthlyPocketMoney: 75,
    },
    tags: ["资源丰富", "强者环绕", "队内竞争"],
  },
  {
    id: "county-school",
    number: "04",
    title: "普通县中生",
    subtitle: "没有成熟路线，但你愿意把能找到的资料都看一遍。",
    story:
      "学校里很少有人认真准备生物竞赛，教练也需要兼顾常规教学。你可能走很多弯路，却拥有定义自己道路的自由。",
    upside: "自主竞赛学习效率 +10%；低资源路线可解锁校外资源网剧情。",
    cost: "要零花钱成功率 -5%；实验、资料和培训支持需要靠成绩争取。",
    stats: {
      familyWealth: 38,
      familySupport: 57,
      schoolSupport: 28,
      academics: 70,
      social: 62,
      resilience: 78,
      san: 84,
      pocketMoney: 100,
      monthlyPocketMoney: 55,
    },
    tags: ["自主探索", "资源有限", "韧性较强"],
  },
  {
    id: "wealthy-family",
    number: "05",
    title: "富裕家庭",
    subtitle: "家里能承担试错，但不会替你读完任何一本书。",
    story:
      "额外教材、外地课程和更舒适的生活条件都不是难题。真正的问题是，家长愿意为一个结果未知的选择支持多久。",
    upside: "小卖部九折；要钱成功率 +14%、支持度消耗 -30%。",
    cost: "资源不直接增加掌握；消费方式会影响同伴关系，支持仍受成绩约束。",
    stats: {
      familyWealth: 94,
      familySupport: 64,
      schoolSupport: 52,
      academics: 68,
      social: 58,
      resilience: 54,
      san: 80,
      pocketMoney: 900,
      monthlyPocketMoney: 180,
    },
    tags: ["选择丰富", "生活宽裕", "结果期待"],
  },
];

const schoolNames = [
  "栖川实验中学",
  "临江第一中学",
  "青岚高级中学",
  "望岳外国语学校",
  "云泽县中学",
  "明理书院",
];

const supportLabels = ["谨慎观望", "心存疑虑", "暂时支持", "比较支持", "全力支持"];

const familyProfiles = [
  { key: "anxious", label: "焦虑波动型", volatility: 1.35, moneyFactor: 1.15, romance: "反对", note: "很在意每次排名，态度容易随短期成绩摆动。" },
  { key: "results", label: "结果导向型", volatility: 1.1, moneyFactor: 1, romance: "谨慎", note: "愿意投入，但习惯用看得见的成绩确认这条路是否值得。" },
  { key: "longterm", label: "长期规划型", volatility: 0.65, moneyFactor: 0.8, romance: "可沟通", note: "更在意长期路线、身体状态和退出方案，不会因一场考试立刻翻脸。" },
  { key: "open", label: "包容沟通型", volatility: 0.5, moneyFactor: 0.7, romance: "较包容", note: "未必懂竞赛，但愿意先听完你的理由，再讨论边界。" },
] as const;

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function makeSeed() {
  const block = Math.floor(Math.random() * 900000 + 100000);
  return `BIO-${block}`;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

const PROVINCIAL_QUESTION_COUNT = 80;
const PROVINCIAL_POINTS_PER_QUESTION = 2;
const PROVINCIAL_MAX_SCORE =
  PROVINCIAL_QUESTION_COUNT * PROVINCIAL_POINTS_PER_QUESTION;

function provincialScoreRate(score: number) {
  return round1((score / PROVINCIAL_MAX_SCORE) * 100);
}

function statLabel(value: number) {
  if (value >= 85) return "极高";
  if (value >= 70) return "较高";
  if (value >= 50) return "普通";
  if (value >= 35) return "偏低";
  return "有限";
}

function firstMondayOnOrAfter(year: number, month: number, day: number) {
  const date = new Date(year, month, day, 12);
  const offset = (8 - date.getDay()) % 7;
  date.setDate(date.getDate() + offset);
  return date;
}

function secondSundayOfMay(year: number) {
  const date = new Date(year, 4, 1, 12);
  const firstSundayOffset = (7 - date.getDay()) % 7;
  date.setDate(1 + firstSundayOffset + 7);
  return date;
}

function secondSundayOfAugust(year: number) {
  const date = new Date(year, 7, 1, 12);
  const firstSundayOffset = (7 - date.getDay()) % 7;
  date.setDate(1 + firstSundayOffset + 7);
  return date;
}

function weekOfDate(start: Date, target: Date) {
  return Math.floor((target.getTime() - start.getTime()) / 604800000) + 1;
}

function calendarFor(firstExamYear: number, week: number) {
  const start = firstMondayOnOrAfter(firstExamYear - 1, 6, 1);
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (week - 1) * 7);
  const firstExam = secondSundayOfMay(firstExamYear);
  const secondExam = secondSundayOfMay(firstExamYear + 1);
  const firstNational = secondSundayOfAugust(firstExamYear);
  const secondNational = secondSundayOfAugust(firstExamYear + 1);
  const firstExamWeek = weekOfDate(start, firstExam);
  const secondExamWeek = weekOfDate(start, secondExam);
  const firstNationalWeek = weekOfDate(start, firstNational);
  const secondNationalWeek = weekOfDate(start, secondNational);
  const formalLeaveWeek = weekOfDate(
    start,
    firstMondayOnOrAfter(firstExamYear, 8, 1),
  );
  const mandatoryLeaveWeek = weekOfDate(
    start,
    firstMondayOnOrAfter(firstExamYear, 10, 1),
  );
  return {
    start,
    weekStart,
    firstExam,
    secondExam,
    firstExamWeek,
    secondExamWeek,
    firstNationalWeek,
    secondNationalWeek,
    temporaryLeaveWeek: firstExamWeek - 12,
    formalLeaveWeek,
    mandatoryLeaveWeek,
    dateLabel: `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日`,
  };
}

function rankAgainst(scores: number[], score: number) {
  return 1 + scores.filter((competitorScore) => competitorScore > score).length;
}

type NamedExamRivalContext = {
  rival: Rival;
  name: string;
  retiredWeek?: number;
  knownAtExam: boolean;
};

type NamedProvincialResult = {
  rivalId: string;
  name: string;
  school: string;
  scope: Rival["scope"];
  score: number;
  rank: number;
  knownAtExam: boolean;
};

type NamedNationalResult = {
  rivalId: string;
  name: string;
  school: string;
  theoryRaw: number;
  theoryRank: number;
  qualifiedForExperiment: boolean;
  experimentRaw?: number;
  finalRank: number;
  medal: NationalMedal;
  knownAtExam: boolean;
};

function gradeEligibleForProvincial(
  rival: Rival,
  attemptNumber: 1 | 2,
) {
  if (rival.scope === "national") return false;
  return attemptNumber === 1
    ? rival.gradeRelation !== "下届"
    : rival.gradeRelation !== "上届";
}

function simulateProvincialExam(
  stats: PlayerStats,
  seed: string,
  week: number,
  attemptNumber: 1 | 2,
  world: {
    teamPlaces: number;
    provinceParticipants: number;
    firstPrizeEnd: number;
    secondPrizeEnd: number;
    thirdPrizeEnd: number;
    competitionStrength: number;
  },
  luck = 0,
  namedRivals: NamedExamRivalContext[] = [],
): ProvincialAttempt {
  const literatureCount = 22 + (hashSeed(`${seed}-literature-${week}`) % 7);
  const moduleNames = ["第一模块", "第二模块", "第三模块", "第四模块"] as const;
  const moduleKeys = ["module1", "module2", "module3", "module4"] as const;
  const counts = Object.fromEntries(
    [...moduleNames, "文献阅读"].map((name) => [
      name,
      { name, correct: 0, total: 0 },
    ]),
  ) as Record<string, { name: string; correct: number; total: number }>;
  const questions = Array.from({ length: 80 }, (_, index) => {
    const isLiterature = index >= 80 - literatureCount;
    const moduleIndex =
      hashSeed(`${seed}-province-module-${week}-${index}`) % moduleKeys.length;
    const strangeQuestion =
      seededUnit(`${seed}-strange-${week}-${index}`) <
      0.07 + seededUnit(`${seed}-paper-weirdness-${week}`) * 0.12;
    const difficulty =
      0.82 + seededUnit(`${seed}-difficulty-${week}-${index}`) * 0.44;
    return { index, isLiterature, moduleIndex, strangeQuestion, difficulty };
  });
  const paperWeirdness = seededUnit(`${seed}-paper-weirdness-${week}`);
  const requiredSpeed = 42 + paperWeirdness * 13 + (literatureCount - 22) * 0.45;
  const examScore = (
    moduleAbilities: number[],
    reasoning: number,
    problemSpeed: number,
    san: number,
    mindset: number,
    neglectWeeks: number,
    candidateKey: string,
    candidateLuck = 0,
  ) => {
    const form =
      (seededUnit(`${candidateKey}-form-a`) +
        seededUnit(`${candidateKey}-form-b`) -
        1) *
      0.14;
    let correct = 0;
    questions.forEach((question) => {
      const ability = moduleAbilities[question.moduleIndex];
      const baseProbability = question.isLiterature
        ? 0.15 + reasoning * 0.0045 + ability * 0.0022
        : 0.18 + ability * 0.0052 + reasoning * 0.001;
      const conditionFactor =
        (0.86 + san * 0.0016) *
        (0.94 + mindset * 0.0008) *
        Math.max(0.52, 1 - neglectWeeks * 0.05);
      const completionShare = clamp(
        0.7 + problemSpeed / (requiredSpeed * 3.25),
        0.7,
        1,
      );
      const relativePosition = (question.index + 1) / questions.length;
      const pacingFactor =
        relativePosition <= completionShare
          ? 1 - Math.max(0, relativePosition - 0.62) * Math.max(0, requiredSpeed - problemSpeed) / 95
          : 0.12;
      const probability = clamp(
        (baseProbability -
          (question.strangeQuestion ? 0.11 : 0) +
          form) *
          conditionFactor * pacingFactor /
          question.difficulty + candidateLuck * 0.006,
        0.055,
        0.91,
      );
      if (
        seededUnit(`${candidateKey}-answer-${question.index}`) < probability
      )
        correct += 1;
    });
    return correct;
  };

  const playerFormKey = `${seed}-province-player-${week}`;
  const playerModules = moduleKeys.map((key) =>
    clamp(stats[key] + supplementaryExamBonus(stats.supplementaryBookStudy, key)),
  );
  const correctTotal = examScore(
    playerModules,
    stats.reasoning,
    stats.problemSpeed,
    stats.san,
    stats.mindset,
    stats.competitionNeglectWeeks,
    playerFormKey,
    luck,
  );
  const rawScore = correctTotal * PROVINCIAL_POINTS_PER_QUESTION;
  questions.forEach((question) => {
    const ability = playerModules[question.moduleIndex];
    const form =
      (seededUnit(`${playerFormKey}-form-a`) +
        seededUnit(`${playerFormKey}-form-b`) -
        1) *
      0.14;
    const baseProbability = question.isLiterature
      ? 0.15 + stats.reasoning * 0.0045 + ability * 0.0022
      : 0.18 + ability * 0.0052 + stats.reasoning * 0.001;
    const probability = clamp(
      (baseProbability -
        (question.strangeQuestion ? 0.11 : 0) +
        form) *
        (0.86 + stats.san * 0.0016) *
        (0.94 + stats.mindset * 0.0008) *
        Math.max(0.52, 1 - stats.competitionNeglectWeeks * 0.05) /
        question.difficulty *
        (((question.index + 1) / questions.length <=
        clamp(0.7 + stats.problemSpeed / (requiredSpeed * 3.25), 0.7, 1))
          ? 1 -
            Math.max(0, (question.index + 1) / questions.length - 0.62) *
              Math.max(0, requiredSpeed - stats.problemSpeed) /
              95
          : 0.12) + luck * 0.006,
      0.055,
      0.91,
    );
    const correct =
      seededUnit(`${playerFormKey}-answer-${question.index}`) < probability;
    const section = question.isLiterature
      ? "文献阅读"
      : moduleNames[question.moduleIndex];
    counts[section].total += 1;
    if (correct) {
      counts[section].correct += 1;
    }
  });

  const eligibleNamedRivals = namedRivals.filter(
    ({ rival, retiredWeek }) =>
      gradeEligibleForProvincial(rival, attemptNumber) &&
      (retiredWeek === undefined || retiredWeek > week),
  );
  const anonymousCompetitorScores = Array.from(
    {
      length: Math.max(
        0,
        world.provinceParticipants - 1 - eligibleNamedRivals.length,
      ),
    },
    (_, index) => {
      const eliteBonus =
        seededUnit(`${seed}-province-elite-${week}-${index}`) < 0.045
          ? 10
          : 0;
      const gradeBonus = index % 7 === 0 ? 6 : index % 5 === 0 ? -4 : 0;
      const latent = clamp(
        22 +
          seededUnit(`${seed}-province-level-a-${week}-${index}`) * 44 +
          (seededUnit(`${seed}-province-level-b-${week}-${index}`) - 0.5) *
            16 +
          eliteBonus +
          gradeBonus +
          (world.competitionStrength - 1) * 35,
        10,
        91,
      );
      const modules = moduleKeys.map((_, moduleIndex) =>
        clamp(
          latent +
            (seededUnit(
              `${seed}-province-specialty-${week}-${index}-${moduleIndex}`,
            ) -
              0.5) *
              22,
        ),
      );
      const reasoning = clamp(
        latent * 0.82 +
          8 +
          (seededUnit(`${seed}-province-reason-${week}-${index}`) - 0.5) *
            20,
      );
      const problemSpeed = clamp(
        latent * 0.76 + 9 +
          (seededUnit(`${seed}-province-speed-${week}-${index}`) - 0.5) * 22,
      );
      return round1(
        examScore(
          modules,
          reasoning,
          problemSpeed,
          58 + seededUnit(`${seed}-province-san-${week}-${index}`) * 34,
          52 + seededUnit(`${seed}-province-mind-${week}-${index}`) * 38,
          seededUnit(`${seed}-province-neglect-${week}-${index}`) < 0.12
            ? 2
            : 0,
          `${seed}-province-candidate-${week}-${index}`,
          0,
        ) * PROVINCIAL_POINTS_PER_QUESTION,
      );
    },
  );
  const namedScoreEntries = eligibleNamedRivals.map((context, index) => {
    const { rival } = context;
    const level = rivalSnapshot(rival, seed, week, context.retiredWeek).level;
    const modules = moduleKeys.map((module, moduleIndex) =>
      clamp(
        level +
          (module === rival.specialty ? 8 : -1.5) +
          (seededUnit(
            `${seed}-named-province-module-${week}-${rival.id}-${moduleIndex}`,
          ) -
            0.5) *
            12,
        12,
        96,
      ),
    );
    const reasoning = clamp(
      level * 0.86 +
        7 +
        (seededUnit(`${seed}-named-province-reason-${week}-${rival.id}`) -
          0.5) *
          12,
    );
    const speed = clamp(
      level * 0.8 +
        8 +
        (seededUnit(`${seed}-named-province-speed-${week}-${rival.id}`) -
          0.5) *
          14,
    );
    return {
      context,
      score:
        examScore(
          modules,
          reasoning,
          speed,
          62 + seededUnit(`${seed}-named-province-san-${rival.id}`) * 30,
          56 + seededUnit(`${seed}-named-province-mind-${rival.id}`) * 36,
          0,
          `${seed}-named-province-${week}-${rival.id}-${index}`,
          0,
        ) * PROVINCIAL_POINTS_PER_QUESTION,
    };
  });
  const namedScores = namedScoreEntries.map((entry) => entry.score);
  const competitorScores = [...anonymousCompetitorScores, ...namedScores];
  const namedResults: NamedProvincialResult[] = namedScoreEntries.map(
    ({ context, score }) => ({
      rivalId: context.rival.id,
      name: context.name,
      school: context.rival.school,
      scope: context.rival.scope,
      score,
      rank:
        1 +
        competitorScores.filter((competitorScore) => competitorScore > score)
          .length +
        (rawScore > score ? 1 : 0),
      knownAtExam: context.knownAtExam,
    }),
  );
  const estimateError =
    (seededUnit(`${seed}-estimate-center-${week}`) - 0.5) *
    Math.max(4, 12.8 - stats.reasoning * 0.064);
  const estimateWidth = Math.max(
    4,
    11.2 - stats.reasoning * 0.056 - stats.mindset * 0.0192,
  );
  const estimateCenter = clamp(rawScore + estimateError, 0, PROVINCIAL_MAX_SCORE);
  const estimateLow = round1(
    clamp(estimateCenter - estimateWidth / 2, 0, PROVINCIAL_MAX_SCORE),
  );
  const estimateHigh = round1(
    clamp(estimateCenter + estimateWidth / 2, 0, PROVINCIAL_MAX_SCORE),
  );
  const draftDelta = round1(
    (seededUnit(`${seed}-draft-adjustment-${week}`) - 0.42) * 7.2,
  );
  const draftScore = round1(
    clamp(rawScore + draftDelta, 0, PROVINCIAL_MAX_SCORE),
  );
  const appealDelta =
    seededUnit(`${seed}-appeal-opportunity-${week}`) < 0.48
      ? round1(1 + seededUnit(`${seed}-appeal-delta-${week}`) * 3)
      : 0;
  const rankFor = (score: number) => rankAgainst(competitorScores, score);
  const breakdown = Object.values(counts).map((section) => ({
    name: section.name,
    correct: section.correct,
    total: section.total,
    score: section.correct * PROVINCIAL_POINTS_PER_QUESTION,
    maxScore: section.total * PROVINCIAL_POINTS_PER_QUESTION,
    rate: round1((section.correct / Math.max(1, section.total)) * 100),
  }));
  return {
    attemptNumber,
    examWeek: week,
    rawScore,
    estimateLow,
    estimateHigh,
    estimateRankLow: rankFor(estimateHigh),
    estimateRankHigh: rankFor(estimateLow),
    draftScore,
    draftRank: rankFor(draftScore),
    appealDelta,
    maxScore: PROVINCIAL_MAX_SCORE,
    participants: world.provinceParticipants,
    firstPrizeEnd: world.firstPrizeEnd,
    secondPrizeEnd: world.secondPrizeEnd,
    thirdPrizeEnd: world.thirdPrizeEnd,
    teamPlaces: world.teamPlaces,
    competitionStrength: world.competitionStrength,
    competitorScores,
    namedResults,
    breakdown,
  };
}

function provincialAward(rank: number, attempt: ProvincialAttempt) {
  if (rank <= attempt.firstPrizeEnd) return "省一等奖";
  if (rank <= attempt.secondPrizeEnd) return "省二等奖";
  if (rank <= attempt.thirdPrizeEnd) return "省三等奖";
  return "未获奖";
}

function rankedNamedProvincialResults(
  attempt: ProvincialAttempt,
  playerScore = attempt.finalScore ?? attempt.draftScore ?? attempt.rawScore,
) {
  return (attempt.namedResults ?? [])
    .map((result) => ({
      ...result,
      rank:
        1 +
        attempt.competitorScores.filter((score) => score > result.score).length +
        (playerScore > result.score ? 1 : 0),
    }))
    .sort((a, b) => a.rank - b.rank);
}

function familiarProvincialLine(
  attempt: ProvincialAttempt,
  playerScore: number,
  knownOnly = false,
) {
  const playerRank = rankAgainst(attempt.competitorScores, playerScore);
  const nearby = rankedNamedProvincialResults(attempt, playerScore)
    .filter((result) => !knownOnly || result.knownAtExam)
    .sort(
      (a, b) =>
        Math.abs(a.rank - playerRank) - Math.abs(b.rank - playerRank),
    )
    .slice(0, 3);
  if (!nearby.length) return null;
  return `熟悉的名字也出现在榜单附近：${nearby
    .map(
      (result) =>
        `${result.name} ${formatNumber(result.score)}/${PROVINCIAL_MAX_SCORE}，全省第${result.rank}`,
    )
    .join("；")}。`;
}

function meanAndSd(values: number[]) {
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance =
    values.reduce((total, value) => total + Math.pow(value - mean, 2), 0) /
    values.length;
  return { mean, sd: Math.max(1, Math.sqrt(variance)) };
}

function simulateNationalExam(
  stats: PlayerStats,
  seed: string,
  week: number,
  attemptNumber: 1 | 2,
  luck = 0,
  namedRivals: NamedExamRivalContext[] = [],
  provincialAttempt?: ProvincialAttempt,
): NationalAttempt {
  // 国赛每届约 600 人；人数会小幅波动，但奖牌名额按核实后的固定口径划分。
  const participants = nationalParticipantCount(
    hashSeed(`${seed}-national-size-${week}`),
  );
  const moduleAverage =
    (["module1", "module2", "module3", "module4"] as const).reduce(
      (sum, module) =>
        sum + stats[module] + supplementaryExamBonus(stats.supplementaryBookStudy, module),
      0,
    ) / 4;
  const condition =
    (0.87 + stats.san * 0.0015) *
    (0.95 + stats.mindset * 0.0007) *
    Math.max(0.55, 1 - stats.competitionNeglectWeeks * 0.05);
  const theoryForm =
    (seededUnit(`${seed}-national-form-a-${week}`) +
      seededUnit(`${seed}-national-form-b-${week}`) -
      1) *
      12;
  const theoryQuestionLoad = 88 + (hashSeed(`${seed}-national-load-${week}`) % 29);
  const pacingFactor = clamp(
    0.73 + stats.problemSpeed * 0.0037 - (theoryQuestionLoad - 88) * 0.0025,
    0.7,
    1.02,
  );
  const literaturePerformance = clamp(
    (23 + stats.reasoning * 0.5 + moduleAverage * 0.18) * condition * pacingFactor +
      theoryForm +
      (seededUnit(`${seed}-national-lit-${week}`) - 0.5) * 10 + luck * 0.45,
  );
  const foundationPerformance = clamp(
    (12 + moduleAverage * 0.65 + stats.reasoning * 0.06) * condition +
      theoryForm * 0.65 +
      (seededUnit(`${seed}-national-foundation-${week}`) - 0.5) * 9 + luck * 0.35,
  );
  const theoryRaw = round1(
    literaturePerformance * 0.9 + foundationPerformance * 0.1,
  );
  const provincialQualifiers = new Set(
    (provincialAttempt?.namedResults ?? [])
      .filter((result) => result.rank <= (provincialAttempt?.teamPlaces ?? 0))
      .map((result) => result.rivalId),
  );
  const eligibleNamedRivals = namedRivals.filter(
    ({ rival, retiredWeek }) =>
      (retiredWeek === undefined || retiredWeek > week) &&
      (rival.scope === "national" || provincialQualifiers.has(rival.id)),
  );
  const anonymousProfiles = Array.from(
    { length: Math.max(0, participants - 1 - eligibleNamedRivals.length) },
    (_, index) => {
      const powerhouse =
        seededUnit(`${seed}-national-powerhouse-${week}-${index}`) < 0.22
          ? 11
          : 0;
      const latent = clamp(
        48 +
          seededUnit(`${seed}-national-latent-a-${week}-${index}`) * 34 +
          (seededUnit(`${seed}-national-latent-b-${week}-${index}`) - 0.5) *
            14 +
          powerhouse,
        35,
        96,
      );
      const knowledge = clamp(
        latent +
          (seededUnit(`${seed}-national-knowledge-${week}-${index}`) - 0.5) *
            13,
      );
      const reasoning = clamp(
        latent * 0.82 +
          10 +
          (seededUnit(`${seed}-national-reason-${week}-${index}`) - 0.5) *
            15,
      );
      const experiment = clamp(
        latent * 0.76 +
          8 +
          (seededUnit(`${seed}-national-experiment-${week}-${index}`) - 0.5) *
            22,
      );
      const speed = clamp(
        latent * 0.78 + 8 +
          (seededUnit(`${seed}-national-speed-${week}-${index}`) - 0.5) * 18,
      );
      const form =
        (seededUnit(`${seed}-national-rival-form-a-${week}-${index}`) +
          seededUnit(`${seed}-national-rival-form-b-${week}-${index}`) -
          1) *
        11;
      const literature = clamp(
        (23 + reasoning * 0.5 + knowledge * 0.18) *
          clamp(0.73 + speed * 0.0037 - (theoryQuestionLoad - 88) * 0.0025, 0.7, 1.02) +
          form,
      );
      const foundation = clamp(
        12 + knowledge * 0.65 + reasoning * 0.06 + form * 0.65,
      );
      return {
        index,
        latent,
        knowledge,
        reasoning,
        experiment,
        theoryRaw: round1(literature * 0.9 + foundation * 0.1),
        namedContext: null as NamedExamRivalContext | null,
      };
    },
  );
  const namedProfiles = eligibleNamedRivals.map((context, namedIndex) => {
    const { rival } = context;
    const level = rivalSnapshot(rival, seed, week, context.retiredWeek).level;
    const knowledge = clamp(
      level +
        4 +
        (seededUnit(`${seed}-named-national-knowledge-${week}-${rival.id}`) -
          0.5) *
          10,
      35,
      97,
    );
    const reasoning = clamp(
      level * 0.9 +
        8 +
        (seededUnit(`${seed}-named-national-reason-${week}-${rival.id}`) -
          0.5) *
          12,
    );
    const speed = clamp(
      level * 0.84 +
        9 +
        (seededUnit(`${seed}-named-national-speed-${week}-${rival.id}`) -
          0.5) *
          12,
    );
    const experiment = clamp(
      level * 0.8 +
        (rival.scope === "national" ? 10 : 5) +
        (seededUnit(`${seed}-named-national-experiment-${week}-${rival.id}`) -
          0.5) *
          16,
    );
    const form =
      (seededUnit(`${seed}-named-national-form-a-${week}-${rival.id}`) +
        seededUnit(`${seed}-named-national-form-b-${week}-${rival.id}`) -
        1) *
      11;
    const literature = clamp(
      (23 + reasoning * 0.5 + knowledge * 0.18) *
        clamp(
          0.73 + speed * 0.0037 - (theoryQuestionLoad - 88) * 0.0025,
          0.7,
          1.02,
        ) +
        form,
    );
    const foundation = clamp(
      12 + knowledge * 0.65 + reasoning * 0.06 + form * 0.65,
    );
    return {
      index: anonymousProfiles.length + namedIndex,
      latent: level,
      knowledge,
      reasoning,
      experiment,
      theoryRaw: round1(literature * 0.9 + foundation * 0.1),
      namedContext: context,
    };
  });
  const competitorProfiles = [...anonymousProfiles, ...namedProfiles];
  const competitorTheory = competitorProfiles.map((profile) => profile.theoryRaw);
  const theoryDistribution = meanAndSd([...competitorTheory, theoryRaw]);
  const theoryT = round1(
    50 + ((theoryRaw - theoryDistribution.mean) / theoryDistribution.sd) * 10,
  );
  const theoryRank =
    1 + competitorTheory.filter((score) => score > theoryRaw).length;
  const qualifiedForExperiment = theoryRank <= NATIONAL_EXPERIMENT_CUTOFF;

  const experimentDefinitions = [
    ["生物化学实验", stats.module1, stats.experimentModules.module1],
    ["植物学实验", stats.module2, stats.experimentModules.module2],
    ["动物学实验", stats.module2, stats.experimentModules.module3],
    [
      "分子与遗传实验",
      (stats.module1 + stats.module4) / 2,
      stats.experimentModules.module4,
    ],
  ] as const;
  const experimentScores = experimentDefinitions.map(
    ([name, knowledge, practical], index) => ({
      name,
      score: round1(
        clamp(
          8 +
            (practical * 0.78 + stats.experiment * 0.22) * 0.52 +
            knowledge * 0.22 +
            stats.mindset * 0.04 +
            (seededUnit(`${seed}-national-exp-${week}-${index}`) - 0.5) * 22 + luck * 0.25,
        ),
      ),
    }),
  );
  const experimentRaw =
    experimentScores.reduce((total, item) => total + item.score, 0) /
    experimentScores.length;
  const qualifiedProfiles = competitorProfiles
    .sort((a, b) => b.theoryRaw - a.theoryRaw)
    .slice(0, qualifiedForExperiment ? 239 : 240);
  const competitorExperiment = qualifiedProfiles.map((profile) =>
    clamp(
      8 +
        profile.experiment * 0.52 +
        profile.knowledge * 0.22 +
        profile.latent * 0.04 +
        (seededUnit(
          `${seed}-national-qualified-exp-${week}-${profile.index}`,
        ) -
          0.5) *
          22,
    ),
  );
  const experimentDistribution = meanAndSd([
    ...competitorExperiment,
    experimentRaw,
  ]);
  const experimentT = round1(
    50 +
      ((experimentRaw - experimentDistribution.mean) /
        experimentDistribution.sd) *
        10,
  );
  const finalScore = round1(theoryT * 0.3 + experimentT * 0.7);
  const competitorFinal = competitorExperiment.map((experiment, index) => {
    const profile = qualifiedProfiles[index];
    const competitorTheoryT =
      50 +
      ((profile.theoryRaw - theoryDistribution.mean) /
        theoryDistribution.sd) *
        10;
    const competitorExperimentT =
      50 +
      ((experiment - experimentDistribution.mean) /
        experimentDistribution.sd) *
        10;
    return competitorTheoryT * 0.3 + competitorExperimentT * 0.7;
  });
  // 前 240 名通过理论与实验合成重新排名；未进入实验者沿用理论排名，
  // 这样 241 名之后仍能正确产生普通银牌和铜牌。
  const finalRank = qualifiedForExperiment
    ? 1 + competitorFinal.filter((score) => score > finalScore).length
    : theoryRank;
  const experimentRank = qualifiedForExperiment
    ? 1 + competitorExperiment.filter((score) => score > experimentRaw).length
    : undefined;
  const namedResults: NamedNationalResult[] = competitorProfiles.flatMap(
    (profile) => {
      const context = profile.namedContext;
      if (!context) return [];
      const rivalTheoryRank =
        1 +
        competitorTheory.filter((score) => score > profile.theoryRaw).length +
        (theoryRaw > profile.theoryRaw ? 1 : 0);
      const rivalQualified = rivalTheoryRank <= NATIONAL_EXPERIMENT_CUTOFF;
      const qualifiedIndex = qualifiedProfiles.findIndex(
        (candidate) => candidate.index === profile.index,
      );
      let rivalFinalRank = rivalTheoryRank;
      let rivalExperimentRaw: number | undefined;
      if (rivalQualified && qualifiedIndex >= 0) {
        rivalExperimentRaw = round1(competitorExperiment[qualifiedIndex]);
        const rivalFinalScore = competitorFinal[qualifiedIndex];
        rivalFinalRank =
          1 +
          competitorFinal.filter((score) => score > rivalFinalScore).length +
          (qualifiedForExperiment && finalScore > rivalFinalScore ? 1 : 0);
      }
      return [
        {
          rivalId: context.rival.id,
          name: context.name,
          school: context.rival.school,
          theoryRaw: profile.theoryRaw,
          theoryRank: rivalTheoryRank,
          qualifiedForExperiment: rivalQualified,
          experimentRaw: rivalExperimentRaw,
          finalRank: rivalFinalRank,
          medal: nationalMedalForRank(rivalFinalRank),
          knownAtExam: context.knownAtExam,
        },
      ];
    },
  );
  const medal = nationalMedalForRank(finalRank);
  return {
    attemptNumber,
    theoryWeek: week,
    participants,
    theoryRaw,
    theoryT,
    theoryRank,
    competitorTheory,
    qualifiedForExperiment,
    experimentScores,
    experimentT,
    finalScore,
    finalRank,
    competitorFinal,
    medal,
    experimentRank,
    sanAtExam: stats.san,
    namedResults,
  };
}

function generateAssessmentRecap(
  assessment: NonNullable<WeekPhase["fixed"][number]["assessment"]>,
  stats: PlayerStats,
  seed: string,
  week: number,
  provincialAttempt?: ProvincialAttempt,
  nationalAttempt?: NationalAttempt,
  nationalStage?: "theory" | "experiment",
  schoolStrength = 0.58,
  schoolParticipants = 680,
  activeSchoolTeamSize = 12,
): AssessmentRecap {
  if (nationalAttempt && nationalStage === "theory") {
    return {
      id: assessment.id,
      title: assessment.title,
      type: "competition",
      subjects: [
        {
          name: "文献阅读（90%）",
          score: nationalAttempt.theoryRaw,
          note: `理论T分 ${formatNumber(nationalAttempt.theoryT)}`,
        },
        {
          name: "基础综合（10%）",
          score: round1(
            (stats.module1 + stats.module2 + stats.module3 + stats.module4) / 4,
          ),
          note: "教材掌握度加权",
        },
      ],
      rank: nationalAttempt.theoryRank,
      participants: nationalAttempt.participants,
      lowRegularPenalty: false,
      nationalAttempt,
      nationalStage,
    };
  }
  if (nationalAttempt && nationalStage === "experiment") {
    return {
      id: assessment.id,
      title: assessment.title,
      type: "competition",
      subjects: nationalAttempt.experimentScores.map((item) => ({
        name: item.name,
        score: item.score,
        note: "实验操作、记录与解释综合",
      })),
      rank: nationalAttempt.finalRank ?? nationalAttempt.theoryRank,
      participants: 240,
      lowRegularPenalty: false,
      nationalAttempt,
      nationalStage,
    };
  }
  if (provincialAttempt) {
    return {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      subjects: provincialAttempt.breakdown.map((section) => ({
        name: section.name,
        score: section.score,
        maxScore: section.maxScore,
        note: `回忆正确 ${section.correct}/${section.total} · 得分率 ${formatNumber(section.rate)}%`,
      })),
      rank: Math.round(
        (provincialAttempt.estimateRankLow +
          provincialAttempt.estimateRankHigh) /
          2,
      ),
      participants: provincialAttempt.participants,
      lowRegularPenalty: false,
      provincialAttempt,
    };
  }
  if (assessment.type === "school") {
    const maxima: Record<string, number> = {
      语文: 150,
      数学: 150,
      英语: 150,
      物理: 100,
      化学: 100,
      生物: 100,
    };
    const coverage = regularCoverage(stats, week);
    const assessmentAdjustment = assessment.title.includes("月考")
      ? 0.015
      : assessment.title.includes("期末")
        ? -0.018
        : 0;
    const subjectScores = assessment.subjects.map((subject, index) => {
      const maxScore = maxima[subject] ?? 100;
      const subjectNoise =
        (seededUnit(`${seed}-${assessment.id}-${subject}-${index}`) - 0.5) *
        (stats.san < 45 ? 0.18 : 0.11);
      const sanAdjustment = (stats.san - 55) / 900;
      const rate = clamp(
        0.2 +
          coverage * 0.68 +
          assessmentAdjustment +
          sanAdjustment +
          subjectNoise,
        0.18,
        0.96,
      );
      const score = round1(maxScore * rate);
      return {
        name: subject,
        score,
        maxScore,
        note:
          rate >= 0.86
            ? "本阶段掌握扎实"
            : rate >= 0.72
              ? "基本跟上当前教学"
              : rate >= 0.58
                ? "存在连续知识缺口"
                : "本阶段内容明显脱节",
      };
    });
    const totalScore = round1(
      subjectScores.reduce((total, subject) => total + subject.score, 0),
    );
    const performance = totalScore / 750;
    const rankNoise =
      (seededUnit(`${seed}-school-rank-${assessment.id}-${week}`) - 0.5) *
      0.07;
    const rankFraction = clamp(
      1 / (1 + Math.exp((performance - schoolStrength) * 9)) + rankNoise,
      0.003,
      0.995,
    );
    return {
      id: assessment.id,
      title: assessment.title,
      type: "school",
      subjects: subjectScores,
      rank: Math.max(1, Math.round(schoolParticipants * rankFraction)),
      participants: schoolParticipants,
      lowRegularPenalty: coverage < 0.58,
      totalScore,
      maxScore: 750,
      regularCoverage: round1(coverage * 100),
      projectedGaokao: projectedGaokaoScore(stats, week),
    };
  }
  const subjectScores = assessment.subjects.map((subject, index) => {
    let ability = stats.reasoning;
    const book = textbooks.find((item) => item.discipline === subject);
    if (book) ability = stats[book.module];
    else if (subject === "第一模块") ability = stats.module1;
    else if (subject === "第二模块") ability = stats.module2;
    else if (subject === "第三模块") ability = stats.module3;
    else if (subject === "第四模块") ability = stats.module4;
    if (subject.includes("实验")) {
      const practical = subject.includes("生物化学")
        ? stats.experimentModules.module1
        : subject.includes("植物")
          ? stats.experimentModules.module2
          : subject.includes("动物")
            ? stats.experimentModules.module3
            : stats.experimentModules.module4;
      ability = practical * 0.7 + stats.experiment * 0.3;
    }
    const noise =
      (seededUnit(`${seed}-${assessment.id}-${subject}-${index}`) * 2 - 1) *
      (stats.san < 45 ? 20 : 14);
    const score = round1(
      clamp(
        22 +
          ability * 0.68 +
          stats.reasoning * 0.12 +
          (subject.includes("实验")
            ? 0
            : clamp((stats.problemSpeed - 50) * 0.12, -5, 6)) +
          noise,
        0,
        100,
      ),
    );
    return {
      name: subject,
      score,
      note:
        score >= 80
          ? "稳定优势"
          : score >= 65
            ? "基本达到预期"
            : score >= 50
              ? "存在明显漏洞"
              : "需要优先复盘",
    };
  });
  const average =
    subjectScores.reduce((total, subject) => total + subject.score, 0) /
    subjectScores.length;
  const isProvincialMock = /省赛冲刺机构模考|历年联赛真题测试/.test(
    assessment.title,
  );
  const isInstitutionAssessment = /机构|南辰|圆阶|外培/.test(assessment.title);
  const participants = isInstitutionAssessment
    ? 80 + (hashSeed(`${seed}-${assessment.id}-institution-size`) % 141)
    : Math.max(2, activeSchoolTeamSize);
  const rank = Math.max(
    1,
    Math.round(
      participants *
        (1 - clamp(average + (seededUnit(`${seed}-rank-${week}`) - 0.5) * 8) / 105),
    ),
  );
  return {
    id: assessment.id,
    title: assessment.title,
    type: assessment.type,
    subjects: subjectScores,
    rank,
    participants,
    lowRegularPenalty: false,
    ...(isProvincialMock
      ? {
          totalScore:
            Math.round((average / 100) * PROVINCIAL_QUESTION_COUNT) *
            PROVINCIAL_POINTS_PER_QUESTION,
          maxScore: PROVINCIAL_MAX_SCORE,
        }
      : {}),
  };
}

type PlayerStats = {
  module1: number;
  module2: number;
  module3: number;
  module4: number;
  reasoning: number;
  problemSpeed: number;
  experiment: number;
  experimentUnlocked: boolean;
  experimentModules: Record<
    "module1" | "module2" | "module3" | "module4",
    number
  >;
  social: number;
  mindset: number;
  academics: number;
  san: number;
  pocketMoney: number;
  coachFavor: number;
  peerFavor: number;
  familySupport: number;
  regularNeglectWeeks: number;
  competitionNeglectWeeks: number;
  slackDependence: number;
  bookStudy: Record<string, BookStudyState>;
  supplementaryBookStudy: Record<string, SupplementaryBookState>;
};

type BookStudyState = {
  course: number;
  notes: number;
  practice: number;
  retention: number;
  lectureSessions: number;
  lastStudiedWeek: number;
};

type WeekRecord = {
  week: number;
  headline: string;
  changes: Array<{ label: string; value: number }>;
  efficiency: number;
  fluctuation: number;
  sanAfter?: number;
  fixedActions?: Array<{ title: string; cost: number }>;
  chosenActions?: Array<{ title: string; count: number; cost: number }>;
  moments?: WeekMoment[];
};

type WeekMoment = {
  kind: "opening" | "event" | "assessment";
  title: string;
  choice?: string;
  result?: string;
  effects?: GameEffect;
};

type AssessmentRecap = {
  id: string;
  title: string;
  type: "school" | "competition";
  subjects: Array<{
    name: string;
    score: number;
    maxScore?: number;
    note: string;
  }>;
  rank: number;
  participants: number;
  lowRegularPenalty: boolean;
  totalScore?: number;
  maxScore?: number;
  regularCoverage?: number;
  projectedGaokao?: number;
  provincialAttempt?: ProvincialAttempt;
  nationalAttempt?: NationalAttempt;
  nationalStage?: "theory" | "experiment";
};

type ProvincialAttempt = {
  attemptNumber: 1 | 2;
  examWeek: number;
  maxScore: number;
  rawScore: number;
  estimateLow: number;
  estimateHigh: number;
  estimateRankLow: number;
  estimateRankHigh: number;
  draftScore: number;
  draftRank: number;
  appealDelta: number;
  participants: number;
  firstPrizeEnd: number;
  secondPrizeEnd: number;
  thirdPrizeEnd: number;
  teamPlaces: number;
  competitionStrength: number;
  competitorScores: number[];
  namedResults: NamedProvincialResult[];
  breakdown: Array<{
    name: string;
    score: number;
    maxScore: number;
    rate: number;
    correct: number;
    total: number;
  }>;
  finalScore?: number;
  finalRank?: number;
  enteredTeam?: boolean;
  finalAward?: string;
};

function normalizeProvincialAttemptScoreScale(
  attempt: ProvincialAttempt,
): ProvincialAttempt {
  if (attempt.maxScore === PROVINCIAL_MAX_SCORE) {
    return { ...attempt, namedResults: attempt.namedResults ?? [] };
  }
  const scale = PROVINCIAL_MAX_SCORE / 100;
  const convert = (value: number | undefined) =>
    typeof value === "number" ? round1(value * scale) : value;
  return {
    ...attempt,
    maxScore: PROVINCIAL_MAX_SCORE,
    rawScore: convert(attempt.rawScore) ?? 0,
    estimateLow: convert(attempt.estimateLow) ?? 0,
    estimateHigh: convert(attempt.estimateHigh) ?? 0,
    draftScore: convert(attempt.draftScore) ?? 0,
    appealDelta: convert(attempt.appealDelta) ?? 0,
    finalScore: convert(attempt.finalScore),
    competitorScores: attempt.competitorScores.map(
      (score) => convert(score) ?? 0,
    ),
    namedResults: (attempt.namedResults ?? []).map((result) => ({
      ...result,
      score: convert(result.score) ?? 0,
    })),
    breakdown: attempt.breakdown.map((section) => ({
      ...section,
      score: section.correct * PROVINCIAL_POINTS_PER_QUESTION,
      maxScore: section.total * PROVINCIAL_POINTS_PER_QUESTION,
      rate:
        section.rate ??
        round1((section.correct / Math.max(1, section.total)) * 100),
    })),
  };
}

type NationalAttempt = {
  attemptNumber: 1 | 2;
  theoryWeek: number;
  participants: number;
  theoryRaw: number;
  theoryT: number;
  theoryRank: number;
  competitorTheory?: number[];
  qualifiedForExperiment: boolean;
  experimentScores: Array<{ name: string; score: number }>;
  experimentT: number;
  finalScore: number;
  finalRank: number | null;
  competitorFinal?: number[];
  medal: NationalMedal;
  experimentRank?: number;
  sanAtExam?: number;
  namedResults: NamedNationalResult[];
};

type DisplayEffectKey =
  | "module1"
  | "module2"
  | "module3"
  | "module4"
  | "reasoning"
  | "problemSpeed"
  | "experiment"
  | "social"
  | "mindset"
  | "academics"
  | "san"
  | "coachFavor"
  | "peerFavor"
  | "familySupport"
  | "pocketMoney";

const effectLabels: Array<[DisplayEffectKey, string]> = [
  ["module1", "第一模块"],
  ["module2", "第二模块"],
  ["module3", "第三模块"],
  ["module4", "第四模块"],
  ["reasoning", "思辨"],
  ["problemSpeed", "做题速率"],
  ["experiment", "实验"],
  ["social", "社交"],
  ["mindset", "心态"],
  ["academics", "常规"],
  ["san", "SAN"],
  ["coachFavor", "教练好感"],
  ["peerFavor", "同学好感"],
  ["familySupport", "家庭支持"],
  ["pocketMoney", "零花钱"],
];

function applyEffects(stats: PlayerStats, effects: GameEffect) {
  const next = { ...stats };
  effectLabels.forEach(([key]) => {
    let amount = effects[key];
    if (typeof amount !== "number") return;
    if (key === "reasoning" && amount > 0) {
      const current = next.reasoning;
      amount *=
        current < 45 ? 0.38 : current < 65 ? 0.25 : current < 80 ? 0.13 : 0.05;
    }
    if (key === "problemSpeed" && amount > 0) {
      const current = next.problemSpeed;
      amount *= current < 48 ? 0.72 : current < 68 ? 0.48 : current < 82 ? 0.25 : 0.1;
    }
    if (key === "experiment" && amount > 0) {
      amount *= next.experiment < 60 ? 0.72 : next.experiment < 78 ? 0.45 : 0.22;
    }
    if (key === "pocketMoney") {
      next.pocketMoney = round1(Math.max(0, next.pocketMoney + amount));
      return;
    }
    if (key === "academics") {
      next.academics = round1(clamp(next.academics + amount, 0, 750));
      return;
    }
    if (key === "coachFavor") {
      next.coachFavor = round1(clamp(next.coachFavor + amount, -100, 100));
      return;
    }
    if (key in next && typeof next[key as keyof PlayerStats] === "number") {
      next[key] = round1(clamp(next[key] + amount));
    }
  });
  return next;
}

function slackProjection(stats: PlayerStats | null, scheduledSlack: number) {
  const dependenceLevel = (stats?.slackDependence ?? 0) + scheduledSlack;
  return {
    cost: Math.min(4, 1 + Math.floor(dependenceLevel / 3)),
    san: round1(Math.max(2.5, 7 - dependenceLevel * 0.55)),
    mindset: round1(-1 - dependenceLevel * 0.12),
  };
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function formatNumber(value: number) {
  const rounded = round1(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function itemSpriteStyle(atlasIndex: number): CSSProperties {
  const column = atlasIndex % 8;
  const row = Math.floor(atlasIndex / 8);
  const zoomedPosition = (cell: number) =>
    (((cell + 0.5) * 1.05 - 0.5) / 7.4) * 100;
  return {
    backgroundImage: `url(${keepsakeAtlasDataUrl})`,
    backgroundPosition: `${zoomedPosition(column)}% ${zoomedPosition(row)}%`,
    backgroundSize: "840% 840%",
  };
}

function regularUnlockedScore(week: number) {
  if (week <= 8) return round1(300 + (week - 1) * 2.5);
  if (week <= 52) return round1(317.5 + (week - 8) * 4.4);
  if (week <= 104) return round1(511.1 + (week - 52) * 2.65);
  return round1(Math.min(750, 648.9 + (week - 104) * 1.95));
}

function regularCoverage(stats: PlayerStats, week: number) {
  return clamp(stats.academics / regularUnlockedScore(week), 0, 1.08);
}

function projectedGaokaoScore(stats: PlayerStats, week: number) {
  const coverage = regularCoverage(stats, week);
  const unlocked = regularUnlockedScore(week);
  const accumulatedRatio = stats.academics / 750;
  return round1(
    clamp(
      285 +
        accumulatedRatio * 310 +
        coverage * 45 +
        Math.min(22, unlocked / 34),
      280,
      650,
    ),
  );
}

type RivalRelationship = DeepRelationship;

type RetirementStage =
  | "before-school"
  | "early-study"
  | "first-loss"
  | "second-team"
  | "after-medal"
  | "second-failure"
  | "mid-course";

type RetirementFlow = {
  stage: RetirementStage;
  step: 0 | 1 | 2;
  resumeWeek?: number;
  initiatedBy?: "self" | "family" | "coach" | "eligibility";
};

type EventResultNotice = {
  title: string;
  choice: string;
  result: string;
  effects?: GameEffect;
  nextAction?:
    | { type: "national-finish" }
    | { type: "continue-event"; event: GameEvent }
    | { type: "retirement-finish"; stage: RetirementStage };
};

type ShopItem = {
  id: string;
  name: string;
  price: number;
  category: "补给" | "学习" | "玩具" | "特殊";
  rarity: KeepsakeRarity;
  atlasIndex: number;
  description: string;
  flavor: string;
  consumable: boolean;
  effects?: GameEffect;
  bonusActionPoints?: number;
  learningBoost?: number;
  purchaseTag?: string;
  effectVisible?: boolean;
};

type SaveSlotInfo = {
  name: string;
  week: number;
  savedAt: string;
  seed: string;
  screen: string;
};

type EndingArchiveRecord = {
  id: string;
  seed: string;
  name: string;
  endingTitle: string;
  futureTitle?: string;
  admission?: string;
  route?: string;
  gaokao?: number;
  nationalRank?: number | null;
  recordedAt: string;
};

type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  creditedBy?: string;
  category?: string;
  unlockMethod?: string;
};

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: "first-week",
    title: "第一页之后",
    description: "完成了竞赛生涯的第一次正式周结算。",
  },
  {
    id: "book-half",
    title: "书脊开始褪色",
    description: "第一次把一本竞赛教材推进到足以形成知识框架的程度。",
  },
  {
    id: "notes-complete",
    title: "手写的第二本书",
    description: "完成了一本教材的整套笔记。",
  },
  {
    id: "library",
    title: "废墟图书馆",
    description: "愿您找到想要的书。",
  },
  {
    id: "shawshank",
    title: "肖申克的救赎",
    description: "有些鸟儿是关不住的。",
  },
  {
    id: "province-upset",
    title: "考场不认识平均值",
    description: "在能力并不占绝对优势时爆冷进入省队。",
  },
  {
    id: "province-one",
    title: "省一不是终点",
    description: "第一次取得省一等奖。",
  },
  {
    id: "national-lab",
    title: "第二天还有考试",
    description: "通过国赛理论筛选，进入实验考试。",
  },
  {
    id: "training-team",
    title: "五十人的下一站",
    description: "国赛最终排名进入国家集训队范围。",
  },
  {
    id: "national-five",
    title: "名单只剩五行",
    description: "在国家集训队理论与实验选拔后进入最终国家队。",
  },
  {
    id: "international-medal",
    title: "世界赛场的显色反应",
    description: "在国际生物学竞赛中获得奖牌。",
  },
  {
    id: "gaokao-600",
    title: "回班以后，六百分",
    description: "经历竞赛或退赛后，高考总分达到600分。",
  },
  {
    id: "gaokao-650",
    title: "迟到的一轮复习",
    description: "高考总分达到650分。",
  },
  {
    id: "ordinary-strong",
    title: "笔试之后，门真的开了",
    description: "通过普通强基笔试、面试并被高校录取。",
  },
  {
    id: "exceptional-strong",
    title: "奖牌的另一种含义",
    description: "通过竞赛破格强基路线收到录取通知书。",
  },
  {
    id: "recommendation",
    title: "不需要七百五十分的夏天",
    description: "凭国家集训队资格完成高校保送接收。",
  },
  {
    id: "early-return",
    title: "只在实验楼待了一个夏天",
    description: "很早离开竞赛路线，并把常规学习重新接了回来。",
  },
  {
    id: "pause",
    title: "暂停键不是删除键",
    description: "在身心危机中接受休学和治疗安排。",
  },
  {
    id: "withdrawal",
    title: "离开那张排名表",
    description: "离开原有学校轨道，进入非传统教育路径。",
  },
  ...communityAchievementDefinitions,
];

function achievementMethod(achievement: AchievementDefinition) {
  const methods: Record<string, string> = {
    "first-week": "完成第一次正式周结算。",
    "book-half": "任意一本竞赛教材的课程进度达到40%。",
    "notes-complete": "任意一本教材的笔记完成度达到99%。",
    library: "在SAN低于50时，让全部教材课程进度达到70%。",
    shawshank: "在家长和教练都反对的情况下，坚持完成退赛。",
    "province-upset": "在四模块平均掌握低于65时，正式进入省队。",
    "province-one": "在任意一次联赛正式结果中获得省一等奖。",
    "national-lab": "国赛理论排名进入前240，取得实验考试资格。",
    "training-team": "国赛最终排名进入前50。",
    "national-five": "国家集训队选拔后进入五人国家队。",
    "international-medal": "代表国家队参加国际赛并获得奖牌。",
    "gaokao-600": "高考总分达到600分。",
    "gaokao-650": "高考总分达到650分。",
    "ordinary-strong": "通过普通强基笔试与面试，并被高校录取。",
    "exceptional-strong": "通过竞赛破格强基路线被高校录取。",
    recommendation: "凭国家集训队资格完成高校保送接收。",
    "early-return": "在第16周及以前退赛，并将高三流程推进到二轮复习或更后阶段。",
    pause: "在身心危机结局中接受休学与治疗安排。",
    withdrawal: "触发退学结局，离开原有学校轨道。",
  };
  return (
    achievement.unlockMethod ??
    methods[achievement.id] ??
    communityAchievementUnlockMethods[achievement.id] ??
    "该成就的达成记录需要重新核对。"
  );
}

const shopItems: ShopItem[] = [
  {
    id: "coffee",
    name: "冰美式",
    price: 12,
    category: "补给",
    rarity: "green",
    atlasIndex: 0,
    description: "本周额外获得1行动点，同时消耗2点SAN；每周最多生效一次。",
    flavor: "家长认为白开水已经足够，因此拒绝报销。",
    consumable: true,
    effects: { san: -2 },
    bonusActionPoints: 1,
    effectVisible: true,
  },
  {
    id: "chocolate",
    name: "抽屉里的巧克力",
    price: 10,
    category: "补给",
    rarity: "green",
    atlasIndex: 1,
    description: "立即恢复3点SAN和0.3点心态；同周重复食用收益不会继续提高。",
    flavor: "模考结束后的糖分通常比解析更快抵达大脑。",
    consumable: true,
    effects: { san: 3, mindset: 0.3 },
    effectVisible: true,
  },
  {
    id: "energy-drink",
    name: "蓝色功能饮料",
    price: 26,
    category: "补给",
    rarity: "blue",
    atlasIndex: 2,
    description: "本周额外获得2行动点，但立即损失5点SAN与1点心态；每周最多生效一次。",
    flavor: "把疲惫推迟并不等于把疲惫消灭。",
    consumable: true,
    effects: { san: -5, mindset: -1 },
    bonusActionPoints: 2,
    effectVisible: true,
  },
  {
    id: "mint",
    name: "薄荷糖与荧光笔套装",
    price: 24,
    category: "学习",
    rarity: "green",
    atlasIndex: 3,
    description: "本周学习效率提高8%，并恢复0.5点SAN。",
    flavor: "颜色太多未必让笔记更清楚，但至少看起来像是准备充分。",
    consumable: true,
    effects: { san: 0.5 },
    learningBoost: 0.08,
    effectVisible: true,
  },
  {
    id: "earplugs",
    name: "隔音耳塞",
    price: 22,
    category: "补给",
    rarity: "green",
    atlasIndex: 4,
    description: "立即恢复2点SAN并稳定0.5点心态。",
    flavor: "可以隔绝室友打游戏，却隔绝不了隔壁床背书。",
    consumable: true,
    effects: { san: 2, mindset: 0.5 },
    effectVisible: true,
  },
  {
    id: "hardback-notebook",
    name: "深绿色硬壳笔记本",
    price: 30,
    category: "学习",
    rarity: "green",
    atlasIndex: 5,
    description: "启用后本周学习效率提高6%；写入计划后转为纪念物。",
    flavor: "第一页写得最整齐，越往后越接近私人密码。",
    consumable: true,
    learningBoost: 0.06,
    effectVisible: true,
  },
  {
    id: "plant-seeds",
    name: "一包来历不明的植物种子",
    price: 18,
    category: "特殊",
    rarity: "blue",
    atlasIndex: 7,
    description: "没有即时收益，解锁完整的窗台种植事件链。",
    flavor: "包装只写了“混合花种”，甚至没有注明到底是什么科。",
    consumable: false,
    purchaseTag: "shop:plant-seeds",
  },
  {
    id: "lucky-pen",
    name: "据说很灵的考试笔",
    price: 28,
    category: "玩具",
    rarity: "green",
    atlasIndex: 6,
    description: "没有稳定加成，解锁幸运笔、丢笔和迷信模考事件。",
    flavor: "老板坚称上一位使用者成功进了省队，但拒绝提供姓名。",
    consumable: false,
    purchaseTag: "shop:lucky-pen",
  },
  {
    id: "field-kit",
    name: "廉价野外观察盒",
    price: 55,
    category: "学习",
    rarity: "blue",
    atlasIndex: 41,
    description: "解锁校园观察、昆虫、雨夜和临时实验事件。",
    flavor: "附赠的塑料放大镜几乎只能把指纹放大。",
    consumable: false,
    purchaseTag: "shop:field-kit",
  },
  {
    id: "card-game",
    name: "物种分类卡牌",
    price: 38,
    category: "玩具",
    rarity: "white",
    atlasIndex: 9,
    description: "解锁和队友打牌、争论分类及宿舍社交事件。",
    flavor: "规则写着寓教于乐，实际玩起来主要是在互相质疑分类依据。",
    consumable: false,
    purchaseTag: "shop:card-game",
  },
  {
    id: "slide-box",
    name: "空的装片收纳盒",
    price: 42,
    category: "特殊",
    rarity: "green",
    atlasIndex: 29,
    description: "寒假实验启蒙后可触发装片收藏与实验事故事件。",
    flavor: "现在里面什么也没有，但你已经开始想象要放些什么。",
    consumable: false,
    purchaseTag: "shop:slide-box",
  },
  {
    id: "strange-mug",
    name: "长得像烧杯的马克杯",
    price: 32,
    category: "玩具",
    rarity: "white",
    atlasIndex: 0,
    description: "解锁教练误会、实验室禁饮和咖啡溢出事件。",
    flavor: "刻度完全不准，唯一可靠的参数是容量很大。",
    consumable: false,
    purchaseTag: "shop:strange-mug",
  },
  {
    id: "microbe-blindbox",
    name: "微生物盲盒",
    price: 20,
    category: "玩具",
    rarity: "white",
    atlasIndex: 9,
    description: "没有数值效果，只会在抽屉里留下一只造型奇怪的小生物。",
    flavor: "老板说它是原核生物，你觉得这个结论缺少证据。",
    consumable: false,
    purchaseTag: "shop:microbe-blindbox",
  },
  {
    id: "folding-umbrella",
    name: "便利店折叠伞",
    price: 36,
    category: "特殊",
    rarity: "green",
    atlasIndex: 10,
    description: "抵消一次普通淋雨事件，并为雨天同行剧情提供额外选择。",
    flavor: "伞面很小，小到两个人使用时必须认真决定偏向哪边。",
    consumable: false,
    purchaseTag: "shop:folding-umbrella",
  },
  {
    id: "shared-snack",
    name: "双人分享装零食",
    price: 22,
    category: "补给",
    rarity: "blue",
    atlasIndex: 11,
    description: "使用后恢复2点SAN，并小幅增加同学好感；每周最多生效一次。",
    flavor: "包装写着两人份，实际分配从来没有那么公平。",
    consumable: true,
    effects: { san: 2, peerFavor: 0.8 },
  },
  {
    id: "gift-bag",
    name: "牛皮纸礼袋",
    price: 16,
    category: "特殊",
    rarity: "green",
    atlasIndex: 12,
    description: "解锁一次正式赠礼选择；礼物是否合适仍由关系与性格决定。",
    flavor: "纸袋没有写收件人，写名字比买下它困难得多。",
    consumable: false,
    purchaseTag: "shop:gift-bag",
  },
  {
    id: "data-usb",
    name: "16GB旧U盘",
    price: 46,
    category: "特殊",
    rarity: "blue",
    atlasIndex: 13,
    description: "保存一次资料事故中的文件，并参与幻想乡档案支线。",
    flavor: "容量不大，文件夹名称却从“最终版”排到了“真的最终版3”。",
    consumable: false,
    purchaseTag: "shop:data-usb",
  },
];

function weekHeadline(week: number, effects: GameEffect) {
  const studyGain =
    (effects.module1 ?? 0) +
    (effects.module2 ?? 0) +
    (effects.module3 ?? 0) +
    (effects.module4 ?? 0) +
    (effects.reasoning ?? 0);
  if ((effects.san ?? 0) >= 12) return "你终于把睡眠补了回来。";
  if ((effects.coachFavor ?? 0) + (effects.peerFavor ?? 0) >= 10)
    return "竞赛教室开始有了熟悉的人。";
  if (studyGain >= 18) return "这是一周扎实、也有些过载的推进。";
  if (week % 4 === 0) return "月末复盘：你的路线正在逐渐成形。";
  return "日历翻过一页，积累还没有立刻显出形状。";
}

function summarizeChosenActions(actions: WeeklyAction[]) {
  const summaries = new Map<string, { title: string; count: number; cost: number }>();
  actions.forEach((action) => {
    const current = summaries.get(action.title);
    summaries.set(action.title, {
      title: action.title,
      count: (current?.count ?? 0) + 1,
      cost: (current?.cost ?? 0) + action.cost,
    });
  });
  return [...summaries.values()];
}

type WeekPhase = {
  label: string;
  freePoints: number;
  isLeave: boolean;
  isTraining: boolean;
  trainingName?: string;
  fixed: Array<{
    title: string;
    cost: number;
    effects: GameEffect;
    bookEffect?: WeeklyAction["bookEffect"];
    coachBonus?: number;
    assessment?: {
      id: string;
      type: "school" | "competition";
      title: string;
      subjects: string[];
    };
  }>;
};

const guidedBookOrder = [
  "cell",
  "biochemistry",
  "molecular",
  "botany",
  "zoology",
  "genetics",
  "plant-physiology",
  "animal-physiology",
  "ecology",
  "evolution",
];

function getWeekPhase(
  week: number,
  schoolSupport: number,
  calendar: ReturnType<typeof calendarFor>,
  tags: string[],
): WeekPhase {
  let label = "高二十月后 · 全面停课";
  const fixed: WeekPhase["fixed"] = [];
  const temporaryLeave =
    tags.includes("临时停课") &&
    week >= calendar.temporaryLeaveWeek &&
    week <= calendar.firstExamWeek;
  const formalLeave =
    tags.includes("正式停课") && week >= calendar.formalLeaveWeek;
  const mandatoryLeave =
    tags.includes("统一停课") && week >= calendar.mandatoryLeaveWeek;
  const isLeave = temporaryLeave || formalLeave || mandatoryLeave;
  const nationalDayTraining =
    week === 13 &&
    (tags.includes("国庆外培-南辰") || tags.includes("国庆外培-圆阶"));
  const winterTraining =
    [29, 30].includes(week) &&
    (tags.includes("寒假外培-南辰") || tags.includes("寒假外培-圆阶"));
  const firstTeamCamp =
    tags.includes("第1次省赛-进入省队") &&
    week > calendar.firstExamWeek + 4 &&
    week < calendar.firstNationalWeek;
  const secondTeamCamp =
    tags.includes("第2次省赛-进入省队") &&
    week > calendar.secondExamWeek + 4 &&
    week < calendar.secondNationalWeek;
  const inProvincialTeamCamp = firstTeamCamp || secondTeamCamp;
  const firstNationalTheory =
    tags.includes("第1次省赛-进入省队") &&
    week === calendar.firstNationalWeek;
  const secondNationalTheory =
    tags.includes("第2次省赛-进入省队") &&
    week === calendar.secondNationalWeek;
  // 实验、休息与颁奖由国赛周内的连续事件处理，不再各占一周。
  const firstNationalExperiment = false;
  const secondNationalExperiment = false;
  const inNationalTheory = firstNationalTheory || secondNationalTheory;
  const inNationalExperiment =
    firstNationalExperiment || secondNationalExperiment;
  const isTraining =
    nationalDayTraining ||
    winterTraining ||
    inProvincialTeamCamp ||
    inNationalTheory ||
    inNationalExperiment;
  const trainingName =
    (nationalDayTraining && tags.includes("国庆外培-南辰")) ||
    (winterTraining && tags.includes("寒假外培-南辰"))
      ? "南辰学社"
      : nationalDayTraining || winterTraining
        ? "圆阶生科"
        : inProvincialTeamCamp
          ? "本校教练安排的校外机构"
        : undefined;

  if (inNationalTheory) {
    const attemptNumber = firstNationalTheory ? 1 : 2;
    label = `全国决赛 · 第${attemptNumber}次参赛`;
    fixed.push({
      title: "上午报到与开幕式",
      cost: 2,
      effects: { social: 1, san: -1, mindset: 0.5 },
    });
    fixed.push({
      title: "下午 · 全国决赛理论考试",
      cost: 7,
      effects: { reasoning: 1, san: -6, mindset: -1 },
      assessment: {
        id: `national-theory-${attemptNumber}-${week}`,
        type: "competition",
        title: "全国中学生生物学竞赛 · 理论考试",
        subjects: ["文献阅读", "基础综合"],
      },
    });
  } else if (inNationalExperiment) {
    const attemptNumber = firstNationalExperiment ? 1 : 2;
    label = `全国决赛 · 实验考试日`;
    const experimentSubjects = [
      "生物化学实验",
      "植物学实验",
      "动物学实验",
      "分子与遗传实验",
    ];
    experimentSubjects.forEach((subject, index) => {
      fixed.push({
        title: `${index < 2 ? "上午" : "下午"} · ${subject}`,
        cost: 2,
        effects: { experiment: 0.8, san: -2.2 },
        assessment:
          index === experimentSubjects.length - 1
            ? {
                id: `national-experiment-${attemptNumber}-${week}`,
                type: "competition",
                title: "全国中学生生物学竞赛 · 实验考试",
                subjects: experimentSubjects,
              }
            : undefined,
      });
    });
  } else if (inProvincialTeamCamp) {
    const experimentalFocus =
      tags.includes("国赛集训-实验强化") ||
      (!tags.includes("国赛集训-理论强化") && week % 3 !== 0);
    label = `本校国赛备赛 · 距国赛 ${
      (firstTeamCamp ? calendar.firstNationalWeek : calendar.secondNationalWeek) -
      week
    } 周`;
    fixed.push({
      title: experimentalFocus
        ? "教练安排机构实验培训 · 四科轮转"
        : "教练安排机构理论培训 · 文献题与套卷",
      cost: 4,
      effects: experimentalFocus
        ? { experiment: 3.5, san: -3.2, coachFavor: 0.5 }
        : { reasoning: 2.4, san: -3, coachFavor: 0.5 },
      bookEffect: experimentalFocus
        ? undefined
        : {
            bookId: week % 3 === 0 ? "genetics" : "biochemistry",
            course: 5,
            practice: 0.8,
            retention: 8,
            mode: "guided",
          },
    });
    fixed.push({
      title: "本校教练检查 · 晚间复盘",
      cost: 2,
      effects: { reasoning: 0.8, san: -1.5, mindset: -0.4 },
    });
    if (week % 2 === 0 || experimentalFocus) {
      fixed.push({
        title: experimentalFocus ? "四科实验循环模考" : "国赛理论全真模考",
        cost: 1,
        effects: experimentalFocus
          ? { experiment: 1.5, san: -3 }
          : { reasoning: 1.2, san: -3 },
        assessment: {
          id: `national-camp-mock-${week}`,
          type: "competition",
          title: experimentalFocus ? "机构实验循环模考" : "机构理论全真模考",
          subjects: experimentalFocus
            ? ["生物化学实验", "植物学实验", "动物学实验", "分子与遗传实验"]
            : ["文献阅读", "文献阅读Ⅱ", "基础综合"],
        },
      });
    }
  } else if (week <= 8) {
    label = "初三毕业暑假";
    fixed.push({
      title: "校内选拔训练",
      cost: 2,
      effects: { module1: 1, module2: 1, coachFavor: 1, san: -1 },
      bookEffect: {
        bookId: week % 2 === 1 ? "cell" : "botany",
        course: 4,
        notes: 2,
        retention: 6,
        mode: "guided",
      },
    });
  } else if (week <= 28) {
    label = week <= 10 ? "高一军训" : "高一上学期 · 正常上课";
    if (week <= 10) {
      fixed.push({
        title: "高一军训",
        cost: 7,
        effects: { social: 2, mindset: 1, san: -3 },
      });
    } else if (isTraining) {
      label = `高一国庆外培 · ${trainingName}`;
      fixed.push({
        title: `${trainingName} · 白天专题课与晚间作业`,
        cost: 6,
        effects: { reasoning: trainingName === "圆阶生科" ? 2 : 1, san: -4 },
        bookEffect: {
          bookId: trainingName === "圆阶生科" ? "genetics" : "molecular",
          course: trainingName === "圆阶生科" ? 16 : 19,
          notes: trainingName === "南辰学社" ? 8 : 4,
          retention: 10,
          lectureSession: 1,
          mode: "guided",
        },
        coachBonus: tags.includes("国庆外培-南辰") ? 1.12 : 1,
      });
      fixed.push({
        title: `${trainingName} · 国庆机构模考`,
        cost: 1,
        effects: { san: -3, reasoning: 0.8 },
        assessment: {
          id: `training-mock-${week}`,
          type: "competition",
          title: `${trainingName}国庆模考`,
          subjects: ["生物化学", "分子生物学", "遗传学", "文献阅读"],
        },
      });
      fixed.push({
        title: `${trainingName} · 统一晚自习与查寝`,
        cost: 1,
        effects: { san: -1, mindset: -0.3 },
      });
    } else if (!isLeave) {
      fixed.push({
        title: "五天常规课程",
        cost: 6,
        effects: { academics: 5.5, san: -2 },
      });
    }
  } else if (week <= 32) {
    label = isTraining ? `高一寒假外培 · ${trainingName}` : "高一寒假";
    if (isTraining) {
      fixed.push({
        title: `${trainingName} · 封闭课程与套卷训练`,
        cost: 6,
        effects: {
          reasoning: trainingName === "圆阶生科" ? 2.5 : 1.2,
          san: -4.5,
        },
        bookEffect: {
          bookId: week === 29 ? "animal-physiology" : "zoology",
          course: trainingName === "圆阶生科" ? 15 : 18,
          notes: trainingName === "南辰学社" ? 9 : 5,
          practice: 1,
          retention: 12,
          lectureSession: 1,
          mode: "guided",
        },
        coachBonus: trainingName === "南辰学社" ? 1.12 : 1,
      });
      fixed.push({
        title: `${trainingName} · 寒假阶段模考`,
        cost: 1,
        effects: { san: -3.5, reasoning: 1 },
        assessment: {
          id: `winter-training-mock-${week}`,
          type: "competition",
          title: `${trainingName}寒假第${week === 29 ? "一" : "二"}次模考`,
          subjects: ["第二模块", "第三模块", "遗传学", "文献阅读"],
        },
      });
      fixed.push({
        title: `${trainingName} · 统一晚自习与查寝`,
        cost: 1,
        effects: { san: -1, mindset: -0.3 },
      });
    } else {
      fixed.push({
        title: "学校寒假集训",
        cost: 3,
        effects: { reasoning: 1, san: -2 },
        bookEffect: {
          bookId: week % 2 === 1 ? "zoology" : "animal-physiology",
          course: 8,
          notes: 5,
          retention: 8,
          mode: "guided",
        },
      });
    }
    if (week === 29 && !isTraining) {
      fixed.push({
        title: "实验启蒙 · 第一次完整进实验室",
        cost: 1,
        effects: { experiment: 2, social: 1, san: -1 },
      });
    }
  } else if (week <= 52) {
    label = "高一下学期 · 正常上课";
    if (!isLeave) {
      fixed.push({
        title: "五天常规课程",
        cost: 6,
        effects: { academics: 5.5, san: -2 },
      });
    }
  } else if (week <= 60) {
    label = "高一结束后的暑假";
    fixed.push({
      title: "竞赛队暑期集训",
      cost: 2,
      effects: { reasoning: 1, coachFavor: 1, san: -2 },
    });
  } else if (week <= 72) {
    label = "高二上学期 · 尚未停课";
    if (!isLeave) {
      fixed.push({
        title: "五天常规课程",
        cost: 6,
        effects: { academics: 5.5, san: -2 },
      });
    }
  } else {
    fixed.push({
      title: "竞赛队固定测验",
      cost: 1,
      effects: { reasoning: 0.5, san: -1.5 },
    });
  }

  const waitingAttempt =
    week > calendar.firstExamWeek && week <= calendar.firstExamWeek + 4
      ? 1
      : week > calendar.secondExamWeek && week <= calendar.secondExamWeek + 4
        ? 2
        : null;
  if (
    waitingAttempt &&
    tags.includes(`第${waitingAttempt}次省赛后-实验路线`)
  ) {
    fixed.push({
      title: "评议稿等待期 · 实验培训",
      cost: 2,
      effects: { experiment: 2.5, san: -1.5, coachFavor: 0.5 },
    });
  } else if (
    waitingAttempt &&
    tags.includes(`第${waitingAttempt}次省赛后-理论路线`)
  ) {
    fixed.push({
      title: "评议稿等待期 · 继续理论",
      cost: 2,
      effects: { reasoning: 1.2, san: -1 },
      bookEffect: {
        bookId: week % 2 === 0 ? "genetics" : "animal-physiology",
        course: 5,
        practice: 0.5,
        retention: 6,
        mode: "guided",
      },
    });
  } else if (
    waitingAttempt &&
    tags.includes(`第${waitingAttempt}次省赛后-准备退赛`)
  ) {
    fixed.push({
      title: "评议稿等待期 · 回班补常规",
      cost: 2,
      effects: { academics: 3, san: -0.5, mindset: 0.5 },
    });
  }

  const guidedStart = 9;
  const guidedEnd = calendar.temporaryLeaveWeek - 1;
  const guidedBlock = (guidedEnd - guidedStart + 1) / guidedBookOrder.length;
  const guidedIndex = Math.floor((week - guidedStart) / guidedBlock);
  if (
    week >= guidedStart &&
    week <= guidedEnd &&
    !isTraining &&
    schoolSupport >= 40 &&
    guidedIndex >= 0 &&
    guidedIndex < guidedBookOrder.length
  ) {
    const book = textbooks.find((item) => item.id === guidedBookOrder[guidedIndex]);
    if (book) {
      const coachBonus = round1(0.82 + schoolSupport / 300);
      const position = ((week - guidedStart) / guidedBlock) % 1;
      const guidedMode =
        position < 0.5
          ? "lecture"
          : guidedIndex % 4 === 3
            ? "practice"
            : "notes";
      const modeTitle =
        guidedMode === "lecture"
          ? "统一看课"
          : guidedMode === "notes"
            ? "统一抄笔记"
            : "统一刷题";
      fixed.push({
        title: `竞赛队${modeTitle} · ${book.shortTitle}`,
        cost: 1,
        effects: {
          [book.module]: 1,
          coachFavor: schoolSupport >= 72 ? 0.3 : 0,
          san: schoolSupport >= 60 ? -0.5 : -1.2,
        },
        bookEffect: {
          bookId: book.id,
          course:
            guidedMode === "lecture"
              ? round1(book.lectureCap / Math.max(1, guidedBlock * 0.5))
              : guidedMode === "notes"
                ? round1(14 / Math.max(1, guidedBlock * 0.5))
                : 7,
          notes: guidedMode === "notes" ? round1(18 / Math.max(1, guidedBlock * 0.5)) : 0,
          practice: guidedMode === "practice" ? 1 : 0,
          retention: 5,
          lectureSession: guidedMode === "lecture" ? 1 : 0,
          mode: "guided",
        },
        coachBonus,
      });
    }
  }
  if (
    week >= guidedStart &&
    week <= guidedEnd &&
    !isTraining &&
    schoolSupport < 55 &&
    week % 4 === 1
  ) {
    fixed.push({
      title: "教练临时加塞 · 低效统一任务",
      cost: 1,
      effects: { san: -1.5, mindset: -0.4 },
      bookEffect: {
        bookId: guidedBookOrder[
          hashSeed(`coach-burden-${week}`) % guidedBookOrder.length
        ],
        course: 1.2,
        retention: 1,
        mode: "guided",
      },
      coachBonus: 0.72,
    });
  }

  const inTerm = (week >= 11 && week <= 28) || (week >= 33 && week <= 52) ||
    (week >= 61 && week <= 72);
  const nearestProvincialDistance = Math.min(
    Math.abs(calendar.firstExamWeek - week),
    Math.abs(calendar.secondExamWeek - week),
  );
  const attendsRegularExam =
    !isLeave && !isTraining && nearestProvincialDistance > 5;
  if (attendsRegularExam && [18, 42, 66].includes(week)) {
    fixed.push({
      title: "学校期中考试",
      cost: 1,
      effects: { san: -3 },
      assessment: {
        id: `midterm-${week}`,
        type: "school",
        title: "学校期中考试",
        subjects: ["语文", "数学", "英语", "物理", "化学", "生物"],
      },
    });
  } else if (attendsRegularExam && [28, 52, 72].includes(week)) {
    fixed.push({
      title: "学校期末考试",
      cost: 2,
      effects: { san: -4 },
      assessment: {
        id: `final-${week}`,
        type: "school",
        title: "学校期末考试",
        subjects: ["语文", "数学", "英语", "物理", "化学", "生物"],
      },
    });
  } else if (attendsRegularExam && inTerm && week % 4 === 0) {
    fixed.push({
      title: "学校月考",
      cost: 1,
      effects: { san: -2 },
      assessment: {
        id: `monthly-${week}`,
        type: "school",
        title: "学校月考",
        subjects: ["语文", "数学", "英语", "物理", "化学", "生物"],
      },
    });
  }

  if (
    week >= 12 &&
    week <= 72 &&
    week % 3 === 0 &&
    week !== calendar.firstExamWeek &&
    week !== calendar.secondExamWeek &&
    !fixed.some((item) => item.assessment)
  ) {
    const subjectStart = hashSeed(`quiz-${week}`) % textbooks.length;
    const quizSubjects = [
      textbooks[subjectStart % textbooks.length].discipline,
      textbooks[(subjectStart + 3) % textbooks.length].discipline,
      textbooks[(subjectStart + 7) % textbooks.length].discipline,
    ];
    fixed.push({
      title: "竞赛队阶段小测",
      cost: 1,
      effects: { reasoning: 0.8, coachFavor: 0.3, san: -1.5 },
      assessment: {
        id: `competition-quiz-${week}`,
        type: "competition",
        title: "竞赛队阶段小测",
        subjects: quizSubjects,
      },
    });
  }

  const targetExamWeek =
    week < calendar.firstExamWeek
      ? calendar.firstExamWeek
      : calendar.secondExamWeek;
  const weeksToProvincial = targetExamWeek - week;
  if (weeksToProvincial >= 1 && weeksToProvincial <= 12) {
    const isInstitutionMock = weeksToProvincial % 2 === 0;
    const focusBook = textbooks[
      hashSeed(`sprint-paper-${week}`) % textbooks.length
    ];
    const existingAssessment = fixed.some((item) => item.assessment);
    fixed.push({
      title: isInstitutionMock
        ? `省赛冲刺 · 第${13 - weeksToProvincial}次机构整卷模考`
        : `省赛冲刺 · 近年联赛真题限时测试`,
      cost: 1,
      effects: {
        san: isInstitutionMock ? -3.2 : -2.4,
        reasoning: isInstitutionMock ? 1.2 : 0.8,
      },
      bookEffect: {
        bookId: focusBook.id,
        course: isInstitutionMock ? 3.2 : 2.4,
        practice: 0.5,
        retention: 5,
        mode: "guided",
      },
      assessment: existingAssessment
        ? undefined
        : {
            id: `provincial-sprint-${week}`,
            type: "competition",
            title: isInstitutionMock ? "省赛冲刺机构模考" : "历年联赛真题测试",
            subjects: ["第一模块", "第二模块", "第三模块", "第四模块", "文献阅读"],
          },
    });
  }

  if (week === calendar.firstExamWeek || week === calendar.secondExamWeek) {
    fixed.push({
      title: "五月第二个星期日 · 生物学联赛",
      cost: 2,
      effects: { san: -5, reasoning: 0.5 },
      assessment: {
        id: `provincial-${week}`,
        type: "competition",
        title: "全国中学生生物学联赛",
        subjects: ["第一模块", "第二模块", "第三模块", "第四模块", "文献阅读"],
      },
    });
  }

  const fixedCost = fixed.reduce((total, item) => total + item.cost, 0);
  if (isLeave && !label.includes("停课")) label = `${label} · 停课中`;
  return {
    label,
    freePoints: Math.max(1, 10 - fixedCost),
    fixed,
    isLeave,
    isTraining,
    trainingName,
  };
}

function makeBookAction(
  book: Textbook,
  mode: "lecture" | "notes" | "review-notes" | "practice",
): WeeklyAction {
  const isLecture = mode === "lecture";
  const isNotes = mode === "notes";
  const noteProgress = round1(100 / book.baseWeeks);
  const courseProgress = round1(
    (book.lectureCap / book.maxLectureSessions) * 1.32,
  );
  const masteryProgress =
    isLecture
      ? courseProgress
      : isNotes
        ? round1(noteProgress * 0.85)
        : mode === "review-notes"
          ? round1(3.5 + book.difficulty * 0.4)
          : round1(5.5 + book.difficulty * 0.7);
  return {
    id: `${book.id}-${mode}`,
    category: "study",
    title: `${
      isLecture
        ? "看课"
        : isNotes
          ? "抄笔记"
          : mode === "review-notes"
            ? "看笔记"
            : "刷题"
    } · ${book.shortTitle}`,
    description:
      mode === "lecture"
        ? "短时间搭起知识框架，但次数有限，且无法覆盖全部细节。"
        : mode === "notes"
          ? "推进不快，但有效掌握增长更多，也能延缓遗忘。"
          : mode === "review-notes"
            ? "快速唤回已经整理过的内容，压力最低。"
            : "用题目暴露漏洞。压力最大，但能力增长没有次数上限。",
    cost: isNotes ? 2 : 1,
    effects: {
      reasoning: mode === "practice" ? 0.9 : isNotes ? 0.45 : 0.18,
      problemSpeed:
        mode === "practice" ? 2.4 : isNotes ? 0.45 : mode === "review-notes" ? 0.7 : 0.35,
      san:
        mode === "practice" ? -3 : isNotes ? -2 : mode === "review-notes" ? -0.5 : -1,
    },
    bookEffect: {
      bookId: book.id,
      course: masteryProgress,
      notes: isNotes ? noteProgress : 0,
      practice: mode === "practice" ? 1 : 0,
      retention:
        mode === "review-notes" ? 14 : isNotes ? 10 : mode === "practice" ? 8 : 5,
      lectureSession: isLecture ? 1 : 0,
      mode,
    },
  };
}

const experimentModuleLabels = {
  module1: "第一模块实验",
  module2: "第二模块实验",
  module3: "第三模块实验",
  module4: "第四模块实验",
} as const;

function makeExperimentAction(
  module: keyof typeof experimentModuleLabels,
): WeeklyAction {
  return {
    id: `experiment-practice-${module}`,
    category: "study",
    title: `练习 · ${experimentModuleLabels[module]}`,
    description:
      "完成操作、记录、误差分析与结果解释。理论基础越扎实，本次训练越容易沉淀。",
    cost: 2,
    effects: { san: -3.5, reasoning: 0.4 },
    experimentModule: module,
  };
}

function makeSupplementaryBookAction(bookId: string, mode: "browse" | "research"): WeeklyAction {
  const book = supplementaryBooks.find((item) => item.id === bookId)!;
  return {
    id: `supplementary-${bookId}-${mode}`,
    category: "study",
    title: `${mode === "browse" ? "简单浏览" : "深入研究"} · ${book.title}`,
    description: mode === "browse" ? "快速建立专门领域的地图，收获有限但压力较小。" : "沿着专门问题持续深挖，掌握增长更高，也更消耗精神状态。",
    cost: mode === "browse" ? 1 : 2,
    effects: { san: mode === "browse" ? -1.5 : -4, reasoning: mode === "research" ? 0.35 : 0.1 },
    supplementaryBookEffect: { bookId, mastery: mode === "browse" ? 5 : 11, retention: mode === "browse" ? 6 : 13, mode },
  };
}

function makeSupplementaryUnlockEvent(week: number, seed: string, stats: PlayerStats): GameEvent | null {
  if (week < 8 || seededUnit(`${seed}-supplementary-unlock-${week}`) >= 0.075) return null;
  const locked = supplementaryBooks.filter((book) => !stats.supplementaryBookStudy[book.id]?.unlocked);
  if (!locked.length) return null;
  const book = locked[hashSeed(`${seed}-${week}-supplementary-choice`) % locked.length];
  return supplementaryUnlockEventForBook(book, week);
}

function supplementaryUnlockEventForBook(
  book: (typeof supplementaryBooks)[number],
  week = 8,
): GameEvent {
  return {
    id: `supplementary-unlock-${book.id}`,
    phase: "weekly",
    label: "偶然所得 · 扩充书目",
    title: `一本不在教练书单里的${book.title}`,
    body: ["它可能来自旧书架、群友寄来的纸箱、学长留下的资料，或一次漫无目的的检索。封面与教练常用书单格格不入，目录却正好延伸到你最近反复疑惑的地方。它不会替代基础教材，也不计入模块总掌握，却可能让你在少数理论题、实验判断或材料语境中看见更深一层。把它带走意味着多开一条支路，暂时记下则能保护现有进度；两种选择都不等于否认知识本身的价值。"],
    trigger: { earliestWeek: week, latestWeek: week },
    concealConsequences: true,
    choices: [
      { id: `unlock-supplementary-${book.id}`, title: "把它加入自己的扩充书目", preview: "", result: `你掸掉封面上的灰，把${book.title}放进书架最容易拿到的位置，又在目录旁夹了一张空白索引。它不会替代当前教材，也不会被计入模块总掌握；从下周起，你可以选择简单浏览或深入研究，让其中更专门的知识影响相关题目，部分书目也会帮助对应实验判断。眼下多出来的不是必须完成的任务，而是一条可以自行决定走多深的支路。`, effects: { tags: [`扩充书目:${book.id}:已解锁`] } },
      { id: `skip-supplementary-${book.id}`, title: "暂时把线索记下来", preview: "", result: `你把${book.title}的书名、版本和发现地点记在资料索引末尾，却没有立刻把它加入本周计划。现有教材已经占满桌面，再开一条战线只会让每本书都停在前几十页。那条记录并未消失；以后再次遇到这本书或更明确的题目需求时，你仍有机会把它带回书架。此刻的克制不是否定它的价值，而是承认注意力也有边界。`, effects: { mindset: 0.2 } },
    ],
  };
}

function supplementaryUnlockDeveloperCatalog() {
  return supplementaryBooks.map((book, index) =>
    supplementaryUnlockEventForBook(book, 8 + index),
  );
}

const learningKeys: Array<keyof GameEffect> = [
  "module1",
  "module2",
  "module3",
  "module4",
  "reasoning",
  "academics",
  "experiment",
];

const relationshipKeys: Array<keyof GameEffect> = [
  "social",
  "coachFavor",
  "peerFavor",
];

function sanEfficiency(san: number) {
  if (san >= 45) return 0.72 + (san - 45) * 0.0065;
  return Math.max(0.12, 0.72 * Math.pow(san / 45, 2));
}

function mindsetSanCostMultiplier(mindset: number) {
  return clamp(1.35 - mindset * 0.007, 0.65, 1.45);
}

function seededUnit(value: string) {
  return (hashSeed(value) % 10000) / 9999;
}

function adjustedWeeklyEffects(
  actions: WeeklyAction[],
  stats: PlayerStats,
  seed: string,
  week: number,
  studyBoost = 0,
  originId = "",
) {
  const baseEfficiency = sanEfficiency(stats.san);
  const volatility = stats.san < 45 ? 0.28 : 0.12;
  const fluctuation =
    1 + (seededUnit(`${seed}-efficiency-${week}`) * 2 - 1) * volatility;
  const familyLearningModifier =
    stats.familySupport >= 80
      ? 0.02
      : stats.familySupport < 25
        ? -0.05
        : stats.familySupport < 40
          ? -0.025
          : 0;
  const learningFactor =
    baseEfficiency * fluctuation * (1 + studyBoost + familyLearningModifier);
  const socialFactor =
    (0.78 + stats.social * 0.004) *
    (0.92 + seededUnit(`${seed}-social-${week}`) * 0.16);
  const effects: GameEffect = {};

  actions.forEach((action) => {
    effectLabels.forEach(([key]) => {
      const raw = action.effects[key];
      if (typeof raw !== "number") return;
      let adjusted = raw;
      if (raw > 0 && learningKeys.includes(key)) {
        let originFactor = 1;
        if (originId === "coach-family" && action.category === "study") originFactor = 1.08;
        if (originId === "elite-school" && action.category === "study") originFactor = 1.05;
        if (originId === "county-school" && action.category === "study") originFactor = 1.1;
        if (originId === "top-scorer" && action.category === "regular") originFactor = 1.15;
        if (originId === "top-scorer" && action.category === "study") originFactor = 0.95;
        adjusted = raw * learningFactor * originFactor;
      }
      if (raw > 0 && relationshipKeys.includes(key)) adjusted = raw * socialFactor;
      if (key === "san" && raw < 0) {
        adjusted = raw * mindsetSanCostMultiplier(stats.mindset);
      }
      effects[key] = Number(
        (((effects[key] as number | undefined) ?? 0) + adjusted).toFixed(1),
      );
    });
  });

  return {
    effects,
    baseEfficiency,
    fluctuation,
    learningFactor,
  };
}

function effectiveBookProgress(state: BookStudyState) {
  return round1(clamp(state.course * (state.retention / 100)));
}

function weightedModuleProgress(
  bookStudy: Record<string, BookStudyState>,
  module: Textbook["module"],
) {
  const books = textbooks.filter((book) => book.module === module);
  const totalWeight = books.reduce(
    (total, book) => total + book.baseWeeks * (0.7 + book.difficulty * 0.1),
    0,
  );
  if (totalWeight === 0) return 0;
  const weighted = books.reduce((total, book) => {
    const weight = book.baseWeeks * (0.7 + book.difficulty * 0.1);
    return total + effectiveBookProgress(bookStudy[book.id]) * weight;
  }, 0);
  return round1(weighted / totalWeight);
}

function updateBookStudy(
  current: Record<string, BookStudyState>,
  actions: WeeklyAction[],
  fixed: WeekPhase["fixed"],
  learningFactor: number,
  week: number,
  competitionNeglectWeeks: number,
) {
  const next = Object.fromEntries(
    Object.entries(current).map(([id, state]) => [id, { ...state }]),
  ) as Record<string, BookStudyState>;
  const studied = new Set<string>();
  const weeklyBookRepeats: Record<string, number> = {};

  Object.entries(next).forEach(([bookId, state]) => {
    const idleWeeks = state.lastStudiedWeek === 0 ? 0 : week - state.lastStudiedWeek;
    if (idleWeeks > 2) {
      const noteProtection = state.notes * 0.0002;
      const decay = Math.min(0.985, 0.955 + noteProtection);
      state.retention = round1(Math.max(15, state.retention * decay));
      next[bookId] = state;
    }
    if (competitionNeglectWeeks >= 2) {
      const neglectDecay = 1 - Math.min(0.08, (competitionNeglectWeeks - 1) * 0.012);
      state.retention = round1(Math.max(12, state.retention * neglectDecay));
      next[bookId] = state;
    }
  });

  const applyBookEffect = (
    effect: NonNullable<WeeklyAction["bookEffect"]>,
    bonus = 1,
  ) => {
    const book = textbooks.find((item) => item.id === effect.bookId);
    const state = next[effect.bookId];
    if (!book || !state) return;
    if (
      (effect.lectureSession ?? 0) > 0 &&
      state.lectureSessions >= book.maxLectureSessions
    )
      return;
    const progressFactor = learningFactor * bonus;
    const repeatIndex = weeklyBookRepeats[effect.bookId] ?? 0;
    weeklyBookRepeats[effect.bookId] = repeatIndex + 1;
    const repeatFactor = [1, 0.72, 0.55, 0.45, 0.38][
      Math.min(4, repeatIndex)
    ];
    const masteryFactor =
      state.course < 65
        ? 0.67
        : state.course < 75
          ? 0.42
          : state.course < 85
            ? 0.24
            : 0.1;
    state.course = round1(
      Math.min(
        94,
        state.course +
          (effect.course ?? 0) *
            progressFactor *
            repeatFactor *
            masteryFactor,
      ),
    );
    state.notes = round1(
      Math.min(100, state.notes + (effect.notes ?? 0) * progressFactor),
    );
    state.practice = round1(state.practice + (effect.practice ?? 0));
    state.retention = round1(
      clamp(state.retention + (effect.retention ?? 0) * progressFactor),
    );
    state.lectureSessions = Math.min(
      book.maxLectureSessions,
      state.lectureSessions + (effect.lectureSession ?? 0),
    );
    state.lastStudiedWeek = week;
    next[effect.bookId] = state;
    studied.add(effect.bookId);
  };

  fixed.forEach((item) => {
    if (item.bookEffect) {
      applyBookEffect(item.bookEffect, item.coachBonus ?? 1);
    }
  });
  actions.forEach((action) => {
    if (action.bookEffect) applyBookEffect(action.bookEffect);
  });

  return { next, studied };
}

function findWeeklyEvent(
  week: number,
  stats: PlayerStats,
  seed: string,
  resolved: string[],
  tags: string[],
  counts: Record<string, number>,
  isTrainingWeek: boolean,
  retiredRivalIds: string[],
) {
  const pool = [...weeklySocialEvents, ...linkedWeeklyEvents];
  const eligible = pool.filter((event) => {
      const trigger = event.trigger;
      if (resolved.includes(event.id)) return false;
      if (event.phase === "exam") return false;
      const mentionedRival = rivalMentionedBy(event);
      if (mentionedRival && retiredRivalIds.includes(mentionedRival.id))
        return false;
      if (isTrainingWeek && event.phase !== "training") return false;
      if (!isTrainingWeek && event.phase === "training") return false;
      if (week < trigger.earliestWeek || week > trigger.latestWeek) return false;
      if (trigger.allowedWeeks && !trigger.allowedWeeks.includes(week)) return false;
      const chainMatch = event.id.match(/^chain-(.+)-(\d{2})$/);
      if (chainMatch && Number(chainMatch[2]) > 1) {
        const previousStep = Number(chainMatch[2]) - 1;
        const previousWeekTag = tags.find((tag) => tag.startsWith(`chain:${chainMatch[1]}:${previousStep}:week:`));
        if (previousWeekTag) {
          const previousWeek = Number(previousWeekTag.split(":").at(-1));
          const requiredGap = 2 + (hashSeed(`${seed}-${event.id}-chain-gap`) % 4);
          if (Number.isFinite(previousWeek) && week - previousWeek < requiredGap) return false;
        }
      }
      if (stats.social < (trigger.minSocial ?? 0)) return false;
      if (stats.peerFavor < (trigger.minPeerFavor ?? 0)) return false;
      if (stats.peerFavor > (trigger.maxPeerFavor ?? 100)) return false;
      if (stats.coachFavor < (trigger.minCoachFavor ?? 0)) return false;
      if (stats.san > (trigger.maxSan ?? 100)) return false;
      if (
        stats.regularNeglectWeeks < (trigger.minRegularNeglectWeeks ?? 0)
      )
        return false;
      if (
        trigger.requiredTags?.some((requiredTag) => !tags.includes(requiredTag))
      )
        return false;
      if (trigger.blockedTags?.some((blockedTag) => tags.includes(blockedTag)))
        return false;
      const taggedWeek = (requiredTag: string) => {
        const prefix = `tag-week:${requiredTag}:`;
        const weeks = tags
          .filter((tag) => tag.startsWith(prefix))
          .map((tag) => Number(tag.slice(prefix.length)))
          .filter(Number.isFinite);
        return weeks.length > 0 ? Math.max(...weeks) : undefined;
      };
      if (
        trigger.minimumWeeksAfterTags &&
        Object.entries(trigger.minimumWeeksAfterTags).some(([requiredTag, gap]) => {
          const happenedAt = taggedWeek(requiredTag);
          return happenedAt !== undefined && week - happenedAt < gap;
        })
      )
        return false;
      if (
        trigger.maximumWeeksAfterTags &&
        Object.entries(trigger.maximumWeeksAfterTags).some(([requiredTag, gap]) => {
          const happenedAt = taggedWeek(requiredTag);
          return happenedAt !== undefined && week - happenedAt > gap;
        })
      )
        return false;
      if (
        trigger.requiredActionCounts &&
        Object.entries(trigger.requiredActionCounts).some(
          ([actionKey, minimum]) => (counts[actionKey] ?? 0) < minimum,
        )
      )
        return false;
      if (
        trigger.maximumActionCounts &&
        Object.entries(trigger.maximumActionCounts).some(
          ([actionKey, maximum]) => (counts[actionKey] ?? 0) > maximum,
        )
      )
        return false;
      return true;
    });
  if (eligible.length === 0)
    return isTrainingWeek
      ? makeTrainingRoutineEvent(week, seed)
      : makeRoutineEvent(week, seed);
  const trainingEligible = eligible.filter((event) => event.phase === "training");
  const isolationEligible =
    stats.peerFavor <= 8
      ? eligible.filter((event) => event.id.startsWith("chain-isolation"))
      : [];
  const priorityPool =
    trainingEligible.length > 0
      ? trainingEligible
      : isolationEligible.length > 0
        ? isolationEligible
        : eligible;
  const probabilistic = priorityPool.filter(
    (event) =>
      seededUnit(`${seed}-${event.id}-${week}`) < (event.trigger.probability ?? 1),
  );
  if (probabilistic.length === 0)
    return isTrainingWeek
      ? makeTrainingRoutineEvent(week, seed)
      : makeRoutineEvent(week, seed);
  const candidates = probabilistic;
  const index = hashSeed(`${seed}-weekly-event-${week}`) % candidates.length;
  return candidates[index];
}

function makeTrainingRoutineEvent(week: number, seed: string): GameEvent {
  const variants: GameEvent[] = [
    {
      id: `training-routine-handout-${week}`,
      phase: "training",
      label: "外培日常 · 课间",
      title: "讲义在课间多出了一页",
      body: [
        "上午的讲师拖堂了十分钟，下一节课的人已经抱着电脑站在门口。你收拾桌面时，发现讲义最后多夹了一页没有页码的补充材料：像是上一届留下的整理，也可能只是助教临时打印的延伸题。周围的人有的抓紧拍照，有的趴在桌上补觉。培训日程不会为这页纸停下，你只能决定现在把注意力放在哪里。",
      ],
      trigger: { earliestWeek: week, latestWeek: week },
      concealConsequences: true,
      choices: [
        { id: `training-routine-handout-copy-${week}`, title: "拍下来，午休再判断是否值得看", preview: "", result: "你没有立刻挤进新知识里，只把页面拍清楚，并在文件名里记下讲师和章节。午休时你发现其中一半只是旧题重排，另一半却正好补上上午跳过的推导。筛选花去一点休息，却避免了把所有额外资料都当作必须完成；真正有用的两段被抄进了当天笔记，其余内容留在相册里等待以后再说。", effects: { reasoning: 0.3, san: -0.3 } },
        { id: `training-routine-handout-rest-${week}`, title: "把纸交给同桌，先去走廊透气", preview: "", result: "你请同桌替你保留一张，自己走到窗边喝水。十分钟里没有增加任何页数，耳边密集了一上午的术语却终于慢慢退开。下一节课开始前，同桌告诉你那页并非必讲内容，还把拍好的照片发来。你没有失去资料，只是不再要求自己在每一次偶然发现面前立即进入战斗状态。", effects: { san: 1.3, peerFavor: 0.3 } },
      ],
    },
    {
      id: `training-routine-dorm-${week}`,
      phase: "training",
      label: "集训日常 · 宿舍",
      title: "熄灯前的二十分钟",
      body: [
        "晚课结束后，宿舍里四个人都说只再看一会儿，台灯却一盏接一盏亮起来。有人复盘白天模考，有人排队洗澡，还有人把明早的闹钟设了三遍。你今天确实有几处没弄懂，也确实已经困得需要反复读同一句话。集训把学习、休息和同伴生活压进一个房间，继续或停下都会影响明天的状态。",
      ],
      trigger: { earliestWeek: week, latestWeek: week },
      concealConsequences: true,
      choices: [
        { id: `training-routine-dorm-one-${week}`, title: "只订正最关键的一题，然后按时熄灯", preview: "", result: "你把目标缩到那道真正影响后续理解的题，和上铺核对完关键前提便合上讲义。剩余错题仍在红笔圈里，没有因为停下而消失；可闹钟响起时，你至少能清楚记得昨晚弄懂了什么。克制没有换来夸张进步，只保护了第二天第一节课仍能工作的注意力。", effects: { reasoning: 0.25, san: 0.8 } },
        { id: `training-routine-dorm-all-${week}`, title: "趁记忆还热，把整套卷重新过完", preview: "", result: "你压低台灯，把每道错题都重新算了一遍。凌晨时思路一度变得很顺，几处漏洞也确实被补上；代价在第二天早课才出现，讲师讲到新的关键步骤时，你必须掐着手心才能保持清醒。昨夜的收获真实存在，透支同样真实存在，它们不会互相抵消。", effects: { reasoning: 0.7, san: -2.2 } },
        { id: `training-routine-dorm-talk-${week}`, title: "收起卷子，听室友讲今天最崩溃的时刻", preview: "", result: "话题从一道离谱的实验题开始，很快变成谁在课堂上走神、谁偷偷想家、谁其实没听懂却不敢举手。没有人替别人解决问题，房间里的比较却松了一点。熄灯后你仍记得白天的失误，也知道它们并非只发生在自己身上；这段闲聊占去复盘时间，换回了几个人都更容易入睡的夜晚。", effects: { peerFavor: 0.8, san: 1.2 } },
      ],
    },
    {
      id: `training-routine-lunch-${week}`,
      phase: "training",
      label: "外培日常 · 午休",
      title: "陌生食堂里的一张空桌",
      body: [
        "培训点的食堂比学校更拥挤，课程表只给了四十分钟午休。你端着餐盘找到一张空桌，旁边几名外校选手正在讨论上午讲师留下的争议结论；另一侧靠窗的位置很安静，足够吃完饭后趴一会儿。外培机会珍贵，结识新同伴和保护下午状态也都不是浪费时间，区别只在你愿意承担哪一种缺失。",
      ],
      trigger: { earliestWeek: week, latestWeek: week },
      concealConsequences: true,
      choices: [
        { id: `training-routine-lunch-join-${week}`, title: "坐过去，先听他们怎样理解那段结论", preview: "", result: "你没有一坐下就宣布自己的答案，而是先听清几个人争论的其实是不同层级的问题。等你补上一条例外条件时，讨论终于从互相否定变成可以查证的分歧。午饭吃得有些匆忙，你却记住了两个外校名字，也得到一份晚上会发来的参考页码；社交占用休息，换来的不是捷径，而是以后还能继续对话的入口。", effects: { social: 0.8, reasoning: 0.25, san: -0.5 } },
        { id: `training-routine-lunch-rest-${week}`, title: "坐到窗边，把这顿饭安静吃完", preview: "", result: "你没有因为身处外培就强迫自己抓住每一次交流，只把手机调成静音，慢慢吃完午饭。窗外没有熟悉的操场，楼下送货车倒车的声音反而让脑子短暂空了下来。下午回教室时，你错过了一段可能有用的讨论，却没有错过讲师开场的前二十分钟；这也是培训日程里一种真实的收益。", effects: { san: 1.5 } },
      ],
    },
  ];
  return variants[hashSeed(`${seed}-training-routine-${week}`) % variants.length];
}

function makeRoutineEvent(week: number, seed: string): GameEvent {
  const variants: GameEvent[] = [
    {
      id: `routine-library-${week}`,
      phase: "weekly",
      label: "每周日常 · 校园",
      title: "图书馆最后一排",
      body: ["晚自习临近结束，图书馆最后一排只剩你和两名竞赛生。管理员已经关掉半边灯，窗外的操场广播也停了。今天没有突发事件，恰恰因此，最后四十分钟显得完全属于你：可以再逼自己推进一点，也可以和身边的人交换那些不会写进周计划的近况。"],
      inspiration: "原创",
      trigger: { earliestWeek: week, latestWeek: week },
      choices: [
        {
          id: `routine-library-study-${week}`,
          title: "再看一节书",
          preview: "微小但稳定的积累",
          result: "你把计时器调到三十五分钟，只处理刚才卡住的那一小节。闭馆提示响起时，进度条并没有出现惊人的跳跃，但页边多了两个真正由自己推出来的箭头。你合上书时仍有些疲惫，却没有平日那种“坐了很久却不知道学了什么”的空心感；这几页会在之后的复习里成为可靠的落脚点。",
          effects: { module1: 0.4, san: -0.5 },
        },
        {
          id: `routine-library-chat-${week}`,
          title: "和队友聊几句",
          preview: "交换一点近况和情报",
          result: "你压低声音问起最近的训练，话题很快从一道难题滑到睡眠、家长和谁又在群里假装毫不焦虑。没有人提供秘密资料，也没有一句话能直接提高分数，但你终于知道别人同样会在熟悉章节里卡住、会害怕被队友超过。离开图书馆时，问题仍然存在，只是不再像只发生在你一个人身上。",
          effects: { peerFavor: 0.8, san: 0.5 },
        },
      ],
    },
    {
      id: `routine-canteen-${week}`,
      phase: "weekly",
      label: "每周日常 · 队内社交",
      title: "食堂的十分钟",
      body: ["午休只剩十分钟，食堂窗口已经开始收餐。队伍里两个人端着餐盘争论一道生态题，筷子在半空比画捕食关系；另一边的人埋头吃饭，只想在下午训练前获得片刻安静。你坐在两拨人中间，胃和大脑提出了完全不同的优先级。"],
      inspiration: "原创",
      trigger: { earliestWeek: week, latestWeek: week },
      choices: [
        {
          id: `routine-canteen-talk-${week}`,
          title: "加入讨论",
          preview: "也许能理清一个概念",
          result: "你把餐盘挪过去，先要求他们把“种群下降”究竟指数量、密度还是增长率说清楚。争论没有在十分钟内得到标准答案，却从互相重复结论变成了三个可以查证的问题。回教室后，有人真的找出教材页码发进群里。你少休息了一会儿，但获得的不是一句答案，而是一套以后还能使用的拆题方式。",
          effects: { reasoning: 0.5, peerFavor: 0.5, san: -0.3 },
        },
        {
          id: `routine-canteen-rest-${week}`,
          title: "安静吃饭",
          preview: "给脑子留一点空白",
          result: "你没有加入争论，把手机扣在桌面，认真吃完已经有些凉的饭。周围的术语仍不断飘过来，你却第一次允许自己不在每句话后面寻找考点。十分钟里没有任何知识增量，下午回到教室时，太阳穴的紧绷却缓了下来；你发现休息并不是从竞赛时间里偷走东西，而是在保护下一段真正能工作的注意力。",
          effects: { san: 1.2 },
        },
      ],
    },
    {
      id: `routine-corridor-${week}`,
      phase: "weekly",
      label: "每周日常 · 教练",
      title: "办公室门口",
      body: ["晚训结束后，你路过竞赛教练办公室，门开着一条缝。教练正对着电脑整理下周课表，桌边还摞着没有批完的卷子。你本来只是想问一道题，却在门口站了半分钟：问题还很模糊，进去可能得到指点，也可能只是暴露自己连哪里没懂都说不清。"],
      inspiration: "原创",
      trigger: { earliestWeek: week, latestWeek: week },
      choices: [
        {
          id: `routine-corridor-ask-${week}`,
          title: "进去问问",
          preview: "一次普通的请教",
          result: "你敲门后先把自己的推理从头讲了一遍，讲到第三步时便听出哪里不对。教练没有接过草稿替你算完，只圈出那个被你默认成立的条件，又从书架抽出一本参考书让你查。谈话不到五分钟，却比直接得到答案更让人踏实；离开办公室时，你知道下一步该验证什么，也更清楚以后怎样提出一个值得讨论的问题。",
          effects: { coachFavor: 0.6, reasoning: 0.4, san: -0.3 },
        },
        {
          id: `routine-corridor-note-${week}`,
          title: "先自己想",
          preview: "把问题记下来，暂时不打扰",
          result: "你没有敲门，而是在走廊长椅上把疑问重新写了一遍：已知条件、自己的推导、矛盾出现的位置，以及最想确认的一步。写到最后，你已经解决了其中一半，剩下的部分也不再是一团“我不会”。第二天再去办公室时，教练看完只问了两个问题；暂缓请教没有变成逃避，反而让这次交流更具体。",
          effects: { mindset: 0.3 },
        },
      ],
    },
  ];
  return variants[hashSeed(`${seed}-routine-${week}`) % variants.length];
}

function makeHotelEvent(attemptNumber: 1 | 2): GameEvent {
  return {
    id: `provincial-${attemptNumber}-hotel`,
    phase: "exam",
    label: `省赛流程 · 第${attemptNumber}次参赛 · 考前入住`,
    title: "考试前一晚，你抵达考点附近的酒店。",
    body: [
      "大堂里全是抱着教材和透明文件袋的竞赛生。教练在群里发了最后一条通知：晚上九点后禁止集体对题。",
      "父母可以留下陪你，也可以让你跟队伍统一行动。真正影响明天的，可能不是再记住一个知识点，而是今晚能否睡着。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: `hotel-parent-${attemptNumber}`,
        title: "让父母陪同，早点结束复习",
        preview: "SAN +3 · 家庭支持 +1 · 心态 +1",
        result: "父母把房间里的速查页收拢到桌角，没有再追问省队线，也没有临时搜来所谓押题资料。母亲确认了三遍闹钟，父亲把准考证、身份证和两支笔并排放在门边，随后主动结束话题。十点前灯便熄了，隔壁队员还在走廊讨论争议题时，你已经躺下。焦虑没有完全消失，却终于不必同时照顾一家人的期待。",
        effects: {
          san: 3,
          familySupport: 1,
          mindset: 1,
          tags: [`第${attemptNumber}次省赛-父母陪考`],
        },
      },
      {
        id: `hotel-team-${attemptNumber}`,
        title: "跟队友拼房，参加教练考前会",
        preview: "同学好感 +2 · 教练好感 +1 · SAN -1",
        result: "教练把考前会严格控制在二十分钟，只重复入场时间、涂卡顺序和遇到陌生题时的弃题原则，没有再塞进任何新知识。散会后，室友仍忍不住提起群里争了半天的那道题，你们约好只查一个条件便关灯。讨论最终多用了十分钟，却也让彼此确认明天有人会一起出门、一起承担紧张，而不是独自守着倒计时。",
        effects: {
          peerFavor: 2,
          coachFavor: 1,
          san: -1,
          tags: [`第${attemptNumber}次省赛-队伍住宿`],
        },
      },
      {
        id: `hotel-late-study-${attemptNumber}`,
        title: "独自住下，把速查页再过一遍",
        preview: "教材保持率小幅提高 · SAN -4 · 心态 -1",
        result: "你把速查页摊满半张床，从熟悉章节一路翻到最担心的细节。凌晨一点时，你确实重新记住了几个术语和两条易混结论，却也开始把每一页都想象成明天一定会考的内容。关灯以后，大脑仍在自动出题，走廊每次开门都让你醒来。新增的记忆是否能抵消睡眠损失还不知道，考前夜却已经被复习完整占据。",
        effects: {
          san: -4,
          mindset: -1,
          reasoning: 0.5,
          tags: [`第${attemptNumber}次省赛-考前熬夜`],
        },
      },
    ],
  };
}

function makePostExamRouteEvent(attemptNumber: 1 | 2): GameEvent {
  return {
    id: `provincial-${attemptNumber}-post-route`,
    phase: "exam",
    label: "省赛流程 · 等待评议稿",
    title: "答案评议稿还要三周。接下来学什么，没有人能替你决定。",
    body: [
      "现在只有机构答案和零散回忆。有人已经开始实验培训，有人继续刷理论，也有人把竞赛书全部装进纸箱。",
      "这不是最终结果，但三周足以让不同选择产生真正的差距。评议稿可能推翻你此刻的估计，却不会归还已经过去的训练时间。你必须在信息不完整时安排下一步，并接受这项决定既可能成为提前准备，也可能在名单公布后显得像一段沉没成本。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: `post-experiment-${attemptNumber}`,
        title: "先参加实验培训",
        preview: "实验解锁并提升 · SAN -2 · 若未进省队可能成为沉没成本",
        result: "正式名单尚未公布，你仍按报名时间进入第一次完整实验培训。省队线在群里被改了好几个版本，身边的人也无法确认这笔投入最后是否用得上。你穿上实验服，从最基础的记录格式和仪器检查开始练习，手上的生疏很快暴露出来。提前准备可能成为优势，也可能只留下一段昂贵经历；你选择先为尚未确定的资格付出成本。",
        effects: {
          experiment: 4,
          san: -2,
          tags: [`第${attemptNumber}次省赛后-实验路线`],
        },
      },
      {
        id: `post-theory-${attemptNumber}`,
        title: "继续理论，为下一次机会准备",
        preview: "思辨 +2 · 心态 +1",
        result: "你没有把是否继续完全交给尚未公布的名单，而是按原计划摊开下一本书，把这次考试暴露出的理论缺口列成新的复习页。继续学习并不表示你确信一定有下一次机会，也不是拒绝面对可能落选；它只是让等待期仍由自己支配。群里的估分消息偶尔让你停笔，随后你又回到眼前章节，为任何可能到来的路线保留一点准备。",
        effects: {
          reasoning: 2,
          mindset: 1,
          tags: [`第${attemptNumber}次省赛后-理论路线`],
        },
      },
      {
        id: `post-quit-${attemptNumber}`,
        title: "暂时退赛，开始补常规",
        preview: "常规 +5 · SAN +3 · 教练好感 -2",
        result: "你把竞赛书按模块收进柜子，只留下可能与常规课程重合的部分，第二天便回到原班跟随课表。正式结果仍会公布，你也没有宣布自己永远离开，但等待不再占满全部生活。陌生章节和堆积的作业很快暴露出回归的难度，班主任为你列出补课顺序。暂时退赛带来了喘息，也意味着必须用行动重新接上另一条被搁置许久的路线。",
        effects: {
          academics: 5,
          san: 3,
          coachFavor: -2,
          tags: [`第${attemptNumber}次省赛后-准备退赛`],
        },
      },
    ],
  };
}

function makeEvaluationDraftEvent(attempt: ProvincialAttempt): GameEvent {
  return {
    id: `provincial-${attempt.attemptNumber}-evaluation-draft`,
    phase: "exam",
    label: "省赛流程 · 答案评议稿",
    title: `评议稿公布：重新估分 ${formatNumber(attempt.draftScore)} / ${PROVINCIAL_MAX_SCORE}。`,
    body: [
      `得分率 ${formatNumber(provincialScoreRate(attempt.draftScore))}%。机构答案经过三周争议后，部分题目接受了新答案，也有题目被建议删除；重新计算后，你的暂估排名约为全省第 ${attempt.draftRank} 名。`,
      ...(familiarProvincialLine(attempt, attempt.draftScore, true)
        ? [familiarProvincialLine(attempt, attempt.draftScore, true)!]
        : []),
      attempt.appealDelta > 0
        ? "你发现仍有一道题存在可以引用教材或论文反驳的空间。申诉若被接受，会对所有相关选手统一改分。"
        : "你检查了争议题，目前没有发现足以改变统一评分规则的明确证据。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: `appeal-${attempt.attemptNumber}`,
        title: "整理证据，请教练提交申诉",
        preview:
          attempt.appealDelta > 0
            ? "存在有效证据 · 可能触发统一改分 · SAN -3"
            : "证据较弱 · 仍可尝试 · SAN -3",
        result:
          attempt.appealDelta > 0
            ? "你把教材页码、论文图表、题干条件和推理链压缩成一页说明，逐项区分知识错误、表述歧义与自己可能的误读。教练删去情绪化措辞，又要求你补上原文截图，才以学校名义提交评议组。证据并不保证改分，但这份不同意见终于不再只是群聊里的愤怒，而成为所有相关选手都能被统一核验的正式材料。"
            : "你仍把能够找到的教材表述和答题回忆整理出来，教练看完后指出证据不足，却没有阻止你提交。材料最终被转交评议组，同时明确标注目前无法证明统一评分存在错误。你完成了申诉流程，也必须接受它很可能不会改变结果；之后的准备仍按原估分区间进行，不能把全部希望寄托在一次缺少关键依据的复核上。",
        effects: {
          san: -3,
          coachFavor: 1,
          reasoning: 1,
          tags: [`第${attempt.attemptNumber}次省赛-提交申诉`],
        },
      },
      {
        id: `accept-draft-${attempt.attemptNumber}`,
        title: "接受评议稿，停止反复估分",
        preview: "SAN +2 · 心态 +1",
        result: "你接受教练整理后的评议稿，把教材依据、争议点和自己的估分区间一并存档，随后关闭不断滚动的群聊提醒。有人仍在传播新的答案版本，也有人声称掌握内部名次，但这些消息都无法再被核实。最终线尚未公布，焦虑当然没有结束；只是此刻已经没有新的证据值得用一整晚追逐。你决定先让等待恢复成等待，而不是另一场无法交卷的考试。",
        effects: {
          san: 2,
          mindset: 1,
          tags: [`第${attempt.attemptNumber}次省赛-接受评议稿`],
        },
      },
    ],
  };
}

function makeOfficialResultEvent(
  attempt: ProvincialAttempt,
  storyTags: string[],
): GameEvent {
  const appealed = storyTags.includes(
    `第${attempt.attemptNumber}次省赛-提交申诉`,
  );
  const finalScore = round1(
    clamp(
      attempt.draftScore + (appealed ? attempt.appealDelta : 0),
      0,
      PROVINCIAL_MAX_SCORE,
    ),
  );
  const finalRank = rankAgainst(attempt.competitorScores, finalScore);
  const award = provincialAward(finalRank, attempt);
  const entersTeam = finalRank <= attempt.teamPlaces;
  const outcomeTag = entersTeam
    ? `第${attempt.attemptNumber}次省赛-进入省队`
    : `第${attempt.attemptNumber}次省赛-${award}`;
  return {
    id: `provincial-${attempt.attemptNumber}-official-result`,
    phase: "exam",
    label: "省赛流程 · 最终名单",
    title: entersTeam
      ? `省队线公布：全省第 ${finalRank} 名，进入省队。`
      : `最终排名：全省第 ${finalRank} 名，${award}。`,
    body: [
      `最终有效得分 ${formatNumber(finalScore)} / ${PROVINCIAL_MAX_SCORE}，得分率 ${formatNumber(provincialScoreRate(finalScore))}%。本届省一截止第 ${attempt.firstPrizeEnd} 名，省二截止第 ${attempt.secondPrizeEnd} 名，省三截止第 ${attempt.thirdPrizeEnd} 名。`,
      ...(familiarProvincialLine(attempt, finalScore)
        ? [familiarProvincialLine(attempt, finalScore)!]
        : []),
      entersTeam
        ? `本届省队共 ${attempt.teamPlaces} 人。你的名字出现在名单中，等待期终于有了明确方向。`
        : attempt.attemptNumber === 1
          ? `本届省队共 ${attempt.teamPlaces} 人。省队线与奖项线是两回事，接下来仍要决定是否使用第二次参赛机会。`
          : `本届省队共 ${attempt.teamPlaces} 人。两次参赛机会已经用完，竞赛主线将在离队与回班交接后强制结束。`,
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: `record-official-${attempt.attemptNumber}`,
        title: entersTeam
          ? "确认名单，准备国赛阶段"
          : attempt.attemptNumber === 2
            ? "确认最后一次联赛结果，开始离队交接"
            : "记录结果，继续选择后续路线",
        preview: entersTeam
          ? "解锁省队与国赛流程 · 教练好感 +5"
          : `${award} · 后续可继续竞赛或回归常规`,
        result: entersTeam
          ? "教练在群里只发了一句“今晚开会”，随后上传了实验服尺寸表和第一轮集训安排。你把榜单截下来时仍有些不敢相信，直到队友开始讨论报到和外培，才意识到实验、国赛理论与那些只在联考榜上见过的全国对手已经成为现实。省队名额不是终点，它只是把接下来的训练突然变得具体而拥挤。"
          : "你把最终名次和奖项记进档案，关闭了刷新了一整天的榜单。省赛已经结束，这张证书不会自动替你决定是否再用一年，也不会抹去成绩暴露出的差距；但父母、教练和同学从此都会带着这个结果讨论你的下一步。今晚仍没有必须立刻做出的选择，等情绪沉下来后，你还要判断这份不甘究竟值得多少时间。",
        effects: {
          coachFavor: entersTeam ? 5 : award === "省一等奖" ? 2 : -1,
          familySupport: entersTeam
            ? 5
            : award === "省一等奖"
              ? 1.5
              : award === "省二等奖"
                ? 0.5
                : award === "省三等奖"
                  ? -1
                  : -3,
          mindset: entersTeam ? 3 : -1,
          tags: [
            outcomeTag,
            `第${attempt.attemptNumber}次省赛-${award}`,
            `第${attempt.attemptNumber}次省赛-最终名单确认`,
          ],
        },
      },
    ],
  };
}

function makeNamedProvincialAftermathEvent(
  attempt: ProvincialAttempt,
): GameEvent | null {
  const playerScore = attempt.finalScore ?? attempt.draftScore;
  const playerRank = attempt.finalRank ?? rankAgainst(attempt.competitorScores, playerScore);
  const nearby = rankedNamedProvincialResults(attempt, playerScore).sort(
    (a, b) => {
      const aStory = rivals.some((rival) => rival.id === a.rivalId) ? 0 : 1;
      const bStory = rivals.some((rival) => rival.id === b.rivalId) ? 0 : 1;
      return (
        aStory - bStory ||
        Math.abs(a.rank - playerRank) - Math.abs(b.rank - playerRank)
      );
    },
  );
  const focus = nearby[0];
  if (!focus) return null;
  const playerAhead = playerRank < focus.rank;
  return {
    id: `provincial-${attempt.attemptNumber}-named-aftermath-${focus.rivalId}`,
    phase: "exam",
    label: "联赛之后 · 熟人榜单",
    title: playerAhead
      ? `这一次，你的名字排在${focus.name}前面。`
      : `${focus.name}的名字先于你出现在榜单上。`,
    body: [
      `你是全省第 ${playerRank} 名，${focus.name}是第 ${focus.rank} 名。分数之间的距离只有 ${formatNumber(Math.abs(playerScore - focus.score))} 分，却足以把两个人带向不同的暑假。`,
      focus.school === "本校"
        ? "下一次回到竞赛教室时，你们仍会在同一张训练表上见面；排名没有自动解释过去共同学习过的那些晚上。"
        : "你们最初只在机构榜单和聊天群里认识。正式排名第一次让那个名字与一段具体命运连在一起。",
    ],
    concealConsequences: true,
    visualNovel: true,
    trigger: { earliestWeek: 1, latestWeek: 120 },
    choices: [
      {
        id: `named-result-message-${focus.rivalId}`,
        title: "私下发消息，不用名次定义这次对话",
        preview: "对方会记住你怎样谈论胜负。",
        result: playerAhead
          ? `${focus.name}先祝贺了你，随后才说自己会不会继续。你删掉了原本想发的复盘建议，只问TA暑假准备怎么过。`
          : `${focus.name}没有用安慰的语气，只把自己也做错的几道题发了过来。你们第一次承认，同一张卷子可以让两个人同时不甘心。`,
        effects: { peerFavor: 2, san: 0.5, tags: [`${focus.rivalId}-联赛后保持联系`] },
      },
      {
        id: `named-result-compare-${focus.rivalId}`,
        title: "把两人的分模块结果逐项比较",
        preview: "比较可能带来进步，也会延长考后的紧绷。",
        result: `你们把四个模块的得分、犹豫题和时间分配逐项摊开，找到了差距最大的部分，也发现总分接近并不意味着失分方式相同：有人败在知识空白，有人则把会做的题留在最后。榜单被重新拆回一道道可以复盘的题，原本笼统的输赢因此有了可执行的方向；只是每次看见对方领先的那一栏，胜负感仍会从分析表格下面冒出来。`,
        effects: { reasoning: 0.5, problemSpeed: 0.5, san: -2, tags: [`${focus.rivalId}-联赛后对表`] },
      },
      {
        id: `named-result-distance-${focus.rivalId}`,
        title: "暂时不联系，让结果先沉淀一周",
        preview: "保持距离也是一种处理方式。",
        result: "你关掉榜单，也暂时退出不断更新的群聊，没有立刻把祝贺、遗憾或不甘投向另一个人。接下来一周，你几次点开对话框，又觉得任何一句话都像在借名次索要回应，于是重新按灭屏幕。这段停顿让情绪有机会从比赛结果里分离，也让对方无法知道你是在体谅、逃避还是疏远；有些关系经得住安静，有些张力则会被未说明的沉默留下。",
        effects: { san: 1.5, mindset: 0.3, peerFavor: -0.5 },
      },
    ],
  };
}

function makeNationalCampChoiceEvent(attemptNumber: 1 | 2): GameEvent {
  return {
    id: `national-${attemptNumber}-camp-choice`,
    phase: "training",
    label: "国赛备赛 · 本校外培路线",
    title: "省队名单确认后，本校教练开始联系实验机构与模考。",
    body: [
      "省队并不会把所有学校集中起来训练。五月到八月，各校教练分别联系机构、大学实验室和模考；不同学校的安排甚至可能完全不同。",
      "你的教练给出了几套可报销的方案。理论卷与实验模考都会有，但实验训练更密集；你仍可以决定额外时间偏向哪一端。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 120 },
    choices: [
      {
        id: `national-camp-experiment-${attemptNumber}`,
        title: "额外参加实验强化外培",
        preview: "实验增长更快 · 理论自由时间更少 · SAN -2",
        result: "你接受了额外实验安排，开始在几间设备和规程都不同的实验室之间轮转。第一次离心时你因为配平被叫停，解剖课上也不得不重新适应刀具，但记录表上逐渐少了低级失误。离心机、显微镜和解剖台取代了大部分普通课桌，手上的熟练度确实增长；与此同时，理论整卷只能被压到晚间，恢复时间也比计划中更快消失。",
        effects: {
          experiment: 3,
          san: -2,
          tags: ["国赛集训-实验强化"],
        },
      },
      {
        id: `national-camp-theory-${attemptNumber}`,
        title: "额外参加文献题与理论模考",
        preview: "思辨增长更快 · 实验训练主要依赖本校教练安排",
        result: "外培群从第一天起便不断上传论文、图表题和限时整卷，你把额外时段几乎全留给文献阅读与理论模考。教练报名的基础实验课仍照常参加，但你不再追加操作训练，更多时候只在纸面上推演实验结果。几周后，陌生材料不再轻易打乱节奏，理论判断也更连贯；只是当同队成员讨论仪器手感时，你清楚这条路线把风险留在了另一端。",
        effects: {
          reasoning: 2.5,
          san: -1,
          tags: ["国赛集训-理论强化"],
        },
      },
      {
        id: `national-camp-balanced-${attemptNumber}`,
        title: "只跟本校教练安排，保留恢复时间",
        preview: "实验与理论均衡 · 心态 +2 · 教练好感 +1",
        result: "你没有追着其他学校的课表继续加码，只完成本校教练已经报名的实验与理论训练，并把空出的晚上固定留给复盘和睡眠。看见外培群晒出新题时，你仍会担心自己少学了一层，教练也要求你用阶段成绩证明这不是懈怠。好在课程之间终于留下了消化的间隙，错题能够回到教材，操作失误也能在下一次训练前被真正整理。",
        effects: {
          mindset: 2,
          coachFavor: 1,
          tags: ["国赛集训-均衡路线"],
        },
      },
    ],
  };
}

function nationalHost(seed: string, attemptNumber: 1 | 2) {
  const hosts = ["海岚省", "江岳省", "云川省", "南岭省", "临海省", "北湖省"];
  return hosts[
    hashSeed(`${seed}-national-host-${attemptNumber}`) % hosts.length
  ];
}

function makeNationalOpeningEvent(
  attemptNumber: 1 | 2,
  seed: string,
): GameEvent {
  const host = nationalHost(seed, attemptNumber);
  return {
    id: `national-${attemptNumber}-opening`,
    phase: "exam",
    label: `全国决赛 · ${host}`,
    title: `开幕式开始，全国各省代表队依次入场。`,
    body: [
      `今年国赛在${host}举行。你第一次把省队服穿在身上，身边近六百人的名字大多只在联考榜和培训群里见过。`,
      "开幕式结束后，下午就是理论考试。赛场热闹只持续很短时间，所有人都在暗自计算最后还能复习什么。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 120 },
    choices: [
      {
        id: `national-opening-network-${attemptNumber}`,
        title: "和外省熟人交换队徽，观察全国对手",
        preview: "社交 +2 · 同学好感 +1 · SAN -1",
        result: "你带着本省队徽走进人群，和几个只在培训群头像里见过的选手第一次面对面说话。有人交换当地题库的传闻，有人只问食堂在哪，榜单上长期靠前的名字也会因为下午考试反复确认准考证。短短半小时没有带来决定胜负的情报，却让“全国对手”从一排抽象名次变回具体的人；回房时，你口袋里多了几枚队徽，也少了一点面对传说的畏惧。",
        effects: { social: 2, peerFavor: 1, san: -1 },
      },
      {
        id: `national-opening-rest-${attemptNumber}`,
        title: "仪式结束后立刻回房休息",
        preview: "SAN +2 · 心态 +1",
        result: "仪式结束后，你向队友说明一声便直接回房，拉上窗帘，把手机调成勿扰。楼下合影和交换队徽的消息仍不断弹出，你没有逐条点开，只按计划吃完东西、躺了二十分钟，再检查一次文具。你错过了一些认识外省选手的机会，却保住了下午最稀缺的清醒。卷子不会因为社交变容易，也不会因为多看一页突然改变；至少入场时，你的手没有一直发抖。",
        effects: { san: 2, mindset: 1 },
      },
    ],
  };
}

function nearestNamedNationalResult(
  attempt: NationalAttempt,
  stage: "theory" | "final" = "final",
) {
  const playerRank =
    stage === "theory" ? attempt.theoryRank : (attempt.finalRank ?? attempt.theoryRank);
  return [...(attempt.namedResults ?? [])].sort((a, b) => {
    const aStory = rivals.some((rival) => rival.id === a.rivalId) ? 0 : 1;
    const bStory = rivals.some((rival) => rival.id === b.rivalId) ? 0 : 1;
    const rankA = stage === "theory" ? a.theoryRank : a.finalRank;
    const rankB = stage === "theory" ? b.theoryRank : b.finalRank;
    return aStory - bStory || Math.abs(rankA - playerRank) - Math.abs(rankB - playerRank);
  })[0];
}

function makeNationalListRevisionEvent(attempt: NationalAttempt): GameEvent {
  const source = weeklySocialEvents.find((event) => event.id === "national-list-midnight-revision");
  if (!source) throw new Error("缺少国赛名单深夜更正事件");
  return {
    ...source,
    id: `national-${attempt.attemptNumber}-list-revision`,
    phase: "exam",
    label: "全国决赛 · 实验名单深夜更正",
    archive: { category: "赛事与考试", group: "国赛流程", clusterKey: "national-list-revision", variantKey: String(attempt.attemptNumber), variantLabel: `第${attempt.attemptNumber}次国赛`, timingNote: "仅在理论晋级实验后、实验考试开始前触发" },
    trigger: { earliestWeek: attempt.theoryWeek, latestWeek: attempt.theoryWeek },
    choices: source.choices.map((choice) => ({ ...choice, id: `${choice.id}-${attempt.attemptNumber}` })),
  };
}

function makeTheoryNightEvent(attempt: NationalAttempt): GameEvent {
  const nearby = [...(attempt.namedResults ?? [])]
    .sort(
      (a, b) =>
        Math.abs(a.theoryRank - attempt.theoryRank) -
        Math.abs(b.theoryRank - attempt.theoryRank),
    )
    .slice(0, 3);
  return {
    id: `national-${attempt.attemptNumber}-theory-night`,
    phase: "exam",
    label: "全国决赛 · 理论排名公布",
    title: attempt.qualifiedForExperiment
      ? `理论第 ${attempt.theoryRank} 名：进入前240，获得实验考试资格。`
      : `理论第 ${attempt.theoryRank} 名：未进入前240。`,
    body: [
      `理论原始表现 ${formatNumber(attempt.theoryRaw)}，换算T分 ${formatNumber(attempt.theoryT)}。排名在当晚公布，走廊里不断有人刷新名单。`,
      ...(nearby.length
        ? [
            `你认识的选手里，${nearby
              .map(
                (result) =>
                  `${result.name}理论第${result.theoryRank}${
                    result.qualifiedForExperiment ? "，进入实验" : "，止步理论"
                  }`,
              )
              .join("；")}。`,
          ]
        : []),
      attempt.qualifiedForExperiment
        ? "你的名字出现在实验分组表中。第二天上午两门、下午两门，四个板块将占满整整一天。"
        : "你的国赛考试部分到此结束。实验考场仍会照常开放，但名单上没有你的考号。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 120 },
    choices: [
      {
        id: `national-theory-confirm-${attempt.attemptNumber}`,
        title: attempt.qualifiedForExperiment
          ? "确认实验分组，准备第二天考试"
          : "收起准考证，接受理论止步",
        preview: attempt.qualifiedForExperiment
          ? "解锁四科实验考试 · SAN -2 · 心态 +2"
          : "SAN -3 · 心态 -2",
        result: attempt.qualifiedForExperiment
          ? "教练把所有还在争论的理论题收起来，不再允许任何人复盘，只逐项检查实验服、文具、分组编号和集合时间。你几次想确认某道题是否选错，最终还是把手机放下，因为现在没有任何补理论的意义。名单把下一步写得十分清楚：今晚要做的是吃饭、睡觉，并让双手准备好应对明天四个完全不同的实验板块。"
          : "你把准考证收回文件袋，仍按要求留在代表队驻地，却不再需要准备第二天的实验服。走廊另一端，进入前240名的队员正在核对分组和集合时间，那些声音近得可以听清，却与你的日程隔着一道名单。没有哪道理论题还能重做，也没有额外机会证明操作能力；你第一次必须在比赛尚未完全结束时，接受自己的考试部分已经抵达终点。",
        effects: {
          san: attempt.qualifiedForExperiment ? -2 : -3,
          mindset: attempt.qualifiedForExperiment ? 2 : -2,
          tags: [
            attempt.qualifiedForExperiment
              ? `第${attempt.attemptNumber}次国赛-进入实验`
              : `第${attempt.attemptNumber}次国赛-理论止步`,
          ],
        },
      },
    ],
  };
}

function makeNationalRestEvent(attempt: NationalAttempt): GameEvent {
  const nearby = nearestNamedNationalResult(attempt, "theory");
  return {
    id: `national-${attempt.attemptNumber}-rest-day`,
    phase: "exam",
    label: "全国决赛 · 休息日",
    title: "所有考试结束，颁奖典礼前还有完整一天。",
    body: [
      attempt.qualifiedForExperiment
        ? "四场实验留下了不同程度的确信和怀疑。有人反复回忆操作步骤，有人拒绝再谈任何一道题。"
        : "没有实验成绩需要等待，但你仍和省队一起留到颁奖典礼。全国赛场成为一段短暂而复杂的旁观经历。",
      "教练要求全队停止估分。城市就在酒店外面，房间里却仍有人讨论可能的金银牌线。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 120 },
    choices: [
      {
        id: `national-rest-walk-${attempt.attemptNumber}`,
        title: "和队友出去走走，不再对答案",
        preview: "SAN +4 · 同学好感 +2",
        result: "你们把手机留在包里，沿着酒店外的街走到一家普通小店，约好谁都不许用餐具复现实验步骤。起初话题几次又滑回成绩，后来终于聊到各自学校的食堂、回家后最想补的觉，以及如果不学竞赛会参加什么社团。那顿饭没有提供任何可以推算名次的新证据，却让四场实验从脑中暂时退场。回酒店时，结果仍未知，你们却重新像一群考试之外也有生活的人。",
        effects: { san: 4, peerFavor: 2 },
      },
      {
        id: `national-rest-estimate-${attempt.attemptNumber}`,
        title: "留在酒店继续回忆实验细节",
        preview: "估分信息增加 · SAN -3 · 心态 -1",
        result: "你留在房间，把四场实验按操作、记录和解释重新过了一遍。每想起一个细节，便在纸上增加一种可能扣分的情况；清单从半页长到两页，连原本确信的步骤也开始显得可疑。你没有得到官方评分标准，更无法回去改变任何操作，却用整个下午反复审判已经结束的自己。晚饭时别人谈起城市见闻，你只能记得那支移液枪究竟有没有回到正确刻度。",
        effects: { san: -3, mindset: -1 },
      },
      ...(nearby
        ? [
            {
              id: `national-rest-rival-${nearby.rivalId}-${attempt.attemptNumber}`,
              title: `和${nearby.name}在酒店走廊聊一会儿`,
              preview: "你们会谈考试，也可能谈考试之外的事。",
              result: nearby.qualifiedForExperiment === attempt.qualifiedForExperiment
                ? `你和${nearby.name}都在等待下一张名单。你们交换了最不确定的一处判断，随后约定不再继续对答案。`
                : `一道前240名的线把你和${nearby.name}分到不同日程。你们没有回避那种尴尬，只把明天各自要做的事说清楚。`,
              effects: { peerFavor: 2, san: 1, mindset: 0.5 },
            },
          ]
        : []),
    ],
  };
}

function makeNationalExperimentEvent(attempt: NationalAttempt): GameEvent {
  return {
    id: `national-${attempt.attemptNumber}-experiment-day`,
    phase: "exam",
    label: "全国决赛 · 实验考试日",
    title: "上午两门、下午两门，四个实验板块在一天内全部结束。",
    body: [
      ...attempt.experimentScores.map(
        (item) => `${item.name}：现场表现 ${formatNumber(item.score)}`,
      ),
      `实验T分 ${formatNumber(attempt.experimentT)}。操作、记录和解释彼此牵连，理论掌握只能帮助你理解任务，无法替代手上的熟练度。四份记录纸已经交回，所有临场犹豫都被封进评分流程；你现在能做的只有离开实验楼，让那些无法再修改的步骤等待统一换算。`,
    ],
    trigger: { earliestWeek: 1, latestWeek: 120 },
    choices: [
      {
        id: `national-experiment-finish-${attempt.attemptNumber}`,
        title: "交回最后一份记录纸，离开实验楼",
        preview: "四科实验完成 · SAN -5",
        result: "最后一场铃响后，监考员从你手边收走记录纸，你才发现手套里全是汗。走出实验楼时，上午的切片、下午的操作和几处不确定解释挤在一起，已经难以分清哪一个判断真正出错。你没有精力继续核对，只按集合要求跟着队伍回去。持续数年的学习在此刻停止影响这届比赛，剩下的换算、排名与奖牌，都不会再因今晚多看一页书而改变。",
        effects: { san: -5, mindset: -1 },
      },
    ],
  };
}

function makeNationalAwardEvent(attempt: NationalAttempt): GameEvent {
  const hasFinalRank = attempt.finalRank !== null;
  const isTrueSilver = isTrueSilverRank(attempt.finalRank);
  const nearby = nearestNamedNationalResult(attempt);
  return {
    id: `national-${attempt.attemptNumber}-award`,
    phase: "exam",
    label: "全国决赛 · 颁奖典礼",
    title: hasFinalRank
      ? `最终第 ${attempt.finalRank} 名，获得${attempt.medal}。`
      : "颁奖名单倒序公布，你的国赛止步于理论考试。",
    body: [
      "上午的礼堂按照名次倒序念出名单。每次停顿，都有人握紧手里的代表队证件。",
      attempt.qualifiedForExperiment
        ? `理论T分 ${formatNumber(attempt.theoryT)}，实验T分 ${formatNumber(attempt.experimentT)}；最终按理论30%与实验70%合成为 ${formatNumber(attempt.finalScore)}。${
            isTrueSilver ? " 你位于151—240名的“真银牌”区间。" : ""
          }`
        : `理论排名第 ${attempt.theoryRank}，未取得实验考试资格；该名次直接进入最终奖牌序列，你获得${attempt.medal}。`,
      ...(nearby
        ? [
            `${nearby.name}最终第 ${nearby.finalRank} 名，获得${nearby.medal}。在倒序念名的礼堂里，你终于知道那个熟悉的名字会在自己之前还是之后响起。`,
          ]
        : []),
    ],
    trigger: { earliestWeek: 1, latestWeek: 120 },
    choices: [
      {
        id: `national-award-record-${attempt.attemptNumber}`,
        title: "走出礼堂，记录这次国赛结果",
        preview: hasFinalRank
          ? `${attempt.medal} · 解锁对应结局与后续评价`
          : "理论止步 · 返回学校后的路线仍需选择",
        result: hasFinalRank
          ? "你走出礼堂才低头看清奖牌上的字。它挂在胸前时比想象中轻，合影、祝贺和教练的复盘安排却接连涌来，仿佛所有人都希望你立刻说出这几年究竟值不值得。真正沉重的不是金属，而是被压缩进这一刻的训练、争执和被放弃的普通日子。你记录下名次与分数，却没有急着替整个过程写结论。"
          : "你仍站进省队合影，队服、姓名牌和身边的人都证明这趟国赛真实发生过，只是奖牌序列没有给你期待的回答。快门按下后，有人讨论下一届，有人安慰你至少来到这里，你却暂时听不进去。结果已经确定，训练和考试也全部结束；要把这次理论止步放进更长的人生里理解，而不是只当成一句失败，还需要比颁奖典礼更久的时间。",
        effects: {
          mindset:
            attempt.medal === "金牌"
              ? 6
              : attempt.medal === "银牌"
                ? 3
                : hasFinalRank
                  ? 1
                  : -2,
          coachFavor: attempt.medal === "金牌" ? 6 : hasFinalRank ? 3 : -1,
          tags: [`第${attempt.attemptNumber}次国赛-${attempt.medal}`],
        },
      },
    ],
  };
}

function findMilestoneEvent(
  week: number,
  calendar: ReturnType<typeof calendarFor>,
  resolved: string[],
  attempts: ProvincialAttempt[],
  nationalAttempts: NationalAttempt[],
  storyTags: string[],
  seed: string,
) {
  const firstAttempt = attempts.find((attempt) => attempt.attemptNumber === 1);
  const secondAttempt = attempts.find((attempt) => attempt.attemptNumber === 2);
  const firstNational = nationalAttempts.find(
    (attempt) => attempt.attemptNumber === 1,
  );
  const secondNational = nationalAttempts.find(
    (attempt) => attempt.attemptNumber === 2,
  );
  const firstNamedAftermath = firstAttempt
    ? makeNamedProvincialAftermathEvent(firstAttempt)
    : null;
  const secondNamedAftermath = secondAttempt
    ? makeNamedProvincialAftermathEvent(secondAttempt)
    : null;
  const candidates: Array<[number, GameEvent]> = [
    [12, trainingMilestoneEvents.nationalDay],
    [28, trainingMilestoneEvents.winter],
    [calendar.firstExamWeek, makeHotelEvent(1)],
    [calendar.secondExamWeek, makeHotelEvent(2)],
    ...(firstAttempt
      ? ([
          [calendar.firstExamWeek + 3, makeEvaluationDraftEvent(firstAttempt)],
          [
            calendar.firstExamWeek + 4,
            makeOfficialResultEvent(firstAttempt, storyTags),
          ],
        ] as Array<[number, GameEvent]>)
      : []),
    ...(firstNamedAftermath
      ? ([[calendar.firstExamWeek + 6, firstNamedAftermath]] as Array<[
          number,
          GameEvent,
        ]>)
      : []),
    ...(secondAttempt
      ? ([
          [calendar.secondExamWeek + 3, makeEvaluationDraftEvent(secondAttempt)],
          [
            calendar.secondExamWeek + 4,
            makeOfficialResultEvent(secondAttempt, storyTags),
          ],
        ] as Array<[number, GameEvent]>)
      : []),
    ...(secondNamedAftermath
      ? ([[calendar.secondExamWeek + 6, secondNamedAftermath]] as Array<[
          number,
          GameEvent,
        ]>)
      : []),
    ...(storyTags.includes("第1次省赛-进入省队")
      ? ([
          [calendar.firstExamWeek + 5, makeNationalCampChoiceEvent(1)],
          [calendar.firstNationalWeek, makeNationalOpeningEvent(1, seed)],
        ] as Array<[number, GameEvent]>)
      : []),
    ...(storyTags.includes("第2次省赛-进入省队")
      ? ([
          [calendar.secondExamWeek + 5, makeNationalCampChoiceEvent(2)],
          [calendar.secondNationalWeek, makeNationalOpeningEvent(2, seed)],
        ] as Array<[number, GameEvent]>)
      : []),
    [calendar.temporaryLeaveWeek, leaveMilestoneEvents.temporary],
    [calendar.formalLeaveWeek, leaveMilestoneEvents.formal],
    [calendar.mandatoryLeaveWeek, leaveMilestoneEvents.mandatory],
  ];
  return (
    candidates.find(
      ([triggerWeek, event]) =>
        triggerWeek === week && !resolved.includes(event.id),
    )?.[1] ?? null
  );
}

const specialtyLabels: Record<Rival["specialty"], string> = {
  module1: "第一模块",
  module2: "第二模块",
  module3: "第三模块",
  module4: "第四模块",
};

function rivalSnapshot(
  rival: Rival,
  seed: string,
  week: number,
  retiredWeek?: number,
) {
  const effectiveWeek = retiredWeek === undefined ? week : Math.min(week, retiredWeek);
  const startingLevel = 28 + (hashSeed(`${seed}-${rival.id}-base`) % 27);
  const growthRate =
    rival.gradeRelation === "上届"
      ? 0.3
      : rival.gradeRelation === "下届"
        ? 0.48
        : 0.39;
  const trainingCurve = effectiveWeek > 40 ? Math.min(12, (effectiveWeek - 40) * 0.12) : 0;
  const formNoise =
    (seededUnit(`${seed}-${rival.id}-form-${Math.floor(effectiveWeek / 3)}`) - 0.5) *
    12;
  const level = clamp(
    startingLevel + effectiveWeek * growthRate + trainingCurve + formNoise,
    18,
    96,
  );
  const previous =
    startingLevel +
    Math.max(0, effectiveWeek - 3) * growthRate +
    (seededUnit(
      `${seed}-${rival.id}-form-${Math.max(0, Math.floor(effectiveWeek / 3) - 1)}`,
    ) -
      0.5) *
      12;
  const trend = level - previous;
  return {
    level: round1(level),
    trendLabel:
      retiredWeek !== undefined && week > retiredWeek
        ? "退赛后停止训练"
        : trend > 2
          ? "近期上升"
          : trend < -2
            ? "近期波动"
            : "发挥稳定",
  };
}

function rivalStrengthBand(level: number) {
  if (level < 35) return "仍在搭建基础";
  if (level < 50) return "校内竞争阶段";
  if (level < 64) return "省奖竞争阶段";
  if (level < 77) return "省队竞争阶段";
  if (level < 88) return "国赛竞争阶段";
  return "全国顶尖阶段";
}

function seededRivalIdentity(rival: Rival, seed: string) {
  const token = hashSeed(`${seed}-identity-${rival.id}`);
  const rivalIndex = Math.max(0, rivals.findIndex((item) => item.id === rival.id));
  const gender = (Math.floor(token / 47) % 2 === 0
    ? "male"
    : "female") as "male" | "female";
  const surnames = [
    "王", "李", "张", "刘", "陈", "杨", "黄", "赵", "吴", "周",
    "徐", "孙", "马", "朱", "胡", "郭", "何", "高", "林", "罗",
    "郑", "梁", "谢", "宋", "唐", "许", "韩", "冯", "邓", "曹",
    "彭", "曾", "肖", "田", "董", "潘", "袁", "蔡", "蒋", "余",
    "杜", "叶", "程", "苏", "魏", "吕", "丁", "任", "沈", "姚",
    "卢", "姜", "崔", "钟", "谭", "陆", "汪", "范", "金", "石",
    "廖", "贺", "夏", "韦", "傅", "方", "白", "邹", "孟", "熊",
    "秦", "邱", "江", "尹", "薛", "闫", "段", "雷", "侯", "龙",
    "欧阳",
  ];
  const maleGivenNames = [
    "浩宇", "宇航", "子轩", "俊杰", "嘉豪", "宇辰", "浩然", "博文",
    "皓轩", "明宇", "天宇", "子豪", "奕辰", "嘉诚", "志远", "睿哲",
    "泽宇", "俊宇", "文博", "晨阳", "启航", "思源", "承宇", "振宇",
    "彦博", "明轩", "昊宇", "嘉伟", "子涵", "凯文", "文杰", "佳乐",
    "宇恒", "俊豪", "浩轩", "梓睿", "明哲", "嘉铭", "泽楷", "皓然",
    "建华", "俊驰", "致远", "卓然", "一鸣", "睿阳", "晨浩", "景程",
    "彦辰", "正阳", "博宇", "嘉佑", "修远", "逸凡", "昱辰", "思远",
    "承泽", "文昊", "泽林", "宇泽",
  ];
  const femaleGivenNames = [
    "欣怡", "雨桐", "梓涵", "佳琪", "思妍", "语彤", "可欣", "雅雯",
    "晓彤", "诗涵", "子涵", "心怡", "佳宁", "雨欣", "婉婷", "嘉怡",
    "思琪", "怡然", "欣妍", "依琳", "晨曦", "嘉宁", "语欣", "思涵",
    "雨萱", "若涵", "昕怡", "梦琪", "佳怡", "晓雯", "静怡", "雨婷",
    "思雨", "欣然", "嘉慧", "雅婷", "可馨", "子晴", "佳颖", "晓琳",
    "文静", "思佳", "雨晴", "嘉欣", "心悦", "雅琪", "婧怡", "紫涵",
    "慧敏", "佳雯", "思颖", "雨菲", "欣悦", "晓晴", "嘉敏", "诗雨",
    "梦婷", "语晴", "思宁", "欣桐",
  ];
  const givenNames = gender === "male" ? maleGivenNames : femaleGivenNames;
  const personalities = [
    "话不多，但一旦讨论问题就会追问到证据链闭合",
    "健谈、消息灵通，很快能和不同年级的人熟悉起来",
    "平时看起来松弛，考试时却会进入近乎屏蔽外界的状态",
    "耐心而有边界感，愿意共享方法但不喜欢比较进度",
    "胜负欲写在脸上，考后却愿意坦率讲清自己的失误",
    "好奇心很重，经常提出看似基础却直指漏洞的问题",
  ];
  const methods = [
    "先快速看完课程建立框架，再靠错题逐层补漏洞。",
    "习惯逐页整理笔记，推进不快，但隔很久仍能复述细节。",
    "喜欢把论文图表遮住结论，自己重新写一遍证据链。",
    "按题型建立错题档案，每隔几周闭卷重做一次。",
    "常用口头讲题检验理解，一旦讲不清就回教材查机制。",
    "学习时间不算最长，却很擅长在模考后找出高收益漏洞。",
  ];
  const peerIndex = rivals
    .filter((item) => item.scope === "school-peer")
    .findIndex((item) => item.id === rival.id);
  const stablePeerPersonalities = ["competitive", "playful", "curious", "warm"] as const;
  const stablePeerConflicts = ["burden", "abandonment", "achievement", "family"] as const;
  const randomPersonalityKey = (["reserved", "warm", "competitive", "playful", "curious"] as const)[Math.floor(token / 31) % 5];
  const personalityKey = peerIndex >= 0
    ? stablePeerPersonalities[peerIndex % stablePeerPersonalities.length]
    : randomPersonalityKey;
  const personalityDescriptions = {
    reserved: "话不多，但一旦讨论问题就会追问到证据链闭合",
    warm: "耐心而有边界感，愿意共享方法但不喜欢替别人作决定",
    competitive: "胜负欲写在脸上，考后却愿意坦率讲清自己的失误",
    playful: "平时看起来松弛，总用玩笑缓冲压力，认真时反而格外直接",
    curious: "好奇心很重，经常提出看似基础却直指漏洞的问题",
  } as const;
  return {
    name: `${surnames[(token + rivalIndex * 17) % surnames.length]}${
      givenNames[
        (Math.floor(token / 7) + hashSeed(rival.id) + rivalIndex * 13) %
          givenNames.length
      ]
    }`,
    personality: peerIndex >= 0
      ? personalityDescriptions[personalityKey]
      : personalities[Math.floor(token / 13) % personalities.length],
    studyStyle: methods[Math.floor(token / 29) % methods.length],
    temperament: [
      "reserved",
      "social",
      "calm",
      "steady",
      "competitive",
      "curious",
    ][Math.floor(token / 13) % 6],
    personalityKey,
    innerConflictKey: peerIndex >= 0
      ? stablePeerConflicts[peerIndex % stablePeerConflicts.length]
      : (["abandonment", "burden", "achievement", "distance", "caretaking", "family"] as const)[Math.floor(token / 53) % 6],
    gender,
  };
}

function generatedCoreRivalContexts(
  seed: string,
  week: number,
  social: number,
  targets: Record<Rival["gradeRelation"], number>,
): NamedExamRivalContext[] {
  const schoolPool = [
    "临江第一中学",
    "青屿高级中学",
    "望河外国语学校",
    "海岳中学",
    "云川实验中学",
    "北湖附中",
    "南岭高级中学",
    "东江第一中学",
    "澄海中学",
    "西陵外国语学校",
    "榕城实验学校",
    "江岳中学",
  ];
  const specialties = ["module1", "module2", "module3", "module4"] as const;
  const generatedContexts: NamedExamRivalContext[] = [];
  const usedNames = new Set(
    rivals.map((rival) => seededRivalIdentity(rival, seed).name),
  );
  (["上届", "同届", "下届"] as const).forEach((gradeRelation) => {
    const existing = rivals.filter(
      (rival) =>
        rival.scope !== "national" && rival.gradeRelation === gradeRelation,
    ).length;
    const needed = Math.max(0, targets[gradeRelation] - existing);
    for (let index = 0; index < needed; index += 1) {
      const id = `core-${gradeRelation}-${index}`;
      const token = hashSeed(`${seed}-${id}`);
      const revealSocial = 42 + (token % 27);
      const synthetic: Rival = {
        id,
        name: "省内核心选手",
        school: schoolPool[(token >>> 4) % schoolPool.length],
        gradeRelation,
        scope: "province",
        revealWeek: 16 + ((token >>> 7) % 18),
        specialty: specialties[(token >>> 10) % specialties.length],
        personality: "只有在培训、联考或正式榜单上才逐渐显出轮廓",
        studyStyle: "训练方式尚未完全公开。",
        hiddenStrength: "本届省内核心竞争者。",
        revealSocial,
      };
      const retirementRoll = seededUnit(`${seed}-${id}-retirement-roll`);
      const retirementWeek =
        retirementRoll < 0.17
          ? 16 + (hashSeed(`${seed}-${id}-retirement-week`) % 62)
          : undefined;
      let name = seededRivalIdentity(synthetic, seed).name;
      let nameSalt = 1;
      while (usedNames.has(name) && nameSalt <= 12) {
        name = seededRivalIdentity(
          { ...synthetic, id: `${id}-name-${nameSalt}` },
          seed,
        ).name;
        nameSalt += 1;
      }
      usedNames.add(name);
      generatedContexts.push({
        rival: synthetic,
        name,
        retiredWeek: retirementWeek,
        knownAtExam: week >= synthetic.revealWeek && social >= revealSocial,
      });
    }
  });
  return generatedContexts;
}

function seedRivalText(text: string, seed: string) {
  return rivals
    .reduce(
      (value, rival) =>
        value.replaceAll(rival.name, seededRivalIdentity(rival, seed).name),
      text,
    );
}

function rivalMentionedBy(event: GameEvent) {
  const source = [
    event.title,
    ...event.body,
    ...event.choices.flatMap((choice) => [choice.title, choice.result]),
  ].join(" ");
  return rivals.find(
    (rival) => rival.scope.startsWith("school") && source.includes(rival.name),
  );
}

function adaptiveRivalLine(
  event: GameEvent,
  seed: string,
  stats: PlayerStats,
) {
  const rival = rivalMentionedBy(event);
  if (!rival) return null;
  const identity = seededRivalIdentity(rival, seed);
  const relation =
    stats.peerFavor >= 55
      ? `你们已经足够信任彼此，${identity.name}没有再试探你的水平，直接把最真实的漏洞摊开。`
      : stats.peerFavor >= 25
        ? `你和${identity.name}已经熟悉，但涉及排名与进度时，彼此仍会保留一点分寸。`
        : `${identity.name}和你还不算熟，这次交谈里每一句话都带着轻微的试探。`;
  const temperament =
    identity.temperament === "reserved"
      ? "对方很少主动开口；你若认真回应，讨论会比表面看起来更深入。"
      : identity.temperament === "social"
        ? "对方很会活跃气氛，也更容易把这次讨论延伸成下一次邀请。"
        : identity.temperament === "competitive"
          ? "对方不会隐藏胜负欲，合作和较劲几乎发生在同一句话里。"
          : identity.temperament === "curious"
            ? "对方不断追问最基础的假设，反而让你无法用含糊的术语蒙混过去。"
            : "对方的语气很平稳，真正的态度更多藏在是否愿意继续交换细节里。";
  return `${relation}${temperament}`;
}

function adaptRivalChoiceEffects(
  event: GameEvent,
  effects: GameEffect,
  seed: string,
  stats: PlayerStats,
  relationships: Record<string, DeepRelationship>,
) {
  const rival = rivalMentionedBy(event);
  if (!rival) return effects;
  const temperament = seededRivalIdentity(rival, seed).temperament;
  const relation = normalizeRelationship(relationships[rival.id], seed, rival.id);
  const adapted = { ...effects };
  if ((adapted.peerFavor ?? 0) > 0) {
    const relationshipFactor = stats.peerFavor >= 55 ? 1.2 : stats.peerFavor < 20 ? 0.8 : 1;
    const temperamentFactor =
      temperament === "social" ? 1.25 : temperament === "reserved" ? 0.8 : 1;
    adapted.peerFavor = round1(
      (adapted.peerFavor ?? 0) * relationshipFactor * temperamentFactor,
    );
  }
  if (
    (temperament === "reserved" || temperament === "competitive") &&
    (adapted.reasoning ?? 0) > 0
  ) {
    adapted.reasoning = round1((adapted.reasoning ?? 0) + 0.5);
  }
  if (temperament === "curious" && (adapted.social ?? 0) >= 0) {
    adapted.social = round1((adapted.social ?? 0) + 0.5);
  }
  if (relation.tension >= 35 && /竞争|模考|排名|榜/.test(`${event.label}${event.title}`)) {
    adapted.reasoning = round1((adapted.reasoning ?? 0) + 0.3);
    adapted.san = round1((adapted.san ?? 0) - 0.4);
    if ((adapted.peerFavor ?? 0) > 0)
      adapted.peerFavor = round1((adapted.peerFavor ?? 0) * 0.88);
    else adapted.mindset = round1((adapted.mindset ?? 0) - 0.2);
  }
  return adapted;
}

function retirementStageFor(
  week: number,
  tags: string[],
  nationalAttempts: NationalAttempt[],
): RetirementStage {
  const hasOfficialOutcome = (attempt: 1 | 2) =>
    ["省一等奖", "省二等奖", "省三等奖", "未获奖"].some((award) =>
      tags.includes(`第${attempt}次省赛-${award}`),
    );
  if (
    hasOfficialOutcome(2) &&
    !tags.includes("第2次省赛-进入省队")
  )
    return "second-failure";
  if (
    tags.includes("第2次省赛-进入省队") &&
    !nationalAttempts.some((attempt) => attempt.attemptNumber === 2)
  )
    return "second-team";
  if (
    nationalAttempts.some(
      (attempt) =>
        attempt.finalRank !== null &&
        ["金牌", "银牌", "铜牌"].includes(attempt.medal),
    )
  )
    return "after-medal";
  if (
    hasOfficialOutcome(1) &&
    !tags.includes("第1次省赛-进入省队")
  )
    return "first-loss";
  if (week <= 8) return "before-school";
  if (week <= 24) return "early-study";
  return "mid-course";
}

const retirementStageCopy: Record<
  RetirementStage,
  { label: string; title: string; body: string[] }
> = {
  "before-school": {
    label: "退赛事件 · 高一开学之前",
    title: "竞赛教室还没有真正成为日常，你已经开始怀疑是否要留下。",
    body: [
      "书只翻过最前面的几章，退出的成本看起来还不高。可招生时的期待、家长已经付出的信任，以及你对未知路线的想象，都让这句话很难直接说出口。",
      "现在离开最容易追回常规，却也最难判断自己究竟是不适合，还是只是不适应。",
    ],
  },
  "early-study": {
    label: "退赛事件 · 第一轮学习中",
    title: "进度表已经排满，但你越来越难回答自己为什么继续。",
    body: [
      "你已经能听懂队里大部分术语，也开始拥有自己的笔记。退出不再只是放弃一次尝试，而是承认此前投入的时间可能不会兑换成奖项。",
      "教练会问你是不是遇到了具体困难，家长则更关心回到常规后还能不能追上。",
    ],
  },
  "first-loss": {
    label: "退赛事件 · 第一次省赛失利后",
    title: "省队名单上没有你的名字，第二次机会忽然显得格外沉重。",
    body: [
      "有人劝你把第一次当作熟悉流程，也有人提醒你，继续一年意味着更深的常规缺口。",
      "这次退赛既像止损，也像在最接近看清自身水平的时候转身。桌上的两份计划分别通向继续冲刺和尽快回班，任何一份都无法证明另一条路必然错误；真正需要回答的，是你是否愿意为第二次机会继续承担更深的常规缺口与不确定。",
    ],
  },
  "second-team": {
    label: "退赛事件 · 第二年省队集训期",
    title: "第二次省赛已经过线，省队集训却让“就此停下”重新变成一个现实选项。",
    body: [
      "这不是一次失利后的冲动。你已经拿到了最后一次参加国赛的资格，但接下来的三个月意味着密集实验、外培、模考和几乎没有空白的作息。",
      "教练会把退赛理解为浪费名额，家长会追问为什么偏偏走到这里才停下；队友也很难立刻理解。即使决定离开，也需要把这些关系一层层谈完。",
    ],
  },
  "after-medal": {
    label: "退赛事件 · 国赛获奖之后",
    title: "你带着一块奖牌回来，却不确定还要不要再证明一次。",
    body: [
      "在别人看来，现在退出近乎不可理解：你已经走到了全国赛场，也拥有继续冲击更高名次的资本。",
      "但只有你知道，奖牌没有自动消除疲惫。功成身退、再战一年和回归高考，都是有代价的选择。",
    ],
  },
  "second-failure": {
    label: "退赛事件 · 第二次省赛结束",
    title: "两次机会已经用完，这一次“退赛”更接近被时间推离赛道。",
    body: [
      "竞赛书仍在桌上，但名单不会再为你改写。教练开始谈回班安排，家长询问常规缺口，同学们不知道该安慰还是沉默。",
      "你仍需要亲口结束这段经历，并决定怎样理解此前的两年。它们可以被归结为一次没有进队的失败，也可以保留为真实改变过知识、关系与选择方式的时间。被赛制推离主线不等于情绪已经完成告别，最后的手续仍必须由你本人走完。",
    ],
  },
  "mid-course": {
    label: "退赛事件 · 学习进行中",
    title: "没有一场明确的失败，但长期消耗本身也可能成为理由。",
    body: [
      "课程、笔记、模考和常规欠账同时堆在桌面上。你不是突然讨厌生物，只是开始怀疑继续投入是否仍然值得。",
      "中途离开不会得到一个干净的结论，反而要面对教练、家长和队友各自不同的解释。没有名单替你证明已经到了终点，也没有某次失败可以承担全部理由；你只能把长期消耗、仍然存在的兴趣和其他路线的代价同时摆出来，判断继续是否还是主动选择。",
    ],
  },
};

type RetirementSceneChoice = {
  id: string;
  title: string;
  preview: string;
  result: string;
  action: "advance" | "cancel" | "retire";
  effects: GameEffect;
};

function retirementScene(
  flow: RetirementFlow,
  stats: PlayerStats,
): {
  label: string;
  title: string;
  body: string[];
  choices: RetirementSceneChoice[];
} {
  const base = retirementStageCopy[flow.stage];
  if (flow.stage === "second-failure") {
    if (flow.step === 0) {
      return {
        label: "竞赛资格结束 · 第二次联赛未进省队",
        title: "两次参赛机会已经用完，这不是一道还能选择“继续竞赛”的题。",
        body: [
          "最终省队名单公布后，教练把你的名字从下一阶段训练表里划掉。并不是你主动认输，而是高中阶段的联赛机会已经全部结束。",
          "接下来仍要处理资料、回班和常规缺口，但高三不会再开放竞赛学习行动。",
        ],
        choices: ["first", "second", "third"].map((echo) => ({
          id: `second-failure-confirm-end-${echo}`,
          title: "确认结果，开始办理离队与回班",
          preview: "",
          result: "你把最后一次成绩单收进文件夹，和教练确认参赛资格已经不会再延续。此前总觉得还能靠下一次考试修正的错题、争执和遗憾，到这里都失去了第三次机会。竞赛生涯并没有用理想方式结束，但接下来的问题已经改变：不再是还能不能再考一次，而是怎样向班级、家人和自己交代这两年，并从明天开始把另一条生活真正接回来。",
          action: "advance" as const,
          effects: { san: -3, mindset: -2 },
        })),
      };
    }
    if (flow.step === 1) {
      return {
        label: "被迫退赛 · 回班交接",
        title: "教练、家长和班主任开始讨论你落下的常规课程。",
        body: [
          "教练的语气可能冷淡，也可能带着遗憾，但训练名额和实验安排已经不再包括你。家长更关心的是常规还剩多少、回班后从哪一章补起。",
          "你可以决定怎样完成告别，却不能把已经耗尽的参赛资格重新变成第三次机会。",
        ],
        choices: [
          {
            id: "second-failure-orderly-handover",
            title: "整理笔记与资料，认真完成交接",
            preview: "同学好感 +1 · 常规 +5 · SAN -2",
            result: "你把公共讲义按模块归还书架，将自己的勘误和实验记录复印给仍在队里的学弟学妹，又请班主任列出回班后的第一轮补课清单。整理期间不断有人来问某份资料放在哪里，仿佛你仍是这间教室的一部分。直到桌面被彻底清空、姓名从值日表上划去，离开才终于有了边界；你带走私人笔记，也留下足够让后来者继续使用的痕迹。",
            action: "advance",
            effects: { peerFavor: 1, academics: 5, san: -2 },
          },
          {
            id: "second-failure-leave-quietly",
            title: "不再复盘竞赛，先回班把生活接上",
            preview: "SAN +1 · 心态 -2 · 教练好感 -3",
            result: "你没有参加那场以“最后一次”为名的训练复盘，只在群里简短说明自己要先回班处理积欠课程。教练认为这是逃避，也没有回复你之后发去的告别消息；你则不愿再用一晚重新计算已经确定的结果。第二天，语文早读、数学作业和陌生的课程进度重新占满日程。竞赛没有得到完整收尾，但普通生活也不会等到所有情绪整理好才开始。",
            action: "advance",
            effects: { san: 1, mindset: -2, coachFavor: -3 },
          },
        ],
      };
    }
    return {
      label: "被迫退赛 · 竞赛生涯结束",
      title: "竞赛教室的座位空了出来，高三常规线从这里开始。",
      body: [
        "这次没有“再给自己四周”的按钮。第二次联赛结果已经把竞赛主线封口，之后的学习、强基与高考都会按退赛后的经历继续。竞赛教室里的座位很快会交给下一届，原班的课表则已向前走过许多章。你不是在两条都保持原样的路线之间切换，而是在不可逆的结果之后，重新接住一段已经因竞赛经历改变过的普通高中生活。",
      ],
      choices: [
        {
          id: "second-failure-return-class",
          title: "正式离队，进入高三常规学习",
          preview: "结束竞赛主线 · 开始回班与高考流程",
          result: "离队手续完成后，你抱着常规教材回到原来的班级。熟悉的同学已经讲到你没见过的章节，课桌里还塞着离开前留下的旧卷子；班主任没有要求你立刻追平，只安排了第一轮补测。从这一周起，训练群的通知不再决定你的日程，下一张需要面对的成绩单也不再是联赛排名，而是六科总分。结束竞赛没有让压力消失，只是把它换成另一种更宽、更现实的形状。",
          action: "retire",
          effects: {
            academics: 5,
            san: -1,
            mindset: -2,
            coachFavor: -4,
            tags: ["已退赛", "第二次省赛后被迫退赛"],
          },
        },
      ],
    };
  }
  if (flow.step === 0) {
    if (flow.initiatedBy && flow.initiatedBy !== "self") {
      const fromCoach = flow.initiatedBy === "coach";
      return {
        label: fromCoach ? "劝退事件 · 教练约谈" : "劝退事件 · 家庭施压",
        title: fromCoach
          ? "教练把你单独留下，问你是否还适合继续占用竞赛队资源。"
          : "家长把近期成绩和投入摆在桌上，第一次明确要求你考虑退赛。",
        body: [
          fromCoach
            ? "这不是温和的路线建议。教练反复强调队内排名、训练态度和名额，把你的困难解释成“不够投入”。"
            : "谈话从常规成绩滑坡开始，逐渐变成对自律、前途和家庭投入的质疑。你很难只讨论竞赛本身。",
          "你可以反驳，也可以接受进入正式协商；无论哪一种，这场谈话都会留下压力。",
        ],
        choices: [
          {
            id: "forced-retire-enter-talks",
            title: "承认现状，进入正式协商",
            preview: "持续两周的退赛协商开始",
            result: "你承认目前的睡眠、常规成绩和训练状态确实无法继续被当作小波动，却没有在谈话当场答应退出。你们把退赛列入接下来两周的正式议程，约好由你整理真实时间表，家人说明底线，教练评估调整空间。问题因此不再靠一次争吵解决，也不能再被一句“下周会好”糊弄过去；你保留最终选择，同时承担提供事实和按期回应的责任。",
            action: "advance",
            effects: {
              san: fromCoach ? -5 : -4,
              mindset: -2,
              coachFavor: fromCoach ? -6 : -1,
              familySupport: fromCoach ? 0 : -3,
            },
          },
          {
            id: "forced-retire-refuse",
            title: "明确拒绝，现在不退",
            preview: "保留竞赛路线 · 冲突升级",
            result: "你明确说自己现在不会退赛，也不会在一场争执里交出决定权。对方停下劝说，却没有因此认可你的选择，只把成绩单重新推到你面前，要求你对下一次结果负责。谈话在僵硬的沉默中结束，你保住了继续的资格，也更清楚这并不等于获得支持；接下来每次波动，都可能被重新拿来证明今天的坚持是否只是逞强。",
            action: "cancel",
            effects: {
              san: -5,
              mindset: -2,
              coachFavor: fromCoach ? -8 : -2,
              familySupport: fromCoach ? 0 : -5,
            },
          },
        ],
      };
    }
    return {
      ...base,
      choices: [
        {
          id: "retire-think-seriously",
          title: "承认自己在认真考虑退赛",
          preview: "进入家长、教练与同伴协商",
          result: "你承认自己不是随口抱怨，而是在认真考虑退赛，并把最难承受的几件事逐项写下来。纸面上的“退赛”比脑中的念头更具体：它意味着回班、补课、重新解释过去投入，也可能意味着终于停止一条不再适合的路线。对方没有立即劝你留下，只要求你区分暂时崩溃与长期判断。决定尚未作出，但它从此不再只是某个疲惫夜晚用来逃跑的想象。",
          action: "advance",
          effects: { san: -1 },
        },
        {
          id: "retire-not-now",
          title: "现在还不做决定",
          preview: "暂时取消 · 四周内不能反复提出",
          result: "你没有在最疲惫的晚上提交申请，也没有假装退赛这个念头从未出现，只把它写进日记并标出一个重新评估的日期。第二天训练照常开始时，桌上的书没有突然变轻，但你知道继续四周并不等于承诺坚持到最后。离开的权利仍被保留，这让眼前的选择少了一点被困住的意味，也要求你在期限到来时诚实检查问题是否真的改善。",
          action: "cancel",
          effects: { san: -0.5, mindset: -0.5 },
        },
      ],
    };
  }
  if (flow.step === 1) {
    const familyOpposes = stats.familySupport >= 62;
    const coachRetains = stats.coachFavor >= 15;
    const coachHostile = stats.coachFavor <= 5;
    const peersRetain = stats.peerFavor >= 28;
    return {
      label: "退赛协商 · 不是一个人的决定",
      title: "你把想法带到了家长、教练和最熟悉的队友面前。",
      body: [
        familyOpposes
          ? "家长认为现在离开会浪费已经投入的时间和资源，要求你至少给出完整的回班追赶计划。"
          : "家长虽然担心，但更在意你是否还能承受现在的生活节奏。",
        coachRetains
          ? "教练没有立即批准。他列出你的进步和下一阶段安排，认为你还有继续走下去的能力。"
          : coachHostile
            ? "教练把你的退意归结为吃不了苦，反复拿队内排名、已经投入的资源和“别人都能坚持”压你。谈话没有提供解决方案，反而像一场责任审判。"
            : "教练没有给出明确方案，只要求你先坚持到下一次测试，再以成绩决定是否允许离队。",
        peersRetain
          ? "关系较近的队友明显不舍。有人说可以陪你调整计划，也有人只是反复确认你是不是一时冲动。"
          : "队友们保持了礼貌的沉默。你忽然意识到，自己和这间教室还没有建立足够深的联系。",
      ],
      choices: [
        {
          id: "retire-open-conversation",
          title: "把真实原因全部说清楚",
          preview: familyOpposes || coachRetains
            ? "可能发生激烈冲突 · 但减少长期误解"
            : "获得理解 · 进入最终决定",
          result: "你把真正想退赛的原因全部说清：不仅是一次成绩，也包括持续失眠、对训练失去兴趣，以及回班成本不断增大的恐惧。谈话拖了很久，父母仍担心你后悔，教练也不同意你对能力的判断，没有任何人被当场说服。但争论终于围绕同一组事实展开，不再一个人谈名次、一个人谈身体、另一个人只谈投入。分歧仍在，却第一次有可能被逐项处理。",
          action: "advance",
          effects: {
            san:
              -(familyOpposes ? 4 : 0) -
              (coachRetains ? 2.5 : 0) -
              (coachHostile ? 4 : 0) -
              (peersRetain ? 1.5 : 0) +
              1,
            mindset: familyOpposes || coachRetains || coachHostile ? -2 : 1,
            coachFavor: coachRetains ? -4 : coachHostile ? -7 : -2,
            peerFavor: peersRetain ? -1 : 0,
          },
        },
        {
          id: "retire-write-plan",
          title: "先拿出回班追赶计划，再谈退赛",
          preview: "常规积累 +8 · SAN -2 · 冲突较小",
          result: "你没有只说“退赛后会好好学”，而是拿出班级课程表，标出已经断层的章节、可以求助的老师和第一轮补课节点。家人逐项追问时间，教练也提醒回班并不会自动追回排名。那张并不轻松的计划让谈话从情绪争执变成现实方案：退赛的代价第一次被看清，也因此不再被简单理解成逃跑；你需要证明的，是这条新路线确实能够开始。",
          action: "advance",
          effects: {
            academics: 8,
            san: -2,
            familySupport: familyOpposes ? 1 : 0.5,
            mindset: 0.5,
          },
        },
        {
          id: "retire-back-down",
          title: "面对挽留，暂时收回申请",
          preview: "取消退赛 · SAN -2 · 心态 -1",
          result: "面对教练和队友的挽留，你暂时收回申请，答应按新的训练安排再坚持一段时间。大家明显松了口气，空出来的座位也被重新留给你；可最初促使你提出退赛的疲惫、常规课缺口或家庭压力并没有随一句答应消失。你为关系和可能性多留了一扇门，也需要警惕这段缓冲不要重新变成无限延期、只能靠忍耐维持的旧状态。",
          action: "cancel",
          effects: { san: -2, mindset: -1, coachFavor: 1 },
        },
      ],
    };
  }
  return {
    label: "退赛协商 · 最终决定",
    title: "所有意见都已经听过，最后仍需要你亲自确认。",
    body: [
      "留下不会保证下一次成功，离开也不会让常规缺口立刻消失。",
      "确认退赛后将进入回班、高三、强基与高考流程；这段竞赛经历也会继续影响最终录取和成年后的生活。最后一次确认不是要求你证明此前投入值得，也不是把离开描述成轻松解脱，而是让所有协商、挽留与外界判断停下，由你本人承担这条路线从此怎样继续。",
    ],
    choices: [
      {
        id: "retire-confirm-final",
        title: "仍然决定退赛",
        preview: "结束竞赛路线 · 进入“您已退赛”页面",
        result: "你仍然决定退赛，并按流程交回公共资料、取消后续报名。最后一次整理竞赛教室的位置时，你把队伍共用的讲义留在架上，只将写满批注的笔记和几张有纪念意义的卷子装进书包。有人劝你再想一晚，你却知道这次不是赌气离场。走廊尽头的训练声仍在继续，你带走了属于自己的部分，也接受以后不会再以参赛者身份坐回这里。",
        action: "retire",
        effects: {
          academics: 2,
          coachFavor: -8,
          familySupport: -2,
          mindset: flow.stage === "after-medal" ? -1 : -3,
          san: -4,
          tags: ["已退赛"],
        },
      },
      {
        id: "retire-stay-final",
        title: "撤回申请，再给自己四周",
        preview: "取消退赛 · 四周冷静期 · 压力不会自动消失",
        result: "你撤回申请，却没有许诺一定坚持到最后，而是在日历上圈出四周后的复盘日，并写下睡眠、常规成绩和训练完成率三项判断标准。教练接受了这个有期限的决定，家人仍觉得你在拖延，但至少每个人知道下次谈话会依据什么。接下来的训练不再只是咬牙撑住；这四周既是继续争取的机会，也是验证离开是否更合适的一段真实样本。",
        action: "cancel",
        effects: { mindset: -1, san: -2, coachFavor: -1 },
      },
    ],
  };
}

function retirementDeveloperCatalog(): GameEvent[] {
  const supportiveStats = {
    familySupport: 72,
    coachFavor: 18,
    peerFavor: 34,
  } as PlayerStats;
  const strainedStats = {
    familySupport: 34,
    coachFavor: 3,
    peerFavor: 9,
  } as PlayerStats;
  const flows: Array<{ flow: RetirementFlow; stats: PlayerStats; suffix: string }> = [
    ...(["early-failure", "after-medal", "mid-course"] as RetirementStage[]).flatMap(
      (stage) => [0, 1, 2].map((step) => ({
        flow: { stage, step: step as 0 | 1 | 2, initiatedBy: "self" as const },
        stats: step === 1 ? supportiveStats : strainedStats,
        suffix: `${stage}-${step}`,
      })),
    ),
    ...([0, 1, 2] as const).map((step) => ({
      flow: { stage: "second-failure" as const, step, initiatedBy: "eligibility" as const },
      stats: strainedStats,
      suffix: `second-failure-${step}`,
    })),
    {
      flow: { stage: "mid-course", step: 0, initiatedBy: "family" },
      stats: strainedStats,
      suffix: "family-pressure",
    },
    {
      flow: { stage: "mid-course", step: 0, initiatedBy: "coach" },
      stats: strainedStats,
      suffix: "coach-pressure",
    },
  ];
  return flows.map(({ flow, stats, suffix }) => {
    const scene = retirementScene(flow, stats);
    return {
      id: `developer-retirement-${suffix}`,
      phase: "weekly",
      label: scene.label,
      title: scene.title,
      body: scene.body,
      trigger: { earliestWeek: 1, latestWeek: 104 },
      concealConsequences: true,
      choices: scene.choices.map(({ action: _action, ...choice }) => choice),
    };
  });
}

function pageFlowDeveloperCatalog(seed: string): GameEvent[] {
  const events = new Map<string, GameEvent>();
  const add = (event: GameEvent | null | undefined) => {
    if (event) events.set(event.id, event);
  };

  for (let variant = 0; variant < 60 && events.size < 3; variant += 1) {
    add(makeRoutineEvent(1, `${seed}-developer-routine-${variant}`));
  }
  for (let variant = 0; variant < 60; variant += 1) {
    add(makeTrainingRoutineEvent(1, `${seed}-developer-training-routine-${variant}`));
  }

  const provincial = (attemptNumber: 1 | 2, enteredTeam: boolean): ProvincialAttempt => ({
    attemptNumber,
    examWeek: attemptNumber === 1 ? 45 : 97,
    maxScore: PROVINCIAL_MAX_SCORE,
    rawScore: enteredTeam ? 138 : 104,
    estimateLow: enteredTeam ? 132 : 98,
    estimateHigh: enteredTeam ? 144 : 110,
    estimateRankLow: enteredTeam ? 3 : 150,
    estimateRankHigh: enteredTeam ? 12 : 260,
    draftScore: enteredTeam ? 138 : 104,
    draftRank: enteredTeam ? 6 : 198,
    appealDelta: enteredTeam ? 2 : 0,
    participants: 1200,
    firstPrizeEnd: 90,
    secondPrizeEnd: 260,
    thirdPrizeEnd: 520,
    teamPlaces: 12,
    competitionStrength: 1,
    competitorScores: enteredTeam ? [150, 146, 144, 142, 140] : [150, 146, 142, 138, 134, 130, 126, 122, 118, 114, 110, 108, 106, 105],
    namedResults: [],
    breakdown: [
      { name: "第一模块", score: 36, maxScore: 40, rate: 90, correct: 18, total: 20 },
      { name: "第二模块", score: 34, maxScore: 40, rate: 85, correct: 17, total: 20 },
      { name: "第三模块", score: 32, maxScore: 40, rate: 80, correct: 16, total: 20 },
      { name: "第四模块", score: 30, maxScore: 40, rate: 75, correct: 15, total: 20 },
    ],
    finalScore: enteredTeam ? 140 : 104,
    finalRank: enteredTeam ? 6 : 198,
    enteredTeam,
    finalAward: enteredTeam ? "省一等奖" : "省二等奖",
  });
  const provincialOne = provincial(1, true);
  const provincialTwo = provincial(2, false);
  for (const attempt of [provincialOne, provincialTwo]) {
    add(makeHotelEvent(attempt.attemptNumber));
    add(makePostExamRouteEvent(attempt.attemptNumber));
    add(makeEvaluationDraftEvent(attempt));
    add(makeOfficialResultEvent(attempt, []));
    add(makeNationalCampChoiceEvent(attempt.attemptNumber));
    add(makeNationalOpeningEvent(attempt.attemptNumber, seed));
  }

  const national = (attemptNumber: 1 | 2, qualified: boolean): NationalAttempt => ({
    attemptNumber,
    theoryWeek: attemptNumber === 1 ? 58 : 110,
    participants: 600,
    theoryRaw: qualified ? 82 : 58,
    theoryT: qualified ? 61 : 45,
    theoryRank: qualified ? 118 : 310,
    qualifiedForExperiment: qualified,
    experimentScores: qualified
      ? ["细胞生物学", "植物学", "动物学", "生态学"].map((name, index) => ({ name, score: 72 - index * 3 }))
      : [],
    experimentT: qualified ? 58 : 0,
    finalScore: qualified ? 58.9 : 45,
    finalRank: qualified ? 132 : null,
    medal: qualified ? "银牌" : "铜牌",
    namedResults: [],
  });
  for (const attempt of [national(1, true), national(2, false)]) {
    add(makeTheoryNightEvent(attempt));
    if (attempt.qualifiedForExperiment) add(makeNationalListRevisionEvent(attempt));
    add(makeNationalRestEvent(attempt));
    if (attempt.qualifiedForExperiment) add(makeNationalExperimentEvent(attempt));
    add(makeNationalAwardEvent(attempt));
  }

  const sampleStats = {
    familySupport: 55,
    coachFavor: 12,
    peerFavor: 25,
    san: 58,
  } as PlayerStats;
  const calendar = calendarFor(2026, 1);
  // 编辑器目录不依赖某一个种子碰巧抽到哪些家庭场景：每个独立场景 × 4 种家长
  // 都显式生成，运行中的随机节奏仍由 makeFamilyWeeklyEvent 自己控制。
  for (let sceneIndex = 0; sceneIndex < familyWeeklySceneCatalog.length; sceneIndex += 1) {
    for (const profile of familyProfiles) {
      add(
        makeFamilyWeeklyEvent(
          8 + sceneIndex,
          seed,
          profile,
          sampleStats,
          ["第1次省赛-进入省队"],
          [],
          sceneIndex,
        ),
      );
    }
  }
  for (let week = 1; week <= 120; week += 1) {
    for (const profile of familyProfiles) {
      add(makeFamilyCheckpointEvent(week, seed, profile, sampleStats, ["第1次省赛-进入省队", "第2次省赛-进入省队", "关系:示例:正式恋爱"], [], calendar));
    }
    add(makeExternalDepartureEvent(week, seed, [], []));
    add(makeTeammateDepartureEvent(week, seed, 12, 12, [], calendar, {}, [],));
  }
  return [...events.values()];
}

function makeTeammateDepartureEvent(
  targetWeek: number,
  seed: string,
  activeTeamSize: number,
  initialTeamSize: number,
  retiredRivalIds: string[],
  calendar: ReturnType<typeof calendarFor>,
  relationships: Record<string, DeepRelationship>,
  storyTags: string[],
): GameEvent | null {
  const inNationalPreparation =
    (storyTags.includes("第1次省赛-进入省队") &&
      targetWeek > calendar.firstExamWeek + 4 &&
      targetWeek <= calendar.firstNationalWeek) ||
    (storyTags.includes("第2次省赛-进入省队") &&
      targetWeek > calendar.secondExamWeek + 4 &&
      targetWeek <= calendar.secondNationalWeek);
  if (
    inNationalPreparation &&
    seededUnit(`${seed}-unavoidable-departure-${targetWeek}`) >= 0.018
  )
    return null;
  const waveBases = [23, calendar.firstExamWeek + 4, 47, calendar.secondExamWeek + 4];
  const waveWeek = waveBases.find(
    (baseWeek, index) =>
      targetWeek === baseWeek + 1 + (hashSeed(`${seed}-wave-week-${index}`) % 2),
  );
  const waveRoll = seededUnit(`${seed}-wave-trigger-${targetWeek}`);
  if (waveWeek !== undefined && activeTeamSize >= 2 && waveRoll < 0.58) {
    const severity = seededUnit(`${seed}-wave-severity-${targetWeek}`);
    const maximumLeaving = Math.max(1, activeTeamSize - 1);
    const leaving = Math.min(
      maximumLeaving,
      severity > 0.94
        ? Math.max(2, Math.round(activeTeamSize * (0.65 + severity * 0.2)))
        : 1 + Math.floor(severity * Math.min(6, maximumLeaving)),
    );
    const after = Math.max(1, activeTeamSize - leaving);
    const afterExam =
      targetWeek > calendar.firstExamWeek &&
      Math.abs(targetWeek - calendar.firstExamWeek) <= 7 ||
      targetWeek > calendar.secondExamWeek &&
      Math.abs(targetWeek - calendar.secondExamWeek) <= 7;
    const waveScenes = [
      ["训练群一夜之间少了好几条打卡", "退群提示没有连续出现，名字却在第二天被管理员逐个移出名单。有人私下告别，也有人一句话都没留下。"],
      ["期末家长会后，靠窗那组没有再回来", "几位家长分别作出决定，结果却在同一个星期落下。教材被抱回班级，实验服则留在柜子里。"],
      ["教练重排了整张训练表", "原来的分组已经凑不齐。留下的人被重新组合，曾经默认会一起走到五月的名字变成了表格里的空行。"],
      ["一次模考把队伍分成了三种方向", "有人继续冲省队，有人降强度保常规，也有人当晚决定停止。没有统一口号，只有不同家庭各自计算出的答案。"],
      ["竞赛教室的钥匙突然多出来一串", "退赛的人把钥匙交回办公室。教练把它们放进抽屉，没有逐个点名，金属碰撞声却让所有人都抬了头。"],
      ["班主任们在同一周集中约谈", "常规缺口、睡眠和政策风险被分别摆上桌面。几场互不相干的谈话，最后让队伍同时少了几个人。"],
      ["校内选拔名单重新公示", "公告栏没有写“退赛”，只更新了下一阶段参训名单。被删去的名字仍在旧胶痕下面若隐若现。"],
      ["一顿散伙饭来得比比赛更早", "原本只是普通夜宵，最后却变成几个人离队前唯一一次合照。没人喊口号，大家只争着把剩下的饮料喝完。"],
      ["寒假结束，返校的人比出发时少", "外培群仍在发解析，返校大巴却空出了几排。有人转回常规，有人换了赛道，还有人只说想先睡够一周。"],
      ["联赛结果让去留在同一天失去缓冲", "喜报和遗憾同时传回学校。没进队的人并不都离开，拿奖的人也不都继续；队伍在一晚之间重新认识了机会成本。"],
    ] as const;
    const [waveTitle, waveBody] = waveScenes[hashSeed(`${seed}-wave-copy-${targetWeek}`) % waveScenes.length];
    return {
      id: `teammate-wave-${leaving}-${targetWeek}`,
      phase: "weekly",
      label: afterExam ? "队伍变化 · 联赛后的退赛潮" : "队伍变化 · 成绩节点后的退赛潮",
      title: waveTitle,
      body: [
        waveBody,
        `这一周共有 ${leaving} 人停止训练，在队人数从 ${activeTeamSize} 变成 ${after}。留下的人重新分座位，也重新判断自己是不是还愿意继续。空出来的不只是桌椅，还有原本默认会一起经历下一场考试的人；每一次离开都让继续训练从惯性重新变成需要本人回答的选择。`,
      ],
      trigger: { earliestWeek: targetWeek, latestWeek: targetWeek },
      choices: [
        {
          id: `wave-hold-${targetWeek}`,
          title: "帮忙整理留下的资料，也送他们回班",
          preview: "同学好感 +3 · SAN -3 · 心态 -1",
        result: "你留下来帮几名退赛队员整理资料，把公共讲义、私人笔记和需要归还的书逐一按名字分开，又陪他们走到原班门口。一路上没有人认真谈告别，只讨论缺了哪些课程和午休去哪吃饭。走廊尽头，有人抱着书回头挥手；你返回竞赛教室时，空下的座位已经收拾干净，屋里安静得能听见翻页声。帮忙完成交接，也让离开这件事第一次有了具体形状。",
          effects: { peerFavor: 3, san: -3, mindset: -1, tags: ["经历退赛潮"] },
        },
        {
          id: `wave-focus-${targetWeek}`,
          title: "不讨论去留，把自己的下一阶段计划排满",
          preview: "做题速率 +1.5 · 教练好感 +1 · SAN -4",
          result: "你没有参加关于去留的讨论，而是把空出来的桌面铺满下一阶段卷子，用更密集的任务阻止自己反复猜测。少了闲聊和等待，效率确实提高，排名目标也被重新写得清楚；但每次起身拿资料，那几把椅子仍会进入视线。别人离开以后，留下不再只是按惯性继续上课，它同样是一项需要承担时间、机会成本和未来解释的选择。",
          effects: { problemSpeed: 1.5, coachFavor: 1, san: -4, tags: ["退赛潮后加练"] },
        },
        {
          id: `wave-rethink-${targetWeek}`,
          title: "和家长认真谈一次自己的退路",
          preview: "家庭支持 +2 · 常规 +4 · 心态 -1",
        result: "你主动和家长谈起自己的退路，没有用“肯定能进省队”结束问题，而是把继续竞赛与现在回班分别需要的时间、费用和最坏结果写在同一张纸上。家人对其中几项估计并不认同，也担心你是在为失败预留借口，谈话因此持续很久。你们没有立刻得出结论，却第一次拥有两份可比较的现实方案；退路不再只在情绪崩溃时出现。",
          effects: { familySupport: 2, academics: 4, mindset: -1, tags: ["退赛潮后讨论退路"] },
        },
      ],
    };
  }
  const windows = [15, 23, 32, 45, 57, 69];
  const scheduledWeek = windows.find(
    (baseWeek, index) =>
      targetWeek ===
      baseWeek + (hashSeed(`${seed}-departure-week-${index}`) % 3),
  );
  if (scheduledWeek === undefined || activeTeamSize <= 2)
    return null;
  const candidates = rivals.filter(
    (rival) =>
      rival.scope.startsWith("school") && !retiredRivalIds.includes(rival.id),
  );
  if (candidates.length === 0) return null;
  const rival =
    candidates[
      hashSeed(`${seed}-departure-rival-${targetWeek}`) % candidates.length
    ];
  const relation = normalizeRelationship(relationships[rival.id], seed, rival.id);
  const protectedRoute = ["dating", "crush", "friend"].includes(relation.route);
  const rivalFamilyType = hashSeed(`${seed}-${rival.id}-family-profile`) % 5;
  const familyRetirementPressure = [0.13, 0.07, -0.05, -0.09, 0.02][rivalFamilyType];
  const departureChance = clamp(
    0.72 - relation.bond * 0.005 - relation.trust * 0.003 -
      (relation.route === "dating" ? 0.24 : relation.route === "crush" ? 0.14 : 0) +
      familyRetirementPressure,
    protectedRoute ? 0.08 : 0.24,
    0.72,
  );
  if (seededUnit(`${seed}-departure-trigger-${targetWeek}-${rival.id}`) >= departureChance)
    return null;
  const reasons = [
    {
      title: "家长反对",
      lead: `${rival.name}的家长在月考后赶到学校，要求立刻停止竞赛。`,
      detail:
        "他们把下降的排名、晚归的作息和不确定的升学政策写在同一张纸上。谈话结束时，对方没有再回竞赛教室。",
    },
    {
      title: "常规成绩压力",
      lead: `${rival.name}连续两次常规考试失利，班主任正式约谈了家长。`,
      detail:
        "教练提出可以减少训练量，但普通班的作业已经积压成另一套完整课程。最终，对方选择先保住高考路线。",
    },
    {
      title: "政策变化",
      lead: `一条新的招生政策在家长群里传开，${rival.name}重新评估了竞赛的回报。`,
      detail:
        "消息未必会直接改变你们这一届，却足以让一个原本犹豫的家庭作出决定。下午，资料柜里少了一整摞讲义。",
    },
    {
      title: "长期耗竭",
      lead: `${rival.name}在一次模考中交了近乎空白的答题卡。`,
      detail:
        "这不是不会做，而是已经无法继续集中注意。教练批准了暂停训练，对方后来在群里说，短期内不会回来。",
    },
    {
      title: "路线转向",
      lead: `${rival.name}决定把时间转向另一门竞赛或强基准备。`,
      detail:
        "没有争吵，也没有戏剧性的失败。对方只是计算了剩余时间，然后把生物竞赛从日程表里删掉。",
    },
    {
      title: "省赛预期落差",
      lead: `${rival.name}对照模拟排名后，认为继续投入一年也很难触及省队线。`,
      detail:
        "教练说模拟不能代表正式考试，对方却回答，机会成本也不能等到正式考试后才计算。",
    },
    {
      title: "健康暂停",
      lead: `${rival.name}在连续失眠和胃痛之后，被家长带去做了检查。`,
      detail:
        "检查结果不算严重，却足够让所有人承认现在的作息已经不能继续。对方先停掉晚训，也退出了下一轮机构模考。",
    },
    {
      title: "与教练长期冲突",
      lead: `${rival.name}和教练在训练安排上又争执了一次，这次没有像过去一样各退一步。`,
      detail:
        "争论并不只关于一道题，而是长期积累的否定、加练与沟通方式。对方把资料留给队友，决定不再接受这套训练关系。",
    },
    {
      title: "兴趣转移",
      lead: `${rival.name}发现自己真正愿意熬夜读的，已经不是竞赛教材。`,
      detail:
        "对方开始参加社团项目，也重新捡起曾经搁置的爱好。离开不是因为某场考试失败，而是终于愿意承认兴趣已经转向。",
    },
    {
      title: "家庭突发变故",
      lead: `${rival.name}请了一周假，回来后决定暂停全部校外培训。`,
      detail:
        "TA没有在群里解释家里发生了什么，只说接下来需要把时间留给家庭和常规课。队里的人没有追问，只把借走的书慢慢收齐。",
    },
  ];
  const reasonIndex =
    rivalFamilyType === 0 &&
    seededUnit(`${seed}-family-driven-departure-${targetWeek}-${rival.id}`) < 0.46
      ? hashSeed(`${seed}-family-reason-${targetWeek}`) % 2
      : hashSeed(`${seed}-departure-reason-${targetWeek}`) % reasons.length;
  const reason = reasons[reasonIndex];
  const persuasionSuccessResults = [
    `${rival.name}没有说服家里撤回反对，只争取到两周暂停期。TA先退出晚训，保留校内课程，也答应两周后由自己重新决定。你没有把TA劝回原来的强度，却让一次当场终止变成仍有本人意愿的位置；家庭争论仍在，之后的答案未必是回来。`,
    `${rival.name}同意先不提交退赛申请，把两周用于补最危险的常规章节。TA回到竞赛教室的次数减少，也不再参加所有模考。暂停让两条路线都获得真实数据，却使训练连续性进一步下降；两周后是否留下，要看TA愿意承担哪一种缺口。`,
    `${rival.name}决定等学校和教练核实政策后再作最终选择，不再只凭家长群转述离开。TA暂时保留训练名额，也把另一条升学路线一起准备。信息核验争取了时间，没有取消政策风险；最终选择仍可能与今天相同，只是不再由一条未经确认的消息替TA完成。`,
    `${rival.name}接受完整停训两周，而不是直接注销资格。TA先睡觉、就医，也把群消息全部静音。你争取到的不是继续拼，而是一段真正判断身体能否恢复的时间；若耗竭没有好转，离开仍会发生，而且不该被理解成你的挽留失败。`,
    `${rival.name}答应保留一次生物训练，借两周比较新路线与旧兴趣，而不是当晚删除全部安排。TA可能因此确认转向，也可能发现仍舍不得这里。你保住选择的可逆性，没有获得TA必须回来的承诺；新方向同样值得被认真尝试。`,
    `${rival.name}同意把退赛决定延后到下一次完整模考，并降低这两周的训练强度。TA不再把模拟排名当作正式判决，也没有假装机会成本不存在。观察期提供另一组证据，同时让那场模考背上更重意义；结果仍可能支持离开。`,
    `${rival.name}接受医生建议，先退出晚训与外培，两周后根据睡眠和胃痛恢复决定。TA仍偶尔来教室取资料，不再用出勤证明意志。你帮助TA把“暂停”与“失败”分开，也必须接受健康恢复优先于是否重返队伍。`,
    `${rival.name}没有立刻回到原教练安排，只同意在两周内尝试一套边界更清楚的训练：任务提前确认，争议由第三位老师参与。TA保留竞赛，不等于原谅过去的沟通。若新安排仍重复旧问题，离开将是经过验证的选择。`,
    `${rival.name}答应不在兴趣刚转移时立刻清空所有竞赛联系，每周保留一次自由阅读。TA没有承诺重新热爱，也不把新爱好当作背叛旧投入。两周后可能回来，也可能更确定离开；你争取的是允许兴趣变化得慢一点。`,
    `${rival.name}同意暂不办理彻底退赛，只把训练降到不会占用家庭所需时间的最低水平。TA没有解释家里发生什么，你也不再追问。保留资格给未来留门，同时尊重眼下生活已经改变；是否回来只能由TA在家庭状况允许时回答。`,
  ];
  const persuasionFailureResults = [
    `${rival.name}谢谢你愿意挽留，却说两周暂停无法改变家里的决定。继续私下坚持只会让TA在家与学校之间承担更大冲突。你让告别获得一次完整谈话，没有因此拥有替TA对抗家庭的权利；TA最终回班，也答应以后仍可联系。`,
    `${rival.name}认真算过欠下的课程，认为两周不足以同时验证两条路线，只会让返班缺口继续扩大。TA没有否定竞赛经历，也不把你的挽留当作压力。选择回班是对当前时间的分配，不是承认此前全部错误；你只能尊重这项取舍。`,
    `${rival.name}认为即使传言最终有偏差，家庭对政策不确定性的承受已经到极限。TA不愿再用一年等待规则稳定。你的核验建议合理，却不能替另一个家庭接受风险；离开基于他们愿意承担什么，而非哪条消息绝对正确。`,
    `${rival.name}说自己现在需要的不是短暂停顿后重新追赶，而是结束那种醒来就欠任务的生活。挽留让TA知道有人在意，也可能把恢复再次变成回归考核。TA选择完整离开，把健康从一项恢复训练的工具变回生活本身。`,
    `${rival.name}没有接受试行两周，因为新路线并非冲动，而是已经持续很久的兴趣。继续保留生物训练只会挤占真正想投入的事。TA感谢你没有把转向叫作失败，也明确表示关系可以留下，赛道不必为了关系一起留下。`,
    `${rival.name}拒绝让下一次模考成为最后审判，认为自己已经用足够多次排名评估过机会。多等两周可能出现偶然好成绩，也不会改变愿意投入的时间。你的挽留被认真听见，TA仍选择把有限时间交给更确定的路线。`,
    `${rival.name}说检查结果只是最后提醒，真正的问题是身体状态已经持续数月。暂停后再回到同样作息只会重复循环。TA选择退出晚训也退出赛道，不再把恢复目标设成尽快重新参赛；健康因此获得没有附加条件的位置。`,
    `${rival.name}不愿再用两周试验一段已经多次失败的教练关系。问题不是一场争执，而是长期否定和失去信任。你无法通过友情替双方修复训练结构；TA留下资料、离开队伍，也保留以后在别处继续学习生物的可能。`,
    `${rival.name}说自己已经试过在两条兴趣之间保留最低投入，结果只是每件事都做得疲惫。TA选择把生物竞赛完整放下，让新生活真正获得时间。你的挽留确认了旧经历有人珍惜，却不能要求兴趣为了共同记忆继续存在。`,
    `${rival.name}没有说明家庭细节，只说两周后责任也不会自动消失。此时保留最低训练仍会占用TA需要交给家人的注意力。你停止追问，接受关系能提供的只是理解，不是替TA承担现实；离开因而成为边界，而非突然消失。`,
  ];
  const aftermaths = [
    `${rival.name}最后一次打卡停在周三。之后，竞赛队从 ${activeTeamSize} 人变成了 ${activeTeamSize - 1} 人。`,
    `实验柜里多出一件洗净叠好的白大褂，袖口写着${rival.name}的名字。队伍还剩 ${activeTeamSize - 1} 人。`,
    `下一次分组时，原来和${rival.name}搭档的人被并进另一组；训练表上的人数改成了 ${activeTeamSize - 1}。`,
    `返校大巴的座位表被重新打印。${rival.name}那一格被删去，后面的名字整体向前挪了一位。`,
    `共享题单仍保留着${rival.name}做过的批注，但新的完成记录不会再出现。队伍少到 ${activeTeamSize - 1} 人。`,
    `教练在点名时停顿了半秒，随后从下一位继续。没有告别仪式，在队人数却已经变成 ${activeTeamSize - 1}。`,
    `${rival.name}把没用完的活页纸和标签分给大家，像是普通地整理一次桌面。第二天，训练群少了一个人。`,
    `常规班晚自习的窗边重新出现了${rival.name}。你隔着走廊看见TA低头补作业，手边不再放竞赛书。`,
    `下一场校内模考的准考名单只有 ${activeTeamSize - 1} 个名字。直到卷子发下来，离开才第一次变得具体。`,
    `${rival.name}没有退出所有群，只把群昵称里的“生竞”两个字删掉。留下的人也没有立刻讨论这件事。`,
  ];
  const aftermath =
    aftermaths[
      hashSeed(`${seed}-departure-aftermath-${targetWeek}-${rival.id}`) %
        aftermaths.length
    ];
  const persuadeChance = clamp(
    0.18 + relation.bond * 0.006 + relation.trust * 0.004 +
      (relation.route === "dating" ? 0.2 : relation.route === "friend" ? 0.12 : relation.route === "crush" ? 0.1 : 0),
    0.18,
    0.88,
  );
  const persuasionSucceeds =
    seededUnit(`${seed}-departure-persuade-${targetWeek}-${rival.id}`) < persuadeChance;
  return {
    id: `teammate-departure-${rival.id}-${targetWeek}`,
    phase: "weekly",
    label: `队伍变化 · ${reason.title}`,
    title: reason.lead,
    body: [
      reason.detail,
      aftermath,
    ],
    trigger: { earliestWeek: targetWeek, latestWeek: targetWeek },
    choices: [
      ...(relation.bond >= 22 || protectedRoute
        ? [
            {
              id: `departure-persuade-${persuasionSucceeds ? "success" : "fail"}-${rival.id}`,
              title: "认真问TA：能不能先暂停两周，再决定是否彻底离开",
              preview: "",
              result: persuasionSucceeds
                ? persuasionSuccessResults[reasonIndex]
                : persuasionFailureResults[reasonIndex],
              effects: {
                peerFavor: persuasionSucceeds ? 3 : 2,
                san: persuasionSucceeds ? -1 : -3,
                mindset: persuasionSucceeds ? 1 : -1,
                tags: [
                  persuasionSucceeds
                    ? `${rival.id}-被羁绊劝回`
                    : `${rival.id}-挽留未果`,
                ],
              },
            },
          ]
        : []),
      {
        id: `departure-message-${rival.id}`,
        title: "私下发消息，问对方以后是否还愿意联系",
        preview: "",
        result:
          "你私下发消息，问对方回班以后是否还愿意联系，没有把问题包装成资料交接或最后一次复盘。对方隔了一会儿才回复，说眼下还不知道以后能聊什么，但可以等下次月考结束一起吃饭。你们没有急着总结这段竞赛经历，也没有许诺关系绝不会改变；退赛确实拿走了每天共同出现的理由，却没有替两个人决定通讯录里的名字从此失效。",
        effects: {
          peerFavor: 2,
          san: -2,
          tags: [`${rival.id}-退赛后保持联系`],
        },
      },
      {
        id: `departure-reflect-${rival.id}`,
        title: "重新计算自己的时间与退路",
        preview: "",
        result:
          "你在原本只有训练任务的计划表旁新增一栏“如果现在退出”，逐项写下回班章节、可用时间、需要求助的人和最坏的排名变化。那一栏没有让你立刻提交申请，反而让继续训练时少了一点被困住的恐慌。竞赛仍是当前选择，却不再是因为看不见其他道路才被动维持；从此每一个月，你都能重新比较留下的理由是否仍然成立。",
        effects: {
          academics: 4,
          mindset: -1,
          reasoning: 0.5,
          tags: ["目睹队友退赛"],
        },
      },
      {
        id: `departure-train-harder-${rival.id}`,
        title: "把空出来的位置理解成更大的责任",
        preview: "",
        result:
          "你把退赛后空出来的位置理解成留队者需要承担的责任，下一次训练比平时早到半小时，主动整理资料并补上原本由对方负责的记录。教练认可这种变化，任务也确实推进得更快。可当你翻开卷子、准备把一道熟悉题型递过去讨论时，视线仍会下意识落在那张空椅上。责任让队伍继续运转，却不会自动替代一个具体的人。",
        effects: {
          reasoning: 1,
          coachFavor: 1,
          san: -3,
          tags: ["队友退赛后加练"],
        },
      },
    ],
  };
}

type FamilyProfile = (typeof familyProfiles)[number];


function makeFamilyWeeklyEvent(
  targetWeek: number,
  seed: string,
  profile: FamilyProfile,
  stats: PlayerStats,
  storyTags: string[],
  resolvedEvents: string[],
  forcedSceneIndex?: number,
): GameEvent | null {
  if (forcedSceneIndex === undefined) {
    if (targetWeek < 8 || targetWeek % 7 !== hashSeed(`${seed}-family-rhythm`) % 7)
      return null;
    if (seededUnit(`${seed}-family-event-${targetWeek}`) > 0.66) return null;
  }
  const preparingForNational =
    (storyTags.includes("第1次省赛-进入省队") &&
      !storyTags.some((tag) => /^第1次国赛-/.test(tag))) ||
    (storyTags.includes("第2次省赛-进入省队") &&
      !storyTags.some((tag) => /^第2次国赛-/.test(tag)));
  const hasImportantRelationship = storyTags.some((tag) =>
    tag.includes("正式恋爱") || tag.includes("朦胧好感") || tag.includes("确认挚友"),
  );
  const eligibleFamilyScenes = forcedSceneIndex === undefined
    ? familyWeeklySceneCatalog.filter((candidateScene) => {
        if (candidateScene.key === "teacher-note") return stats.regularNeglectWeeks >= 1;
        if (candidateScene.key === "fever-bag") return stats.san <= 54;
        if (candidateScene.key === "late-chat") return hasImportantRelationship || stats.peerFavor >= 38;
        return true;
      })
    : familyWeeklySceneCatalog;
  if (!eligibleFamilyScenes.length) return null;
  const scene = forcedSceneIndex === undefined
    ? eligibleFamilyScenes[hashSeed(`${seed}-family-scene-${targetWeek}`) % eligibleFamilyScenes.length]
    : familyWeeklySceneCatalog[forcedSceneIndex];
  if (!scene) return null;
  const sceneIndex = familyWeeklySceneCatalog.findIndex((candidateScene) => candidateScene.key === scene.key);
  const { title, body, key: sceneKey } = scene;
  const id = `family-weekly-${sceneKey}-${profile.key}`;
  if (resolvedEvents.includes(id)) return null;
  const positive = preparingForNational || stats.familySupport >= 48;
  const script = scene.variants[profile.key];
  return {
    id,
    phase: "weekly",
    label: "家庭生活",
    title,
    body: [body, script.voice],
    concealConsequences: true,
    visualNovel: true,
    archive: { category: "家庭与教练", group: "家庭日常谈话", clusterKey: `family-weekly-${sceneKey}`, variantKey: profile.key, variantLabel: profile.label, order: sceneIndex + 1, timingNote: "第 8 周后，每隔约七周进入一次家庭事件判定；具体周次随人生种子错开" },
    trigger: { earliestWeek: targetWeek, latestWeek: targetWeek },
    choices: script.choices.map((choice, index) => ({ id: `family-${sceneKey}-${profile.key}-${index + 1}`, title: choice.title, preview: "", result: choice.result, effects: { ...choice.effects, familySupport: round1((choice.effects.familySupport ?? 0) * (positive ? 1.12 : 1) * profile.volatility), tags: [`家庭谈话:${profile.key}:${sceneKey}`] } })),
  };
}

function makeFamilyCheckpointEvent(
  targetWeek: number,
  seed: string,
  profile: FamilyProfile,
  stats: PlayerStats,
  storyTags: string[],
  resolvedEvents: string[],
  calendar: ReturnType<typeof calendarFor>,
): GameEvent | null {
  const jitter = (key: string) => (hashSeed(`${seed}-family-checkpoint-${key}`) % 3) - 1;
  const checkpoints = [
    { week: 9 + jitter("first-meeting"), key: "first-meeting", phase: "第一次家校沟通" },
    { week: 27 + jitter("winter-training"), key: "winter-training", phase: "第一次寒假外培前" },
    { week: calendar.firstExamWeek - 2 + jitter("province-one"), key: "province-one", phase: "第一次联赛前" },
    ...(storyTags.includes("第1次省赛-进入省队")
      ? [{ week: calendar.firstNationalWeek - 3 + jitter("national-one"), key: "national-one", phase: "第一次国赛备考中段" }]
      : []),
    { week: calendar.formalLeaveWeek - 1 + jitter("formal-leave"), key: "formal-leave", phase: "正式停课前" },
    { week: calendar.secondExamWeek - 2 + jitter("province-two"), key: "province-two", phase: "第二次联赛前" },
    ...(storyTags.includes("第2次省赛-进入省队")
      ? [{ week: calendar.secondNationalWeek - 3 + jitter("national-two"), key: "national-two", phase: "第二次国赛备考中段" }]
      : []),
  ];
  const checkpointIndex = checkpoints.findIndex((item) => item.week === targetWeek);
  const checkpoint = checkpoints[checkpointIndex];
  if (!checkpoint) return null;
  const id = `family-checkpoint-${checkpoint.key}-${profile.key}`;
  if (resolvedEvents.includes(id)) return null;
  const enteredNational =
    (targetWeek > calendar.firstExamWeek &&
      targetWeek <= calendar.firstNationalWeek &&
      storyTags.includes("第1次省赛-进入省队")) ||
    (targetWeek > calendar.secondExamWeek &&
      targetWeek <= calendar.secondNationalWeek &&
      storyTags.includes("第2次省赛-进入省队"));
  const hasRelationship = storyTags.some(
    (tag) => tag.includes("正式恋爱") || tag.includes("确认挚友"),
  );
  const lowTrust = stats.familySupport < 38;
  const bodies: Record<string, string> = {
    "first-meeting":
      "班主任、竞赛教练和父母第一次坐在同一张桌边。三个人说的都是‘为你好’，却分别指向常规排名、竞赛进度和睡眠。",
    "winter-training":
      "两周外培的日程、住宿和返程票摊在桌上。培训费用不从你的零花钱里出，但这仍是一笔需要全家共同承担的时间。",
    "province-one":
      "离第一次联赛只剩两周。父母没有能力判断你的知识漏洞，只能从模拟排名、黑眼圈和情绪猜测这次投入是否值得。",
    "national-one":
      "国赛备考已经过半。父母不再追问是否立刻退赛，而是拿着机构日程逐项确认住宿、实验安全和每天能睡多久。",
    "formal-leave":
      "正式停课申请需要家长签字。签名意味着接受常规成绩继续下滑，也意味着不再把每一次焦虑都伪装成‘再考虑一下’。",
    "province-two":
      "第二次、也是最后一次联赛机会就在眼前。家里都清楚这张成绩单之后，不会再有‘下一年重新来过’。",
    "national-two":
      "最后一段国赛备考让全家的时间都跟着机构日程移动。此时争论的重点已经不是要不要学，而是如何别在抵达赛场前先被耗空。",
  };
  const checkpointScript = familyCheckpointContent[checkpoint.key]?.[profile.key];
  if (!checkpointScript) return null;
  return {
    id,
    phase: "weekly",
    label: `家庭节点 · ${checkpoint.phase}`,
    title: lowTrust ? `${checkpointScript.title}，而这次谈话从追问开始。` : checkpointScript.title,
    body: [
      bodies[checkpoint.key],
      checkpointScript.voice,
      hasRelationship
        ? "父母也注意到你和某位同学来往得更密切。那段关系究竟是支撑还是新的压力，暂时没有人能替你回答；今晚也不会因为大人需要一个结论，就被匆忙归类成应当保留或必须放弃的东西。"
        : "这不是一次只讨论成绩的会议，作息、人际关系和你是否仍然愿意继续也被问到了。没有人能替你预先证明坚持或退出更正确，谈话只能先把各自愿意承担的部分放到桌面上。",
    ],
    concealConsequences: true,
    visualNovel: true,
    archive: { category: "家庭与教练", group: "家庭阶段节点", clusterKey: `family-checkpoint-${checkpoint.key}`, variantKey: profile.key, variantLabel: profile.label, order: checkpointIndex + 1, timingNote: `${checkpoint.phase}附近浮动一周；与正式考试周错开` },
    trigger: { earliestWeek: targetWeek, latestWeek: targetWeek },
    choices: checkpointScript.choices.map((choice, index) => ({
      id: `family-checkpoint-${checkpoint.key}-${profile.key}-${index + 1}`,
      title: choice.title,
      preview: "",
      result: choice.result,
      effects: {
        ...choice.effects,
        familySupport: round1((choice.effects.familySupport ?? 0) * (enteredNational ? 1.08 : 1)),
        tags: [`家庭阶段:${checkpoint.key}:${profile.key}`],
      },
    })),
  };
}

function makeExternalDepartureEvent(
  targetWeek: number,
  seed: string,
  retiredRivalIds: string[],
  resolvedEvents: string[],
): GameEvent | null {
  if (targetWeek < 24 || targetWeek % 11 !== hashSeed(`${seed}-external-retire-rhythm`) % 11)
    return null;
  if (seededUnit(`${seed}-external-retire-trigger-${targetWeek}`) > 0.42)
    return null;
  const candidates = rivals.filter(
    (rival) =>
      rival.scope === "province" &&
      rival.revealWeek <= targetWeek &&
      !retiredRivalIds.includes(rival.id),
  );
  if (!candidates.length) return null;
  const rival = candidates[hashSeed(`${seed}-external-retire-rival-${targetWeek}`) % candidates.length];
  const id = `external-departure-${rival.id}-${targetWeek}`;
  if (resolvedEvents.includes(id)) return null;
  const scenes = [
    `省联考群里，${rival.name}把昵称后的学校与年级一起删掉，只留下一句“之后不参加排名了”。`,
    `一张新的机构模考榜发出来，你翻了两遍也没找到${rival.name}。后来才从共同认识的人那里听说TA已经回班。`,
    `${rival.name}所在学校更换了负责教练，原有训练突然中断。TA没有转学，只能先把竞赛从日程里移走。`,
    `省内交流群转发了${rival.name}的退赛说明：家里决定优先处理健康与睡眠，所有培训暂停。`,
    `你曾把${rival.name}当作稳定的省队线参照。一次政策讨论后，TA却比任何人都快地选择了另一条升学路线。`,
    `${rival.name}没有公开宣布退赛，只是不再参加任何一场联考。几周以后，旧榜单上的名字才显出一种过去时。`,
    `机构老师在课前说${rival.name}以后不来了。不同学校的人沉默几秒，随即又被下一张幻灯片推着向前。`,
    `共同朋友告诉你，${rival.name}的常规考试重新回到年级前列。这个消息既不像失败，也不像胜利。`,
    `${rival.name}转去准备另一门竞赛。省内对手少了一个，现实中的TA却并没有因此停在原地。`,
    `联赛结果之后，${rival.name}退出了几个模考群，却保留了好友。TA说不想再被排名看见，但仍愿意偶尔聊题。`,
  ];
  return {
    id,
    phase: "weekly",
    label: "省内消息",
    title: "一个熟悉的外校名字从下一张榜单上消失了。",
    body: [scenes[hashSeed(`${seed}-external-retire-copy-${targetWeek}`) % scenes.length], "这不会改变本校在队人数，却会改变你对全省竞争与个人去留的想象。过去只在榜单和联考群里出现的名字忽然有了另一条路线，也提醒你，退赛并不总等于失败，更不会让一个人停在原地。你可以重新计算竞争格局，也可以先承认这条消息带来的复杂感受，而不把别人的离开只解释成自己的机会。"],
    concealConsequences: true,
    visualNovel: true,
    trigger: { earliestWeek: targetWeek, latestWeek: targetWeek },
    choices: [
      { id: `external-wish-${rival.id}`, title: "通过共同好友转达祝福", preview: "", result: "你没有突然以熟人的口吻闯进对方的告别，而是请共同朋友转达一句简短祝福，也说明无需专门回复。消息绕了一圈才送到那里，几天后你收到一句同样克制的谢谢。你们其实并不熟，过去更多只是榜单上的两个名字；可这次转达让彼此都知道，离开赛场并不等于此前的努力无人看见，也不等于从所有人的记忆里一并消失。", effects: { san: -0.5, mindset: 0.5 } },
      { id: `external-recalculate-${rival.id}`, title: "重新评估今年省内竞争", preview: "", result: "你从对手表中移走那个名字，重新估算各校强手、名额和自己的相对位置，很快发现少一个竞争者并不会让卷子少一道难题，也不能填补你的知识漏洞。名次概率确实发生了细小变化，却不值得被当作别人的退赛送来的奖励。你保留新的判断，同时在表格旁写下一句提醒：只根据仍会参赛的人调整策略，不替离开的人编造失败结局。", effects: { reasoning: 0.3, mindset: -0.2 } },
    ],
  };
}

function makeRelationshipTurningEvent(
  targetWeek: number,
  relationships: Record<string, RivalRelationship>,
  resolvedEvents: string[],
  retiredRivalIds: string[],
): GameEvent | null {
  if (targetWeek < 20) return null;
  const rival = rivals
    .filter(
      (item) =>
        item.scope === "school-peer" &&
        !retiredRivalIds.includes(item.id) &&
        (relationships[item.id]?.bond ?? 0) >= 22 &&
        !resolvedEvents.includes(`relationship-turn-${item.id}`),
    )
    .sort(
      (a, b) =>
        (relationships[b.id]?.bond ?? 0) - (relationships[a.id]?.bond ?? 0),
    )[0];
  if (!rival) return null;
  const relation = relationships[rival.id];
  return {
    id: `relationship-turn-${rival.id}`,
    phase: "weekly",
    label: "人物关系 · 不只是普通队友",
    title: `一次晚自习后，${rival.name}没有立刻离开。`,
    body: [
      "你们已经交换过笔记、错题和模考后的情绪。讨论竞赛时，你们熟悉彼此最常犯的错误；不讨论竞赛时，却还不确定应该把这段关系叫作什么。",
      `当前关系积累：亲近 ${formatNumber(relation.bond)}，竞争张力 ${formatNumber(relation.tension)}。这次选择只确定第一阶段方向，未来仍可能变化。`,
    ],
    trigger: { earliestWeek: targetWeek, latestWeek: targetWeek },
    choices: [
      {
        id: `relationship-friend-${rival.id}`,
        title: "约定无论谁先退赛，都继续做朋友",
        preview: "开启好友路线 · 同学好感 +4 · SAN +2",
        result:
          `你们没有说“永远”之类听上去过重的话，只认真约了下周末去校外吃一碗面。${rival.name}把时间写进日历时，还特意备注“禁止带题”。那一刻你忽然觉得轻松：即使下一张名单把两个人分开，这段关系也不必随着竞赛资格一起失效。第一次，见面的理由和任何分数都无关。`,
        effects: {
          peerFavor: 4,
          san: 2,
          tags: [`${rival.id}-好友路线`, `${rival.id}-关系定型`],
        },
      },
      {
        id: `relationship-rivalry-${rival.id}`,
        title: "约定下一次模考必须分出胜负",
        preview: "开启宿敌路线 · 思辨 +2 · SAN -1",
        result:
          `你伸出手，要求下一次模考谁也不许用“状态不好”给自己留退路。${rival.name}没有握手，只把你的名字写在新计划表最上方，又在旁边重重画了一道线。从此每一次公布成绩，你们都会先寻找对方的位置；那份说不清的在意被改写成一场有期限的胜负，也因此变得更具体、更锋利。`,
        effects: {
          reasoning: 2,
          san: -1,
          tags: [`${rival.id}-宿敌路线`, `${rival.id}-关系定型`],
        },
      },
      {
        id: `relationship-crush-${rival.id}`,
        title: "试着聊一些竞赛之外的事",
        preview: "开启朦胧好感路线 · 心态 +1 · SAN +1",
        result:
          `你从班主任最近的口头禅聊到食堂最难吃的窗口，又绕到周末作业和小时候做过的傻事。${rival.name}没有像平时那样把每句话拉回题目，反而讲了一个从未在队里提过的家庭小事。你仍不能确定这种在意应当叫什么，也没有急着给关系下定义；只是在保安第二次催促时，你们都同时放慢了收书包的动作，谁也不太想先结束今晚。`,
        effects: {
          mindset: 1,
          san: 1,
          tags: [`${rival.id}-朦胧好感`, `${rival.id}-关系定型`],
        },
      },
    ],
  };
}

function makeRivalStudyAction(rival: Rival): WeeklyAction {
  const moduleBooks = textbooks.filter(
    (book) => book.module === rival.specialty,
  );
  const focusBook =
    moduleBooks[hashSeed(rival.id) % Math.max(1, moduleBooks.length)];
  return {
    id: `rival-study-${rival.id}`,
    category: "study",
    title: `与${rival.name}共同学习`,
    description: `互相挑错并讨论${specialtyLabels[rival.specialty]}。竞争会暴露短板，也会迫使思路更完整。`,
    cost: 1,
    effects: {
      reasoning: 0.45,
      peerFavor: 2,
      san: -1,
    },
    bookEffect: focusBook
      ? {
          bookId: focusBook.id,
          course: 4.5,
          practice: 0.5,
          retention: 7,
          mode: "practice",
        }
      : undefined,
  };
}

export default function Home() {
  const [selectedId, setSelectedId] = useState(origins[1].id);
  const [seed, setSeed] = useState("BIO-527184");
  const storyNpcNames = useMemo(
    () =>
      Object.fromEntries(
        rivals.map((rival) => [rival.id, seededRivalIdentity(rival, seed).name]),
      ),
    [seed],
  );
  const storyNpcLabels = useMemo(() => {
    const labels = {
      reserved: "内敛克制型",
      warm: "温和照顾型",
      competitive: "竞争敏锐型",
      playful: "轻松幽默型",
      curious: "好奇追问型",
    } as const;
    const conflictLabels = {
      abandonment: "害怕不告而别",
      burden: "害怕成为负担",
      achievement: "用成绩确认价值",
      distance: "习惯用距离自保",
      caretaking: "习惯承担照顾者",
      family: "受家庭边界牵制",
    } as const;
    const peerRivals = rivals.filter((rival) => rival.scope === "school-peer");
    return Object.fromEntries(
      rivals.map((rival) => {
        const identity = seededRivalIdentity(rival, seed);
        const peerIndex = peerRivals.findIndex((peer) => peer.id === rival.id);
        return [
          rival.id,
          peerIndex >= 0
            ? `${labels[identity.personalityKey]} · ${conflictLabels[identity.innerConflictKey]} · NPC变体${peerIndex + 1}`
            : "NPC风格变体",
        ];
      }),
    );
  }, [seed]);
  const [name, setName] = useState("林知夏");
  const [playerGender, setPlayerGender] = useState<PlayerGender>("female");
  const [screen, setScreen] = useState<
    "origin" | "profile" | "week" | "retired" | "complete" | "postcareer"
  >("origin");
  const [firstChoice, setFirstChoice] = useState<string | null>(null);
  const [openingResolved, setOpeningResolved] = useState(false);
  const [week, setWeek] = useState(1);
  const [schedule, setSchedule] = useState<WeeklyAction[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [weekRecords, setWeekRecords] = useState<WeekRecord[]>([]);
  const [currentWeekMoments, setCurrentWeekMoments] = useState<WeekMoment[]>([]);
  const [pendingWeekReview, setPendingWeekReview] = useState<WeekRecord | null>(
    null,
  );
  const [selectedBookId, setSelectedBookId] = useState(textbooks[0].id);
  const [selectedModule, setSelectedModule] =
    useState<Textbook["module"]>("module1");
  const [careerTab, setCareerTab] = useState<
    "planner" | "rivals" | "store" | "journal"
  >("planner");
  const [pendingEvent, setPendingEvent] = useState<GameEvent | null>(null);
  const [eventChoice, setEventChoice] = useState<string | null>(null);
  const [eventResultNotice, setEventResultNotice] =
    useState<EventResultNotice | null>(null);
  const [resolvedEvents, setResolvedEvents] = useState<string[]>([]);
  const [storyTags, setStoryTags] = useState<string[]>([]);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  const [currentWeekUses, setCurrentWeekUses] = useState<Record<string, number>>({});
  const [currentWeekUseWeek, setCurrentWeekUseWeek] = useState(1);
  const [chocolateStreak, setChocolateStreak] = useState(0);
  const [lastChocolateWeek, setLastChocolateWeek] = useState(0);
  const [pendingAssessment, setPendingAssessment] =
    useState<AssessmentRecap | null>(null);
  const [assessmentChoice, setAssessmentChoice] = useState<
    "review" | "rank" | "rest" | null
  >(null);
  const [queuedEvent, setQueuedEvent] = useState<GameEvent | null>(null);
  const [provincialAttempts, setProvincialAttempts] = useState<
    ProvincialAttempt[]
  >([]);
  const [nationalAttempts, setNationalAttempts] = useState<NationalAttempt[]>(
    [],
  );
  const [retirementFlow, setRetirementFlow] =
    useState<RetirementFlow | null>(null);
  const [retirementChoice, setRetirementChoice] = useState<string | null>(null);
  const [retirementStageCompleted, setRetirementStageCompleted] =
    useState<RetirementStage | null>(null);
  const [retirementCooldownUntil, setRetirementCooldownUntil] = useState(0);
  const [retirementAttemptCount, setRetirementAttemptCount] = useState(0);
  const [activeTeamSize, setActiveTeamSize] = useState(0);
  const [retiredRivalIds, setRetiredRivalIds] = useState<string[]>([]);
  const [retiredRivalWeeks, setRetiredRivalWeeks] = useState<Record<string, number>>({});
  const [rivalRelationships, setRivalRelationships] = useState<
    Record<string, RivalRelationship>
  >({});
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [keepsakes, setKeepsakes] = useState<Record<string, KeepsakeRecord>>({});
  const [keepsakeOpen, setKeepsakeOpen] = useState(false);
  const [selectedKeepsakeId, setSelectedKeepsakeId] = useState<string | null>(null);
  const [keepsakeToast, setKeepsakeToast] = useState<{
    id: string;
    count: number;
  } | null>(null);
  const [weeklyBonusPoints, setWeeklyBonusPoints] = useState(0);
  const [weeklyStudyBoost, setWeeklyStudyBoost] = useState(0);
  const [storeNotice, setStoreNotice] = useState<string | null>(null);
  const [allowanceRequestOpen, setAllowanceRequestOpen] = useState(false);
  const [allowanceChoice, setAllowanceChoice] = useState<string | null>(null);
  const [allowanceRequestCount, setAllowanceRequestCount] = useState(0);
  const [allowanceNotice, setAllowanceNotice] = useState<string | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveManagerOpen, setSaveManagerOpen] = useState(false);
  const [saveSlots, setSaveSlots] = useState<(SaveSlotInfo | null)[]>(
    Array.from({ length: 10 }, () => null),
  );
  const [postCareerInput, setPostCareerInput] =
    useState<PostCareerInput | null>(null);
  const [postCareerState, setPostCareerState] =
    useState<PostCareerState | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    Record<string, string>
  >({});
  const [achievementOpen, setAchievementOpen] = useState(false);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [achievementToast, setAchievementToast] =
    useState<AchievementDefinition | null>(null);
  const [achievementHydrated, setAchievementHydrated] = useState(false);
  const [endingArchive, setEndingArchive] = useState<EndingArchiveRecord[]>([]);
  const [endingArchiveOpen, setEndingArchiveOpen] = useState(false);
  const [selectedSupplementaryBookId, setSelectedSupplementaryBookId] = useState<string | null>(null);
  const [realQuestionMode, setRealQuestionMode] = useState(false);
  const [realQuestionSession, setRealQuestionSession] = useState<{ context: string; questions: RealQuestion[]; index: number; responses: Array<Array<TruthValue | null> | "abandoned" | null>; finished: boolean } | null>(null);
  const [mistakeBook, setMistakeBook] = useState<Record<string, MistakeRecord>>({});
  const [mistakeBookOpen, setMistakeBookOpen] = useState(false);

  const selected = origins.find((origin) => origin.id === selectedId) ?? origins[0];

  const generated = useMemo(() => {
    const base = hashSeed(`${seed}-${selected.id}`);
    const firstYear = 2027 + (base % 2);
    const previousGolds = 2 + ((base >>> 3) % 7);
    const schoolIndex =
      selected.id === "county-school"
        ? 4
        : selected.id === "elite-school"
          ? 0
          : (base >>> 5) % schoolNames.length;
    const supportIndex = clamp(
      Math.floor((selected.stats.familySupport + ((base >>> 8) % 17) - 8) / 20),
      0,
      supportLabels.length - 1,
    );

    return {
      firstYear,
      school: schoolNames[schoolIndex],
      schoolTeamSize:
        selected.id === "elite-school"
          ? 18 + ((base >>> 9) % 7)
          : selected.id === "county-school"
            ? 6 + ((base >>> 9) % 7)
            : 10 + ((base >>> 9) % 11),
      schoolParticipants: 620 + ((base >>> 13) % 481),
      schoolAcademicStrength:
        selected.id === "elite-school"
          ? 0.72
          : selected.id === "county-school"
            ? 0.5
            : selected.id === "top-scorer"
              ? 0.64
              : 0.59,
      coreSameGrade: 30 + ((base >>> 11) % 16),
      coreUpperGrade: 30 + ((base >>> 15) % 16),
      coreLowerGrade: 30 + ((base >>> 18) % 16),
      previousGolds,
      teamPlaces: 12 + previousGolds,
      provinceParticipants: 1050 + ((base >>> 6) % 451),
      firstPrizeEnd: 80 + ((base >>> 12) % 26),
      secondPrizeEnd: 230 + ((base >>> 16) % 51),
      thirdPrizeEnd: 460 + ((base >>> 20) % 91),
      competitionStrength: 0.9 + ((base >>> 22) % 21) / 100,
      reimbursement: clamp(
        selected.stats.schoolSupport - 18 + ((base >>> 19) % 31),
        15,
        90,
      ),
      familySupport: supportLabels[supportIndex],
      familyProfile:
        familyProfiles[
          (base >>> 25) % familyProfiles.length
        ],
      paperSetter: firstYear % 2 === 1 ? "思辨倾向命题年" : "基础倾向命题年",
    };
  }, [seed, selected]);

  const saveKey = "shengjing-rensheng-save-v1";
  const autoSaveKey = "shengjing-rensheng-autosave-v1";
  // v2 discards the old draft-rank based provincial achievements that could be
  // unlocked before the official team line was published.
  const achievementKey = "shengjing-rensheng-achievements-v2";
  const endingArchiveKey = "shengjing-rensheng-ending-archive-v1";
  const manualSaveKeys = Array.from({ length: 10 }, (_, index) =>
    index === 0 ? saveKey : `shengjing-rensheng-save-v1-slot-${index + 1}`,
  );
  const makeSaveData = () => ({
    version: 1,
    savedAt: new Date().toISOString(),
    selectedId,
    seed,
    name,
    playerGender,
    screen,
    firstChoice,
    openingResolved,
    week,
    schedule,
    playerStats,
    weekRecords,
    currentWeekMoments,
    pendingWeekReview,
    selectedBookId,
    selectedModule,
    careerTab,
    pendingEvent,
    eventChoice,
    eventResultNotice,
    resolvedEvents,
    storyTags,
    actionCounts,
    currentWeekUses,
    currentWeekUseWeek,
    chocolateStreak,
    lastChocolateWeek,
    pendingAssessment,
    assessmentChoice,
    queuedEvent,
    provincialAttempts,
    nationalAttempts,
    retirementFlow,
    retirementChoice,
    retirementStageCompleted,
    retirementCooldownUntil,
    retirementAttemptCount,
    activeTeamSize,
    retiredRivalIds,
    retiredRivalWeeks,
    rivalRelationships,
    inventory,
    keepsakes,
    weeklyBonusPoints,
    weeklyStudyBoost,
    storeNotice,
    allowanceRequestOpen,
    allowanceChoice,
    allowanceRequestCount,
    allowanceNotice,
    postCareerInput,
    postCareerState,
    unlockedAchievements,
    mistakeBook,
    realQuestionMode,
  });

  const readSaveInfo = (raw: string | null): SaveSlotInfo | null => {
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (!data.playerStats) return null;
      return {
        name: data.name ?? "未命名选手",
        week: data.week ?? 1,
        savedAt: data.savedAt ?? new Date(0).toISOString(),
        seed: data.seed ?? "未知种子",
        screen: data.screen ?? "week",
      };
    } catch {
      return null;
    }
  };

  const refreshSaveSlots = () => {
    const slots = manualSaveKeys.map((key) =>
      readSaveInfo(window.localStorage.getItem(key)),
    );
    setSaveSlots(slots);
    setHasSave(
      slots.some(Boolean) ||
        Boolean(readSaveInfo(window.localStorage.getItem(autoSaveKey))),
    );
  };

  const saveGame = (automatic = false, slotIndex = 0) => {
    if (!playerStats || screen === "origin" || screen === "profile") return;
    window.localStorage.setItem(
      automatic ? autoSaveKey : manualSaveKeys[slotIndex],
      JSON.stringify(makeSaveData()),
    );
    setHasSave(true);
    if (!automatic) {
      setSaveNotice(`已保存到档位 ${slotIndex + 1}：第 ${week} 周`);
      refreshSaveSlots();
    }
  };

  const loadGame = (preferLatest = false, slotIndex?: number) => {
    const manualRaws = manualSaveKeys
      .map((key) => window.localStorage.getItem(key))
      .filter((raw): raw is string => Boolean(raw));
    const autoRaw = window.localStorage.getItem(autoSaveKey);
    let raw =
      slotIndex === undefined
        ? (manualRaws[0] ?? autoRaw)
        : window.localStorage.getItem(manualSaveKeys[slotIndex]);
    if (preferLatest) {
      raw = [...manualRaws, ...(autoRaw ? [autoRaw] : [])]
        .map((candidate) => ({
          candidate,
          time: new Date(JSON.parse(candidate).savedAt ?? 0).getTime(),
        }))
        .sort((a, b) => b.time - a.time)[0]?.candidate;
    }
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.version !== 1 || !data.playerStats) return;
      setSelectedId(data.selectedId);
      setSeed(data.seed);
      setName(data.name);
      setPlayerGender(data.playerGender ?? "female");
      setScreen(data.screen);
      setFirstChoice(data.firstChoice);
      setOpeningResolved(data.openingResolved);
      setWeek(data.week);
      setSchedule(data.schedule ?? []);
      setPlayerStats({
        ...data.playerStats,
        problemSpeed: data.playerStats.problemSpeed ?? 18,
        slackDependence: data.playerStats.slackDependence ?? 0,
        experimentModules:
          data.playerStats.experimentModules ?? {
            module1: data.playerStats.experiment ?? 0,
            module2: data.playerStats.experiment ?? 0,
            module3: data.playerStats.experiment ?? 0,
            module4: data.playerStats.experiment ?? 0,
          },
        supplementaryBookStudy: {
          ...defaultSupplementaryBookStudy(),
          ...(data.playerStats.supplementaryBookStudy ?? {}),
        },
      });
      setWeekRecords(data.weekRecords ?? []);
      setCurrentWeekMoments(data.currentWeekMoments ?? []);
      setPendingWeekReview(data.pendingWeekReview ?? null);
      setSelectedBookId(data.selectedBookId ?? textbooks[0].id);
      setSelectedModule(data.selectedModule ?? "module1");
      // 读档后统一回到周计划，避免玩家被恢复在小卖部或对手页而误以为进度丢失。
      setCareerTab("planner");
      setPendingEvent(data.pendingEvent ?? null);
      setEventChoice(data.eventChoice ?? null);
      setEventResultNotice(
        data.eventResultNotice
          ? {
              ...data.eventResultNotice,
              choice: data.eventResultNotice.choice ?? "已记录的选择",
            }
          : null,
      );
      setResolvedEvents(data.resolvedEvents ?? []);
      setStoryTags(data.storyTags ?? []);
      setActionCounts(data.actionCounts ?? {});
      setCurrentWeekUses(data.currentWeekUses ?? {});
      setCurrentWeekUseWeek(data.currentWeekUseWeek ?? data.week ?? 1);
      setChocolateStreak(data.chocolateStreak ?? 0);
      setLastChocolateWeek(data.lastChocolateWeek ?? 0);
      const loadedPendingAssessment = data.pendingAssessment?.provincialAttempt
        ? (() => {
            const migrated = normalizeProvincialAttemptScoreScale(
              data.pendingAssessment.provincialAttempt,
            );
            return {
              ...data.pendingAssessment,
              provincialAttempt: migrated,
              subjects: migrated.breakdown.map((section) => ({
                name: section.name,
                score: section.score,
                maxScore: section.maxScore,
                note: `回忆正确 ${section.correct}/${section.total} · 得分率 ${formatNumber(section.rate)}%`,
              })),
            };
          })()
        : (data.pendingAssessment ?? null);
      setPendingAssessment(loadedPendingAssessment);
      setAssessmentChoice(data.assessmentChoice ?? null);
      setQueuedEvent(data.queuedEvent ?? null);
      setProvincialAttempts(
        (data.provincialAttempts ?? []).map(normalizeProvincialAttemptScoreScale),
      );
      setNationalAttempts(
        (data.nationalAttempts ?? []).map((attempt: NationalAttempt) => ({
          ...attempt,
          namedResults: attempt.namedResults ?? [],
        })),
      );
      const loadedTags: string[] = data.storyTags ?? [];
      const secondAttemptFinishedOutsideTeam =
        loadedTags.includes("第2次省赛-最终名单确认") &&
        !loadedTags.includes("第2次省赛-进入省队") &&
        !loadedTags.includes("已退赛");
      setRetirementFlow(
        secondAttemptFinishedOutsideTeam
          ? {
              stage: "second-failure",
              step: 0,
              resumeWeek: data.week ?? 1,
              initiatedBy: "eligibility",
            }
          : (data.retirementFlow ?? null),
      );
      setRetirementChoice(data.retirementChoice ?? null);
      setRetirementStageCompleted(data.retirementStageCompleted ?? null);
      setRetirementCooldownUntil(data.retirementCooldownUntil ?? 0);
      setRetirementAttemptCount(data.retirementAttemptCount ?? 0);
      setActiveTeamSize(data.activeTeamSize ?? 0);
      const restoredRetiredIds: string[] = data.retiredRivalIds ?? [];
      setRetiredRivalIds(restoredRetiredIds);
      setRetiredRivalWeeks(
        data.retiredRivalWeeks ??
          Object.fromEntries(restoredRetiredIds.map((rivalId) => [rivalId, data.week ?? 1])),
      );
      setRivalRelationships(
        Object.fromEntries(
          rivals
            .filter((rival) => rival.scope.startsWith("school"))
            .map((rival) => [
              rival.id,
              normalizeRelationship(
                data.rivalRelationships?.[rival.id],
                data.seed,
                rival.id,
              ),
            ]),
        ),
      );
      setInventory(data.inventory ?? {});
      setKeepsakes(data.keepsakes ?? {});
      setKeepsakeOpen(false);
      setSelectedKeepsakeId(null);
      setKeepsakeToast(null);
      setWeeklyBonusPoints(data.weeklyBonusPoints ?? 0);
      setWeeklyStudyBoost(data.weeklyStudyBoost ?? 0);
      setStoreNotice(data.storeNotice ?? null);
      setAllowanceRequestOpen(data.allowanceRequestOpen ?? false);
      setAllowanceChoice(data.allowanceChoice ?? null);
      setAllowanceRequestCount(data.allowanceRequestCount ?? 0);
      setAllowanceNotice(data.allowanceNotice ?? null);
      setPostCareerInput(data.postCareerInput ?? null);
      setPostCareerState(data.postCareerState ?? null);
      const restoredAchievements = { ...(data.unlockedAchievements ?? {}) };
      const restoredTags: string[] = data.storyTags ?? [];
      if (!restoredTags.some((tag) => tag.endsWith("省赛-进入省队"))) {
        delete restoredAchievements["province-upset"];
      }
      if (!restoredTags.some((tag) => tag.endsWith("省赛-省一等奖"))) {
        delete restoredAchievements["province-one"];
      }
      setUnlockedAchievements(restoredAchievements);
      setMistakeBook(data.mistakeBook ?? {});
      setRealQuestionMode(data.realQuestionMode ?? false);
      setSaveNotice(`已读取：第 ${data.week} 周`);
      setSaveManagerOpen(false);
    } catch {
      setSaveNotice("存档读取失败：这份存档可能来自不兼容的旧版本。");
    }
  };

  useEffect(() => {
    refreshSaveSlots();
    try {
      const raw = window.localStorage.getItem(achievementKey);
      if (raw) setUnlockedAchievements(JSON.parse(raw));
    } catch {
      // 成就元数据损坏时从空记录开始，不影响主存档。
    }
    try {
      const rawArchive = window.localStorage.getItem(endingArchiveKey);
      if (rawArchive) setEndingArchive(JSON.parse(rawArchive));
    } catch {
      // 档案损坏不影响当前游戏。
    }
    setAchievementHydrated(true);
  }, []);

  useEffect(() => {
    if (screen !== "postcareer" || postCareerState?.stage !== "ending" || !postCareerState.ending)
      return;
    const id = `${seed}-${postCareerState.ending.subtitle}-${postCareerState.admission?.school ?? "none"}`;
    setEndingArchive((current) => {
      if (current.some((record) => record.id === id)) return current;
      const next = [
        {
          id,
          seed,
          name,
          endingTitle: postCareerState.ending!.subtitle,
          futureTitle: postCareerState.ending!.futureTitle,
          admission: postCareerState.admission?.school,
          route: postCareerState.admission?.routeLabel,
          gaokao: postCareerState.gaokao?.total,
          nationalRank: postCareerInput?.nationalRank,
          recordedAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 60);
      window.localStorage.setItem(endingArchiveKey, JSON.stringify(next));
      return next;
    });
  }, [screen, postCareerState, postCareerInput, seed, name]);

  useEffect(() => {
    if (!achievementHydrated) return;
    window.localStorage.setItem(
      achievementKey,
      JSON.stringify(unlockedAchievements),
    );
  }, [achievementHydrated, unlockedAchievements]);

  useEffect(() => {
    if (!achievementToast) return;
    const timer = window.setTimeout(() => setAchievementToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [achievementToast]);

  useEffect(() => {
    if (!playerStats || achievementToast) return;
    if (!["week", "postcareer"].includes(screen)) return;
    if (screen === "week" && (pendingEvent || pendingAssessment || retirementFlow))
      return;
    const latestNational = [...nationalAttempts]
      .sort((a, b) => b.attemptNumber - a.attemptNumber)
      .find((attempt) => attempt.finalRank !== null);
    const moduleAverage =
      (playerStats.module1 +
        playerStats.module2 +
        playerStats.module3 +
        playerStats.module4) /
      4;
    const enteredTeamWithLowAverage = [1, 2].some(
      (attempt) =>
        storyTags.includes(`第${attempt}次省赛-进入省队`) && moduleAverage < 65,
    );
    const conditions: Record<string, boolean> = {
      "first-week": week > 1,
      "book-half": Object.values(playerStats.bookStudy).some(
        (book) => book.course >= 40,
      ),
      "notes-complete": Object.values(playerStats.bookStudy).some(
        (book) => book.notes >= 99,
      ),
      library:
        playerStats.san < 50 &&
        Object.values(playerStats.bookStudy).every((book) => book.course >= 70),
      shawshank:
        storyTags.includes("逆势退赛完成"),
      "province-upset": enteredTeamWithLowAverage,
      "province-one":
        storyTags.includes("第1次省赛-省一等奖") ||
        storyTags.includes("第2次省赛-省一等奖"),
      "national-lab": nationalAttempts.some(
        (attempt) => attempt.qualifiedForExperiment,
      ),
      "training-team": (latestNational?.finalRank ?? 999) <= 50,
      "national-five": Boolean(postCareerState?.nationalSelection.selected),
      "international-medal": ["金牌", "银牌", "铜牌"].includes(
        postCareerState?.nationalSelection.internationalMedal ?? "",
      ),
      "gaokao-600": (postCareerState?.gaokao?.total ?? 0) >= 600,
      "gaokao-650": (postCareerState?.gaokao?.total ?? 0) >= 650,
      "ordinary-strong":
        postCareerState?.admission?.routeLabel === "普通强基计划",
      "exceptional-strong":
        postCareerState?.admission?.routeLabel === "竞赛破格强基",
      recommendation:
        postCareerState?.admission?.routeLabel === "国家集训队保送",
      "early-return":
        Boolean(postCareerInput?.retired) &&
        (postCareerInput?.retiredWeek ?? 999) <= 16 &&
        ["second-review", "mock2", "gaokao", "admission", "ending"].includes(
          postCareerState?.stage ?? "",
        ),
      pause:
        postCareerState?.ending?.subtitle.includes("休学结局") ?? false,
      withdrawal:
        postCareerState?.ending?.subtitle.includes("退学结局") ?? false,
    };
    Object.assign(
      conditions,
      communityAchievementConditions({
        week,
        stats: playerStats,
        storyTags,
        actionCounts,
        currentWeekUses,
        chocolateStreak,
        weekRecords,
        provincialAttempts,
        nationalAttempts,
        activeTeamSize,
        relationships: rivalRelationships,
        unlocked: unlockedAchievements,
        postCareer: postCareerState,
      }),
    );
    conditions.faust = achievementDefinitions
      .filter((achievement) => achievement.id !== "faust")
      .every((achievement) => Boolean(unlockedAchievements[achievement.id]));
    const unlocked = achievementDefinitions.find(
      (achievement) =>
        conditions[achievement.id] && !unlockedAchievements[achievement.id],
    );
    if (!unlocked) return;
    setUnlockedAchievements((current) => ({
      ...current,
      [unlocked.id]: `${new Date().toISOString()}|${week}`,
    }));
    setAchievementToast(unlocked);
  }, [
    achievementToast,
    actionCounts,
    activeTeamSize,
    currentWeekUses,
    chocolateStreak,
    nationalAttempts,
    playerStats,
    postCareerInput,
    postCareerState,
    provincialAttempts,
    pendingAssessment,
    pendingEvent,
    retirementFlow,
    rivalRelationships,
    screen,
    storyTags,
    unlockedAchievements,
    week,
  ]);

  useEffect(() => {
    if (!playerStats || screen === "origin" || screen === "profile") return;
    const timer = window.setTimeout(() => saveGame(true), 250);
    return () => window.clearTimeout(timer);
  }, [
    week,
    screen,
    playerStats,
    pendingEvent,
    pendingAssessment,
    retirementFlow,
    schedule,
    postCareerState,
    keepsakes,
  ]);

  const randomize = () => {
    setSeed(makeSeed());
    setSelectedId(origins[Math.floor(Math.random() * origins.length)].id);
  };

  const startCareer = () => {
    const startingUnlocked = regularUnlockedScore(1);
    setPlayerStats({
      module1: 0,
      module2: 0,
      module3: 0,
      module4: 0,
      reasoning: 4,
      problemSpeed: 16,
      experiment: 0,
      experimentUnlocked: false,
      experimentModules: {
        module1: 0,
        module2: 0,
        module3: 0,
        module4: 0,
      },
      social: selected.stats.social,
      mindset: selected.stats.resilience,
      academics: round1(startingUnlocked * (selected.stats.academics / 100)),
      san: selected.stats.san,
      pocketMoney: selected.stats.pocketMoney,
      coachFavor: 0,
      peerFavor: 10,
      familySupport: selected.stats.familySupport,
      regularNeglectWeeks: 0,
      competitionNeglectWeeks: 0,
      slackDependence: 0,
      bookStudy: Object.fromEntries(
        textbooks.map((book) => [
          book.id,
          {
            course: 0,
            notes: 0,
            practice: 0,
            retention: 100,
            lectureSessions: 0,
            lastStudiedWeek: 0,
          },
        ]),
      ),
      supplementaryBookStudy: defaultSupplementaryBookStudy(),
    });
    setFirstChoice(null);
    setOpeningResolved(false);
    setWeek(1);
    setSchedule([]);
    setWeekRecords([]);
    setCurrentWeekMoments([]);
    setPendingWeekReview(null);
    setCareerTab("planner");
    setSelectedModule("module1");
    setSelectedBookId(textbooks[0].id);
    setPendingEvent(null);
    setEventChoice(null);
    setEventResultNotice(null);
    setResolvedEvents([]);
    setStoryTags([`origin:${selected.id}`]);
    setActionCounts({});
    setCurrentWeekUses({});
    setCurrentWeekUseWeek(1);
    setChocolateStreak(0);
    setLastChocolateWeek(0);
    setPendingAssessment(null);
    setAssessmentChoice(null);
    setQueuedEvent(null);
    setProvincialAttempts([]);
    setNationalAttempts([]);
    setRetirementFlow(null);
    setRetirementChoice(null);
    setRetirementStageCompleted(null);
    setRetirementCooldownUntil(0);
    setRetirementAttemptCount(0);
    setActiveTeamSize(generated.schoolTeamSize);
    setRetiredRivalIds([]);
    setRetiredRivalWeeks({});
    setKeepsakes({});
    setKeepsakeOpen(false);
    setSelectedKeepsakeId(null);
    setKeepsakeToast(null);
    setRivalRelationships(
      Object.fromEntries(
        rivals
          .filter((rival) => rival.scope.startsWith("school"))
          .map((rival) => [
            rival.id,
            defaultRelationship(seed, rival.id),
          ]),
      ),
    );
    setInventory({});
    setWeeklyBonusPoints(0);
    setWeeklyStudyBoost(0);
    setStoreNotice(null);
    setAllowanceRequestOpen(false);
    setAllowanceChoice(null);
    setAllowanceRequestCount(0);
    setAllowanceNotice(null);
    setPostCareerInput(null);
    setPostCareerState(null);
    setSelectedSupplementaryBookId(null);
    setRealQuestionMode(false);
    setRealQuestionSession(null);
    setMistakeBook({});
    setAchievementOpen(false);
    setAchievementToast(null);
    setScreen("week");
  };

  const confirmOpening = () => {
    const choice = openingEvent.choices.find((item) => item.id === firstChoice);
    if (!choice || !playerStats) return;
    setPlayerStats(applyEffects(playerStats, choice.effects));
    const choiceTags = [...(choice.effects.tags ?? [])];
    if (
      choiceTags.some((tag) => tag.endsWith("省赛-进入省队")) &&
      Object.values(rivalRelationships).some(
        (relation) => relation.route === "friend" && relation.bond >= 42,
      )
    ) {
      choiceTags.push("挚友一同进入省队");
    }
    if (choiceTags.length) {
      setStoryTags((current) => [...new Set([...current, ...choiceTags])]);
    }
    setCurrentWeekMoments([
      {
        kind: "opening",
        title: openingEvent.title,
        choice: choice.title,
        result: choice.result,
        effects: choice.effects,
      },
    ]);
    setOpeningResolved(true);
    setEventResultNotice({
      title: openingEvent.title,
      choice: choice.title,
      result: choice.result,
      effects: choice.effects,
    });
  };

  const calendar = calendarFor(generated.firstYear, week);
  const weekPhase = getWeekPhase(
    week,
    selected.stats.schoolSupport,
    calendar,
    storyTags,
  );
  const usedTime = schedule.reduce((total, action) => total + action.cost, 0);
  const activePartnerEntry = Object.entries(rivalRelationships).find(
    ([, relation]) => relation.route === "dating",
  );
  const bestFriendEntry = Object.entries(rivalRelationships)
    .filter(([, relation]) => relation.route === "friend")
    .sort(([, a], [, b]) => b.bond - a.bond)[0];
  const relationshipName = (rivalId?: string) => {
    const rival = rivals.find((item) => item.id === rivalId);
    return rival ? seededRivalIdentity(rival, seed).name : "";
  };
  const relationshipTimeCost = activePartnerEntry && week % 2 === 0 ? 1 : 0;
  const totalFreePoints = Math.max(
    0,
    weekPhase.freePoints + weeklyBonusPoints - relationshipTimeCost,
  );
  const remainingTime = totalFreePoints - usedTime;

  const keepsakeContext = useMemo<KeepsakeContext>(
    () => ({
      week,
      storyTags,
      resolvedEvents,
      actionCounts,
      inventory,
      experimentUnlocked: playerStats?.experimentUnlocked ?? false,
      experiment: playerStats?.experiment ?? 0,
      experimentModules: playerStats
        ? Object.values(playerStats.experimentModules)
        : [],
      retiredRivalCount: retiredRivalIds.length,
      relationships: Object.values(rivalRelationships).map((relationship) => ({
        route: relationship.route,
        bond: relationship.bond,
        trust: relationship.trust,
      })),
      provincialAttempts,
      nationalAttempts,
      postCareer: postCareerState
        ? {
            stage: postCareerState.stage,
            admissionRoute: postCareerState.admission?.routeLabel,
            gaokaoTotal: postCareerState.gaokao?.total,
            nationalSelected: postCareerState.nationalSelection.selected,
            internationalMedal:
              postCareerState.nationalSelection.internationalMedal,
          }
        : undefined,
    }),
    [
      actionCounts,
      inventory,
      nationalAttempts,
      playerStats,
      postCareerState,
      provincialAttempts,
      resolvedEvents,
      retiredRivalIds.length,
      rivalRelationships,
      storyTags,
      week,
    ],
  );

  useEffect(() => {
    if (!playerStats || ["origin", "profile"].includes(screen)) return;
    const newlyUnlocked = newlyUnlockedKeepsakes(keepsakeContext, keepsakes);
    if (!newlyUnlocked.length) return;
    const acquiredAt = new Date().toISOString();
    setKeepsakes((current) => ({
      ...current,
      ...Object.fromEntries(
        newlyUnlocked.map((keepsake) => [
          keepsake.id,
          { acquiredWeek: week, acquiredAt },
        ]),
      ),
    }));
    const reward = newlyUnlocked.reduce<GameEffect>((total, keepsake) => {
      Object.entries(keepsake.reward ?? {}).forEach(([key, value]) => {
        if (typeof value !== "number") return;
        const numericEffects = total as Record<string, number | undefined>;
        numericEffects[key] = (numericEffects[key] ?? 0) + value;
      });
      return total;
    }, {});
    if (Object.keys(reward).length) {
      setPlayerStats((current) => (current ? applyEffects(current, reward) : current));
    }
    setKeepsakeToast({ id: newlyUnlocked[0].id, count: newlyUnlocked.length });
  }, [keepsakeContext, keepsakes, playerStats, screen, week]);

  useEffect(() => {
    if (!keepsakeToast) return;
    const timer = window.setTimeout(() => setKeepsakeToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [keepsakeToast]);

  useEffect(() => {
    if (!pendingEvent) return;
    captureStoryEvent(pendingEvent, storyNpcNames);
    const customized = applyStoryTextOverride(
      pendingEvent,
      loadStoryTextOverrides(),
      storyNpcNames,
    );
    if (JSON.stringify(customized) === JSON.stringify(pendingEvent)) return;
    const timer = window.setTimeout(() => setPendingEvent(customized), 0);
    return () => window.clearTimeout(timer);
  }, [pendingEvent, storyNpcNames]);

  const addAction = (action: WeeklyAction) => {
    if (!playerStats) return;
    let plannedAction = action;
    if (action.id === "slack-off") {
      const scheduledSlack = schedule.filter(
        (item) => item.id === "slack-off",
      ).length;
      const projection = slackProjection(playerStats, scheduledSlack);
      plannedAction = {
        ...action,
        cost: projection.cost,
        effects: {
          ...action.effects,
          san: projection.san,
          mindset: projection.mindset,
        },
      };
    }
    if (plannedAction.cost > remainingTime) return;
    if (plannedAction.bookEffect?.mode === "lecture") {
      const bookEffect = plannedAction.bookEffect;
      const book = textbooks.find(
        (item) => item.id === bookEffect.bookId,
      );
      const currentSessions =
        playerStats.bookStudy[bookEffect.bookId]?.lectureSessions ?? 0;
      const scheduledSessions = schedule.reduce(
        (total, item) =>
          total +
          (item.bookEffect?.bookId === bookEffect.bookId
            ? (item.bookEffect.lectureSession ?? 0)
            : 0),
        0,
      );
      if (
        !book ||
        currentSessions + scheduledSessions >= book.maxLectureSessions
      )
        return;
    }
    const scheduledMoney = schedule.reduce(
      (total, item) => total + (item.effects.pocketMoney ?? 0),
      0,
    );
    if (
      (plannedAction.effects.pocketMoney ?? 0) < 0 &&
      playerStats.pocketMoney +
        scheduledMoney +
        (plannedAction.effects.pocketMoney ?? 0) <
        0
    )
      return;
    if (plannedAction.id.startsWith("rival-study-")) {
      const rivalId = plannedAction.id.replace("rival-study-", "");
      const relation = normalizeRelationship(rivalRelationships[rivalId], seed, rivalId);
      if (relation.route === "broken-up" && !relation.reunionUsed) {
        const identity = seededRivalIdentity(rivals.find((item) => item.id === rivalId)!, seed);
        const reunion = attemptRelationshipReunion(relation, identity.personalityKey, seed, week);
        setRivalRelationships((current) => ({ ...current, [rivalId]: reunion.relation }));
        setStoreNotice(reunion.outcome === "reunited" ? `你和${identity.name}在共同学习后决定重新开始。复合只会发生一次。` : reunion.outcome === "secret-contact" ? `你和${identity.name}没有公开复合，却重新恢复了联系。被发现会带来更严重的后果。` : reunion.outcome === "ended" ? `这次共同学习没有让关系回到从前。你们都明白，断了可能就是真的断了。` : null);
      }
    }
    setSchedule((current) => [...current, plannedAction]);
    setCareerTab("planner");
  };

  const purchaseShopItem = (item: ShopItem) => {
    const price = selected.id === "wealthy-family" ? Math.ceil(item.price * 0.9) : item.price;
    if (!playerStats || playerStats.pocketMoney < price) return;
    if (!item.consumable && (inventory[item.id] ?? 0) > 0) return;
    setPlayerStats(
      applyEffects(playerStats, {
        pocketMoney: -price,
      }),
    );
    setInventory((current) => ({
      ...current,
      [item.id]: (current[item.id] ?? 0) + 1,
    }));
    if (item.purchaseTag) {
      setStoryTags((current) => [
        ...new Set([
          ...current,
          item.purchaseTag!,
          `tag-week:${item.purchaseTag!}:${week}`,
        ]),
      ]);
    }
    setActionCounts((current) => ({
      ...current,
      [`shop:${item.id}`]: (current[`shop:${item.id}`] ?? 0) + 1,
    }));
    setStoreNotice(
      `买下了「${item.name}」。${item.flavor}`,
    );
  };

  const useShopItem = (item: ShopItem) => {
    if (!playerStats || !item.consumable || (inventory[item.id] ?? 0) <= 0)
      return;
    const usedThisWeek =
      currentWeekUseWeek === week ? (currentWeekUses[item.id] ?? 0) : 0;
    const weeklySingleUse = [
      "coffee",
      "chocolate",
      "energy-drink",
      "hardback-notebook",
      "mint",
      "earplugs",
      "shared-snack",
    ].includes(item.id);
    if (weeklySingleUse && usedThisWeek >= 1) {
      setStoreNotice(`「${item.name}」本周已经生效。继续使用不会得到额外收益。`);
      return;
    }
    if ((item.bonusActionPoints ?? 0) > 0 && weeklyBonusPoints >= 2) {
      setStoreNotice("本周从补给中获得的额外行动点已经达到上限。再喝只会增加负担。");
      return;
    }
    setInventory((current) => {
      const next = { ...current };
      const remaining = Math.max(0, (current[item.id] ?? 0) - 1);
      if (remaining === 0) delete next[item.id];
      else next[item.id] = remaining;
      return next;
    });
    setPlayerStats(applyEffects(playerStats, item.effects ?? {}));
    if (item.bonusActionPoints) {
      setWeeklyBonusPoints((current) =>
        Math.min(2, current + item.bonusActionPoints!),
      );
    }
    if (item.learningBoost) {
      setWeeklyStudyBoost((current) =>
        round1(Math.min(0.25, current + item.learningBoost!)),
      );
    }
    setActionCounts((current) => ({
      ...current,
      [`use:${item.id}`]: (current[`use:${item.id}`] ?? 0) + 1,
    }));
    setCurrentWeekUses((current) => ({
      ...(currentWeekUseWeek === week ? current : {}),
      [item.id]:
        (currentWeekUseWeek === week ? (current[item.id] ?? 0) : 0) + 1,
    }));
    setCurrentWeekUseWeek(week);
    if (item.id === "chocolate" && lastChocolateWeek !== week) {
      setChocolateStreak((current) =>
        lastChocolateWeek === week - 1 ? current + 1 : 1,
      );
      setLastChocolateWeek(week);
    }
    setStoreNotice(
      item.effectVisible
        ? `使用了「${item.name}」。${item.description}`
        : `使用了「${item.name}」。${item.flavor}`,
    );
  };

  const enterPostCareer = (
    stats: PlayerStats,
    retired: boolean,
    retirementLabel?: string,
    nationalRankOverride?: number | null,
  ) => {
    const latestNational = [...nationalAttempts]
      .sort((a, b) => b.attemptNumber - a.attemptNumber)[0];
    const nationalRank =
      nationalRankOverride !== undefined
        ? nationalRankOverride
        : (latestNational?.finalRank ?? latestNational?.theoryRank ?? null);
    const input: PostCareerInput = {
      seed,
      name,
      originId: selected.id,
      originAcademic: selected.stats.academics,
      retiredWeek: week,
      retired,
      retirementLabel,
      academics: stats.academics,
      reasoning: stats.reasoning,
      biologyMastery:
        (stats.module1 + stats.module2 + stats.module3 + stats.module4) / 4,
      experiment: stats.experiment,
      san: stats.san,
      mindset: stats.mindset,
      social: stats.social,
      familySupport: stats.familySupport,
      coachFavor: stats.coachFavor,
      peerFavor: stats.peerFavor,
      nationalRank,
      nationalMedal:
        nationalRank !== null
          ? nationalMedalForRank(nationalRank)
          : latestNational?.medal,
      playerGender,
      modules: [stats.module1, stats.module2, stats.module3, stats.module4],
      fantasyJoined: storyTags.includes("幻想乡:加入"),
      fantasyChats: actionCounts["fantasy-chat"] ?? 0,
      relationships: Object.entries(rivalRelationships)
        .filter(([, relation]) =>
          ["dating", "friend", "broken-up", "strained", "crush"].includes(
            relation.route,
          ),
        )
        .map(([rivalId, relation]) => ({
          name: relationshipName(rivalId),
          route: relation.route as
            | "dating"
            | "friend"
            | "broken-up"
            | "strained"
            | "crush",
          bond: relation.bond,
          trust: relation.trust,
          conflict: relation.conflict,
        })),
    };
    setPostCareerInput(input);
    setPostCareerState(createPostCareer(input));
    setSchedule([]);
    setPendingEvent(null);
    setPendingAssessment(null);
    setScreen("postcareer");
  };

  const removeAction = (index: number) => {
    setSchedule((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const allowanceOptions = [
    {
      id: "small",
      amount: 30,
      baseSupportCost: 3,
      title: "只要三十元，买点零食和咖啡",
    },
    {
      id: "medium",
      amount: 80,
      baseSupportCost: 6,
      title: "要八十元，补充一周零花钱",
    },
    {
      id: "large",
      amount: 150,
      baseSupportCost: 10,
      title: "要一百五十元，解释最近确实需要",
    },
  ];

  const allowanceProjection = (
    option: (typeof allowanceOptions)[number],
    stats: PlayerStats,
  ) => {
    const repetitionMultiplier = Math.min(1.8, 1 + allowanceRequestCount * 0.1);
    const originChance =
      selected.id === "wealthy-family"
        ? 0.14
        : selected.id === "coach-family"
          ? 0.05
          : selected.id === "county-school"
            ? -0.05
            : 0;
    return {
      supportCost: round1(option.baseSupportCost * repetitionMultiplier),
      successChance: clamp(
        0.38 + stats.familySupport / 130 - option.amount / 520 -
          allowanceRequestCount * 0.06 + originChance +
          (1 - generated.familyProfile.moneyFactor) * 0.08,
        0.15,
        0.94,
      ),
    };
  };

  const resolveAllowanceRequest = () => {
    if (!allowanceRequestOpen || !allowanceChoice || !playerStats) return;
    if (allowanceChoice === "cancel") {
      setAllowanceRequestOpen(false);
      setAllowanceChoice(null);
      return;
    }
    const option = allowanceOptions.find((item) => item.id === allowanceChoice);
    if (!option) return;
    const { supportCost, successChance } = allowanceProjection(option, playerStats);
    const succeeded =
      seededUnit(
        `${seed}-allowance-${week}-${allowanceRequestCount}-${option.id}`,
      ) < successChance;
    setPlayerStats(
      applyEffects(playerStats, {
        pocketMoney: succeeded ? option.amount : 0,
        familySupport: succeeded ? -supportCost : -supportCost * 0.4,
        san: succeeded ? 0.5 : -1.5,
        mindset: succeeded ? 0 : -0.5,
      }),
    );
    setStoryTags((current) => [
      ...new Set([
        ...current,
        succeeded ? "父母追加零花钱" : "向父母要钱被拒",
      ]),
    ]);
    setAllowanceRequestCount((current) => current + 1);
    const feedbackIndex = hashSeed(`${seed}-allowance-copy-${week}-${allowanceRequestCount}`) % 3;
    const successCopies = [
      `手机震了一下：父母转来了 ¥${option.amount}，随后问你咖啡是不是已经成了固定开销。`,
      `父母答应了这次申请，¥${option.amount} 到账；他们让你下次把最近的消费一起说清楚。`,
      `钱转了过来。父母没有追问每一项用途，只提醒你别把疲惫全靠零食和咖啡顶过去。`,
    ];
    const failureCopies = [
      "父母没有转钱。他们认为现有零花钱应该够用，并让你先说清楚上一次花在了哪里。",
      "消息停在“再说吧”。晚饭时父母提起最近的考试，显然这次申请没有通过。",
      "申请被拒绝了。父母没有否定竞赛支出，但把个人消费和培训费用分得很清楚。",
    ];
    setAllowanceNotice((succeeded ? successCopies : failureCopies)[feedbackIndex]);
    setAllowanceRequestOpen(false);
    setAllowanceChoice(null);
  };

  const settleWeek = () => {
    if (!playerStats || remainingTime !== 0) return;
    const adjusted = adjustedWeeklyEffects(
      schedule,
      playerStats,
      seed,
      week,
      weeklyStudyBoost + relationshipLearningBoost(rivalRelationships),
      selected.id,
    );
    const fixedEffects = weekPhase.fixed.reduce<GameEffect>((total, item) => {
      effectLabels.forEach(([key]) => {
        const amount = item.effects[key];
        if (typeof amount === "number") {
          const adjustedAmount =
            amount > 0 && learningKeys.includes(key)
              ? amount *
                adjusted.learningFactor *
                (item.coachBonus ?? 1)
              : key === "san" && amount < 0
                ? amount * mindsetSanCostMultiplier(playerStats.mindset)
              : amount;
          total[key] = round1(
            ((total[key] as number | undefined) ?? 0) + adjustedAmount,
          );
        }
      });
      return total;
    }, {});
    const scheduledEffects = adjusted.effects;
    const effects = { ...fixedEffects };
    if (activePartnerEntry) {
      effects.san = round1((effects.san ?? 0) - 0.4);
    }
    effectLabels.forEach(([key]) => {
      const amount = scheduledEffects[key];
      if (typeof amount === "number") {
        effects[key] = ((effects[key] as number | undefined) ?? 0) + amount;
      }
    });
    const monthlyPocketMoney =
      week % 4 === 0 ? selected.stats.monthlyPocketMoney : 0;
    if (monthlyPocketMoney > 0) {
      effects.pocketMoney = round1(
        (effects.pocketMoney ?? 0) + monthlyPocketMoney,
      );
    }
    if (!weekPhase.isLeave) {
      const competitionLoad = schedule
        .filter((action) => action.category === "study")
        .reduce((total, action) => total + action.cost, 0);
      const regularDecay =
        week <= 10
          ? 0.35
          : round1(
              Math.min(
                2.4,
                (weekPhase.isTraining ? 1.6 : 0.85) +
                  competitionLoad * 0.16 +
                  playerStats.regularNeglectWeeks * 0.07,
              ),
            );
      effects.academics = round1((effects.academics ?? 0) - regularDecay);
    }
    const nextStats = applyEffects(playerStats, effects);
    nextStats.regularNeglectWeeks = schedule.some(
      (action) => action.id === "regular-study",
    )
      ? 0
      : playerStats.regularNeglectWeeks + 1;
    nextStats.competitionNeglectWeeks = schedule.some(
      (action) => action.category === "study",
    )
      ? 0
      : playerStats.competitionNeglectWeeks + 1;
    const isNationalPreparationWeek =
      (storyTags.includes("第1次省赛-进入省队") &&
        week > calendar.firstExamWeek &&
        week <= calendar.firstNationalWeek) ||
      (storyTags.includes("第2次省赛-进入省队") &&
        week > calendar.secondExamWeek &&
        week <= calendar.secondNationalWeek);
    if (
      !isNationalPreparationWeek &&
      week % 2 === 0 &&
      nextStats.regularNeglectWeeks >= 4
    ) {
      const regularTrustLoss =
        (generated.familyProfile.key === "anxious" ? 0.55 : 0.35) *
        generated.familyProfile.volatility;
      nextStats.familySupport = round1(
        clamp(nextStats.familySupport - regularTrustLoss),
      );
    }
    if (
      week % 3 === 0 &&
      nextStats.competitionNeglectWeeks >= 4 &&
      ["anxious", "results"].includes(generated.familyProfile.key)
    ) {
      nextStats.familySupport = round1(
        clamp(nextStats.familySupport - 0.35 * generated.familyProfile.volatility),
      );
    }
    const slackCount = schedule.filter(
      (action) => action.id === "slack-off",
    ).length;
    const healthyRest = schedule.some((action) => action.id === "recovery");
    nextStats.slackDependence = round1(
      clamp(
        playerStats.slackDependence +
          slackCount * 1.1 -
          (slackCount === 0 && healthyRest ? 0.7 : 0),
        0,
        12,
      ),
    );
    if (nextStats.slackDependence >= 6 && slackCount > 0) {
      nextStats.san = round1(clamp(nextStats.san - 1.2));
      nextStats.mindset = round1(clamp(nextStats.mindset - 0.8));
    }
    if (week >= 29) nextStats.experimentUnlocked = true;
    if (weekPhase.isLeave) {
      const formal =
        storyTags.includes("正式停课") || storyTags.includes("统一停课");
      nextStats.academics = round1(
        nextStats.academics * (formal ? 0.96 : 0.98),
      );
    }
    nextStats.academics = round1(
      Math.min(nextStats.academics, regularUnlockedScore(week) * 1.03),
    );
    if (nextStats.san < 45) {
      const mindsetLoss =
        (45 - nextStats.san) / 14 + (nextStats.san < 25 ? 1.5 : 0);
      nextStats.mindset = round1(clamp(nextStats.mindset - mindsetLoss));
    }
    if (nextStats.coachFavor <= -10) {
      nextStats.san = round1(clamp(nextStats.san - 1));
      nextStats.mindset = round1(clamp(nextStats.mindset - 0.5));
    }
    if (nextStats.peerFavor <= 8) {
      nextStats.san = round1(clamp(nextStats.san - 1.2));
      nextStats.mindset = round1(clamp(nextStats.mindset - 0.6));
    }
    const assessmentItem = weekPhase.fixed.find((item) => item.assessment);
    if (
      assessmentItem?.assessment?.type === "school" &&
      regularCoverage(nextStats, week) < 0.58
    ) {
      const gap = 0.58 - regularCoverage(nextStats, week);
      nextStats.san = round1(clamp(nextStats.san - gap * 22));
      nextStats.mindset = round1(clamp(nextStats.mindset - gap * 15));
    }
    const updatedBooks = updateBookStudy(
      playerStats.bookStudy,
      schedule,
      weekPhase.fixed,
      adjusted.learningFactor,
      week,
      nextStats.competitionNeglectWeeks,
    );
    const nextSupplementaryBooks = Object.fromEntries(
      Object.entries(playerStats.supplementaryBookStudy).map(([bookId, state]) => {
        const nextState = { ...state };
        const idleWeeks = state.lastStudiedWeek ? week - state.lastStudiedWeek : 0;
        if (state.unlocked && idleWeeks > 2) {
          nextState.retention = round1(Math.max(18, state.retention * (state.mastery >= 70 ? 0.95 : 0.965)));
        }
        return [bookId, nextState];
      }),
    ) as Record<string, SupplementaryBookState>;
    schedule.forEach((action) => {
      const effect = action.supplementaryBookEffect;
      if (!effect) return;
      const state = nextSupplementaryBooks[effect.bookId];
      if (!state?.unlocked) return;
      const softCap = state.mastery < 55 ? 1 : state.mastery < 75 ? 0.55 : state.mastery < 88 ? 0.26 : 0.1;
      state.mastery = round1(Math.min(94, state.mastery + effect.mastery * adjusted.learningFactor * softCap));
      state.retention = round1(clamp(state.retention + effect.retention * adjusted.learningFactor));
      state.lastStudiedWeek = week;
    });
    nextStats.supplementaryBookStudy = nextSupplementaryBooks;
    const nextExperimentModules = { ...playerStats.experimentModules };
    schedule.forEach((action) => {
      if (!action.experimentModule) return;
      const moduleKey = action.experimentModule;
      const current = nextExperimentModules[moduleKey];
      const theory = weightedModuleProgress(updatedBooks.next, moduleKey);
      const softCap =
        current < 55 ? 1 : current < 72 ? 0.58 : current < 84 ? 0.3 : 0.12;
      const gain =
        (3.4 + theory * 0.032) *
        (0.8 + nextStats.reasoning * 0.0025) *
        adjusted.learningFactor *
        softCap + supplementaryExperimentBonus(nextSupplementaryBooks, moduleKey) * 0.035;
      nextExperimentModules[moduleKey] = round1(
        Math.min(92, current + gain),
      );
      textbooks
        .filter((book) => book.module === moduleKey)
        .forEach((book) => {
          const state = updatedBooks.next[book.id];
          state.course = round1(
            Math.min(94, state.course + 0.25 * adjusted.learningFactor),
          );
          state.retention = round1(
            clamp(state.retention + 1.8 * adjusted.learningFactor),
          );
          state.lastStudiedWeek = week;
        });
    });
    nextStats.experimentModules = nextExperimentModules;
    const experimentValues = Object.values(nextExperimentModules);
    const trainedExperimentAverage =
      experimentValues.reduce((total, value) => total + value, 0) /
      experimentValues.length;
    nextStats.experiment = round1(
      clamp(
        Math.max(
          nextStats.experiment,
          trainedExperimentAverage,
        ),
      ),
    );
    nextStats.bookStudy = updatedBooks.next;
    nextStats.module1 = weightedModuleProgress(updatedBooks.next, "module1");
    nextStats.module2 = weightedModuleProgress(updatedBooks.next, "module2");
    nextStats.module3 = weightedModuleProgress(updatedBooks.next, "module3");
    nextStats.module4 = weightedModuleProgress(updatedBooks.next, "module4");
    const nextCounts = { ...actionCounts };
    const incrementCount = (key: string, amount = 1) => {
      nextCounts[key] = round1((nextCounts[key] ?? 0) + amount);
    };
    schedule.forEach((action) => {
      incrementCount(action.id);
      if (action.id.startsWith("rival-study-")) incrementCount("rival-study");
      if (action.bookEffect) {
        incrementCount("book-study");
        if (action.bookEffect.mode === "practice") incrementCount("practice");
        if (
          action.bookEffect.mode === "notes" ||
          action.bookEffect.mode === "review-notes"
        )
          incrementCount("notes");
        if (action.bookEffect.mode === "lecture") incrementCount("lecture");
      }
    });
    if (weekPhase.isTraining) incrementCount("training-week");
    if (assessmentItem?.assessment?.type === "competition")
      incrementCount("competition-assessment");
    setActionCounts(nextCounts);
    const weeklyTags: string[] = [];
    const allSlack =
      schedule.length > 0 && schedule.every((action) => action.id === "slack-off");
    const extremePractice = schedule.reduce(
      (total, action) =>
        total +
        (action.bookEffect?.mode === "practice" ||
        action.id.includes("wrong-question")
          ? action.cost
          : 0),
      0,
    );
    if (allSlack) weeklyTags.push("一周全部摸鱼");
    if (extremePractice >= 4) weeklyTags.push("一周极端刷题");
    if (
      assessmentItem?.assessment?.title.includes("联赛") &&
      [nextStats.module1, nextStats.module2, nextStats.module3, nextStats.module4].every(
        (value) => value <= 30,
      )
    )
      weeklyTags.push("低掌握参加省赛");
    if (
      (nextCounts["competition-assessment"] ?? 0) >= 12 &&
      Object.values(nextStats.bookStudy).filter((book) => book.retention < 48)
        .length >= 4
    )
      weeklyTags.push("长期模考却遗忘");
    if (weeklyTags.length) {
      setStoryTags((current) => [...new Set([...current, ...weeklyTags])]);
    }
    const nextRelationships = Object.fromEntries(
      Object.entries(rivalRelationships).map(([rivalId, relation]) => [
        rivalId,
        settleRelationshipWeek(
          normalizeRelationship(relation, seed, rivalId),
          schedule.some((action) => action.id === `rival-study-${rivalId}`),
          week + 1,
        ),
      ]),
    );
    const relationshipMood = relationshipWeeklyMoodEffect(
      nextRelationships,
      week + 1,
    );
    if (relationshipMood !== 0) {
      nextStats.mindset = round1(clamp(nextStats.mindset + relationshipMood));
      effects.mindset = round1((effects.mindset ?? 0) + relationshipMood);
    }
    setRivalRelationships(nextRelationships);
    const changes = effectLabels
      .filter(([key]) => !key.startsWith("module"))
      .map(([key, label]) => ({
        label,
        value:
          typeof effects[key] === "number"
            ? Number((effects[key] as number).toFixed(1))
            : 0,
      }))
      .filter((change) => change.value !== 0);
    const completedWeekRecord: WeekRecord = {
      week,
      headline: weekHeadline(week, effects),
      changes,
      efficiency: adjusted.baseEfficiency,
      fluctuation: adjusted.fluctuation,
      sanAfter: nextStats.san,
      fixedActions: [
        ...weekPhase.fixed.map((item) => ({
          title: item.title,
          cost: item.cost,
        })),
        ...(monthlyPocketMoney > 0
          ? [
              {
                title: `本月零花钱到账 ¥${monthlyPocketMoney}`,
                cost: 0,
              },
            ]
          : []),
      ],
      chosenActions: summarizeChosenActions(schedule),
      moments: currentWeekMoments,
    };
    setPlayerStats(nextStats);
    setWeekRecords((current) => [...current, completedWeekRecord]);
    setPendingWeekReview(completedWeekRecord);
    setCurrentWeekMoments([]);
    const namedExamRivals: NamedExamRivalContext[] = [
      ...rivals.map((rival) => ({
        rival,
        name: seededRivalIdentity(rival, seed).name,
        retiredWeek: retiredRivalWeeks[rival.id],
        knownAtExam:
          week >= rival.revealWeek && nextStats.social >= rival.revealSocial,
      })),
      ...generatedCoreRivalContexts(seed, week, nextStats.social, {
        同届: generated.coreSameGrade,
        上届: generated.coreUpperGrade,
        下届: generated.coreLowerGrade,
      }),
    ];
    let provincialAttempt: ProvincialAttempt | undefined;
    let nextAttempts = provincialAttempts;
    if (assessmentItem?.assessment?.title === "全国中学生生物学联赛") {
      const attemptNumber: 1 | 2 =
        week === calendar.firstExamWeek ? 1 : 2;
      provincialAttempt = simulateProvincialExam(
        nextStats,
        seed,
        week,
        attemptNumber,
        generated,
        keepsakes["fantasy-archive-badge"] ? 1 : 0,
        namedExamRivals,
      );
      nextAttempts = [
        ...provincialAttempts.filter(
          (attempt) => attempt.attemptNumber !== attemptNumber,
        ),
        provincialAttempt,
      ];
      setProvincialAttempts(nextAttempts);
    }
    let nationalAttempt: NationalAttempt | undefined;
    let nationalStage: "theory" | "experiment" | undefined;
    let nextNationalAttempts = nationalAttempts;
    if (
      assessmentItem?.assessment?.title.includes("全国中学生生物学竞赛") &&
      assessmentItem.assessment.title.includes("理论考试")
    ) {
      const attemptNumber: 1 | 2 =
        week === calendar.firstNationalWeek ? 1 : 2;
      nationalAttempt = simulateNationalExam(
        nextStats,
        seed,
        week,
        attemptNumber,
        keepsakes["fantasy-archive-badge"] ? 1 : 0,
        namedExamRivals,
        nextAttempts.find(
          (attempt) => attempt.attemptNumber === attemptNumber,
        ),
      );
      nationalStage = "theory";
      nextNationalAttempts = [
        ...nationalAttempts.filter(
          (attempt) => attempt.attemptNumber !== attemptNumber,
        ),
        nationalAttempt,
      ];
      setNationalAttempts(nextNationalAttempts);
    } else if (
      assessmentItem?.assessment?.title.includes("全国中学生生物学竞赛") &&
      assessmentItem.assessment.title.includes("实验考试")
    ) {
      const attemptNumber: 1 | 2 =
        week === calendar.firstNationalWeek + 1 ? 1 : 2;
      nationalAttempt = nationalAttempts.find(
        (attempt) => attempt.attemptNumber === attemptNumber,
      );
      nationalStage = "experiment";
    }
    const nextCalendar = calendarFor(generated.firstYear, week + 1);
    const nextWeekPhaseForEvents = getWeekPhase(
      week + 1,
      selected.stats.schoolSupport,
      nextCalendar,
      storyTags,
    );
    let milestone = findMilestoneEvent(
      week + 1,
      nextCalendar,
      resolvedEvents,
      nextAttempts,
      nextNationalAttempts,
      storyTags,
      seed,
    );
    // 正式联赛的赛后选择，以及国赛理论出分后的实验/休息/颁奖，
    // 都在本次考试所在周连续处理，不再人为隔成后续数周。
    if (provincialAttempt) {
      milestone = makePostExamRouteEvent(provincialAttempt.attemptNumber);
    } else if (nationalAttempt && nationalStage === "theory") {
      milestone = makeTheoryNightEvent(nationalAttempt);
    }
    const randomEvent = findWeeklyEvent(
      week + 1,
      nextStats,
      seed,
      resolvedEvents,
      storyTags,
      nextCounts,
      nextWeekPhaseForEvents.isTraining,
      retiredRivalIds,
    );
    const nextStoryTags = [...new Set([...storyTags, ...weeklyTags])];
    const teammateDeparture = nextWeekPhaseForEvents.isTraining
      ? null
      : makeTeammateDepartureEvent(
          week + 1,
          seed,
          activeTeamSize,
          generated.schoolTeamSize,
          retiredRivalIds,
          nextCalendar,
          nextRelationships,
          nextStoryTags,
        );
    const familyEvent = nextWeekPhaseForEvents.isTraining
      ? null
      : makeFamilyWeeklyEvent(
          week + 1,
          seed,
          generated.familyProfile,
          nextStats,
          nextStoryTags,
          resolvedEvents,
        );
    const familyCheckpoint = nextWeekPhaseForEvents.isTraining
      ? null
      : makeFamilyCheckpointEvent(
          week + 1,
          seed,
          generated.familyProfile,
          nextStats,
          nextStoryTags,
          resolvedEvents,
          nextCalendar,
        );
    const externalDeparture = nextWeekPhaseForEvents.isTraining
      ? null
      : makeExternalDepartureEvent(
          week + 1,
          seed,
          retiredRivalIds,
          resolvedEvents,
        );
    const nextWeeksToProvincial = [
      nextCalendar.firstExamWeek,
      nextCalendar.secondExamWeek,
    ]
      .filter((examWeek) => examWeek >= week + 1)
      .map((examWeek) => examWeek - (week + 1))
      .sort((a, b) => a - b)[0];
    const relationshipStory = nextWeekPhaseForEvents.isTraining ? null : nextRelationshipStoryEvent({
      week: week + 1,
      seed,
      playerGender,
      candidates: rivals
        .filter((rival) => rival.scope === "school-peer")
        .map((rival) => {
          const identity = seededRivalIdentity(rival, seed);
          return {
            rival: {
              ...rival,
              name: identity.name,
              personality: identity.personality,
              studyStyle: identity.studyStyle,
            },
            gender: identity.gender,
            personalityKey: identity.personalityKey,
            innerConflictKey: identity.innerConflictKey,
          };
        }),
      relationships: nextRelationships,
      resolvedEvents,
      retiredRivalIds,
      storyTags: nextStoryTags,
      san: nextStats.san,
      coachFavor: nextStats.coachFavor,
      familySupport: nextStats.familySupport,
      regularPerformance: regularCoverage(nextStats, week + 1) * 100,
      competitionPerformance: (nextStats.module1 + nextStats.module2 + nextStats.module3 + nextStats.module4) / 4,
      coachStrictness: selected.stats.schoolSupport >= 80 ? "strict" : selected.stats.schoolSupport < 40 ? "hands-off" : "balanced",
    });
    const relationshipDaily = relationshipStory
      ? null
      : nextRelationshipDailyEvent({
          week: week + 1,
          seed,
          playerGender,
          candidates: rivals
            .filter((rival) => rival.scope === "school-peer")
            .map((rival) => {
              const identity = seededRivalIdentity(rival, seed);
              return {
                rival: {
                  ...rival,
                  name: identity.name,
                  personality: identity.personality,
                  studyStyle: identity.studyStyle,
                },
                gender: identity.gender,
                personalityKey: identity.personalityKey,
                innerConflictKey: identity.innerConflictKey,
              };
            }),
          relationships: nextRelationships,
          resolvedEvents,
          retiredRivalIds,
          storyTags: nextStoryTags,
          san: nextStats.san,
          coachFavor: nextStats.coachFavor,
          familySupport: nextStats.familySupport,
          isTraining: nextWeekPhaseForEvents.isTraining,
          pocketMoney: nextStats.pocketMoney,
          weeksToProvincial: nextWeeksToProvincial,
          hasNationalAttempt: nextNationalAttempts.length > 0,
        });
    const personalityDaily = relationshipStory || nextWeekPhaseForEvents.isTraining
      ? null
      : nextPersonalityDailyEvent({
          week: week + 1,
          seed,
          playerGender,
          candidates: rivals
            .filter((rival) => rival.scope === "school-peer")
            .map((rival) => {
              const identity = seededRivalIdentity(rival, seed);
              return {
                rival: {
                  ...rival,
                  name: identity.name,
                  personality: identity.personality,
                  studyStyle: identity.studyStyle,
                },
                gender: identity.gender,
                personalityKey: identity.personalityKey,
                innerConflictKey: identity.innerConflictKey,
              };
            }),
          relationships: nextRelationships,
          resolvedEvents,
          retiredRivalIds,
          storyTags: nextStoryTags,
          san: nextStats.san,
          coachFavor: nextStats.coachFavor,
          familySupport: nextStats.familySupport,
          isTraining: nextWeekPhaseForEvents.isTraining,
          pocketMoney: nextStats.pocketMoney,
          weeksToProvincial: nextWeeksToProvincial,
          hasNationalAttempt: nextNationalAttempts.length > 0,
        });
    const fantasyStory = nextFantasyStoryEvent({
      week: week + 1,
      seed,
      social: nextStats.social,
      peerFavor: nextStats.peerFavor,
      san: nextStats.san,
      slackActions: nextCounts["slack-off"] ?? 0,
      slackedThisWeek: slackCount > 0,
      slackDependence: nextStats.slackDependence,
      resolvedEvents,
      storyTags: nextStoryTags,
      activeTeamSize,
      hasNationalAttempt: nextNationalAttempts.length > 0,
    });
    const achievementStory = nextWeekPhaseForEvents.isTraining ? null : nextAchievementStoryEvent({
      week: week + 1,
      seed,
      san: nextStats.san,
      mindset: nextStats.mindset,
      experiment: nextStats.experiment,
      modules: [
        nextStats.module1,
        nextStats.module2,
        nextStats.module3,
        nextStats.module4,
      ],
      resolvedEvents,
      storyTags: nextStoryTags,
      inventory,
      actionCounts: nextCounts,
      weeksToProvincial: nextWeeksToProvincial,
    });
    const relationshipEvent =
      relationshipStory ??
      ((week + 1) % 2 === 0
        ? personalityDaily ?? relationshipDaily
        : relationshipDaily ?? personalityDaily);
    // 不再按“周数除以三”的固定轮班表决定剧情类型。每类事件先由自己的
    // 状态前置筛选，再以人生种子在当周候选中排序；重大人物节点仍优先。
    const storylineCandidates = [
      relationshipStory,
      familyEvent,
      externalDeparture,
      achievementStory,
      fantasyStory,
      relationshipEvent,
    ].filter((event): event is GameEvent => Boolean(event));
    const storylineEvent = relationshipStory ??
      [...storylineCandidates].sort(
        (left, right) =>
          seededUnit(`${seed}-storyline-${week + 1}-${right.id}`) -
          seededUnit(`${seed}-storyline-${week + 1}-${left.id}`),
      )[0];
    const supplementaryUnlockEvent = nextWeekPhaseForEvents.isTraining
      ? null
      : makeSupplementaryUnlockEvent(
          week + 1,
          seed,
          nextStats,
        );
    const nextEvent =
      milestone ?? familyCheckpoint ?? teammateDeparture ?? supplementaryUnlockEvent ?? storylineEvent ?? randomEvent;
    if (
      !retirementFlow &&
      week + 1 >= retirementCooldownUntil &&
      !storyTags.includes("已退赛")
    ) {
      const moduleAverage =
        (nextStats.module1 +
          nextStats.module2 +
          nextStats.module3 +
          nextStats.module4) /
        4;
      const regularRate = regularCoverage(nextStats, week + 1);
      const firstProvincialFailed = [
        "省一等奖",
        "省二等奖",
        "省三等奖",
        "未获奖",
      ].some((award) => storyTags.includes(`第1次省赛-${award}`));
      const preparingForNational =
        (storyTags.includes("第1次省赛-进入省队") &&
          week + 1 <= nextCalendar.firstNationalWeek) ||
        (storyTags.includes("第2次省赛-进入省队") &&
          week + 1 <= nextCalendar.secondNationalWeek);
      const coachPressureChance =
        nextStats.coachFavor <= -18 && moduleAverage < 58
          ? 0.58
          : nextStats.coachFavor <= -10 &&
              (moduleAverage < 46 ||
                nextStats.competitionNeglectWeeks >= 4)
            ? 0.34
            : week > 16 &&
                nextStats.coachFavor <= -4 &&
                moduleAverage < 32
              ? 0.16
              : 0;
      const familyPressureChance = preparingForNational
        ? 0
        : nextStats.familySupport <= 24
          ? 0.64
          : nextStats.familySupport < 42 && regularRate < 0.5
            ? 0.4
            : firstProvincialFailed &&
                nextStats.familySupport < 58 &&
                regularRate < 0.62
              ? 0.24
              : week > 32 && regularRate < 0.32
                ? 0.18
                : 0;
      const coachPressure =
        coachPressureChance > 0 &&
        seededUnit(`${seed}-coach-forced-retire-${week}`) <
          coachPressureChance;
      const familyPressure =
        familyPressureChance > 0 &&
        seededUnit(`${seed}-family-forced-retire-${week}`) <
          familyPressureChance;
      if (coachPressure || familyPressure) {
        setStoryTags((current) => [
          ...new Set([
            ...current,
            "曾被家长或教练劝退",
            ...(coachPressure && nextStats.san < 40
              ? ["低SAN时被教练劝退"]
              : []),
          ]),
        ]);
        setRetirementFlow({
          stage: retirementStageFor(week, storyTags, nextNationalAttempts),
          step: 0,
          resumeWeek: week + 1,
          initiatedBy: coachPressure ? "coach" : "family",
        });
        setRetirementChoice(null);
      }
    }
    if (assessmentItem?.assessment) {
      const recap = generateAssessmentRecap(
          assessmentItem.assessment,
          nextStats,
          seed,
          week,
          provincialAttempt,
          nationalAttempt,
          nationalStage,
          generated.schoolAcademicStrength,
          generated.schoolParticipants,
          activeTeamSize,
        );
      setPendingAssessment(recap);
      if (
        realQuestionMode &&
        assessmentItem.assessment.type === "competition" &&
        (/全国中学生生物学联赛|历年联赛真题测试|全国中学生生物学竞赛.*理论考试/.test(assessmentItem.assessment.title))
      ) {
        const questions = drawRealQuestions(`${seed}-${week}-${assessmentItem.assessment.id}`);
        setRealQuestionSession({ context: assessmentItem.assessment.title, questions, index: 0, responses: Array(questions.length).fill(null), finished: false });
      }
      setAssessmentChoice(null);
      setQueuedEvent(nextEvent);
      setPendingEvent(null);
    } else {
      setPendingEvent(nextEvent);
      setQueuedEvent(null);
    }
    setEventChoice(null);
    setSchedule([]);
    setWeeklyBonusPoints(0);
    setWeeklyStudyBoost(0);
    setStoreNotice(null);
    setWeek((current) => current + 1);
  };

  const resolveAssessment = () => {
    if (!pendingAssessment || !assessmentChoice || !playerStats) return;
    let effects: GameEffect = {};
    if (assessmentChoice === "review") {
      effects =
        pendingAssessment.type === "competition"
          ? { reasoning: 0.7, problemSpeed: 1.4, coachFavor: 1, san: -2 }
          : { academics: 6, mindset: 0.5, san: -2.5 };
    } else if (assessmentChoice === "rank") {
      effects = { san: 1, mindset: -0.5 };
    } else {
      effects = { san: 5 };
    }
    let familyResult = 0;
    if (pendingAssessment.type === "school" && pendingAssessment.totalScore) {
      familyResult =
        pendingAssessment.totalScore >= 650
          ? 3
          : pendingAssessment.totalScore >= 600
            ? 1.8
            : pendingAssessment.totalScore >= 560
              ? 0.8
              : pendingAssessment.totalScore >= 500
                ? 0
                : pendingAssessment.totalScore >= 450
                  ? -0.8
                  : -2;
    } else if (pendingAssessment.provincialAttempt) {
      const estimated = provincialScoreRate(
        pendingAssessment.provincialAttempt.estimateHigh,
      );
      familyResult =
        estimated >= 65
          ? 2
          : estimated >= 58
            ? 0.5
            : estimated >= 48
              ? 0
              : estimated >= 40
                ? -0.8
                : -1.8;
    } else if (
      pendingAssessment.nationalAttempt &&
      pendingAssessment.nationalStage === "theory"
    ) {
      familyResult = pendingAssessment.nationalAttempt.qualifiedForExperiment
        ? 3
        : -0.8;
    } else if (
      pendingAssessment.nationalAttempt &&
      pendingAssessment.nationalStage === "experiment"
    ) {
      familyResult =
        pendingAssessment.nationalAttempt.medal === "金牌"
          ? 4
          : pendingAssessment.nationalAttempt.medal === "银牌"
            ? 2
            : 0.5;
    } else if (
      pendingAssessment.type === "competition"
    ) {
      const percentile =
        pendingAssessment.rank / Math.max(1, pendingAssessment.participants);
      familyResult =
        percentile <= 0.15
          ? 1.2
          : percentile <= 0.35
            ? 0.4
            : percentile <= 0.55
              ? 0
              : percentile <= 0.75
                ? -0.5
                : -1.2;
    }
    const familyAdjustedResult =
      familyResult < 0
        ? familyResult * generated.familyProfile.volatility
        : familyResult *
          (generated.familyProfile.key === "results" ? 1.15 : 1);
    effects.familySupport = round1(
      (effects.familySupport ?? 0) + familyAdjustedResult,
    );
    if (pendingAssessment.type === "competition") {
      const percentile =
        pendingAssessment.rank / Math.max(1, pendingAssessment.participants);
      const coachResponse =
        percentile <= 0.15
          ? 1.5
          : percentile <= 0.35
            ? 0.3
            : percentile <= 0.6
              ? -1.5
              : -3.5;
      effects.coachFavor = round1(
        (effects.coachFavor ?? 0) + coachResponse,
      );
      if (percentile > 0.6) {
        effects.san = round1((effects.san ?? 0) - 1.5);
        effects.mindset = round1((effects.mindset ?? 0) - 0.8);
      }
    }
    if (
      selected.id === "top-scorer" &&
      pendingAssessment.rank > pendingAssessment.participants * 0.45
    ) {
      effects.san = round1((effects.san ?? 0) - 2);
      effects.mindset = round1((effects.mindset ?? 0) - 1);
    }
    if (
      selected.id === "coach-family" &&
      pendingAssessment.type === "competition" &&
      pendingAssessment.rank > pendingAssessment.participants * 0.35
    ) {
      effects.familySupport = round1((effects.familySupport ?? 0) - 1.5);
      effects.san = round1((effects.san ?? 0) - 1);
    }
    if (
      selected.id === "elite-school" &&
      pendingAssessment.type === "competition" &&
      pendingAssessment.rank <= pendingAssessment.participants * 0.2
    ) {
      effects.coachFavor = round1((effects.coachFavor ?? 0) + 1.5);
    }
    if (
      selected.id === "county-school" &&
      pendingAssessment.type === "competition" &&
      pendingAssessment.rank <= pendingAssessment.participants * 0.25
    ) {
      effects.familySupport = round1((effects.familySupport ?? 0) + 1.5);
      effects.mindset = round1((effects.mindset ?? 0) + 1);
    }
    if (
      selected.id === "wealthy-family" &&
      pendingAssessment.type === "competition" &&
      pendingAssessment.rank <= pendingAssessment.participants * 0.25
    ) {
      effects.familySupport = round1((effects.familySupport ?? 0) + 2);
    }
    setPlayerStats(applyEffects(playerStats, effects));
    const assessmentChoiceLabel =
      assessmentChoice === "review"
        ? "完成复盘"
        : assessmentChoice === "rank"
          ? "只看排名"
          : "先休息";
    setWeekRecords((current) =>
      current.map((record, index) =>
        index === current.length - 1
          ? {
              ...record,
              moments: [
                ...(record.moments ?? []),
                {
                  kind: "assessment",
                  title: pendingAssessment.title,
                  choice: assessmentChoiceLabel,
                  result:
                    assessmentChoice === "review"
                      ? "你把这次考试重新拆回知识漏洞、时间分配与临场判断，完成了本次复盘。"
                      : assessmentChoice === "rank"
                        ? "你记下最终名次并收起成绩，没有在这一刻继续追查每一道失分。"
                        : "你暂时放下试卷，让情绪和身体先从考试状态中恢复。",
                  effects,
                },
              ],
            }
          : record,
      ),
    );
    setPendingAssessment(null);
    setAssessmentChoice(null);
    setPendingEvent(queuedEvent);
    setQueuedEvent(null);
  };

  const finishRealQuestionSession = () => {
    if (!realQuestionSession || !pendingAssessment) return;
    const scored = realQuestionSession.questions.map((question, index) => {
      const response = realQuestionSession.responses[index];
      return response === "abandoned" || !response ? null : scoreRealQuestion(question, response);
    });
    const counted = scored.filter((item): item is NonNullable<typeof item> => Boolean(item));
    const fraction = counted.length ? counted.reduce((sum, item) => sum + item.fraction, 0) / counted.length : 0;
    const provincialBonus = round1(fraction * 8);
    const nationalBonus = round1(fraction * 5);
    const nextRecap = { ...pendingAssessment };
    if (nextRecap.provincialAttempt) {
      const attempt = { ...nextRecap.provincialAttempt };
      attempt.rawScore = round1(clamp(attempt.rawScore + provincialBonus, 0, PROVINCIAL_MAX_SCORE));
      attempt.estimateLow = round1(clamp(attempt.estimateLow + provincialBonus, 0, PROVINCIAL_MAX_SCORE));
      attempt.estimateHigh = round1(clamp(attempt.estimateHigh + provincialBonus, 0, PROVINCIAL_MAX_SCORE));
      attempt.draftScore = round1(clamp(attempt.draftScore + provincialBonus, 0, PROVINCIAL_MAX_SCORE));
      attempt.estimateRankLow = rankAgainst(attempt.competitorScores, attempt.estimateHigh);
      attempt.estimateRankHigh = rankAgainst(attempt.competitorScores, attempt.estimateLow);
      attempt.draftRank = rankAgainst(attempt.competitorScores, attempt.draftScore);
      attempt.namedResults = attempt.namedResults.map((result) => ({
        ...result,
        rank: result.rank + (attempt.rawScore > result.score && nextRecap.provincialAttempt!.rawScore <= result.score ? 1 : 0),
      }));
      nextRecap.provincialAttempt = attempt;
      setProvincialAttempts((current) => current.map((item) => item.attemptNumber === attempt.attemptNumber ? attempt : item));
    } else if (nextRecap.nationalAttempt && nextRecap.nationalStage === "theory") {
      const original = nextRecap.nationalAttempt;
      const theoryRaw = round1(clamp(original.theoryRaw + nationalBonus));
      const competitorTheory = original.competitorTheory ?? [];
      const theoryDistribution = competitorTheory.length ? meanAndSd([...competitorTheory, theoryRaw]) : null;
      const theoryT = theoryDistribution
        ? round1(50 + ((theoryRaw - theoryDistribution.mean) / theoryDistribution.sd) * 10)
        : round1(original.theoryT + nationalBonus * 0.55);
      const theoryRank = competitorTheory.length ? rankAgainst(competitorTheory, theoryRaw) : original.theoryRank;
      const qualifiedForExperiment = theoryRank <= NATIONAL_EXPERIMENT_CUTOFF;
      const finalScore = round1(theoryT * 0.3 + original.experimentT * 0.7);
      const finalRank = qualifiedForExperiment && original.competitorFinal?.length
        ? rankAgainst(original.competitorFinal, finalScore)
        : theoryRank;
      const attempt = {
        ...original,
        theoryRaw,
        theoryT,
        theoryRank,
        qualifiedForExperiment,
        finalScore,
        finalRank,
        medal: nationalMedalForRank(finalRank),
        namedResults: original.namedResults.map((result) => ({
          ...result,
          theoryRank: result.theoryRank + (theoryRaw > result.theoryRaw && original.theoryRaw <= result.theoryRaw ? 1 : 0),
        })),
      };
      nextRecap.nationalAttempt = attempt;
      setNationalAttempts((current) => current.map((item) => item.attemptNumber === attempt.attemptNumber ? attempt : item));
    } else if (typeof nextRecap.totalScore === "number" && nextRecap.maxScore === PROVINCIAL_MAX_SCORE) {
      nextRecap.totalScore = round1(clamp(nextRecap.totalScore + provincialBonus, 0, PROVINCIAL_MAX_SCORE));
    }
    setPendingAssessment(nextRecap);
    setMistakeBook((current) => {
      const next = { ...current };
      scored.forEach((result, index) => {
        if (!result || result.matches === 4) return;
        const question = realQuestionSession.questions[index];
        const previous = next[question.id];
        next[question.id] = { questionId: question.id, recordedAt: new Date().toISOString(), attempts: (previous?.attempts ?? 0) + 1, bestMatches: Math.max(previous?.bestMatches ?? 0, result.matches) };
      });
      return next;
    });
    setRealQuestionSession({ ...realQuestionSession, finished: true });
  };

  const resolvePendingEvent = () => {
    if (!pendingEvent || !eventChoice || !playerStats) return;
    const choice = pendingEvent.choices.find((item) => item.id === eventChoice);
    if (!choice) return;
    const resolvedEffects = adaptRivalChoiceEffects(
      pendingEvent,
      choice.effects,
      seed,
      playerStats,
      rivalRelationships,
    );
    if (
      pendingEvent.id.startsWith("provincial-") &&
      pendingEvent.id.endsWith("-official-result") &&
      typeof resolvedEffects.familySupport === "number"
    ) {
      resolvedEffects.familySupport = round1(
        resolvedEffects.familySupport < 0
          ? resolvedEffects.familySupport * generated.familyProfile.volatility
          : resolvedEffects.familySupport *
            (generated.familyProfile.key === "results" ? 1.15 : 1),
      );
    }
    const nextStats = applyEffects(playerStats, resolvedEffects);
    nextStats.bookStudy = Object.fromEntries(
      Object.entries(nextStats.bookStudy).map(([bookId, state]) => [
        bookId,
        { ...state },
      ]),
    );
    (["module1", "module2", "module3", "module4"] as const).forEach(
      (module) => {
        const gain = resolvedEffects[module];
        if (typeof gain !== "number" || gain <= 0) return;
        textbooks
          .filter((book) => book.module === module)
          .forEach((book) => {
            const state = nextStats.bookStudy[book.id];
            state.course = round1(Math.min(94, state.course + gain));
            state.retention = round1(clamp(state.retention + gain * 0.8));
            state.lastStudiedWeek = week;
          });
      },
    );
    nextStats.module1 = weightedModuleProgress(nextStats.bookStudy, "module1");
    nextStats.module2 = weightedModuleProgress(nextStats.bookStudy, "module2");
    nextStats.module3 = weightedModuleProgress(nextStats.bookStudy, "module3");
    nextStats.module4 = weightedModuleProgress(nextStats.bookStudy, "module4");
    const unlockedSupplementaryId = choice.effects.tags
      ?.map((tag) => tag.match(/^扩充书目:(.+):已解锁$/)?.[1])
      .find(Boolean);
    if (unlockedSupplementaryId) {
      nextStats.supplementaryBookStudy = {
        ...nextStats.supplementaryBookStudy,
        [unlockedSupplementaryId]: {
          ...(nextStats.supplementaryBookStudy[unlockedSupplementaryId] ?? { mastery: 0, retention: 100, lastStudiedWeek: 0 }),
          unlocked: true,
        },
      };
    }
    setPlayerStats(nextStats);
    if (choice.effects.tags) {
      setStoryTags((current) => [
        ...new Set([
          ...current,
          ...choice.effects.tags!,
          ...choice.effects.tags!.map((tag) => `tag-week:${tag}:${week}`),
        ]),
      ]);
    }
    const resolvedChain = pendingEvent.id.match(/^chain-(.+)-(\d{2})$/);
    if (resolvedChain) {
      setStoryTags((current) => [
        ...new Set([...current, `chain:${resolvedChain[1]}:${Number(resolvedChain[2])}:week:${week}`]),
      ]);
    }
    if (
      pendingEvent.id.startsWith("provincial-") &&
      pendingEvent.id.endsWith("-official-result")
    ) {
      const attemptNumber = Number(pendingEvent.id.split("-")[1]) as 1 | 2;
      setProvincialAttempts((current) =>
        current.map((attempt) => {
          if (attempt.attemptNumber !== attemptNumber) return attempt;
          const appealed = storyTags.includes(`第${attemptNumber}次省赛-提交申诉`);
          const finalScore = round1(
            clamp(
              attempt.draftScore + (appealed ? attempt.appealDelta : 0),
              0,
              PROVINCIAL_MAX_SCORE,
            ),
          );
          const finalRank = rankAgainst(attempt.competitorScores, finalScore);
          return {
            ...attempt,
            finalScore,
            finalRank,
            enteredTeam: finalRank <= attempt.teamPlaces,
            finalAward: provincialAward(finalRank, attempt),
          };
        }),
      );
    }
    const forcedSecondFailure =
      pendingEvent.id === "provincial-2-official-result" &&
      !choice.effects.tags?.includes("第2次省赛-进入省队");
    const involvedRival =
      rivals.find(
        (rival) =>
          pendingEvent.id.includes(rival.id) || choice.id.includes(rival.id),
      ) ?? rivalMentionedBy(pendingEvent);
    if (involvedRival) {
      setRivalRelationships((current) => {
        const previous = normalizeRelationship(
          current[involvedRival.id],
          seed,
          involvedRival.id,
        );
        const peerChange = resolvedEffects.peerFavor ?? 0;
        const storyUpdated = applyRelationshipChoice(previous, choice.id, week);
        const isDedicatedStory = pendingEvent.id.startsWith("bondstory-");
        const isCompetitiveEncounter = /竞争|模考|排名|榜/.test(
          `${pendingEvent.label}${pendingEvent.title}`,
        );
        const competitionTension = isCompetitiveEncounter
          ? peerChange >= 0
            ? 0.7
            : 1.8
          : 0;
        return {
          ...current,
          [involvedRival.id]: {
            ...storyUpdated,
            bond: round1(
              clamp(
                storyUpdated.bond +
                  (isDedicatedStory ? 0 : Math.max(0, peerChange) * 1.6),
              ),
            ),
            tension: round1(
              clamp(
                storyUpdated.tension +
                  (isDedicatedStory ? 0 : Math.max(0, -peerChange) * 2) +
                  competitionTension,
              ),
            ),
            romance: round1(clamp(storyUpdated.romance)),
          },
        };
      });
    }
    if (pendingEvent.id.startsWith("fantasy-")) {
      setActionCounts((current) => ({
        ...current,
        "fantasy-chat": (current["fantasy-chat"] ?? 0) + 1,
      }));
    }
    if (pendingEvent.id.startsWith("bondstory-")) {
      setActionCounts((current) => ({
        ...current,
        "relationship-story": (current["relationship-story"] ?? 0) + 1,
        ...(pendingEvent.id.includes("-daily-")
          ? {
              "relationship-daily":
                (current["relationship-daily"] ?? 0) + 1,
            }
          : {}),
      }));
    }
    if (pendingEvent.id.startsWith("teammate-departure-")) {
      const rivalId = pendingEvent.id
        .replace("teammate-departure-", "")
        .replace(/-\d+$/, "");
      const persuadedBack = choice.id.startsWith("departure-persuade-success-");
      if (!persuadedBack) {
        setActiveTeamSize((current) => Math.max(0, current - 1));
        setRetiredRivalIds((current) => [...new Set([...current, rivalId])]);
        setRetiredRivalWeeks((current) => ({ ...current, [rivalId]: week }));
      }
    }
    if (pendingEvent.id.startsWith("teammate-wave-")) {
      const leaving = Number(pendingEvent.id.split("-")[2]) || 2;
      setActiveTeamSize((current) => Math.max(1, current - leaving));
      setRetiredRivalIds((current) => {
        const available = rivals
          .filter((rival) => {
            if (!rival.scope.startsWith("school") || current.includes(rival.id))
              return false;
            const relation = normalizeRelationship(
              rivalRelationships[rival.id],
              seed,
              rival.id,
            );
            return !["dating", "crush"].includes(relation.route);
          })
          .sort(
            (a, b) =>
              hashSeed(`${seed}-${pendingEvent.id}-${a.id}`) -
              hashSeed(`${seed}-${pendingEvent.id}-${b.id}`),
          )
          .slice(0, leaving)
          .map((rival) => rival.id);
        setRetiredRivalWeeks((weeks) => ({
          ...weeks,
          ...Object.fromEntries(available.map((rivalId) => [rivalId, week])),
        }));
        return [...new Set([...current, ...available])];
      });
    }
    if (pendingEvent.id.startsWith("external-departure-")) {
      const rivalId = pendingEvent.id
        .replace("external-departure-", "")
        .replace(/-\d+$/, "");
      setRetiredRivalIds((current) => [...new Set([...current, rivalId])]);
      setRetiredRivalWeeks((current) => ({ ...current, [rivalId]: week }));
    }
    setResolvedEvents((current) => [...current, pendingEvent.id]);
    setCurrentWeekMoments((current) => [
      ...current,
      {
        kind: "event",
        title: seedRivalText(pendingEvent.title, seed),
        choice: seedRivalText(choice.title, seed),
        result: seedRivalText(choice.result, seed),
        effects: choice.effects,
      },
    ]);
    if (forcedSecondFailure) {
      setRetirementFlow({
        stage: "second-failure",
        step: 0,
        resumeWeek: week,
        initiatedBy: "eligibility",
      });
      setRetirementChoice(null);
    }
    let chainedEvent: GameEvent | undefined;
    const nationalChainMatch = pendingEvent.id.match(/^national-([12])-(theory-night|list-revision|experiment-day|rest-day)$/);
    if (nationalChainMatch) {
      const attemptNumber = Number(nationalChainMatch[1]) as 1 | 2;
      const attempt = nationalAttempts.find(
        (item) => item.attemptNumber === attemptNumber,
      );
      if (attempt) {
        const stage = nationalChainMatch[2];
        chainedEvent =
          stage === "theory-night"
            ? attempt.qualifiedForExperiment
              ? makeNationalListRevisionEvent(attempt)
              : makeNationalRestEvent(attempt)
            : stage === "list-revision"
              ? makeNationalExperimentEvent(attempt)
            : stage === "experiment-day"
              ? makeNationalRestEvent(attempt)
              : makeNationalAwardEvent(attempt);
      }
    }
    setEventResultNotice({
      title: pendingEvent.title,
      choice: choice.title,
      result: choice.result,
      effects: choice.effects,
      ...(chainedEvent
        ? { nextAction: { type: "continue-event", event: chainedEvent } as const }
        : pendingEvent.id === "national-2-award"
        ? { nextAction: { type: "national-finish" } as const }
        : {}),
    });
    setPendingEvent(null);
    setEventChoice(null);
  };

  const resolveRetirementChoice = () => {
    if (!retirementFlow || !retirementChoice || !playerStats) return;
    const scene = retirementScene(retirementFlow, playerStats);
    const choice = scene.choices.find((item) => item.id === retirementChoice);
    if (!choice) return;
    const nextStats = applyEffects(playerStats, choice.effects);
    setPlayerStats(nextStats);
    if (choice.effects.tags) {
      setStoryTags((current) => [
        ...new Set([...current, ...choice.effects.tags!]),
      ]);
    }
    if (choice.action === "advance") {
      setEventResultNotice({
        title: scene.title,
        choice: choice.title,
        result: choice.result,
        effects: choice.effects,
      });
      if (retirementFlow.step === 1) {
        const oppositionTags = [
          ...(playerStats.familySupport >= 62 ? ["家长反对退赛"] : []),
          ...(playerStats.coachFavor >= 15 || playerStats.coachFavor <= 5
            ? ["教练反对退赛"]
            : []),
        ];
        if (oppositionTags.length) {
          setStoryTags((current) => [...new Set([...current, ...oppositionTags])]);
        }
      }
      setRetirementFlow({
        ...retirementFlow,
        step: Math.min(2, retirementFlow.step + 1) as 0 | 1 | 2,
        resumeWeek:
          retirementFlow.stage === "second-failure" ? week : week + 1,
      });
      setRetirementChoice(null);
      setRetirementAttemptCount((current) => current + 1);
      return;
    }
    if (choice.action === "retire") {
      const nextProvinceWeek = [calendar.firstExamWeek, calendar.secondExamWeek]
        .filter((examWeek) => examWeek >= week)
        .sort((a, b) => a - b)[0];
      if (
        nextProvinceWeek !== undefined &&
        nextProvinceWeek - week <= 1 &&
        retirementFlow.stage !== "second-failure"
      ) {
        setStoryTags((current) => [
          ...new Set([...current, "省赛前一周正式退赛"]),
        ]);
      }
      if (
        storyTags.includes("家长反对退赛") &&
        storyTags.includes("教练反对退赛")
      ) {
        setStoryTags((current) => [...new Set([...current, "逆势退赛完成"])]);
      }
      setRetirementStageCompleted(retirementFlow.stage);
      setRetirementFlow(null);
      setRetirementChoice(null);
      setSchedule([]);
      setEventResultNotice({
        title: scene.title,
        choice: choice.title,
        result: choice.result,
        effects: choice.effects,
        nextAction: {
          type: "retirement-finish",
          stage: retirementFlow.stage,
        },
      });
      return;
    }
    setEventResultNotice({
      title: scene.title,
      choice: choice.title,
      result: choice.result,
      effects: choice.effects,
    });
    setRetirementCooldownUntil(week + 4);
    setRetirementAttemptCount((current) => current + 1);
    setRetirementFlow(null);
    setRetirementChoice(null);
  };

  const continueAfterEventResult = () => {
    if (!eventResultNotice) return;
    const nextAction = eventResultNotice.nextAction;
    setEventResultNotice(null);
    if (!nextAction || !playerStats) return;
    if (nextAction.type === "continue-event") {
      setPendingEvent(nextAction.event);
      setEventChoice(null);
      return;
    }
    if (nextAction.type === "national-finish") {
      const secondNational = nationalAttempts.find(
        (attempt) => attempt.attemptNumber === 2,
      );
      enterPostCareer(
        playerStats,
        false,
        undefined,
        secondNational?.finalRank ?? null,
      );
      return;
    }
    enterPostCareer(
      playerStats,
      true,
      retirementStageCopy[nextAction.stage].label.replace("退赛事件 · ", ""),
    );
  };

  const saveDialog = saveManagerOpen ? (
    <div className="save-modal-backdrop" role="presentation">
      <section
        className="save-modal"
        role="dialog"
        aria-modal="true"
        aria-label="存档柜"
      >
        <header>
          <div>
            <p className="kicker">SAVE ARCHIVE</p>
            <h2>存档柜</h2>
            <p>10 个手动档位。自动续玩档会在每次操作后单独更新。</p>
          </div>
          <button
            className="save-modal-close"
            onClick={() => setSaveManagerOpen(false)}
            aria-label="关闭存档柜"
          >
            ×
          </button>
        </header>
        <div className="save-slot-list">
          {saveSlots.map((slot, index) => (
            <article
              className={`save-slot ${slot ? "occupied" : ""}`}
              key={index}
            >
              <strong>档位 {String(index + 1).padStart(2, "0")}</strong>
              {slot ? (
                <div className="save-slot-meta">
                  <span>
                    {slot.name} · 第 {slot.week} 周
                  </span>
                  <small>{slot.seed}</small>
                  <small>
                    {new Date(slot.savedAt).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
              ) : (
                <div className="save-slot-meta empty">
                  <span>空档位</span>
                  <small>尚未写入进度</small>
                </div>
              )}
              <div className="save-slot-actions">
                {playerStats && screen !== "origin" && screen !== "profile" && (
                  <button onClick={() => saveGame(false, index)}>
                    {slot ? "覆盖保存" : "保存到这里"}
                  </button>
                )}
                <button
                  onClick={() => loadGame(false, index)}
                  disabled={!slot}
                >
                  读取
                </button>
              </div>
            </article>
          ))}
        </div>
        {saveNotice && <p className="save-modal-notice">{saveNotice}</p>}
      </section>
    </div>
  ) : null;

  const acquiredKeepsakes = keepsakeDefinitions
    .filter((keepsake) => Boolean(keepsakes[keepsake.id]))
    .map((keepsake) => ({
      definition: displayKeepsake(keepsake, keepsakeContext),
      record: keepsakes[keepsake.id],
    }))
    .sort((a, b) => {
      const rarityOrder: Record<KeepsakeRarity, number> = {
        gold: 0,
        purple: 1,
        blue: 2,
        green: 3,
        white: 4,
      };
      return (
        rarityOrder[a.definition.rarity] - rarityOrder[b.definition.rarity] ||
        a.record.acquiredWeek - b.record.acquiredWeek ||
        a.definition.atlasIndex - b.definition.atlasIndex
      );
    });
  const drawerSlotCount = Math.max(
    24,
    Math.ceil((acquiredKeepsakes.length + 5) / 8) * 8,
  );
  const selectedKeepsake = selectedKeepsakeId
    ? keepsakeById[selectedKeepsakeId]
    : undefined;
  const selectedKeepsakeDisplay = selectedKeepsake
    ? displayKeepsake(selectedKeepsake, keepsakeContext)
    : undefined;
  const keepsakeUi = playerStats ? (
    <>
      <button
        className="keepsake-fab"
        onClick={() => setKeepsakeOpen(true)}
        aria-label="打开纪念物抽屉"
      >
        <span className="drawer-mark">▤</span>
        抽屉 {acquiredKeepsakes.length}
      </button>
      {keepsakeToast && keepsakeById[keepsakeToast.id] && (
        <aside className="keepsake-toast" role="status">
          <span
            className={`item-sprite rarity-${displayKeepsake(keepsakeById[keepsakeToast.id], keepsakeContext).rarity}`}
            style={itemSpriteStyle(keepsakeById[keepsakeToast.id].atlasIndex)}
            aria-hidden="true"
          />
          <div>
            <small>NEW KEEPSAKE</small>
            <strong>
              {displayKeepsake(keepsakeById[keepsakeToast.id], keepsakeContext).name}
            </strong>
            <p>
              {rarityLabels[
                displayKeepsake(keepsakeById[keepsakeToast.id], keepsakeContext)
                  .rarity
              ]}
              {keepsakeToast.count > 1
                ? ` · 同时收进抽屉 ${keepsakeToast.count} 件物品`
                : " · 已收进抽屉"}
            </p>
          </div>
        </aside>
      )}
      {keepsakeOpen && (
        <div className="keepsake-backdrop" role="presentation">
          <section
            className="keepsake-modal"
            role="dialog"
            aria-modal="true"
            aria-label="纪念物抽屉"
          >
            <header>
              <div>
                <p className="kicker">THE DESK DRAWER</p>
                <h2>书桌抽屉</h2>
                <p>这里只摆放本周目真正留下的东西。空位不会透露还有什么尚未发生。</p>
              </div>
              <button
                onClick={() => setKeepsakeOpen(false)}
                aria-label="关闭纪念物抽屉"
              >
                ×
              </button>
            </header>
            <div className="keepsake-modal-body">
              <div className="keepsake-drawer-grid">
                {Array.from({ length: drawerSlotCount }, (_, index) => {
                  const entry = acquiredKeepsakes[index];
                  if (!entry) {
                    return <span className="keepsake-empty-slot" key={`empty-${index}`} />;
                  }
                  const { definition, record } = entry;
                  return (
                    <button
                      className={`keepsake-slot rarity-${definition.rarity} ${selectedKeepsakeId === definition.id ? "selected" : ""}`}
                      key={definition.id}
                      onClick={() => setSelectedKeepsakeId(definition.id)}
                      aria-label={`${definition.name}，${rarityLabels[definition.rarity]}`}
                    >
                      <span
                        className="item-sprite"
                        style={itemSpriteStyle(definition.atlasIndex)}
                        aria-hidden="true"
                      />
                      <small>第 {record.acquiredWeek} 周</small>
                    </button>
                  );
                })}
              </div>
              <aside className="keepsake-detail">
                {selectedKeepsakeDisplay ? (
                  <>
                    <span
                      className={`item-sprite large rarity-${selectedKeepsakeDisplay.rarity}`}
                      style={itemSpriteStyle(selectedKeepsakeDisplay.atlasIndex)}
                      aria-hidden="true"
                    />
                    <small>{rarityLabels[selectedKeepsakeDisplay.rarity]}</small>
                    <h3>{selectedKeepsakeDisplay.name}</h3>
                    <p>{selectedKeepsakeDisplay.description}</p>
                    {selectedKeepsakeDisplay.effectText && (
                      <div className="keepsake-effect">
                        <span>已知作用</span>
                        {selectedKeepsakeDisplay.effectText}
                      </div>
                    )}
                    <em>
                      第 {keepsakes[selectedKeepsakeDisplay.id]?.acquiredWeek ?? week} 周获得
                    </em>
                  </>
                ) : (
                  <div className="keepsake-detail-empty">
                    <span>选择一件物品</span>
                    <p>取得后的风味文本与实际效果会记录在这里。</p>
                  </div>
                )}
              </aside>
            </div>
          </section>
        </div>
      )}
    </>
  ) : null;

  const sortedAchievements = [...achievementDefinitions].sort((a, b) => {
    const unlockedDifference = Number(Boolean(unlockedAchievements[b.id])) - Number(Boolean(unlockedAchievements[a.id]));
    return unlockedDifference || a.title.localeCompare(b.title, "zh-CN");
  });
  const selectedAchievement = achievementDefinitions.find(
    (item) => item.id === selectedAchievementId,
  );
  const achievementUi = (
    <>
      <button
        className="ending-archive-fab"
        onClick={() => setEndingArchiveOpen(true)}
        aria-label="打开结局档案库"
      >
        ▦ 档案 {endingArchive.length}
      </button>
      {endingArchiveOpen && (
        <div className="achievement-backdrop" role="presentation">
          <section className="achievement-modal ending-archive-modal" role="dialog" aria-modal="true" aria-label="结局档案库">
            <header>
              <div><p className="kicker">ENDING ARCHIVE</p><h2>结局档案库</h2><p>已经通关的种子与未来会永久保存在这台设备上。</p></div>
              <button onClick={() => setEndingArchiveOpen(false)} aria-label="关闭结局档案库">×</button>
            </header>
            <div className="ending-archive-list">
              {endingArchive.map((record) => (
                <article key={record.id}>
                  <span>{new Date(record.recordedAt).toLocaleDateString("zh-CN")}</span>
                  <h3>{record.endingTitle}</h3>
                  <p>{record.futureTitle ?? "未来仍在展开"}</p>
                  <small>{record.name} · {record.seed}</small>
                  <dl>
                    {record.admission && <div><dt>录取</dt><dd>{record.admission} · {record.route}</dd></div>}
                    {record.gaokao !== undefined && <div><dt>高考</dt><dd>{formatNumber(record.gaokao)} / 750</dd></div>}
                    {record.nationalRank && <div><dt>国赛</dt><dd>全国第 {record.nationalRank}</dd></div>}
                  </dl>
                </article>
              ))}
              {!endingArchive.length && <div className="archive-empty"><strong>档案库还是空的</strong><p>完成一次录取与后日谈后，结局会自动归档。</p></div>}
            </div>
          </section>
        </div>
      )}
      <button
        className="achievement-fab"
        onClick={() => setAchievementOpen(true)}
        aria-label="打开成就柜"
      >
        <span>◇</span>
        成就 {Object.keys(unlockedAchievements).length}/
        {achievementDefinitions.length}
      </button>
      {achievementToast && (
        <aside className="achievement-toast" role="status">
          <span>ACHIEVEMENT UNLOCKED</span>
          <strong>◇ {achievementToast.title}</strong>
          <p>{achievementToast.description}</p>
          {achievementToast.creditedBy && (
            <small>来自 @{achievementToast.creditedBy}</small>
          )}
        </aside>
      )}
      {achievementOpen && (
        <div className="achievement-backdrop" role="presentation">
          <section
            className="achievement-modal"
            role="dialog"
            aria-modal="true"
            aria-label="成就柜"
          >
            <header>
              <div>
                <p className="kicker">ACHIEVEMENT ARCHIVE</p>
                <h2>成就柜</h2>
                <p>
                  已解锁 {Object.keys(unlockedAchievements).length} /{" "}
                  {achievementDefinitions.length}
                </p>
              </div>
              <button
                onClick={() => setAchievementOpen(false)}
                aria-label="关闭成就柜"
              >
                ×
              </button>
            </header>
            <div className="achievement-grid">
              {sortedAchievements.map((achievement) => {
                const unlockedAt = unlockedAchievements[achievement.id];
                return (
                  <article
                    className={unlockedAt ? "unlocked" : "locked"}
                    key={achievement.id}
                    role={unlockedAt ? "button" : undefined}
                    tabIndex={unlockedAt ? 0 : undefined}
                    onClick={() => unlockedAt && setSelectedAchievementId(achievement.id)}
                  >
                    <span className="achievement-icon">
                      {unlockedAt ? "◇" : "?"}
                    </span>
                    <div>
                      <strong>{unlockedAt ? achievement.title : "???"}</strong>
                      <p>
                        {unlockedAt
                          ? achievement.description
                          : "达成方式尚未揭晓"}
                      </p>
                      {unlockedAt && (
                        <small>
                          {achievement.creditedBy
                            ? `来自 @${achievement.creditedBy} · `
                            : ""}
                          {new Date(unlockedAt.split("|")[0]).toLocaleDateString("zh-CN")}
                        </small>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {selectedAchievement && unlockedAchievements[selectedAchievement.id] && (
              <aside className="achievement-detail">
                <button aria-label="关闭成就详情" onClick={() => setSelectedAchievementId(null)}>×</button>
                <span className="achievement-icon">◇</span>
                <div>
                  <p className="kicker">UNLOCKED ACHIEVEMENT</p>
                  <h3>{selectedAchievement.title}</h3>
                  <p>{selectedAchievement.description}</p>
                  <dl>
                    <div><dt>达成方式</dt><dd>{achievementMethod(selectedAchievement)}</dd></div>
                    <div><dt>获得时间</dt><dd>{new Date(unlockedAchievements[selectedAchievement.id].split("|")[0]).toLocaleString("zh-CN")}</dd></div>
                    {unlockedAchievements[selectedAchievement.id].split("|")[1] && (
                      <div><dt>游戏进度</dt><dd>第 {unlockedAchievements[selectedAchievement.id].split("|")[1]} 周</dd></div>
                    )}
                    {selectedAchievement.creditedBy && <div><dt>共创者</dt><dd>@{selectedAchievement.creditedBy}</dd></div>}
                  </dl>
                </div>
              </aside>
            )}
          </section>
        </div>
      )}
    </>
  );

  if (
    screen === "postcareer" &&
    playerStats &&
    postCareerInput &&
    postCareerState
  ) {
    return (
      <>
        <PostCareerScreen
          name={name}
          seed={seed}
          state={postCareerState}
          input={postCareerInput}
          onAdvance={(choiceId) =>
            setPostCareerState((current) =>
              current
                ? advancePostCareer(current, choiceId, postCareerInput)
                : current,
            )
          }
          onOpenSaves={() => {
            refreshSaveSlots();
            setSaveManagerOpen(true);
          }}
          onRestart={() => setScreen("origin")}
        />
        {saveDialog}
        {achievementUi}
        {keepsakeUi}
      </>
    );
  }

  if (screen === "complete" && playerStats) {
    const finalNational = nationalAttempts.find(
      (attempt) => attempt.attemptNumber === 2,
    );
    const moduleAverage =
      (playerStats.module1 +
        playerStats.module2 +
        playerStats.module3 +
        playerStats.module4) /
      4;
    return (
      <main className="shell retired-ending">
        <header className="topbar">
          <button className="brand-button" onClick={() => setScreen("origin")}>
            生竞人生
          </button>
          <div className="steps" aria-label="试玩版完成">
            <span className="step done">两年竞赛路线完成</span>
            <span className="step active">高三、招考与录取</span>
          </div>
          <span className="seed-chip">{seed}</span>
        </header>
        {keepsakeUi}
        <section className="retired-ending-card">
          <p className="kicker">COMPETITION CHAPTER COMPLETE · THANK YOU</p>
          <span className="ending-week">第二次国赛结束</span>
          <h1>感谢游玩。</h1>
          <p className="retired-lead">
            {name}的两年生物竞赛主线已经结束。接下来将进入完整的高三、强基或高考、
            录取通知书与成年后日谈流程；竞赛经历不会消失，而会继续改变此后的人生选择。
          </p>
          <div className="retired-stats">
            <div>
              <span>四模块平均掌握</span>
              <strong>{formatNumber(moduleAverage)}</strong>
            </div>
            <div>
              <span>第二次国赛</span>
              <strong>
                {finalNational?.finalRank
                  ? `全国第 ${finalNational.finalRank}`
                  : finalNational?.qualifiedForExperiment
                    ? "等待最终名次"
                    : "止步理论"}
              </strong>
            </div>
            <div>
              <span>最终状态</span>
              <strong>
                SAN {formatNumber(playerStats.san)} · 心态{" "}
                {formatNumber(playerStats.mindset)}
              </strong>
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() =>
              enterPostCareer(
                playerStats,
                false,
                undefined,
                finalNational?.finalRank ?? null,
              )
            }
          >
            进入高三与大学录取 <span>→</span>
          </button>
        </section>
      </main>
    );
  }

  if (screen === "retired" && playerStats) {
    const completedCopy = retirementStageCompleted
      ? retirementStageCopy[retirementStageCompleted]
      : retirementStageCopy["mid-course"];
    return (
      <main className="shell retired-ending">
        <header className="topbar">
          <button className="brand-button" onClick={() => setScreen("origin")}>
            生竞人生
          </button>
          <div className="steps" aria-label="退赛结局">
            <span className="step done">竞赛路线结束</span>
            <span className="step active">回班、高考与录取</span>
          </div>
          <span className="seed-chip">{seed}</span>
        </header>
        {keepsakeUi}
        <section className="retired-ending-card">
          <p className="kicker">ENDING · RETURN TO CLASS</p>
          <span className="ending-week">第 {week} 周</span>
          <h1>您已退赛。</h1>
          <p className="retired-lead">
            {completedCopy.label.replace("退赛事件 · ", "")}，你结束了生物竞赛路线。
            竞赛书没有消失，此前投入的时间也不会被简单清零；但从下一周开始，
            日程表的中心将重新变成常规课程。
          </p>
          <div className="retired-stats">
            <div>
              <span>当前常规积累</span>
              <strong>
                {formatNumber(playerStats.academics)} /{" "}
                {formatNumber(regularUnlockedScore(week))}
              </strong>
            </div>
            <div>
              <span>高考趋势</span>
              <strong>
                {formatNumber(projectedGaokaoScore(playerStats, week))} / 750
              </strong>
            </div>
            <div>
              <span>离队时SAN</span>
              <strong>{formatNumber(playerStats.san)}</strong>
            </div>
          </div>
          <div className="retired-placeholder">
            <strong>竞赛路线结束，回班与高考路线从这里接续</strong>
            <p>
              接下来会处理回班适应、补课、旧队友关系、强基或普通高考选择，
              直至录取通知书与成年后日谈。
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() =>
              enterPostCareer(
                playerStats,
                true,
                completedCopy.label.replace("退赛事件 · ", ""),
              )
            }
          >
            继续常规高中与高考 <span>→</span>
          </button>
        </section>
      </main>
    );
  }

  if (screen === "profile") {
    return (
      <main className="shell">
        <header className="topbar">
          <button className="brand-button" onClick={() => setScreen("origin")}>
            生竞人生
          </button>
          <div className="steps" aria-label="开局进度">
            <span className="step done">01 起点</span>
            <span className="step active">02 档案</span>
            <span className="step">03 第一周</span>
          </div>
          <span className="seed-chip">{seed}</span>
        </header>

        <section className="profile-screen">
          <div className="profile-heading">
            <p className="kicker">新建生涯档案</p>
            <h1>{name}，你的竞赛人生即将开始。</h1>
            <p>
              初三毕业后的暑假，学校竞赛队开始选拔。你拥有两次省赛机会，但世界不会为任何一名选手停下。
            </p>
          </div>

          <div className="dossier-grid">
            <article className="paper dossier-main">
              <div className="dossier-stamp">已生成</div>
              <p className="folio">PERSONAL FILE / 001</p>
              <h2>{selected.title}</h2>
              <p className="dossier-quote">{selected.subtitle}</p>

              <div className="gender-selector" aria-label="主角性别">
                <span>主角性别</span>
                <div>
                  <button
                    type="button"
                    aria-pressed={playerGender === "female"}
                    className={playerGender === "female" ? "selected" : ""}
                    onClick={() => setPlayerGender("female")}
                  >
                    女生
                  </button>
                  <button
                    type="button"
                    aria-pressed={playerGender === "male"}
                    className={playerGender === "male" ? "selected" : ""}
                    onClick={() => setPlayerGender("male")}
                  >
                    男生
                  </button>
                </div>
                <small>影响可发展的朦胧好感与恋爱人物；挚友线不受限制。</small>
              </div>

              <dl className="facts">
                <div>
                  <dt>学校</dt>
                  <dd>{generated.school}</dd>
                </div>
                <div>
                  <dt>第一年命题</dt>
                  <dd>{generated.paperSetter}</dd>
                </div>
                <div>
                  <dt>家庭态度</dt>
                  <dd>{generated.familySupport}</dd>
                </div>
                <div>
                  <dt>家庭沟通倾向</dt>
                  <dd>{generated.familyProfile.label}</dd>
                </div>
                <div>
                  <dt>校外培训报销</dt>
                  <dd>约 {generated.reimbursement}%</dd>
                </div>
              </dl>

              <div className="tags">
                {selected.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>

            <aside className="paper world-card">
              <p className="folio">THIS YEAR / ENVIRONMENT</p>
              <h2>{generated.firstYear} 届行情</h2>
              <div className="world-stat">
                <span>本校竞赛队</span>
                <strong>{generated.schoolTeamSize} 人</strong>
              </div>
              <div className="world-stat">
                <span>全省同届核心选手</span>
                <strong>{generated.coreSameGrade} 人</strong>
              </div>
              <div className="world-stat">
                <span>上届核心选手</span>
                <strong>{generated.coreUpperGrade} 人</strong>
              </div>
              <div className="world-stat">
                <span>去年本省金牌</span>
                <strong>{generated.previousGolds} 枚</strong>
              </div>
              <div className="world-stat emphasis">
                <span>今年省队名额</span>
                <strong>{generated.teamPlaces} 人</strong>
              </div>
              <p className="formula">12 个基础名额 + 去年金牌数</p>
            </aside>

            <article className="paper stat-sheet">
              <p className="folio">INITIAL STATUS</p>
              <h2>初始状态</h2>
              <div className="stat-grid">
                <Stat name="中考基础指数" value={selected.stats.academics} />
                <Stat name="社交水平" value={selected.stats.social} />
                <Stat name="心理韧性" value={selected.stats.resilience} />
                <Stat name="SAN" value={selected.stats.san} />
                <Stat name="家庭经济" value={selected.stats.familyWealth} />
                <Stat name="家庭支持" value={selected.stats.familySupport} />
              </div>
              <div className="money-line">
                <span>个人零花钱</span>
                <strong>
                  ¥{formatNumber(selected.stats.pocketMoney)} · 每四周 +¥
                  {formatNumber(selected.stats.monthlyPocketMoney)}
                </strong>
              </div>
            </article>
          </div>

          <div className="profile-actions">
            <button className="secondary-button" onClick={() => setScreen("origin")}>
              返回重选
            </button>
            <button className="primary-button" onClick={startCareer}>
              进入第一周 <span>→</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "week") {
    const selectedOpeningChoice = openingEvent.choices.find(
      (choice) => choice.id === firstChoice,
    );
    const selectedBook =
      textbooks.find((book) => book.id === selectedBookId) ?? textbooks[0];
    const selectedEventChoice = pendingEvent?.choices.find(
      (choice) => choice.id === eventChoice,
    );

    if (!openingResolved) {
      return (
        <main className="shell week-shell">
          <header className="topbar">
            <button className="brand-button" onClick={() => setScreen("origin")}>
              生竞人生
            </button>
            <div className="steps" aria-label="开局进度">
              <span className="step done">01 起点</span>
              <span className="step done">02 档案</span>
              <span className="step active">03 入坑</span>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>

          <section className="week-layout">
            <aside className="week-meta">
              <p className="kicker">初三毕业后的暑假</p>
              <h1>第 1 周</h1>
              <p>{generated.school}</p>
              <div className="mini-status">
                <span>
                  SAN{" "}
                  <strong>
                    {formatNumber(playerStats?.san ?? selected.stats.san)}
                  </strong>
                </span>
                <span>
                  常规积累{" "}
                  <strong>
                    {formatNumber(playerStats?.academics ?? 0)} /{" "}
                    {formatNumber(regularUnlockedScore(1))}
                  </strong>
                </span>
                <span>
                  零花钱{" "}
                  <strong>
                    ¥{formatNumber(playerStats?.pocketMoney ?? selected.stats.pocketMoney)}
                  </strong>
                </span>
              </div>
            </aside>

            <article className="event-card">
              <h2>{openingEvent.title}</h2>
              {openingEvent.body.map((paragraph) => (
                <p className="event-copy" key={paragraph}>
                  {paragraph}
                </p>
              ))}
              {openingEvent.quote && <blockquote>{openingEvent.quote}</blockquote>}

              <div className="choice-list">
                {openingEvent.choices.map((choice, index) => (
                  <button
                    key={choice.id}
                    className={`choice-button ${firstChoice === choice.id ? "selected" : ""}`}
                    onClick={() => setFirstChoice(choice.id)}
                  >
                    <span className="choice-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>
                      <strong>{choice.title}</strong>
                    </span>
                  </button>
                ))}
              </div>

              <button
                className="primary-button event-confirm"
                onClick={confirmOpening}
                disabled={!selectedOpeningChoice}
              >
                记录选择，查看结果 <span>→</span>
              </button>
            </article>
          </section>
        </main>
      );
    }

    if (eventResultNotice) {
      return (
        <main className="shell week-shell visual-novel-result-shell">
          <header className="topbar">
            <button className="brand-button" onClick={() => setScreen("origin")}>
              生竞人生
            </button>
            <div className="steps" aria-label="事件后续">
              <span className="step done">选择已经作出</span>
              <span className="step active">结果揭晓</span>
              <span className="step">继续本周</span>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>
          <section className="visual-novel-result">
            <h1>{seedRivalText(eventResultNotice.title, seed)}</h1>
            <p className="event-result-choice">
              你选择了：{seedRivalText(eventResultNotice.choice, seed)}
            </p>
            <p>{seedRivalText(eventResultNotice.result, seed)}</p>
            {eventResultNotice.effects && effectPreview(eventResultNotice.effects) && (
              <div className="event-result-effects" aria-label="本次选择的即时数值变化">
                <span>数值变化</span>
                <strong>{effectPreview(eventResultNotice.effects)}</strong>
              </div>
            )}
            <small>
              有些影响已经进入人物关系与后续事件，但不会全部换算成即时数值公开。
            </small>
            <button
              className="primary-button"
              onClick={continueAfterEventResult}
            >
              把结果记下来 <span>→</span>
            </button>
          </section>
        </main>
      );
    }

    if (allowanceRequestOpen && playerStats) {
      const selectedAllowance = allowanceOptions.find(
        (item) => item.id === allowanceChoice,
      );
      return (
        <main className="shell week-shell allowance-shell">
          <header className="topbar">
            <button className="brand-button">生竞人生</button>
            <div className="steps" aria-label="向父母申请零花钱">
              <span className="step active">说明用途</span>
              <span className="step">等待回应</span>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>
          <section className="week-layout">
            <aside className="week-meta">
              <p className="kicker">FAMILY & ALLOWANCE</p>
              <h1>问父母要点钱</h1>
              <div className="mini-status">
                <span>
                  零花钱 <strong>¥{formatNumber(playerStats.pocketMoney)}</strong>
                </span>
                <span>
                  家庭支持 <strong>{formatNumber(playerStats.familySupport)}</strong>
                </span>
                <span>
                  此前申请 <strong>{allowanceRequestCount} 次</strong>
                </span>
              </div>
            </aside>
            <article className="event-card allowance-card">
              <h2>竞赛资料家长会承担，小卖部里的东西则需要你自己解释。</h2>
              <p className="event-copy">
                要得越多、次数越频繁，父母越可能怀疑你把精力和钱花在了无关紧要的地方。
                考试表现好会慢慢恢复家庭支持。
              </p>
              <div className="choice-list">
                {allowanceOptions.map((option, index) => (
                  <button
                    key={option.id}
                    className={`choice-button ${
                      allowanceChoice === option.id ? "selected" : ""
                    }`}
                    onClick={() => setAllowanceChoice(option.id)}
                  >
                    <span className="choice-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>
                      <strong>{option.title}</strong>
                      <small>
                        成功率约 {(allowanceProjection(option, playerStats).successChance * 100).toFixed(0)}%
                        {" · "}成功后获得 ¥{option.amount} · 家庭支持约 -
                        {formatNumber(allowanceProjection(option, playerStats).supportCost)}
                      </small>
                    </span>
                  </button>
                ))}
                <button
                  className={`choice-button ${
                    allowanceChoice === "cancel" ? "selected" : ""
                  }`}
                  onClick={() => setAllowanceChoice("cancel")}
                >
                  <span className="choice-letter">D</span>
                  <span>
                    <strong>算了，暂时不问</strong>
                    <small>返回本周计划，不产生变化</small>
                  </span>
                </button>
              </div>
              {selectedAllowance && (
                <div className="decision-note">
                  这笔钱不会影响培训、教材等家庭教育支出，只进入你的个人零花钱。
                </div>
              )}
              <button
                className="primary-button event-confirm"
                disabled={!allowanceChoice}
                onClick={resolveAllowanceRequest}
              >
                确认开口 <span>→</span>
              </button>
            </article>
          </section>
        </main>
      );
    }

    if (pendingWeekReview && playerStats) {
      return (
        <main className="shell week-review-shell">
          <header className="topbar">
            <button className="brand-button" onClick={() => setScreen("origin")}>
              生竞人生
            </button>
            <div className="steps" aria-label="每周结算">
              <span className="step done">第 {pendingWeekReview.week} 周完成</span>
              <span className="step active">本周回顾</span>
              <span className="step">第 {week} 周</span>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>

          <section className="week-review-page">
            <aside className="week-review-title">
              <p className="kicker">WEEK {String(pendingWeekReview.week).padStart(2, "0")} · REVIEW</p>
              <h1>{pendingWeekReview.headline}</h1>
              <p>
                学习效率 {Math.round(pendingWeekReview.efficiency * 100)}% ·
                随机发挥 {pendingWeekReview.fluctuation >= 1 ? "+" : ""}
                {Math.round((pendingWeekReview.fluctuation - 1) * 100)}%
              </p>
              <div className="week-review-san">
                <span>结算后 SAN</span>
                <strong>{formatNumber(pendingWeekReview.sanAfter ?? playerStats.san)}</strong>
              </div>
            </aside>

            <div className="week-review-content">
              <section>
                <h2>这一周把时间花在了哪里</h2>
                <div className="week-review-actions">
                  {(pendingWeekReview.fixedActions ?? []).map((item) => (
                    <div key={`fixed-${item.title}`}>
                      <span>固定</span>
                      <strong>{item.title}</strong>
                      <small>{item.cost} 点</small>
                    </div>
                  ))}
                  {(pendingWeekReview.chosenActions ?? []).map((item) => (
                    <div key={`chosen-${item.title}`}>
                      <span>自主</span>
                      <strong>{item.title}</strong>
                      <small>
                        {item.count > 1 ? `${item.count} 次 · ` : ""}{item.cost} 点
                      </small>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2>发生过的事</h2>
                {(pendingWeekReview.moments ?? []).length > 0 ? (
                  <div className="week-review-moments">
                    {(pendingWeekReview.moments ?? []).map((moment, index) => (
                      <article key={`${moment.kind}-${index}-${moment.title}`}>
                        <span>
                          {moment.kind === "assessment"
                            ? "考试复盘"
                            : moment.kind === "opening"
                              ? "开局事件"
                              : "本周事件"}
                        </span>
                        <h3>{moment.title}</h3>
                        {moment.choice && <strong>你的选择：{moment.choice}</strong>}
                        {moment.result && <p>{moment.result}</p>}
                        {moment.effects && effectPreview(moment.effects) && (
                          <div className="moment-effects">
                            <span>数值变化</span>
                            <strong>{effectPreview(moment.effects)}</strong>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="week-review-empty">这一周没有额外事件。安静本身也是竞赛生活的一部分。</p>
                )}
              </section>

              <section>
                <h2>属性变化</h2>
                <div className="week-review-changes">
                  {pendingWeekReview.changes.length > 0 ? (
                    pendingWeekReview.changes.map((change) => (
                      <span className={change.value > 0 ? "positive" : "negative"} key={change.label}>
                        {change.label} {change.value > 0 ? "+" : ""}
                        {formatNumber(change.value)}
                      </span>
                    ))
                  ) : (
                    <span>没有可见属性变化</span>
                  )}
                </div>
              </section>

              <button
                className="primary-button week-review-continue"
                onClick={() => setPendingWeekReview(null)}
              >
                继续处理第 {week} 周 <span>→</span>
              </button>
            </div>
          </section>
        </main>
      );
    }

    if (
      retirementFlow &&
      playerStats &&
      week >= (retirementFlow.resumeWeek ?? week)
    ) {
      const scene = retirementScene(retirementFlow, playerStats);
      const selectedRetirementChoice = scene.choices.find(
        (choice) => choice.id === retirementChoice,
      );
      const retirementRelationshipLine =
        retirementFlow.step >= 1 && activePartnerEntry
          ? `${relationshipName(activePartnerEntry[0])}没有替你决定。TA先问你现在最难承受的是什么，又提醒你：留下不该只因为害怕失去这段关系，离开也不必独自面对后面的日子。`
          : retirementFlow.step >= 1 && bestFriendEntry
            ? `${relationshipName(bestFriendEntry[0])}把你叫到走廊尽头。TA没有使用“坚持就是胜利”，只答应无论你是否退赛，都不会把你从共同经历里删掉。`
            : null;
      return (
        <main className="shell week-shell retirement-shell">
          <header className="topbar">
            <button className="brand-button">生竞人生</button>
            <div className="steps" aria-label="退赛协商进度">
              <span className={retirementFlow.step >= 0 ? "step done" : "step"}>
                提出想法
              </span>
              <span
                className={
                  retirementFlow.step === 1
                    ? "step active"
                    : retirementFlow.step > 1
                      ? "step done"
                      : "step"
                }
              >
                协商
              </span>
              <span
                className={
                  retirementFlow.step === 2 ? "step active" : "step"
                }
              >
                最终决定
              </span>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>

          <section className="week-layout">
            <aside className="week-meta retirement-meta">
              <p className="kicker">RETIREMENT DECISION</p>
              <h1>第 {week} 周</h1>
              <p>{generated.school}</p>
              <div className="mini-status">
                <span>
                  SAN <strong>{formatNumber(playerStats.san)}</strong>
                </span>
                <span>
                  常规{" "}
                  <strong>
                    {formatNumber(playerStats.academics)} /{" "}
                    {formatNumber(regularUnlockedScore(week))}
                  </strong>
                </span>
                <span>
                  在队 <strong>{activeTeamSize} 人</strong>
                </span>
              </div>
            </aside>

            <article className="event-card retirement-card">
              <h2>{scene.title}</h2>
              {scene.body.map((paragraph) => (
                <p className="event-copy" key={paragraph}>
                  {paragraph}
                </p>
              ))}
              {retirementRelationshipLine && (
                <p className="event-copy relationship-intervention">
                  {retirementRelationshipLine}
                </p>
              )}
              <div className="choice-list">
                {scene.choices.map((choice, index) => (
                  <button
                    key={choice.id}
                    className={`choice-button ${
                      retirementChoice === choice.id ? "selected" : ""
                    }`}
                    onClick={() => setRetirementChoice(choice.id)}
                  >
                    <span className="choice-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>
                      <strong>{choice.title}</strong>
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="primary-button event-confirm"
                onClick={resolveRetirementChoice}
                disabled={!selectedRetirementChoice}
              >
                记录选择，查看结果
                <span>→</span>
              </button>
            </article>
          </section>
        </main>
      );
    }

    if (realQuestionSession && pendingAssessment) {
      const question = realQuestionSession.questions[realQuestionSession.index];
      const response = realQuestionSession.responses[realQuestionSession.index];
      const answered = Array.isArray(response) && response.every(Boolean);
      return (
        <main className="shell real-question-shell">
          <header className="topbar"><button className="brand-button">生竞人生</button><div className="steps"><span className="step active">真实题目 {Math.min(realQuestionSession.index + 1, 4)} / 4</span><span className="step">考试结算</span></div><span className="seed-chip">{realQuestionSession.context}</span></header>
          <section className="real-question-card">
            {!realQuestionSession.finished && question ? <>
              <p className="kicker">{question.year} 年联赛 · 第 {question.number} 题 · {specialtyLabels[question.module]}</p>
              <h1>{question.prompt}</h1>
              <p className="section-note">分别判断 A-D 为 T（正确）或 F（错误）。4 项重合得满权重，3 项得一半，2 项得 10%，其余为 0；放弃不计入加权。</p>
              <div className="truth-statement-list">{question.statements.map((statement, index) => <article key={statement}><span>{String.fromCharCode(65 + index)}. {statement}</span><div><button className={Array.isArray(response) && response[index] === "T" ? "selected" : ""} onClick={() => setRealQuestionSession((current) => { if (!current) return current; const responses = [...current.responses]; const values = Array.isArray(responses[current.index]) ? [...responses[current.index] as Array<TruthValue | null>] : [null, null, null, null]; values[index] = "T"; responses[current.index] = values; return { ...current, responses }; })}>T</button><button className={Array.isArray(response) && response[index] === "F" ? "selected" : ""} onClick={() => setRealQuestionSession((current) => { if (!current) return current; const responses = [...current.responses]; const values = Array.isArray(responses[current.index]) ? [...responses[current.index] as Array<TruthValue | null>] : [null, null, null, null]; values[index] = "F"; responses[current.index] = values; return { ...current, responses }; })}>F</button></div></article>)}</div>
              <div className="real-question-actions"><button className="secondary-button" onClick={() => setRealQuestionSession((current) => { if (!current) return current; const responses = [...current.responses]; responses[current.index] = "abandoned"; return current.index === current.questions.length - 1 ? { ...current, responses } : { ...current, responses, index: current.index + 1 }; })}>放弃本题</button>{realQuestionSession.index < realQuestionSession.questions.length - 1 ? <button className="primary-button" disabled={!answered} onClick={() => setRealQuestionSession((current) => current ? { ...current, index: current.index + 1 } : current)}>下一题 →</button> : <button className="primary-button" disabled={!answered && response !== "abandoned"} onClick={finishRealQuestionSession}>提交全部答案</button>}</div>
            </> : <>
              <p className="kicker">ANSWER REVIEW</p><h1>真实题目作答结果</h1>
              <div className="real-answer-review">{realQuestionSession.questions.map((item, index) => { const user = realQuestionSession.responses[index]; const result = Array.isArray(user) ? scoreRealQuestion(item, user) : null; return <article key={item.id}><strong>{item.year} 年第 {item.number} 题 · {result ? `重合 ${result.matches}/4` : "已放弃"}</strong><p>标准答案：{item.answers.map((value, option) => `${String.fromCharCode(65 + option)}${value}`).join(" · ")}</p>{Array.isArray(user) && <small>你的答案：{user.map((value, option) => `${String.fromCharCode(65 + option)}${value}`).join(" · ")}</small>}</article>; })}</div>
              <button className="primary-button" onClick={() => setRealQuestionSession(null)}>查看考试结算 →</button>
            </>}
          </section>
        </main>
      );
    }

    if (pendingAssessment) {
      const provincialEstimate = pendingAssessment.provincialAttempt;
      const nationalResult = pendingAssessment.nationalAttempt;
      const isNationalTheory = pendingAssessment.nationalStage === "theory";
      const isNationalExperiment =
        pendingAssessment.nationalStage === "experiment";
      const isProvincialMock =
        !provincialEstimate && pendingAssessment.maxScore === PROVINCIAL_MAX_SCORE;
      return (
        <main
          className={`shell assessment-shell ${
            pendingAssessment.title.includes("南辰") ||
            pendingAssessment.title.includes("圆阶")
              ? "training-shell"
              : nationalResult
                ? "exam-shell"
                : ""
          }`}
        >
          <header className="topbar">
            <button className="brand-button" onClick={() => setScreen("origin")}>
              生竞人生
            </button>
            <div className="steps" aria-label="考试复盘">
              <span className="step done">考试完成</span>
              <span className="step active">分科总结</span>
              <span className="step">本周事件待处理</span>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>

          <section className="assessment-layout">
            <aside className="assessment-summary">
              <p className="kicker">
                {provincialEstimate
                  ? "省赛 · 答题回忆估分"
                  : isNationalTheory
                    ? "国赛 · 理论成绩"
                    : isNationalExperiment
                      ? "国赛 · 实验与综合成绩"
                  : pendingAssessment.type === "competition"
                    ? "竞赛测试"
                    : "常规考试"}
              </p>
              <h1>{pendingAssessment.title}</h1>
              <p>
                {provincialEstimate
                  ? "正式评议稿预计约三周后公布"
                  : isNationalTheory
                    ? "当晚公布理论排名，前240名取得实验考试资格"
                    : isNationalExperiment
                      ? "理论占30%，实验占70%；颁奖典礼将倒序公布名次"
                  : `${calendar.dateLabel}所在周`}
              </p>
              <div className="rank-block">
                <span>
                  {provincialEstimate
                    ? "回忆估分区间"
                    : isNationalTheory
                      ? "理论 T 分"
                      : isNationalExperiment
                        ? "综合分"
                        : pendingAssessment.type === "school"
                          ? "本次总分"
                          : isProvincialMock
                            ? "模拟成绩"
                        : "模拟排名"}
                </span>
                <strong>
                  {provincialEstimate
                    ? `${formatNumber(provincialEstimate.estimateLow)}—${formatNumber(provincialEstimate.estimateHigh)} / ${PROVINCIAL_MAX_SCORE}`
                    : isNationalTheory && nationalResult
                      ? formatNumber(nationalResult.theoryT)
                    : isNationalExperiment && nationalResult
                        ? formatNumber(nationalResult.finalScore)
                        : pendingAssessment.type === "school" &&
                            pendingAssessment.totalScore
                          ? `${formatNumber(pendingAssessment.totalScore)} / 750`
                          : isProvincialMock &&
                              typeof pendingAssessment.totalScore === "number"
                            ? `${formatNumber(pendingAssessment.totalScore)} / ${PROVINCIAL_MAX_SCORE}`
                    : pendingAssessment.rank}
                </strong>
                <small>
                  {provincialEstimate
                    ? `得分率 ${formatNumber(provincialScoreRate(provincialEstimate.estimateLow))}%—${formatNumber(provincialScoreRate(provincialEstimate.estimateHigh))}% · 预计全省第 ${provincialEstimate.estimateRankLow}—${provincialEstimate.estimateRankHigh} 名`
                    : isNationalTheory && nationalResult
                      ? `理论第 ${nationalResult.theoryRank} / ${nationalResult.participants} · ${
                          nationalResult.qualifiedForExperiment
                            ? "进入实验"
                            : "止步理论"
                        }`
                      : isNationalExperiment && nationalResult
                        ? `最终第 ${nationalResult.finalRank ?? "—"} / ${nationalResult.participants} · ${nationalResult.medal}${
                            isTrueSilverRank(nationalResult.finalRank)
                              ? "（真银牌）"
                              : ""
                          }`
                        : pendingAssessment.type === "school"
                          ? `校内第 ${pendingAssessment.rank} / ${pendingAssessment.participants} · 当前阶段掌握 ${formatNumber(pendingAssessment.regularCoverage ?? 0)}%`
                          : isProvincialMock &&
                              typeof pendingAssessment.totalScore === "number"
                            ? `得分率 ${formatNumber(provincialScoreRate(pendingAssessment.totalScore))}% · 预估第 ${pendingAssessment.rank} / ${pendingAssessment.participants}`
                    : `/ ${pendingAssessment.participants}`}
                </small>
              </div>
              {provincialEstimate && (
                <div className="assessment-warning estimate">
                  这只是根据答题回忆和非正式答案计算的区间，不是正式成绩。
                </div>
              )}
              {pendingAssessment.lowRegularPenalty && (
                <div className="assessment-warning">
                  当前阶段掌握率低于58%，本次考试已额外降低SAN与心态。
                </div>
              )}
              {pendingAssessment.type === "school" &&
                pendingAssessment.projectedGaokao && (
                  <div className="assessment-warning estimate">
                    按当前积累推算，高考总分潜力约{" "}
                    {formatNumber(pendingAssessment.projectedGaokao)} / 750。这里只是趋势，
                    不等于最终成绩。
                  </div>
                )}
            </aside>

            <article className="assessment-card">
              <div className="assessment-card-heading">
                <div>
                  <p className="kicker">SUBJECT BREAKDOWN</p>
                  <h2>
                    {provincialEstimate
                      ? "分模块答题回忆"
                      : nationalResult
                        ? "国赛分项结果"
                        : "分科结果与失分信号"}
                  </h2>
                </div>
                <span>只有存在小数时才显示一位</span>
              </div>

              <div className="subject-results">
                {pendingAssessment.subjects.map((subject) => (
                  <div key={subject.name}>
                    <span>{subject.name}</span>
                    <strong>
                      {formatNumber(subject.score)}
                      {subject.maxScore ? ` / ${subject.maxScore}` : ""}
                    </strong>
                    <i
                      style={{
                        width: `${
                          (subject.score / (subject.maxScore ?? 100)) * 100
                        }%`,
                      }}
                    />
                    <small>{subject.note}</small>
                  </div>
                ))}
              </div>

              <div className="assessment-choices">
                <button
                  className={assessmentChoice === "review" ? "selected" : ""}
                  onClick={() => setAssessmentChoice("review")}
                >
                  <strong>
                    {provincialEstimate ? "立刻对答案并记录争议题" : "完整复盘"}
                  </strong>
                  <small>
                    {provincialEstimate
                      ? "估分更精确，提前整理争议题，额外消耗SAN"
                      : pendingAssessment.type === "competition"
                      ? "思辨与教练好感提升，额外消耗SAN"
                      : "常规分数回升，额外消耗SAN"}
                  </small>
                </button>
                <button
                  className={assessmentChoice === "rank" ? "selected" : ""}
                  onClick={() => setAssessmentChoice("rank")}
                >
                  <strong>{provincialEstimate ? "只做粗略估分" : "只看排名"}</strong>
                  <small>
                    {provincialEstimate
                      ? "保留较宽估分区间，不反复回忆每一道题"
                      : "眼前压力较小，但心态会受到轻微影响"}
                  </small>
                </button>
                <button
                  className={assessmentChoice === "rest" ? "selected" : ""}
                  onClick={() => setAssessmentChoice("rest")}
                >
                  <strong>先休息</strong>
                  <small>SAN明显恢复，本次不获得复盘收益</small>
                </button>
              </div>

              <button
                className="primary-button assessment-confirm"
                disabled={!assessmentChoice}
                onClick={resolveAssessment}
              >
                完成复盘，继续 <span>→</span>
              </button>
            </article>
          </section>
        </main>
      );
    }

    if (pendingEvent) {
      return (
        <main
          className={`shell week-shell social-event-shell ${
            pendingEvent.visualNovel ? "visual-novel-shell" : ""
          } ${
            weekPhase.isTraining || pendingEvent.phase === "training"
              ? "training-shell"
              : pendingEvent.phase === "exam"
                ? "exam-shell"
                : ""
          }`}
        >
          <header className="topbar">
            <button className="brand-button" onClick={() => setScreen("origin")}>
              生竞人生
            </button>
            <div className="steps" aria-label="本周插曲">
              <span className="step done">第 {week - 1} 周已结算</span>
              <span className="step active">本周插曲</span>
              <span className="step">第 {week} 周待安排</span>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>

          <section className="week-layout">
            <aside className="week-meta">
              <p className="kicker">AN UNPLANNED MOMENT</p>
              <h1>第 {week} 周</h1>
              <p>计划之外，一件事情发生了。</p>
              <div className="mini-status">
                <span>
                  社交 <strong>{formatNumber(playerStats?.social ?? 0)}</strong>
                </span>
                <span>
                  同学好感{" "}
                  <strong>{formatNumber(playerStats?.peerFavor ?? 0)}</strong>
                </span>
                <span>
                  SAN <strong>{formatNumber(playerStats?.san ?? 0)}</strong>
                </span>
              </div>
            </aside>

            <article className="event-card">
              <h2>{seedRivalText(pendingEvent.title, seed)}</h2>
              {pendingEvent.body.map((paragraph) => (
                <p className="event-copy" key={paragraph}>
                  {seedRivalText(paragraph, seed)}
                </p>
              ))}
              {adaptiveRivalLine(pendingEvent, seed, playerStats!) && (
                <p className="event-copy adaptive-character-note">
                  {adaptiveRivalLine(pendingEvent, seed, playerStats!)}
                </p>
              )}
              <div className="choice-list">
                {pendingEvent.choices.map((choice, index) => (
                  <button
                    key={choice.id}
                    className={`choice-button ${eventChoice === choice.id ? "selected" : ""}`}
                    onClick={() => setEventChoice(choice.id)}
                  >
                    <span className="choice-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>
                      <strong>{seedRivalText(choice.title, seed)}</strong>
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="primary-button event-confirm"
                onClick={resolvePendingEvent}
                disabled={!selectedEventChoice}
              >
                记录选择，查看结果{" "}
                <span>→</span>
              </button>
            </article>
          </section>
        </main>
      );
    }

    if (careerTab === "journal" && playerStats) {
      return (
        <main className="shell planner-shell journal-shell">
          <header className="topbar career-topbar">
            <button className="brand-button" onClick={() => setScreen("origin")}>
              生竞人生
            </button>
            <div className="career-tabs" aria-label="生涯页面">
              <button onClick={() => setCareerTab("planner")}>本周计划</button>
              <button onClick={() => setCareerTab("rivals")}>竞争对手</button>
              <button onClick={() => setCareerTab("store")}>小卖部</button>
              <button className="active">周回顾</button>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>
          {keepsakeUi}
          <section className="journal-page">
            <div className="journal-heading">
              <p className="kicker">WEEKLY ARCHIVE</p>
              <h1>时间过去以后，选择才显出形状。</h1>
              <p>这里记录每周的固定安排、自主行动、事件选择和可见属性变化。</p>
            </div>
            {weekRecords.length === 0 ? (
              <div className="journal-empty">第一周尚未结算，目前还没有回顾记录。</div>
            ) : (
              <div className="journal-list">
                {[...weekRecords].reverse().map((record, index) => (
                  <details key={record.week} open={index === 0}>
                    <summary>
                      <span>第 {record.week} 周</span>
                      <strong>{record.headline}</strong>
                      <small>SAN {formatNumber(record.sanAfter ?? 0)}</small>
                    </summary>
                    <div className="journal-record-grid">
                      <section>
                        <h2>时间安排</h2>
                        {[...(record.fixedActions ?? []).map((item) => ({
                          ...item,
                          type: "固定",
                          count: 1,
                        })), ...(record.chosenActions ?? []).map((item) => ({
                          ...item,
                          type: "自主",
                        }))].map((item) => (
                          <p key={`${item.type}-${item.title}`}>
                            <span>{item.type}</span>
                            <strong>{item.title}</strong>
                            <small>{item.count > 1 ? `${item.count}次 · ` : ""}{item.cost}点</small>
                          </p>
                        ))}
                      </section>
                      <section>
                        <h2>事件与选择</h2>
                        {(record.moments ?? []).length > 0 ? (
                          (record.moments ?? []).map((moment, momentIndex) => (
                            <article key={`${momentIndex}-${moment.title}`}>
                              <strong>{moment.title}</strong>
                              {moment.choice && <span>{moment.choice}</span>}
                              {moment.result && <small>{moment.result}</small>}
                              {moment.effects && effectPreview(moment.effects) && (
                                <small className="journal-moment-effects">
                                  数值变化：{effectPreview(moment.effects)}
                                </small>
                              )}
                            </article>
                          ))
                        ) : (
                          <p className="journal-none">没有记录到额外事件。</p>
                        )}
                      </section>
                      <section>
                        <h2>可见变化</h2>
                        <div className="week-review-changes">
                          {record.changes.map((change) => (
                            <span className={change.value > 0 ? "positive" : "negative"} key={change.label}>
                              {change.label} {change.value > 0 ? "+" : ""}{formatNumber(change.value)}
                            </span>
                          ))}
                        </div>
                        <p className="journal-efficiency">
                          SAN学习效率 {Math.round(record.efficiency * 100)}% · 随机发挥{" "}
                          {record.fluctuation >= 1 ? "+" : ""}{Math.round((record.fluctuation - 1) * 100)}%
                        </p>
                      </section>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>
        </main>
      );
    }

    if (careerTab === "store" && playerStats) {
      return (
        <main className="shell planner-shell store-shell">
          <header className="topbar career-topbar">
            <button className="brand-button" onClick={() => setScreen("origin")}>
              生竞人生
            </button>
            <div className="career-tabs" aria-label="生涯页面">
              <button onClick={() => setCareerTab("planner")}>本周计划</button>
              <button onClick={() => setCareerTab("rivals")}>竞争对手</button>
              <button className="active">小卖部</button>
              <button onClick={() => setCareerTab("journal")}>周回顾</button>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>

          {keepsakeUi}
          <section className="store-page">
            <div className="store-heading">
              <div>
                <p className="kicker">THE CORNER SHOP</p>
                <h1>有些东西没有报销理由，买来却可能改变一段故事。</h1>
                <p>
                  道具只使用个人零花钱。咖啡、糖和学习用品提供短期效果；
                  种子、卡牌、幸运笔等特殊物品会在后续周数解锁事件链。
                </p>
              </div>
              <aside>
                <span>当前零花钱</span>
                <strong>¥{formatNumber(playerStats.pocketMoney)}</strong>
                <small>
                  家庭支持 {formatNumber(playerStats.familySupport)} · 本周额外行动{" "}
                  +{weeklyBonusPoints}
                </small>
              </aside>
            </div>

            {storeNotice && <div className="store-notice">{storeNotice}</div>}

            <div className="store-grid">
              {shopItems.map((item) => {
                const owned = inventory[item.id] ?? 0;
                const soldOut = !item.consumable && owned > 0;
                const salePrice =
                  selected.id === "wealthy-family"
                    ? Math.ceil(item.price * 0.9)
                    : item.price;
                const cannotAfford = playerStats.pocketMoney < salePrice;
                return (
                  <article
                    className={`store-item rarity-${item.rarity}`}
                    key={item.id}
                  >
                    <div className="store-item-top">
                      <span>
                        {item.category} · {rarityLabels[item.rarity]}
                      </span>
                      <strong>
                        ¥{salePrice}
                        {salePrice !== item.price && <del>¥{item.price}</del>}
                      </strong>
                    </div>
                    <span
                      className="item-sprite store-sprite"
                      style={itemSpriteStyle(item.atlasIndex)}
                      aria-hidden="true"
                    />
                    <h2>{item.name}</h2>
                    <p>
                      {item.effectVisible
                        ? item.description
                        : owned > 0
                          ? "已经收进书包或抽屉。它是否有用，要等故事真正发生时才知道。"
                          : "看起来未必有用，也许会在未来触发某段经历。"}
                    </p>
                    <small>{item.flavor}</small>
                    <div className="store-item-actions">
                      <button
                        disabled={soldOut || cannotAfford}
                        onClick={() => purchaseShopItem(item)}
                      >
                        {soldOut
                          ? "已经拥有"
                          : cannotAfford
                            ? "零花钱不足"
                            : "购买"}
                      </button>
                      {item.consumable && (
                        <button
                          className="use-item"
                          disabled={owned <= 0}
                          onClick={() => useShopItem(item)}
                        >
                          使用 · 库存 {owned}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <section className="inventory-panel">
              <div>
                <p className="kicker">INVENTORY</p>
                <h2>书包与抽屉</h2>
                <button
                  className="open-drawer-button"
                  onClick={() => setKeepsakeOpen(true)}
                >
                  打开纪念物抽屉
                </button>
              </div>
              <div>
                {shopItems
                  .filter((item) => (inventory[item.id] ?? 0) > 0)
                  .sort((a, b) => {
                    const order: Record<KeepsakeRarity, number> = {
                      gold: 0,
                      purple: 1,
                      blue: 2,
                      green: 3,
                      white: 4,
                    };
                    return order[a.rarity] - order[b.rarity] || a.name.localeCompare(b.name, "zh-CN");
                  })
                  .map((item) => (
                    <span key={item.id}>
                      {item.name} × {inventory[item.id]}
                    </span>
                  ))}
                {!shopItems.some((item) => (inventory[item.id] ?? 0) > 0) && (
                  <span>目前没有道具。</span>
                )}
              </div>
            </section>
          </section>
        </main>
      );
    }

    if (careerTab === "rivals" && playerStats) {
      return (
        <main
          className={`shell planner-shell ${weekPhase.isTraining ? "training-shell" : ""}`}
        >
          <header className="topbar career-topbar">
            <button className="brand-button" onClick={() => setScreen("origin")}>
              生竞人生
            </button>
            <div className="career-tabs" aria-label="生涯页面">
              <button onClick={() => setCareerTab("planner")}>本周计划</button>
              <button className="active">竞争对手</button>
              <button onClick={() => setCareerTab("store")}>小卖部</button>
              <button onClick={() => setCareerTab("journal")}>周回顾</button>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>
          {keepsakeUi}
          <RivalsPage
            stats={playerStats}
            week={week}
            seed={seed}
            remainingTime={remainingTime}
            storyTags={storyTags}
            schoolName={generated.school}
            relationships={rivalRelationships}
            retiredRivalIds={retiredRivalIds}
            retiredRivalWeeks={retiredRivalWeeks}
            provincialAttempts={provincialAttempts}
            nationalAttempts={nationalAttempts}
            onStudy={(rival) => addAction(makeRivalStudyAction(rival))}
            onBack={() => setCareerTab("planner")}
          />
        </main>
      );
    }

    return (
      <main
        className={`shell planner-shell ${weekPhase.isTraining ? "training-shell" : ""}`}
      >
        <header className="topbar career-topbar">
          <button className="brand-button" onClick={() => setScreen("origin")}>
            生竞人生
          </button>
          <div className="career-tabs" aria-label="生涯页面">
            <button className="active">本周计划</button>
            <button onClick={() => setCareerTab("rivals")}>竞争对手</button>
            <button onClick={() => setCareerTab("store")}>小卖部</button>
            <button onClick={() => setCareerTab("journal")}>周回顾</button>
          </div>
          <div className="save-controls">
            <button
              onClick={() => {
                refreshSaveSlots();
                setSaveManagerOpen(true);
              }}
            >
              存读档
            </button>
            {saveNotice && <small>{saveNotice}</small>}
          </div>
          <span className="seed-chip">{seed}</span>
        </header>
        {saveDialog}
        {achievementUi}
        {keepsakeUi}

        <section className="planner-layout">
          <aside className="status-panel">
            <div className="week-number">
              <p className="kicker">WEEKLY SCHEDULE</p>
              <strong>{String(week).padStart(2, "0")}</strong>
              <span>{weekPhase.label}</span>
              <div className="calendar-focus">
                <b>{calendar.dateLabel}</b>
                <em>
                  距本年度五月联赛
                  <strong>
                    {Math.max(
                      0,
                      (week <= calendar.firstExamWeek
                        ? calendar.firstExamWeek
                        : calendar.secondExamWeek) - week,
                    )}
                  </strong>
                  周
                </em>
              </div>
            </div>

            <div className="time-budget">
              <div>
                <span>本周剩余时间</span>
                <strong>
                  {remainingTime} / {totalFreePoints}
                </strong>
              </div>
              <div
                className="time-dots"
                style={{
                  gridTemplateColumns: `repeat(${totalFreePoints}, 1fr)`,
                }}
                aria-label={`剩余 ${remainingTime} 个时间点`}
              >
                {Array.from({ length: totalFreePoints }).map((_, index) => (
                  <i key={index} className={index < usedTime ? "used" : ""} />
                ))}
              </div>
              {(weeklyBonusPoints > 0 || weeklyStudyBoost > 0) && (
                <small className="weekly-item-bonus">
                  道具效果：额外行动 +{weeklyBonusPoints} · 学习效率 +
                  {(weeklyStudyBoost * 100).toFixed(0)}%
                </small>
              )}
            </div>

            <div className="fixed-actions">
              <p>固定安排 · 占用 {10 - weekPhase.freePoints} 点</p>
              {weekPhase.fixed.map((item) => (
                <div key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.cost} 点</strong>
                  <small>
                    {effectPreview(item.effects)}
                    {item.bookEffect?.course
                      ? ` · ${
                          textbooks.find(
                            (book) => book.id === item.bookEffect?.bookId,
                          )?.shortTitle ?? "指定教材"
                        }课程进度+${formatNumber(item.bookEffect.course)}%`
                      : ""}
                    {item.bookEffect?.practice
                      ? ` · 刷题+${formatNumber(item.bookEffect.practice)}轮`
                      : ""}
                    {item.coachBonus
                      ? ` · 跟随教练效率×${formatNumber(item.coachBonus)}`
                      : ""}
                  </small>
                </div>
              ))}
            </div>

            {playerStats && (
              <div
                className={`efficiency-meter ${playerStats.san < 45 ? "danger" : ""}`}
              >
                <span>当前SAN学习效率</span>
                <strong>{(sanEfficiency(playerStats.san) * 100).toFixed(0)}%</strong>
                <small>
                  {playerStats.san < 45
                    ? "已跌破红线：效率进入陡降区"
                    : "正常区间：与SAN近似线性相关"}
                </small>
                <small>
                  心态决定SAN消耗倍率：×
                  {formatNumber(mindsetSanCostMultiplier(playerStats.mindset))}
                </small>
              </div>
            )}

            {playerStats && (
              <>
                <div className="status-section">
                  <p>竞赛能力 · 各模块教材掌握度加权</p>
                  <PlannerStat label="模块一" value={playerStats.module1} />
                  <PlannerStat label="模块二" value={playerStats.module2} />
                  <PlannerStat label="模块三" value={playerStats.module3} />
                  <PlannerStat label="模块四" value={playerStats.module4} />
                  <PlannerStat label="思辨" value={playerStats.reasoning} />
                  <PlannerStat label="做题速率" value={playerStats.problemSpeed} />
                  <PlannerStat
                    label="实验"
                    value={playerStats.experiment}
                    locked={!playerStats.experimentUnlocked}
                  />
                </div>
                <div className="status-section compact">
                  <p>个人状态</p>
                  <StatusNumber label="SAN" value={playerStats.san} />
                  <StatusNumber label="心态" value={playerStats.mindset} />
                  <StatusNumber label="社交" value={playerStats.social} />
                  <div className="regular-unlock-card">
                    <span>常规积累</span>
                    <strong>
                      {formatNumber(playerStats.academics)} /{" "}
                      {formatNumber(regularUnlockedScore(week))}
                    </strong>
                    <i>
                      <b
                        style={{
                          width: `${Math.min(
                            100,
                            regularCoverage(playerStats, week) * 100,
                          )}%`,
                        }}
                      />
                    </i>
                    <small>
                      高考趋势 {formatNumber(projectedGaokaoScore(playerStats, week))} /
                      750 · 当前阶段掌握{" "}
                      {formatNumber(regularCoverage(playerStats, week) * 100)}%
                    </small>
                  </div>
                  <StatusNumber label="教练好感" value={playerStats.coachFavor} />
                  <StatusNumber label="同学好感" value={playerStats.peerFavor} />
                  <StatusNumber
                    label="家庭支持"
                    value={playerStats.familySupport}
                  />
                  {activePartnerEntry && (
                    <div className="close-relationship-status partner">
                      <span>恋人 · {relationshipName(activePartnerEntry[0])}</span>
                      <strong>好感 {formatNumber(activePartnerEntry[1].bond)}</strong>
                      <small>
                        信任 {formatNumber(activePartnerEntry[1].trust)} · 每两周占用1点时间 ·
                        当前学习效率影响{" "}
                        {formatNumber(relationshipLearningBoost(rivalRelationships) * 100)}%
                      </small>
                      <button className="relationship-breakup-button" onClick={() => {
                        const result = breakupRelationship(activePartnerEntry[1], week - activePartnerEntry[1].lastInteractionWeek >= 6 ? "peaceful" : "painful", week);
                        setRivalRelationships((current) => ({ ...current, [activePartnerEntry[0]]: result.relation }));
                        setPlayerStats((current) => current ? applyEffects(current, { san: result.san, mindset: result.mindset }) : current);
                        setStoryTags((current) => [...new Set([...current, "关系:分手", `关系:${activePartnerEntry[0]}:${result.peaceful ? "和平分手" : "主动分手"}`])]);
                        setAllowanceNotice(result.peaceful ? "你们承认长久失联已经改变了关系，平静地结束了恋爱。" : "你提出分手。关系立即结束，情绪影响已经进入本周状态。复合需要日后再次约对方学习。" );
                      }}>提出分手<small>立即结束关系；无冷静期</small></button>
                    </div>
                  )}
                  {!activePartnerEntry && bestFriendEntry && (
                    <div className="close-relationship-status friend">
                      <span>挚友 · {relationshipName(bestFriendEntry[0])}</span>
                      <strong>亲近 {formatNumber(bestFriendEntry[1].bond)}</strong>
                      <small>信任 {formatNumber(bestFriendEntry[1].trust)} · 会参与退赛、考试与后日谈</small>
                    </div>
                  )}
                  <StatusNumber label="零花钱" value={playerStats.pocketMoney} money />
                  <StatusNumber label="在队人数" value={activeTeamSize} />
                  {allowanceNotice && (
                    <div className="allowance-feedback" role="status">
                      {allowanceNotice}
                    </div>
                  )}
                  <button
                    className="allowance-button"
                    onClick={() => {
                      setAllowanceRequestOpen(true);
                      setAllowanceChoice(null);
                      setAllowanceNotice(null);
                    }}
                  >
                    问父母要点钱
                    <small>
                      每四周固定到账 ¥{formatNumber(selected.stats.monthlyPocketMoney)}；
                      额外申请只会轻微影响支持；家庭态度更受沟通与成绩经历影响。
                    </small>
                  </button>
                  <button
                    className="retirement-button"
                    disabled={week < retirementCooldownUntil}
                    onClick={() => {
                      setRetirementFlow({
                        stage: retirementStageFor(
                          week,
                          storyTags,
                          nationalAttempts,
                        ),
                        step: 0,
                        initiatedBy: "self",
                      });
                      setRetirementChoice(null);
                    }}
                  >
                    {week < retirementCooldownUntil
                      ? `退赛冷静期（第${retirementCooldownUntil}周后）`
                      : "提出退赛"}
                    <small>
                      这不是即时决定；身边的人会根据你的成绩与关系作出回应。
                    </small>
                  </button>
                </div>
              </>
            )}
          </aside>

          <section className="planner-main">
            <div className="planner-heading">
              <div>
                <p className="kicker">安排这一周</p>
                <h1>时间不会自己流向正确的地方。</h1>
              </div>
              <p>
                行动可以重复选择。排满剩余时间后结算；有些选择的影响要过一段时间才会显现。
              </p>
            </div>

            <section className="real-question-settings">
              <div><p className="kicker">REVIEWED REAL QUESTIONS</p><h2>真实题目模式</h2><p>在联赛全真模拟、正式联赛与国赛理论考试中追加四模块各一题；放弃的题目不参与加权。</p></div>
              <div><button className={realQuestionMode ? "selected" : ""} onClick={() => setRealQuestionMode((current) => !current)}>{realQuestionMode ? "已开启" : "开启真实题目"}</button><button onClick={() => setMistakeBookOpen(true)}>错题本 {Object.keys(mistakeBook).length}</button></div>
            </section>
            {mistakeBookOpen && <div className="developer-editor-backdrop"><section className="mistake-book-modal" role="dialog" aria-modal="true"><header><div><p className="kicker">MISTAKE BOOK</p><h2>真实题目错题本</h2></div><button onClick={() => setMistakeBookOpen(false)}>×</button></header><div>{Object.values(mistakeBook).map((record) => { const question = reviewedQuestionBank.find((item) => item.id === record.questionId); return question ? <article key={record.questionId}><strong>{question.year} 年第 {question.number} 题 · {specialtyLabels[question.module]}</strong><p>{question.prompt}</p><small>累计错误 {record.attempts} 次 · 最佳重合 {record.bestMatches}/4</small></article> : null; })}{!Object.keys(mistakeBook).length && <p>还没有记录错题。</p>}</div></section></div>}

            <section className="book-section">
              <div className="section-heading">
                <h2>先选择模块，再选择教材</h2>
                <span>课程进度 × 记忆保持率 = 当前有效掌握</span>
              </div>
              <div className="module-selector">
                {(
                  [
                    ["module1", "第一模块", "生化 · 分子 · 细胞 · 生信"],
                    ["module2", "第二模块", "植物 · 动物 · 生理"],
                    ["module3", "第三模块", "行为 · 生态"],
                    ["module4", "第四模块", "遗传 · 进化"],
                  ] as Array<[Textbook["module"], string, string]>
                ).map(([moduleKey, moduleLabel, disciplines]) => {
                  const moduleBooks = textbooks.filter(
                    (book) => book.module === moduleKey,
                  );
                  const average =
                    moduleBooks.reduce(
                      (total, book) =>
                        total +
                        effectiveBookProgress(
                          playerStats?.bookStudy[book.id] ?? {
                            course: 0,
                            notes: 0,
                            practice: 0,
                            retention: 100,
                            lectureSessions: 0,
                            lastStudiedWeek: 0,
                          },
                        ),
                      0,
                    ) / Math.max(1, moduleBooks.length);
                  return (
                    <button
                      key={moduleKey}
                      className={selectedModule === moduleKey ? "selected" : ""}
                      onClick={() => {
                        setSelectedModule(moduleKey);
                        setSelectedBookId(moduleBooks[0].id);
                      }}
                    >
                      <span>{moduleLabel}</span>
                      <strong>{formatNumber(average)}%</strong>
                      <small>{disciplines}</small>
                    </button>
                  );
                })}
              </div>
              <div className="book-grid">
                {textbooks
                  .filter((book) => book.module === selectedModule)
                  .map((book) => {
                  const state = playerStats?.bookStudy[book.id];
                  const progress = state ? effectiveBookProgress(state) : 0;
                  return (
                    <button
                      key={book.id}
                      className={`book-card ${book.id === selectedBook.id ? "selected" : ""}`}
                      onClick={() => setSelectedBookId(book.id)}
                    >
                      <span>{book.discipline}</span>
                      <strong>{book.title}</strong>
                      <small>
                        难度 {"●".repeat(book.difficulty)}
                        {"○".repeat(5 - book.difficulty)}
                      </small>
                      <div>
                        <i style={{ width: `${progress}%` }} />
                      </div>
                      <em>
                        有效 {formatNumber(progress)}% · 记忆{" "}
                        {formatNumber(state?.retention ?? 100)}%
                      </em>
                    </button>
                  );
                })}
              </div>

              <div className="selected-book">
                <div>
                  <p className="kicker">当前教材 · {selectedBook.discipline}</p>
                  <h2>{selectedBook.title}</h2>
                  <p>{selectedBook.description}</p>
                  {playerStats && (
                    <div className="book-progress-detail">
                      <span>
                        课程掌握{" "}
                        <strong>
                          {formatNumber(playerStats.bookStudy[selectedBook.id].course)}%
                        </strong>
                      </span>
                      <span>
                        笔记{" "}
                        <strong>
                          {formatNumber(playerStats.bookStudy[selectedBook.id].notes)}%
                        </strong>
                      </span>
                      <span>
                        刷题{" "}
                        <strong>
                          {formatNumber(playerStats.bookStudy[selectedBook.id].practice)} 轮
                        </strong>
                      </span>
                      <span>
                        保持率{" "}
                        <strong>
                          {formatNumber(playerStats.bookStudy[selectedBook.id].retention)}%
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
                <div className="book-methods">
                  {(["lecture", "notes", "review-notes", "practice"] as const).map((mode) => {
                    const action = makeBookAction(selectedBook, mode);
                    const state = playerStats?.bookStudy[selectedBook.id];
                    const scheduledLectureSessions = schedule.reduce(
                      (total, scheduledAction) =>
                        total +
                        (scheduledAction.bookEffect?.bookId === selectedBook.id
                          ? (scheduledAction.bookEffect.lectureSession ?? 0)
                          : 0),
                      0,
                    );
                    const lectureExhausted =
                      !state ||
                      state.lectureSessions + scheduledLectureSessions >=
                        selectedBook.maxLectureSessions;
                    const notesComplete = !state || state.notes >= 100;
                    const reviewLocked = !state || state.notes < 25;
                    const practiceLocked =
                      !state ||
                      (state.course < 30 &&
                        state.notes < 30 &&
                        effectiveBookProgress(state) < 18);
                    const locked =
                      (mode === "lecture" && lectureExhausted) ||
                      (mode === "notes" && notesComplete) ||
                      (mode === "review-notes" && reviewLocked) ||
                      (mode === "practice" && practiceLocked);
                    const methodLabel =
                      mode === "lecture"
                        ? "看课"
                        : mode === "notes"
                          ? "抄笔记"
                          : mode === "review-notes"
                            ? "看笔记"
                            : "刷题";
                    return (
                      <button
                        className="method-card"
                        key={mode}
                        onClick={() => addAction(action)}
                        disabled={remainingTime < action.cost || locked}
                      >
                        <span>
                          {mode === "lecture"
                            ? `次数限制 · 已用/已安排 ${
                                Math.trunc(state?.lectureSessions ?? 0) +
                                scheduledLectureSessions
                              }/${selectedBook.maxLectureSessions} · 剩余 ${Math.max(
                                0,
                                selectedBook.maxLectureSessions -
                                  Math.trunc(state?.lectureSessions ?? 0) -
                                  scheduledLectureSessions,
                              )}`
                            : mode === "notes"
                              ? "扎实路线 · 消耗2点"
                              : mode === "review-notes"
                                ? state && state.notes >= 25
                                  ? "已解锁"
                                  : "笔记25%后解锁"
                                : practiceLocked
                                  ? "看课或笔记达到门槛后解锁"
                                  : "无次数上限"}
                        </span>
                        <strong>{methodLabel}</strong>
                        <small>{action.description}</small>
                        <i>
                          {action.bookEffect?.course
                            ? `课程 +${formatNumber(action.bookEffect.course)}% · `
                            : ""}
                          {action.bookEffect?.notes
                            ? `笔记 +${formatNumber(action.bookEffect.notes)}% · `
                            : ""}
                          {action.bookEffect?.practice
                            ? `刷题 +${formatNumber(action.bookEffect.practice)}轮 · `
                            : ""}
                          {effectPreview(action.effects)}
                        </i>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="action-group supplementary-library">
              <h2>扩充书目</h2>
              <p className="section-note">由随机事件解锁。不计入四模块总掌握，只对相关联赛、国赛理论题及指定实验提供局部加权。</p>
              <div className="book-grid">
                {supplementaryBooks.filter((book) => book.module === selectedModule).map((book) => {
                  const state = playerStats?.supplementaryBookStudy[book.id];
                  const unlocked = Boolean(state?.unlocked);
                  return <button key={book.id} className={`book-card supplementary ${selectedSupplementaryBookId === book.id ? "selected" : ""} ${unlocked ? "" : "locked"}`} disabled={!unlocked} onClick={() => setSelectedSupplementaryBookId(book.id)}>
                    <span>{unlocked ? "扩充阅读" : "随机事件解锁"}</span><strong>{unlocked ? book.title : "???"}</strong>
                    <div><i style={{ width: `${effectiveSupplementaryMastery(state)}%` }}/></div>
                    <em>{unlocked ? `有效 ${formatNumber(effectiveSupplementaryMastery(state))}% · 记忆 ${formatNumber(state?.retention ?? 100)}%` : "尚未遇见这本书"}</em>
                  </button>;
                })}
              </div>
              {selectedSupplementaryBookId && playerStats?.supplementaryBookStudy[selectedSupplementaryBookId]?.unlocked && (() => {
                const book = supplementaryBooks.find((item) => item.id === selectedSupplementaryBookId)!;
                return <div className="selected-book supplementary-selected"><div><p className="kicker">扩充书目</p><h2>{book.title}</h2><p>{book.description}</p><small>不会增加模块面板掌握；只在抽到相关题目时参与判定。</small></div><div className="book-methods">{(["browse", "research"] as const).map((mode) => { const action = makeSupplementaryBookAction(book.id, mode); return <button className="method-card" key={mode} disabled={remainingTime < action.cost} onClick={() => addAction(action)}><span>{action.cost} 点行动</span><strong>{mode === "browse" ? "简单浏览" : "深入研究"}</strong><small>{action.description}</small><i>掌握 +{action.supplementaryBookEffect?.mastery}% · {effectPreview(action.effects)}</i></button>; })}</div></div>;
              })()}
            </section>

            {playerStats?.experimentUnlocked && (
              <section className="action-group experiment-actions">
                <h2>分模块实验训练</h2>
                <p className="section-note">
                  每次消耗2点。对应模块理论越扎实，实验提升越快；实验训练也会轻微反哺本模块教材掌握与记忆。
                </p>
                <div className="action-grid">
                  {(
                    [
                      "module1",
                      "module2",
                      "module3",
                      "module4",
                    ] as const
                  ).map((module) => {
                    const action = makeExperimentAction(module);
                    return (
                      <button
                        key={action.id}
                        className="action-card"
                        onClick={() => addAction(action)}
                        disabled={action.cost > remainingTime}
                      >
                        <span className="action-cost">{action.cost} 点</span>
                        <strong>{action.title}</strong>
                        <small>{action.description}</small>
                        <i>
                          当前专项{" "}
                          {formatNumber(playerStats?.experimentModules[module] ?? 0)} ·
                          SAN消耗较高
                        </i>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="action-groups secondary-actions">
              {[
                ["study", "专项练习"],
                ["regular", "额外常规学习"],
                ["relationship", "人际关系"],
                ["recovery", "恢复与摸鱼"],
              ].map(([category, label]) => (
                <section className="action-group" key={category}>
                  <h2>{label}</h2>
                  <div className="action-grid">
                    {weeklyActions
                      .filter(
                        (action) =>
                          action.category === category &&
                          !(weekPhase.isTraining && action.category === "regular"),
                      )
                      .map((action) => {
                        const shownCost =
                          action.id === "slack-off"
                            ? slackProjection(
                                playerStats,
                                schedule.filter((item) => item.id === "slack-off").length,
                              ).cost
                            : action.cost;
                        const cannotAfford =
                          (action.effects.pocketMoney ?? 0) < 0 &&
                          (playerStats?.pocketMoney ?? 0) +
                            (action.effects.pocketMoney ?? 0) <
                            0;
                        return (
                          <button
                            key={action.id}
                            className="action-card"
                            onClick={() => addAction(action)}
                            disabled={shownCost > remainingTime || cannotAfford}
                          >
                            <span className="action-cost">{shownCost} 点</span>
                            <strong>{action.title}</strong>
                            <small>{action.description}</small>
                            <i>
                              {action.id === "slack-off"
                                ? (() => {
                                    const current = slackProjection(
                                      playerStats,
                                      schedule.filter((item) => item.id === "slack-off").length,
                                    );
                                    return `本次 SAN +${formatNumber(current.san)} · 心态 ${formatNumber(current.mindset)}；长期影响不会立刻出现`;
                                  })()
                                : effectPreview(action.effects)}
                            </i>
                          </button>
                        );
                      })}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <aside className="schedule-panel">
            <div className="schedule-heading">
              <div>
                <p className="kicker">本周计划</p>
                <h2>{usedTime === 0 ? "还没有安排" : `已安排 ${usedTime} 点`}</h2>
              </div>
              {schedule.length > 0 && (
                <button className="clear-button" onClick={() => setSchedule([])}>
                  清空
                </button>
              )}
            </div>

            <div className="schedule-list">
              {relationshipTimeCost > 0 && activePartnerEntry && (
                <div className="schedule-item fixed-relationship-time">
                  <span>♥</span>
                  <strong>与{relationshipName(activePartnerEntry[0])}相处</strong>
                  <small>-1 点</small>
                  <i>固定</i>
                </div>
              )}
              {schedule.length === 0 ? (
                <p className="empty-schedule">
                  从左侧选择行动。相同的学习行动可以在一周内重复多次。
                </p>
              ) : (
                schedule.map((action, index) => (
                  <button
                    className="schedule-item"
                    key={`${action.id}-${index}`}
                    onClick={() => removeAction(index)}
                    aria-label={`移除 ${action.title}`}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{action.title}</strong>
                    <small>-{action.cost} 点</small>
                    <i>×</i>
                  </button>
                ))
              )}
            </div>

            <div className="schedule-total">
              <span>{remainingTime === 0 ? "计划已排满" : `还需安排 ${remainingTime} 点`}</span>
              <button
                className="primary-button"
                onClick={settleWeek}
                disabled={remainingTime !== 0}
              >
                结算并进入第 {week + 1} 周 <span>→</span>
              </button>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="origin-brand-credit">
          <button className="brand-button">生竞人生</button>
          <span>感谢生竞幻想乡群友共创</span>
        </div>
        <div className="steps" aria-label="开局进度">
          <span className="step active">01 起点</span>
          <span className="step">02 档案</span>
          <span className="step">03 第一周</span>
        </div>
        <div className="save-controls origin-save">
          <button onClick={() => loadGame(true)} disabled={!hasSave}>
            {hasSave ? "继续最近进度" : "暂无存档"}
          </button>
          <button
            onClick={() => {
              refreshSaveSlots();
              setSaveManagerOpen(true);
            }}
            disabled={!hasSave}
          >
            存档柜
          </button>
          {saveNotice && <small>{saveNotice}</small>}
        </div>
        <span className="version">HUMANITY BUILD · 1.1</span>
      </header>
      {saveDialog}
      {achievementUi}
      {keepsakeUi}

      <section className="origin-layout">
        <div className="origin-intro">
          <p className="kicker">一场为期两年的选择实验</p>
          <h1>选择你的起点。</h1>
          <p>
            出身不会替你赢得比赛，只会改变你最初拥有什么、缺少什么，以及别人怎样期待你。
          </p>

          <div className="identity-form">
            <label htmlFor="player-name">你的名字</label>
            <input
              id="player-name"
              value={name}
              maxLength={12}
              onChange={(event) => setName(event.target.value)}
              placeholder="输入姓名"
            />
          </div>

          <div className="gender-selector origin-gender-selector" aria-label="选择主角性别">
            <span>主角性别</span>
            <div>
              <button
                type="button"
                aria-pressed={playerGender === "female"}
                className={playerGender === "female" ? "selected" : ""}
                onClick={() => setPlayerGender("female")}
              >
                女生
              </button>
              <button
                type="button"
                aria-pressed={playerGender === "male"}
                className={playerGender === "male" ? "selected" : ""}
                onClick={() => setPlayerGender("male")}
              >
                男生
              </button>
            </div>
            <small>影响可以发展朦胧好感与恋爱的人物；挚友线不受限制。</small>
          </div>
        </div>

        <div className="origin-list" role="listbox" aria-label="选择人物出身">
          {origins.map((origin) => {
            const active = origin.id === selected.id;
            return (
              <button
                key={origin.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`origin-row ${active ? "active" : ""}`}
                onClick={() => setSelectedId(origin.id)}
              >
                <span className="origin-number">{origin.number}</span>
                <span className="origin-name">
                  <strong>{origin.title}</strong>
                  <small>{origin.subtitle}</small>
                </span>
                <span className="origin-arrow">{active ? "●" : "○"}</span>
              </button>
            );
          })}
        </div>

        <aside className="origin-detail">
          <div className="detail-topline">
            <span>当前选择</span>
            <span>{selected.number} / 05</span>
          </div>
          <h2>{selected.title}</h2>
          <p className="detail-subtitle">{selected.subtitle}</p>
          <p className="detail-story">{selected.story}</p>

          <div className="tradeoff good">
            <span>优势</span>
            <p>{selected.upside}</p>
          </div>
          <div className="tradeoff risk">
            <span>代价</span>
            <p>{selected.cost}</p>
          </div>

          <div className="compact-stats">
            <CompactStat name="家庭支持" value={selected.stats.familySupport} />
            <CompactStat name="学校支持" value={selected.stats.schoolSupport} />
            <CompactStat name="中考基础指数" value={selected.stats.academics} />
            <CompactStat name="SAN" value={selected.stats.san} />
          </div>

          <div className="seed-box">
            <div>
              <label htmlFor="seed">世界种子</label>
              <p>决定学校细节、对手行情和省队名额</p>
            </div>
            <input
              id="seed"
              value={seed}
              onChange={(event) => setSeed(event.target.value.toUpperCase())}
              maxLength={24}
            />
          </div>

          <div className="detail-actions">
            <button className="dice-button" onClick={randomize} aria-label="随机起点与种子">
              ↻ 随机人生
            </button>
            <button
              className="primary-button"
              onClick={() => setScreen("profile")}
              disabled={!name.trim() || !seed.trim()}
            >
              生成档案 <span>→</span>
            </button>
          </div>
        </aside>
      </section>

      <section className="developer-home-tools">
        <div className="developer-changelog-panel">
          <div className="section-heading"><div><p className="kicker">DEVELOPER CHANGELOG</p><h2>开发者更新日志</h2></div>{process.env.NODE_ENV !== "production" && <DeveloperStoryEditor npcNames={storyNpcNames} npcLabels={storyNpcLabels} events={[
            openingEvent,
            ...Object.values(leaveMilestoneEvents),
            ...Object.values(trainingMilestoneEvents),
            ...weeklySocialEvents,
            ...linkedStoryDeveloperEvents,
            ...fantasyStoryDeveloperCatalog(seed),
            ...achievementStoryDeveloperCatalog(seed),
            ...supplementaryUnlockDeveloperCatalog(),
            ...retirementDeveloperCatalog(),
            ...pageFlowDeveloperCatalog(seed),
            ...rivals
              .filter((rival) => rival.scope === "school-peer")
              .flatMap((rival) => {
                const identity = seededRivalIdentity(rival, seed);
                const candidate = {
                  rival: { ...rival, name: identity.name, personality: identity.personality, studyStyle: identity.studyStyle },
                  gender: identity.gender,
                  personalityKey: identity.personalityKey,
                  innerConflictKey: identity.innerConflictKey,
                };
                return [
                  ...relationshipStoryDeveloperCatalog({
                    seed,
                    playerGender,
                    retiredRivalIds: [],
                    coachFavor: 12,
                    familySupport: 55,
                    regularPerformance: 70,
                    competitionPerformance: 70,
                    coachStrictness: "balanced",
                  }, candidate),
                  ...relationshipDailyDeveloperCatalog(candidate, seed),
                  ...relationshipPersonalityDeveloperCatalog(candidate, seed),
                ];
              }),
            ...(pendingEvent ? [pendingEvent] : []),
          ]} />}</div>
          <div className="changelog-list">{developerChangelog.map((entry) => <article key={entry.version}><header><strong>v{entry.version} · {entry.title}</strong><time>{entry.date}</time></header><ul>{entry.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
        </div>
      </section>

      <footer className="site-note">
        <span>所有公开机构、学校与人物均为虚构组合</span>
        <span>一周共 10 点；固定安排会占用其中一部分</span>
      </footer>
    </main>
  );
}

function RivalsPage({
  stats,
  week,
  seed,
  remainingTime,
  storyTags,
  schoolName,
  relationships,
  retiredRivalIds,
  retiredRivalWeeks,
  provincialAttempts,
  nationalAttempts,
  onStudy,
  onBack,
}: {
  stats: PlayerStats;
  week: number;
  seed: string;
  remainingTime: number;
  storyTags: string[];
  schoolName: string;
  relationships: Record<string, RivalRelationship>;
  retiredRivalIds: string[];
  retiredRivalWeeks: Record<string, number>;
  provincialAttempts: ProvincialAttempt[];
  nationalAttempts: NationalAttempt[];
  onStudy: (rival: Rival) => void;
  onBack: () => void;
}) {
  const scopeAvailable = (scope: Rival["scope"]) => {
    if (scope === "school-peer") return true;
    if (scope === "school-other") return week >= 12;
    if (scope === "province")
      return week >= 18 && (stats.social >= 50 || storyTags.includes("进入省内选手群"));
    return week >= 82;
  };
  const knownCount = rivals.filter(
    (rival) =>
      scopeAvailable(rival.scope) &&
      week >= rival.revealWeek &&
      stats.social >= rival.revealSocial,
  ).length;
  const groups: Array<{
    scope: Rival["scope"];
    title: string;
    note: string;
    lockedText: string;
  }> = [
    {
      scope: "school-peer",
      title: "本校 · 同届",
      note: "你最早认识的竞争者，也是每天会在竞赛教室见到的人。",
      lockedText: "",
    },
    {
      scope: "school-other",
      title: "本校 · 学长学姐与学弟学妹",
      note: "随着队内活动增加，年级之间的边界开始松动。",
      lockedText: "进入高一竞赛队日常后解锁",
    },
    {
      scope: "province",
      title: "本省 · 外校选手",
      note: "培训、联考与选手群把本省的核心竞争者连到了一起。",
      lockedText: "第18周后，且社交达到50或进入省内选手群",
    },
    {
      scope: "national",
      title: "全国 · 国赛选手",
      note: "只有进入国赛阶段，全国名单才真正从传闻变成具体的人。",
      lockedText: "进入国赛阶段后解锁",
    },
  ];

  return (
    <section className="rivals-page">
      <div className="rivals-heading">
        <div>
          <p className="kicker">COMPETITOR INTELLIGENCE</p>
          <h1>你不是一个人在往前走。</h1>
        </div>
        <div className="rival-summary">
          <span>已掌握详细情报</span>
          <strong>
            {knownCount} / {rivals.length}
          </strong>
          <small>
            社交 {formatNumber(stats.social)} · 同学好感 {formatNumber(stats.peerFavor)}
          </small>
        </div>
      </div>

      <div className="social-unlock-note">
        <strong>社交不是单纯的好感加成。</strong>
        <span>
          它决定你能否听见训练群之外的消息、了解对手的学习方式，并解锁共同学习事件。
          “综合实力估值”是根据对手起点、年级、训练进度和近期状态得到的0—100情报值，
          用于比较大致阶段，不等于任何一次考试分数。
        </span>
      </div>

      {groups.map((group) => {
        const available = scopeAvailable(group.scope);
        const groupRivals = rivals.filter((rival) => rival.scope === group.scope);
        return (
          <section className="rival-tier" key={group.scope}>
            <div className="rival-tier-heading">
              <h2>{group.title}</h2>
              <p>{group.note}</p>
            </div>
            {!available ? (
              <div className="rival-tier-locked">
                <strong>名单尚未进入你的视野</strong>
                <span>{group.lockedText}</span>
              </div>
            ) : (
              <div className="rival-grid">
                {groupRivals.map((rival) => {
                  const identity = seededRivalIdentity(rival, seed);
                  const appeared = week >= rival.revealWeek;
                  const unlocked = appeared && stats.social >= rival.revealSocial;
                  const strengthKnown = stats.social >= rival.revealSocial + 8;
                  const canStudy =
                    unlocked && stats.peerFavor >= 18 && remainingTime >= 1;
                  const snapshot = rivalSnapshot(
                    rival,
                    seed,
                    week,
                    retiredRivalWeeks[rival.id],
                  );
                  const relationship = normalizeRelationship(
                    relationships[rival.id],
                    seed,
                    rival.id,
                  );
                  const relationshipRoute = relationshipRouteLabel(relationship);
                  const hasRetired = retiredRivalIds.includes(rival.id);
                  const latestNationalResult = [...nationalAttempts]
                    .sort((a, b) => b.attemptNumber - a.attemptNumber)
                    .flatMap((attempt) => attempt.namedResults ?? [])
                    .find((result) => result.rivalId === rival.id);
                  const latestProvincialAttempt = [...provincialAttempts]
                    .sort((a, b) => b.attemptNumber - a.attemptNumber)
                    .find((attempt) =>
                      (attempt.namedResults ?? []).some(
                        (result) => result.rivalId === rival.id,
                      ),
                    );
                  const latestProvincialResult = latestProvincialAttempt
                    ? rankedNamedProvincialResults(
                        latestProvincialAttempt,
                        latestProvincialAttempt.finalScore ??
                          latestProvincialAttempt.draftScore,
                      ).find((result) => result.rivalId === rival.id)
                    : undefined;
                  return (
                    <article
                      className={`rival-card ${unlocked ? "" : "locked"} ${
                        hasRetired ? "retired-rival" : ""
                      }`}
                      key={rival.id}
                    >
                      <div className="rival-card-top">
                        <span>
                          {rival.gradeRelation} · {identity.gender === "female" ? "女" : "男"}
                        </span>
                        <em>
                          {hasRetired
                            ? "已退赛"
                            : specialtyLabels[rival.specialty]}
                        </em>
                      </div>
                      <h2>{appeared ? identity.name : "尚未入队"}</h2>
                      <p className="rival-school">
                        {rival.school === "本校" ? schoolName : rival.school}
                      </p>
                      {unlocked ? (
                        <>
                          <dl>
                            <div>
                              <dt>印象</dt>
                              <dd>{identity.personality}</dd>
                            </div>
                            <div>
                              <dt>学习方式</dt>
                              <dd>{identity.studyStyle}</dd>
                            </div>
                            <div>
                              <dt>关系走向</dt>
                              <dd>
                                {relationshipRoute} · 亲近{" "}
                                {formatNumber(relationship.bond)} · 张力{" "}
                                {formatNumber(relationship.tension)}
                                {relationship.route === "dating" && (
                                  <> · 信任 {formatNumber(relationship.trust)}</>
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>能力情报</dt>
                              <dd>
                                {strengthKnown
                                  ? `${rival.hiddenStrength} · 综合实力估值 ${formatNumber(snapshot.level)} / 100（${rivalStrengthBand(snapshot.level)}）· ${snapshot.trendLabel}`
                                  : `还需 ${formatNumber(Math.max(0, rival.revealSocial + 8 - stats.social))} 点社交以确认`}
                              </dd>
                            </div>
                            {(latestNationalResult || latestProvincialResult) && (
                              <div>
                                <dt>最近正式成绩</dt>
                                <dd>
                                  {latestNationalResult
                                    ? `国赛理论第 ${latestNationalResult.theoryRank} · 最终第 ${latestNationalResult.finalRank} · ${latestNationalResult.medal}`
                                    : latestProvincialResult
                                      ? `联赛 ${formatNumber(latestProvincialResult.score)}/${PROVINCIAL_MAX_SCORE} · 全省第 ${latestProvincialResult.rank}`
                                      : "—"}
                                </dd>
                              </div>
                            )}
                          </dl>
                          <button
                            className="rival-study-button"
                            disabled={!canStudy || hasRetired}
                            onClick={() =>
                              onStudy({
                                ...rival,
                                name: identity.name,
                                personality: identity.personality,
                                studyStyle: identity.studyStyle,
                              })
                            }
                          >
                            {hasRetired
                              ? "对方已经离开竞赛队"
                              : stats.peerFavor < 18
                              ? "同学好感不足"
                              : remainingTime < 1
                                ? "本周已无时间"
                                : `约${identity.name}共同学习 · 1点`}
                          </button>
                        </>
                      ) : (
                        <div className="rival-locked">
                          <strong>{appeared ? "情报不足" : "尚未出现"}</strong>
                          <span>
                            {appeared
                              ? `社交达到 ${formatNumber(rival.revealSocial)} 后解锁`
                              : `第 ${rival.revealWeek} 周后进入名单`}
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <button className="secondary-button rival-back" onClick={onBack}>
        ← 返回本周计划
      </button>
    </section>
  );
}

function effectPreview(effects: GameEffect) {
  const parts = effectLabels.map(([key, label]) => {
      const value = effects[key];
      if (typeof value !== "number" || value === 0) return null;
      return `${label}${value > 0 ? "+" : ""}${formatNumber(value)}`;
    })
    .filter(Boolean);
  return parts.join(" · ");
}

function PostCareerScreen({
  name,
  seed,
  state,
  input,
  onAdvance,
  onOpenSaves,
  onRestart,
}: {
  name: string;
  seed: string;
  state: PostCareerState;
  input: PostCareerInput;
  onAdvance: (choiceId: string) => void;
  onOpenSaves: () => void;
  onRestart: () => void;
}) {
  const scene = getPostScene(state, input);
  const subjects = Object.entries(state.subjects) as Array<
    [PostSubject, number]
  >;
  const isEnding = state.stage === "ending";
  const routeLabel =
    state.applicationRoute === "recommendation"
      ? "保送"
      : state.applicationRoute === "exceptional"
        ? "竞赛破格"
        : state.applicationRoute === "ordinary-strong"
          ? "普通强基"
          : state.applicationRoute === "regular"
            ? "普通高考"
            : "尚未选择";
  const chapter =
    state.stage === "bridge"
      ? "回班过渡"
      : [
            "return",
            "first-review",
            "selection-theory",
            "midterm",
            "selection-experiment",
            "mock1",
          ].includes(state.stage)
        ? "高三上"
        : [
              "application",
              "recommendation-choice",
              "second-review",
              "mock2",
            ].includes(state.stage)
          ? "高三下"
          : ["gaokao", "strong-written", "strong-interview"].includes(
                state.stage,
              )
            ? "招考"
            : "录取";

  return (
    <main className={`shell post-career-shell ${isEnding ? "post-ending" : ""}`}>
      <header className="topbar">
        <button className="brand-button" onClick={onRestart}>
          生竞人生
        </button>
        <div className="steps" aria-label="高中与录取进度">
          {["回班过渡", "高三上", "高三下", "招考", "录取"].map((item) => (
            <span
              className={`step ${
                item === chapter ? "active" : item === "录取" && isEnding ? "done" : ""
              }`}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="save-controls">
          <button onClick={onOpenSaves}>存读档</button>
        </div>
        <span className="seed-chip">{seed}</span>
      </header>

      <section className="post-career-layout">
        <aside className="post-status">
          <p className="folio">FINAL SCHOOL YEARS</p>
          <h2>{name}</h2>
          <div className="post-route-chip">{routeLabel}</div>
          <div className="post-vitals">
            <div>
              <span>六科知识基准</span>
              <strong>{formatNumber(postKnowledgeTotal(state))} / 750</strong>
            </div>
            <div>
              <span>SAN</span>
              <strong>{formatNumber(state.san)}</strong>
            </div>
            <div>
              <span>心态</span>
              <strong>{formatNumber(state.mindset)}</strong>
            </div>
            <div>
              <span>强基专项</span>
              <strong>{formatNumber(state.strongPrep)}</strong>
            </div>
          </div>

          <div className="post-subjects">
            {subjects.map(([subject, value]) => (
              <div key={subject}>
                <span>{subject}</span>
                <div>
                  <i
                    style={{
                      width: `${(value / postSubjectMaxima[subject]) * 100}%`,
                    }}
                  />
                </div>
                <strong>
                  {formatNumber(value)} / {postSubjectMaxima[subject]}
                </strong>
              </div>
            ))}
          </div>

          {state.nationalSelection.eligible && (
            <div className="selection-summary">
              <span>国家队选拔</span>
              <strong>
                {state.nationalSelection.selected
                  ? `最终第 ${state.nationalSelection.finalRank} / 50 · 入选`
                  : state.nationalSelection.finalRank
                    ? `最终第 ${state.nationalSelection.finalRank} / 50`
                    : state.nationalSelection.theoryRank
                      ? `理论暂列第 ${state.nationalSelection.theoryRank} / 50`
                      : "等待理论与实验选拔"}
              </strong>
            </div>
          )}
        </aside>

        <section className="post-scene">
          <p className="kicker">{scene.kicker}</p>
          <h1>{scene.title}</h1>
          <p className="post-scene-lead">{scene.lead}</p>
          {!isEnding && <p className="post-scene-detail">{scene.detail}</p>}

          {isEnding && state.ending?.futureTitle && (
            <section className="future-epilogue">
              <span>多年以后 · {state.ending.futureTitle}</span>
              {(state.ending.epilogueParagraphs ?? [scene.detail]).map(
                (paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
                ),
              )}
            </section>
          )}
          {isEnding && !state.ending?.futureTitle && (
            <p className="post-scene-detail">{scene.detail}</p>
          )}

          {state.lastResult && !isEnding && (
            <div className="post-result">
              <span>上一阶段</span>
              <p>{state.lastResult}</p>
            </div>
          )}

          {state.gaokao && (
            <div className="gaokao-result">
              <div>
                <span>高考总分</span>
                <strong>{formatNumber(state.gaokao.total)} / 750</strong>
              </div>
              <div>
                <span>全省位次</span>
                <strong>
                  第 {state.gaokao.provinceRank} /{" "}
                  {state.gaokao.participants}
                </strong>
              </div>
            </div>
          )}

          {state.strongResult?.written !== undefined && (
            <div className="strong-result">
              <span>强基笔试</span>
              <strong>{formatNumber(state.strongResult.written)}</strong>
              <small>
                {state.strongResult.enteredInterview
                  ? "已进入面试"
                  : "未进入面试"}
              </small>
            </div>
          )}

          {isEnding && state.admission && (
            <article className="admission-letter">
              <span>录取通知书</span>
              <h2>{state.admission.school}</h2>
              <p>{state.admission.major}</p>
              <small>{state.admission.routeLabel}</small>
            </article>
          )}

          <div className="post-choices">
            {scene.choices.map((choice, index) => (
              <button key={choice.id} onClick={() => onAdvance(choice.id)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{choice.title}</strong>
                <small>{choice.hint}</small>
              </button>
            ))}
          </div>

          {isEnding && (
            <button className="primary-button post-restart" onClick={onRestart}>
              返回开局，尝试另一种人生 <span>→</span>
            </button>
          )}
        </section>
      </section>
    </main>
  );
}

function PlannerStat({
  label,
  value,
  locked = false,
}: {
  label: string;
  value: number;
  locked?: boolean;
}) {
  return (
    <div className={`planner-stat ${locked ? "locked" : ""}`}>
      <span>{label}</span>
      <div>
        <i style={{ width: `${locked ? 0 : value}%` }} />
      </div>
      <strong>{locked ? "未解锁" : formatNumber(value)}</strong>
    </div>
  );
}

function StatusNumber({
  label,
  value,
  money = false,
}: {
  label: string;
  value: number;
  money?: boolean;
}) {
  return (
    <div className="status-number">
      <span>{label}</span>
      <strong>
        {money ? "¥" : ""}
        {formatNumber(value)}
      </strong>
    </div>
  );
}

function CompactStat({ name, value }: { name: string; value: number }) {
  return (
    <div className="compact-stat">
      <span>{name}</span>
      <div className="bar" aria-label={`${name} ${value}`}>
        <i style={{ width: `${value}%` }} />
      </div>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
}

function Stat({ name, value }: { name: string; value: number }) {
  return (
    <div className="stat">
      <span>{name}</span>
      <strong>{formatNumber(value)}</strong>
      <small>{statLabel(value)}</small>
    </div>
  );
}
