"use client";

import { useEffect, useMemo, useState } from "react";
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
import { linkedEventCount, linkedWeeklyEvents } from "./event-library";
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
  const examScore = (
    moduleAbilities: number[],
    reasoning: number,
    san: number,
    mindset: number,
    neglectWeeks: number,
    candidateKey: string,
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
      const probability = clamp(
        (baseProbability -
          (question.strangeQuestion ? 0.11 : 0) +
          form) *
          conditionFactor /
          question.difficulty,
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
  const playerModules = moduleKeys.map((key) => stats[key]);
  const correctTotal = examScore(
    playerModules,
    stats.reasoning,
    stats.san,
    stats.mindset,
    stats.competitionNeglectWeeks,
    playerFormKey,
  );
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
        question.difficulty,
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

  const competitorScores = Array.from(
    { length: world.provinceParticipants - 1 },
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
      return round1(
        (examScore(
          modules,
          reasoning,
          58 + seededUnit(`${seed}-province-san-${week}-${index}`) * 34,
          52 + seededUnit(`${seed}-province-mind-${week}-${index}`) * 38,
          seededUnit(`${seed}-province-neglect-${week}-${index}`) < 0.12
            ? 2
            : 0,
          `${seed}-province-candidate-${week}-${index}`,
        ) /
          80) *
          100,
      );
    },
  );

  const rawScore = round1((correctTotal / 80) * 100);
  const estimateError =
    (seededUnit(`${seed}-estimate-center-${week}`) - 0.5) *
    Math.max(2.5, 8 - stats.reasoning * 0.04);
  const estimateWidth = Math.max(
    2.5,
    7 - stats.reasoning * 0.035 - stats.mindset * 0.012,
  );
  const estimateCenter = clamp(rawScore + estimateError);
  const estimateLow = round1(clamp(estimateCenter - estimateWidth / 2));
  const estimateHigh = round1(clamp(estimateCenter + estimateWidth / 2));
  const draftDelta = round1(
    (seededUnit(`${seed}-draft-adjustment-${week}`) - 0.42) * 4.5,
  );
  const draftScore = round1(clamp(rawScore + draftDelta));
  const appealDelta =
    seededUnit(`${seed}-appeal-opportunity-${week}`) < 0.48
      ? round1(0.6 + seededUnit(`${seed}-appeal-delta-${week}`) * 1.4)
      : 0;
  const rankFor = (score: number) => rankAgainst(competitorScores, score);
  const breakdown = Object.values(counts).map((section) => ({
    name: section.name,
    correct: section.correct,
    total: section.total,
    score: round1((section.correct / Math.max(1, section.total)) * 100),
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
    participants: world.provinceParticipants,
    firstPrizeEnd: world.firstPrizeEnd,
    secondPrizeEnd: world.secondPrizeEnd,
    thirdPrizeEnd: world.thirdPrizeEnd,
    teamPlaces: world.teamPlaces,
    competitionStrength: world.competitionStrength,
    competitorScores,
    breakdown,
  };
}

function provincialAward(rank: number, attempt: ProvincialAttempt) {
  if (rank <= attempt.firstPrizeEnd) return "省一等奖";
  if (rank <= attempt.secondPrizeEnd) return "省二等奖";
  if (rank <= attempt.thirdPrizeEnd) return "省三等奖";
  return "未获奖";
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
): NationalAttempt {
  // 国赛每届约 600 人；人数会小幅波动，但奖牌名额按核实后的固定口径划分。
  const participants = nationalParticipantCount(
    hashSeed(`${seed}-national-size-${week}`),
  );
  const moduleAverage =
    (stats.module1 + stats.module2 + stats.module3 + stats.module4) / 4;
  const condition =
    (0.87 + stats.san * 0.0015) *
    (0.95 + stats.mindset * 0.0007) *
    Math.max(0.55, 1 - stats.competitionNeglectWeeks * 0.05);
  const theoryForm =
    (seededUnit(`${seed}-national-form-a-${week}`) +
      seededUnit(`${seed}-national-form-b-${week}`) -
      1) *
    12;
  const literaturePerformance = clamp(
    (16 + stats.reasoning * 0.58 + moduleAverage * 0.18) * condition +
      theoryForm +
      (seededUnit(`${seed}-national-lit-${week}`) - 0.5) * 10,
  );
  const foundationPerformance = clamp(
    (12 + moduleAverage * 0.65 + stats.reasoning * 0.06) * condition +
      theoryForm * 0.65 +
      (seededUnit(`${seed}-national-foundation-${week}`) - 0.5) * 9,
  );
  const theoryRaw = round1(
    literaturePerformance * 0.9 + foundationPerformance * 0.1,
  );
  const competitorProfiles = Array.from(
    { length: participants - 1 },
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
      const form =
        (seededUnit(`${seed}-national-rival-form-a-${week}-${index}`) +
          seededUnit(`${seed}-national-rival-form-b-${week}-${index}`) -
          1) *
        11;
      const literature = clamp(
        16 + reasoning * 0.58 + knowledge * 0.18 + form,
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
      };
    },
  );
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
            (seededUnit(`${seed}-national-exp-${week}-${index}`) - 0.5) * 22,
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
  const medal = nationalMedalForRank(finalRank);
  return {
    attemptNumber,
    theoryWeek: week,
    participants,
    theoryRaw,
    theoryT,
    theoryRank,
    qualifiedForExperiment,
    experimentScores,
    experimentT,
    finalScore,
    finalRank,
    medal,
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
          note: `理论T分 ${nationalAttempt.theoryT.toFixed(1)}`,
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
        note: `回忆正确 ${section.correct}/${section.total}`,
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
    const noise =
      (seededUnit(`${seed}-${assessment.id}-${subject}-${index}`) * 2 - 1) *
      (stats.san < 45 ? 20 : 14);
    const score = round1(
      clamp(22 + ability * 0.68 + stats.reasoning * 0.12 + noise, 0, 100),
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
  const participants =
    assessment.title.includes("联赛")
      ? 1200
      : 42;
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
  };
}

type PlayerStats = {
  module1: number;
  module2: number;
  module3: number;
  module4: number;
  reasoning: number;
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
  breakdown: Array<{ name: string; score: number; correct: number; total: number }>;
};

type NationalAttempt = {
  attemptNumber: 1 | 2;
  theoryWeek: number;
  participants: number;
  theoryRaw: number;
  theoryT: number;
  theoryRank: number;
  qualifiedForExperiment: boolean;
  experimentScores: Array<{ name: string; score: number }>;
  experimentT: number;
  finalScore: number;
  finalRank: number | null;
  medal: NationalMedal;
};

type DisplayEffectKey =
  | "module1"
  | "module2"
  | "module3"
  | "module4"
  | "reasoning"
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
        current < 45 ? 0.55 : current < 65 ? 0.38 : current < 80 ? 0.22 : 0.1;
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

function round1(value: number) {
  return Math.round(value * 10) / 10;
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

type RivalRelationship = {
  bond: number;
  tension: number;
  romance: number;
};

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
  initiatedBy?: "self" | "family" | "coach";
};

type ShopItem = {
  id: string;
  name: string;
  price: number;
  category: "补给" | "学习" | "玩具" | "特殊";
  description: string;
  flavor: string;
  consumable: boolean;
  effects?: GameEffect;
  bonusActionPoints?: number;
  learningBoost?: number;
  purchaseTag?: string;
};

type SaveSlotInfo = {
  name: string;
  week: number;
  savedAt: string;
  seed: string;
  screen: string;
};

type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
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
];

const shopItems: ShopItem[] = [
  {
    id: "coffee",
    name: "冰美式",
    price: 12,
    category: "补给",
    description: "本周额外获得1行动点，但会额外消耗1点SAN。",
    flavor: "家长认为白开水已经足够，因此拒绝报销。",
    consumable: true,
    effects: { san: -1 },
    bonusActionPoints: 1,
  },
  {
    id: "chocolate",
    name: "抽屉里的巧克力",
    price: 10,
    category: "补给",
    description: "立即恢复4点SAN和0.5点心态。",
    flavor: "模考结束后的糖分通常比解析更快抵达大脑。",
    consumable: true,
    effects: { san: 4, mindset: 0.5 },
  },
  {
    id: "mint",
    name: "薄荷糖与荧光笔套装",
    price: 24,
    category: "学习",
    description: "本周学习效率提高10%，并恢复1点SAN。",
    flavor: "颜色太多未必让笔记更清楚，但至少看起来像是准备充分。",
    consumable: true,
    effects: { san: 1 },
    learningBoost: 0.1,
  },
  {
    id: "earplugs",
    name: "隔音耳塞",
    price: 22,
    category: "补给",
    description: "立即恢复2点SAN并稳定1点心态。",
    flavor: "可以隔绝室友打游戏，却隔绝不了隔壁床背书。",
    consumable: true,
    effects: { san: 2, mindset: 1 },
  },
  {
    id: "plant-seeds",
    name: "一包来历不明的植物种子",
    price: 18,
    category: "特殊",
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
    description: "解锁教练误会、实验室禁饮和咖啡溢出事件。",
    flavor: "刻度完全不准，唯一可靠的参数是容量很大。",
    consumable: false,
    purchaseTag: "shop:strange-mug",
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
  const firstNationalExperiment =
    tags.includes("第1次国赛-进入实验") &&
    week === calendar.firstNationalWeek + 1;
  const secondNationalExperiment =
    tags.includes("第2次国赛-进入实验") &&
    week === calendar.secondNationalWeek + 1;
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
          ? "省队集中训练"
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
      (!tags.includes("国赛集训-理论强化") && week % 2 === 0);
    label = `省队集训 · 距国赛 ${
      (firstTeamCamp ? calendar.firstNationalWeek : calendar.secondNationalWeek) -
      week
    } 周`;
    fixed.push({
      title: experimentalFocus
        ? "省队统一实验培训 · 四科轮转"
        : "省队统一理论培训 · 文献题与套卷",
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
      title: "省队统一作息 · 晚间复盘",
      cost: 2,
      effects: { reasoning: 0.8, san: -1.5, mindset: -0.4 },
    });
    if (week % 2 === 0) {
      fixed.push({
        title: experimentalFocus ? "四科实验循环模考" : "国赛理论全真模考",
        cost: 1,
        effects: experimentalFocus
          ? { experiment: 1.5, san: -3 }
          : { reasoning: 1.2, san: -3 },
        assessment: {
          id: `national-camp-mock-${week}`,
          type: "competition",
          title: experimentalFocus ? "省队实验循环模考" : "省队理论全真模考",
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
      reasoning: mode === "practice" ? 2.2 : isNotes ? 0.8 : 0.3,
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
  const learningFactor = baseEfficiency * fluctuation * (1 + studyBoost);
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
) {
  const pool = [...weeklySocialEvents, ...linkedWeeklyEvents];
  const eligible = pool.filter((event) => {
      const trigger = event.trigger;
      if (resolved.includes(event.id)) return false;
      if (event.phase === "training" && !isTrainingWeek) return false;
      if (week < trigger.earliestWeek || week > trigger.latestWeek) return false;
      if (trigger.allowedWeeks && !trigger.allowedWeeks.includes(week)) return false;
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
  if (eligible.length === 0) return makeRoutineEvent(week, seed);
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
  const candidates = probabilistic.length > 0 ? probabilistic : priorityPool;
  const index = hashSeed(`${seed}-weekly-event-${week}`) % candidates.length;
  return candidates[index];
}

function makeRoutineEvent(week: number, seed: string): GameEvent {
  const variants: GameEvent[] = [
    {
      id: `routine-library-${week}`,
      phase: "weekly",
      label: "每周日常 · 校园",
      title: "图书馆最后一排",
      body: ["今天没有大事发生。晚自习结束前，你还可以决定怎样处理剩下的一点时间。"],
      inspiration: "原创",
      trigger: { earliestWeek: week, latestWeek: week },
      choices: [
        {
          id: `routine-library-study-${week}`,
          title: "再看一节书",
          preview: "微小但稳定的积累",
          result: "你在闭馆提示响起前又读完了几页。",
          effects: { module1: 0.4, san: -0.5 },
        },
        {
          id: `routine-library-chat-${week}`,
          title: "和队友聊几句",
          preview: "交换一点近况和情报",
          result: "没有惊人的发现，但你知道大家都在经历相似的卡顿。",
          effects: { peerFavor: 0.8, san: 0.5 },
        },
      ],
    },
    {
      id: `routine-canteen-${week}`,
      phase: "weekly",
      label: "每周日常 · 队内社交",
      title: "食堂的十分钟",
      body: ["队伍里有人争论一道题，也有人只想赶紧吃完回教室。你坐在旁边，决定要不要加入。"],
      inspiration: "原创",
      trigger: { earliestWeek: week, latestWeek: week },
      choices: [
        {
          id: `routine-canteen-talk-${week}`,
          title: "加入讨论",
          preview: "也许能理清一个概念",
          result: "你们没有完全说服彼此，却把问题拆得更清楚了。",
          effects: { reasoning: 0.5, peerFavor: 0.5, san: -0.3 },
        },
        {
          id: `routine-canteen-rest-${week}`,
          title: "安静吃饭",
          preview: "给脑子留一点空白",
          result: "这十分钟没有知识增量，但你终于停止了内心答题。",
          effects: { san: 1.2 },
        },
      ],
    },
    {
      id: `routine-corridor-${week}`,
      phase: "weekly",
      label: "每周日常 · 教练",
      title: "办公室门口",
      body: ["你路过竞赛教练办公室，门开着。里面的灯还亮着，但你不确定自己的问题值不值得问。"],
      inspiration: "原创",
      trigger: { earliestWeek: week, latestWeek: week },
      choices: [
        {
          id: `routine-corridor-ask-${week}`,
          title: "进去问问",
          preview: "一次普通的请教",
          result: "教练没有给出完整答案，只指出了你推理中跳过的一步。",
          effects: { coachFavor: 0.6, reasoning: 0.4, san: -0.3 },
        },
        {
          id: `routine-corridor-note-${week}`,
          title: "先自己想",
          preview: "把问题记下来，暂时不打扰",
          result: "你把问题写进本子，准备等它更具体一些再来。",
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
        result: "父母没有再问省队线，只把准考证和两支笔放在门边。房间十点前熄了灯。",
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
        result: "教练只讲了时间分配和弃题原则。散会后，室友还是忍不住问起一道争议题。",
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
        result: "凌晨一点，你确实又记住了几处细节，也开始无法停止想象明天会考到什么。",
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
      "这不是最终结果，但三周足以让不同选择产生真正的差距。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: `post-experiment-${attemptNumber}`,
        title: "先参加实验培训",
        preview: "实验解锁并提升 · SAN -2 · 若未进省队可能成为沉没成本",
        result: "第一次完整实验课开始时，省队线仍只是群里的传闻。你决定先为可能性付出成本。",
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
        result: "你没有等待结果替自己决定是否继续。下一本书重新被摊开在桌面上。",
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
        result: "竞赛书被收进柜子。你仍会等待正式结果，但明天开始先回到班级课表。",
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
    title: `评议稿公布：重新估分 ${attempt.draftScore.toFixed(1)} 分。`,
    body: [
      `机构答案经过三周争议后，部分题目接受了新答案，也有题目被建议删除。重新计算后，你的暂估排名约为全省第 ${attempt.draftRank} 名。`,
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
            ? "你把教材页码、论文图表和逻辑链整理成一页说明。教练删掉情绪化措辞后提交给评议组。"
            : "教练仍然替你转交了材料，但提醒你不要把最终希望寄托在申诉上。",
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
        result: "聊天群仍在滚动，你关闭了提醒。最终线没有公布，但暂时已经没有新的信息可以获得。",
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
    clamp(attempt.draftScore + (appealed ? attempt.appealDelta : 0)),
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
      `最终有效得分 ${finalScore.toFixed(1)}。本届省一截止第 ${attempt.firstPrizeEnd} 名，省二截止第 ${attempt.secondPrizeEnd} 名，省三截止第 ${attempt.thirdPrizeEnd} 名。`,
      entersTeam
        ? `本届省队共 ${attempt.teamPlaces} 人。你的名字出现在名单中，等待期终于有了明确方向。`
        : `本届省队共 ${attempt.teamPlaces} 人。省队线与奖项线是两回事，接下来仍要决定是否使用第二次参赛机会。`,
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: `record-official-${attempt.attemptNumber}`,
        title: entersTeam ? "确认名单，准备国赛阶段" : "记录结果，继续选择后续路线",
        preview: entersTeam
          ? "解锁省队与国赛流程 · 教练好感 +5"
          : `${award} · 后续可继续竞赛或回归常规`,
        result: entersTeam
          ? "教练在群里只发了一句“今晚开会”。实验、国赛理论和全国对手从此成为现实。"
          : "这次省赛已经结束。奖项不会自动替你决定第二年，但它会改变所有人对下一次机会的判断。",
        effects: {
          coachFavor: entersTeam ? 5 : award === "省一等奖" ? 2 : -1,
          mindset: entersTeam ? 3 : -1,
          tags: [outcomeTag],
        },
      },
    ],
  };
}

function makeNationalCampChoiceEvent(attemptNumber: 1 | 2): GameEvent {
  return {
    id: `national-${attemptNumber}-camp-choice`,
    phase: "training",
    label: "省队流程 · 国赛集训路线",
    title: "省队名单确认后，三个月训练表被发到了群里。",
    body: [
      "五月到八月几乎没有普通暑假：实验中心轮转、理论套卷、机构模考和省队统一测试交替出现。",
      "教练建议所有人跟统一计划走，但你仍可以把额外外培时间偏向实验或理论。偏科会带来明显收益，也会留下另一端风险。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 120 },
    choices: [
      {
        id: `national-camp-experiment-${attemptNumber}`,
        title: "额外参加实验强化外培",
        preview: "实验增长更快 · 理论自由时间更少 · SAN -2",
        result: "你开始在不同实验室之间轮转。离心机、显微镜和解剖台逐渐取代普通课桌。",
        effects: {
          experiment: 3,
          san: -2,
          tags: ["国赛集训-实验强化"],
        },
      },
      {
        id: `national-camp-theory-${attemptNumber}`,
        title: "额外参加文献题与理论模考",
        preview: "思辨增长更快 · 实验训练主要依赖省队统一安排",
        result: "外培群每天发来论文和整卷。你仍参加统一实验，但额外时间几乎全部留给理论。",
        effects: {
          reasoning: 2.5,
          san: -1,
          tags: ["国赛集训-理论强化"],
        },
      },
      {
        id: `national-camp-balanced-${attemptNumber}`,
        title: "只跟省队统一计划，保留恢复时间",
        preview: "实验与理论均衡 · 心态 +2 · 教练好感 +1",
        result: "你拒绝再叠加一套机构课表。空下来的时间不多，但足以维持睡眠和复盘。",
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
        result: "几个只在群头像里见过的人终于有了真实声音。你也看见某些强手和普通高中生一样紧张。",
        effects: { social: 2, peerFavor: 1, san: -1 },
      },
      {
        id: `national-opening-rest-${attemptNumber}`,
        title: "仪式结束后立刻回房休息",
        preview: "SAN +2 · 心态 +1",
        result: "队友还在楼下拍照，你已经关掉手机。下午的卷子不会因为多认识一个人变容易。",
        effects: { san: 2, mindset: 1 },
      },
    ],
  };
}

function makeTheoryNightEvent(attempt: NationalAttempt): GameEvent {
  return {
    id: `national-${attempt.attemptNumber}-theory-night`,
    phase: "exam",
    label: "全国决赛 · 理论排名公布",
    title: attempt.qualifiedForExperiment
      ? `理论第 ${attempt.theoryRank} 名：进入前240，获得实验考试资格。`
      : `理论第 ${attempt.theoryRank} 名：未进入前240。`,
    body: [
      `理论原始表现 ${attempt.theoryRaw.toFixed(1)}，换算T分 ${attempt.theoryT.toFixed(1)}。排名在当晚公布，走廊里不断有人刷新名单。`,
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
          ? "教练不再分析理论题，只检查实验服、文具和集合时间。现在没有任何补理论的意义。"
          : "你仍然留在代表队中，却第一次清楚地感到自己与实验考场隔着一道名单。",
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
        result: "你们第一次聊起竞赛之外的生活。没有人能从这顿饭里推算出明天的名次。",
        effects: { san: 4, peerFavor: 2 },
      },
      {
        id: `national-rest-estimate-${attempt.attemptNumber}`,
        title: "留在酒店继续回忆实验细节",
        preview: "估分信息增加 · SAN -3 · 心态 -1",
        result: "你列出了一张越来越长的可能失分表。它没有改变任何操作，却占据了整个下午。",
        effects: { san: -3, mindset: -1 },
      },
    ],
  };
}

function makeNationalAwardEvent(attempt: NationalAttempt): GameEvent {
  const hasFinalRank = attempt.finalRank !== null;
  const isTrueSilver = isTrueSilverRank(attempt.finalRank);
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
        ? `理论T分 ${attempt.theoryT.toFixed(1)}，实验T分 ${attempt.experimentT.toFixed(1)}；最终按理论30%与实验70%合成为 ${attempt.finalScore.toFixed(1)}。${
            isTrueSilver ? " 你位于151—240名的“真银牌”区间。" : ""
          }`
        : `理论排名第 ${attempt.theoryRank}，未取得实验考试资格；该名次直接进入最终奖牌序列，你获得${attempt.medal}。`,
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
          ? "奖牌挂在胸前时比想象中轻。真正沉重的是过去几年被压缩进这一刻的时间。"
          : "省队合影仍然有你的位置。结果已经确定，如何理解它还需要更长时间。",
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
  const candidates: Array<[number, GameEvent]> = [
    [12, trainingMilestoneEvents.nationalDay],
    [28, trainingMilestoneEvents.winter],
    [calendar.firstExamWeek - 1, makeHotelEvent(1)],
    [calendar.secondExamWeek - 1, makeHotelEvent(2)],
    ...(firstAttempt
      ? ([
          [calendar.firstExamWeek + 1, makePostExamRouteEvent(1)],
          [calendar.firstExamWeek + 3, makeEvaluationDraftEvent(firstAttempt)],
          [
            calendar.firstExamWeek + 4,
            makeOfficialResultEvent(firstAttempt, storyTags),
          ],
        ] as Array<[number, GameEvent]>)
      : []),
    ...(secondAttempt
      ? ([
          [calendar.secondExamWeek + 1, makePostExamRouteEvent(2)],
          [calendar.secondExamWeek + 3, makeEvaluationDraftEvent(secondAttempt)],
          [
            calendar.secondExamWeek + 4,
            makeOfficialResultEvent(secondAttempt, storyTags),
          ],
        ] as Array<[number, GameEvent]>)
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
    ...(firstNational
      ? ([
          [calendar.firstNationalWeek + 1, makeTheoryNightEvent(firstNational)],
          [calendar.firstNationalWeek + 2, makeNationalRestEvent(firstNational)],
          [calendar.firstNationalWeek + 3, makeNationalAwardEvent(firstNational)],
        ] as Array<[number, GameEvent]>)
      : []),
    ...(secondNational
      ? ([
          [
            calendar.secondNationalWeek + 1,
            makeTheoryNightEvent(secondNational),
          ],
          [calendar.secondNationalWeek + 2, makeNationalRestEvent(secondNational)],
          [calendar.secondNationalWeek + 3, makeNationalAwardEvent(secondNational)],
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

function rivalSnapshot(rival: Rival, seed: string, week: number) {
  const startingLevel = 28 + (hashSeed(`${seed}-${rival.id}-base`) % 27);
  const growthRate =
    rival.gradeRelation === "上届"
      ? 0.3
      : rival.gradeRelation === "下届"
        ? 0.48
        : 0.39;
  const trainingCurve = week > 40 ? Math.min(12, (week - 40) * 0.12) : 0;
  const formNoise =
    (seededUnit(`${seed}-${rival.id}-form-${Math.floor(week / 3)}`) - 0.5) *
    12;
  const level = clamp(
    startingLevel + week * growthRate + trainingCurve + formNoise,
    18,
    96,
  );
  const previous =
    startingLevel +
    Math.max(0, week - 3) * growthRate +
    (seededUnit(
      `${seed}-${rival.id}-form-${Math.max(0, Math.floor(week / 3) - 1)}`,
    ) -
      0.5) *
      12;
  const trend = level - previous;
  return {
    level: round1(level),
    trendLabel: trend > 2 ? "近期上升" : trend < -2 ? "近期波动" : "发挥稳定",
  };
}

function seededRivalIdentity(rival: Rival, seed: string) {
  if (!rival.scope.startsWith("school")) {
    return {
      name: rival.name,
      personality: rival.personality,
      studyStyle: rival.studyStyle,
      temperament: "steady",
    };
  }
  const surnames = [
    "沈", "唐", "许", "乔", "周", "林", "程", "顾", "陆", "宋",
    "谢", "罗", "江", "叶", "苏", "闻", "白", "何", "温", "夏",
    "陈", "蒋", "段", "梁", "陶", "裴", "孟", "钟", "宁", "简",
    "欧阳", "司徒",
  ];
  const givenNames = [
    "砚", "榆", "澄", "蘅", "序", "遥", "朔", "葵", "珩", "野",
    "行知", "望舒", "令仪", "景明", "闻川", "清和", "予安", "叙白",
    "栖迟", "谨言", "牧野", "照临", "知遥", "长夏", "星回", "与时",
    "见山", "既白", "南乔", "言蹊", "观澜", "时雨", "弥生", "千帆",
    "若谷", "青梧", "元嘉", "砚秋", "昭野", "知微", "小满", "屿川",
  ];
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
  const token = hashSeed(`${seed}-identity-${rival.id}`);
  return {
    name: `${surnames[token % surnames.length]}${
      givenNames[
        (Math.floor(token / 7) + hashSeed(rival.id)) % givenNames.length
      ]
    }`,
    personality:
      personalities[Math.floor(token / 13) % personalities.length],
    studyStyle: methods[Math.floor(token / 29) % methods.length],
    temperament: [
      "reserved",
      "social",
      "calm",
      "steady",
      "competitive",
      "curious",
    ][Math.floor(token / 13) % 6],
  };
}

function seedRivalText(text: string, seed: string) {
  return rivals
    .filter((rival) => rival.scope.startsWith("school"))
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
) {
  const rival = rivalMentionedBy(event);
  if (!rival) return effects;
  const temperament = seededRivalIdentity(rival, seed).temperament;
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
      "这次退赛既像止损，也像在最接近看清自身水平的时候转身。",
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
      "你仍需要亲口结束这段经历，并决定怎样理解此前的两年。",
    ],
  },
  "mid-course": {
    label: "退赛事件 · 学习进行中",
    title: "没有一场明确的失败，但长期消耗本身也可能成为理由。",
    body: [
      "课程、笔记、模考和常规欠账同时堆在桌面上。你不是突然讨厌生物，只是开始怀疑继续投入是否仍然值得。",
      "中途离开不会得到一个干净的结论，反而要面对每个人不同的解释。",
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
            result: "你没有立刻答应退出，但同意把这件事列入接下来两周的正式议程。",
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
            result: "你保住了这一次决定权，但对方并没有因此认可你的选择。",
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
          result: "当“退赛”两个字真正写下来，它不再只是某个疲惫晚上的念头。",
          action: "advance",
          effects: { san: -1 },
        },
        {
          id: "retire-not-now",
          title: "现在还不做决定",
          preview: "暂时取消 · 四周内不能反复提出",
          result: "你把这个念头保留下来。继续并不代表以后失去了离开的权利。",
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
          result: "谈话持续了很久。没有人被立刻说服，但每个人终于在讨论同一个问题。",
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
          result: "课程表、薄弱科目和补课节点让这场谈话从情绪争执变成了现实方案。",
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
          result: "你答应再坚持一段时间，却没有完全解决最初提出退赛的原因。",
          action: "cancel",
          effects: { san: -2, mindset: -1, coachFavor: 1 },
        },
      ],
    };
  }
  return {
    label: "退赛协商 · 最终决定",
    title:
      flow.stage === "second-failure"
        ? "竞赛经历在这里结束，接下来要面对的是怎样回到普通课表。"
        : "所有意见都已经听过，最后仍需要你亲自确认。",
    body: [
      "留下不会保证下一次成功，离开也不会让常规缺口立刻消失。",
      "确认退赛后将进入独立的常规学习结局页；高三与高考流程会在后续版本继续补全。",
    ],
    choices: [
      {
        id: "retire-confirm-final",
        title:
          flow.stage === "second-failure" ? "整理竞赛资料，正式回班" : "仍然决定退赛",
        preview: "结束竞赛路线 · 进入“您已退赛”页面",
        result: "你最后一次整理竞赛教室里的位置，把仍想保留的笔记装进书包。",
        action: "retire",
        effects: {
          academics: flow.stage === "second-failure" ? 5 : 2,
          coachFavor: flow.stage === "second-failure" ? -4 : -8,
          familySupport: flow.stage === "second-failure" ? -0.5 : -2,
          mindset: flow.stage === "after-medal" ? -1 : -3,
          san: flow.stage === "second-failure" ? -1 : -4,
          tags: ["已退赛"],
        },
      },
      {
        id: "retire-stay-final",
        title: "撤回申请，再给自己四周",
        preview: "取消退赛 · 四周冷静期 · 压力不会自动消失",
        result: "你没有许诺一定坚持到最后，只把下一次决定推迟到四周以后。",
        action: "cancel",
        effects: { mindset: -1, san: -2, coachFavor: -1 },
      },
    ],
  };
}

function makeTeammateDepartureEvent(
  targetWeek: number,
  seed: string,
  activeTeamSize: number,
  initialTeamSize: number,
  retiredRivalIds: string[],
): GameEvent | null {
  const windows = [15, 23, 32, 45, 57, 69];
  const scheduledWeek = windows.find(
    (baseWeek, index) =>
      targetWeek ===
      baseWeek + (hashSeed(`${seed}-departure-week-${index}`) % 3),
  );
  if (
    scheduledWeek === undefined ||
    activeTeamSize <= Math.max(9, initialTeamSize - 7)
  )
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
  ];
  const reason =
    reasons[hashSeed(`${seed}-departure-reason-${targetWeek}`) % reasons.length];
  return {
    id: `teammate-departure-${rival.id}-${targetWeek}`,
    phase: "weekly",
    label: `队伍变化 · ${reason.title}`,
    title: reason.lead,
    body: [
      reason.detail,
      `训练群人数没有立刻变化，${rival.name}的头像却再也没有出现在打卡消息下面。竞赛队从 ${activeTeamSize} 人变成了 ${activeTeamSize - 1} 人。`,
    ],
    trigger: { earliestWeek: targetWeek, latestWeek: targetWeek },
    choices: [
      {
        id: `departure-message-${rival.id}`,
        title: "私下发消息，问对方以后是否还愿意联系",
        preview: "同学好感 +2 · SAN -2 · 保留好友线",
        result:
          "你们没有急着总结这段经历，只约定下次月考后一起吃饭。退赛改变了共同话题，却没有立即结束关系。",
        effects: {
          peerFavor: 2,
          san: -2,
          tags: [`${rival.id}-退赛后保持联系`],
        },
      },
      {
        id: `departure-reflect-${rival.id}`,
        title: "重新计算自己的时间与退路",
        preview: "常规积累 +4 · 心态 -1 · 思辨 +0.5",
        result:
          "你在计划表旁加了一栏“如果现在退出”。它没有让你立刻退赛，却让继续这件事不再完全依靠惯性。",
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
        preview: "思辨 +1 · 教练好感 +1 · SAN -3",
        result:
          "下一次训练你比平时更早到教室。只是翻开卷子时，你仍会下意识看向那个已经空掉的位置。",
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
      `当前关系积累：亲近 ${relation.bond.toFixed(1)}，竞争张力 ${relation.tension.toFixed(1)}。这次选择只确定第一阶段方向，未来仍可能变化。`,
    ],
    trigger: { earliestWeek: targetWeek, latestWeek: targetWeek },
    choices: [
      {
        id: `relationship-friend-${rival.id}`,
        title: "约定无论谁先退赛，都继续做朋友",
        preview: "开启好友路线 · 同学好感 +4 · SAN +2",
        result:
          "你们没有说什么煽情的话，只把周末一起吃饭写进了日程。第一次，见面的理由和竞赛无关。",
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
          "你们把下一张榜单当作约定。竞争从模糊的不安变成了一个具体的人，也因此更锋利。",
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
          "话题从班主任、食堂和周末作业慢慢绕远。你还不能确定这种在意意味着什么，只知道今晚不太想让谈话结束。",
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
      reasoning: 2,
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
  const [name, setName] = useState("林知夏");
  const [screen, setScreen] = useState<
    "origin" | "profile" | "week" | "retired" | "complete" | "postcareer"
  >("origin");
  const [firstChoice, setFirstChoice] = useState<string | null>(null);
  const [openingResolved, setOpeningResolved] = useState(false);
  const [week, setWeek] = useState(1);
  const [schedule, setSchedule] = useState<WeeklyAction[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [weekRecords, setWeekRecords] = useState<WeekRecord[]>([]);
  const [selectedBookId, setSelectedBookId] = useState(textbooks[0].id);
  const [selectedModule, setSelectedModule] =
    useState<Textbook["module"]>("module1");
  const [careerTab, setCareerTab] = useState<"planner" | "rivals" | "store">(
    "planner",
  );
  const [pendingEvent, setPendingEvent] = useState<GameEvent | null>(null);
  const [eventChoice, setEventChoice] = useState<string | null>(null);
  const [resolvedEvents, setResolvedEvents] = useState<string[]>([]);
  const [storyTags, setStoryTags] = useState<string[]>([]);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
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
  const [rivalRelationships, setRivalRelationships] = useState<
    Record<string, RivalRelationship>
  >({});
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [weeklyBonusPoints, setWeeklyBonusPoints] = useState(0);
  const [weeklyStudyBoost, setWeeklyStudyBoost] = useState(0);
  const [storeNotice, setStoreNotice] = useState<string | null>(null);
  const [allowanceRequestOpen, setAllowanceRequestOpen] = useState(false);
  const [allowanceChoice, setAllowanceChoice] = useState<string | null>(null);
  const [allowanceRequestCount, setAllowanceRequestCount] = useState(0);
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
  const [achievementToast, setAchievementToast] =
    useState<AchievementDefinition | null>(null);
  const [achievementHydrated, setAchievementHydrated] = useState(false);

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
      schoolTeamSize: 12 + ((base >>> 9) % 9),
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
      paperSetter: firstYear % 2 === 1 ? "思辨倾向命题年" : "基础倾向命题年",
    };
  }, [seed, selected]);

  const saveKey = "shengjing-rensheng-save-v1";
  const autoSaveKey = "shengjing-rensheng-autosave-v1";
  const achievementKey = "shengjing-rensheng-achievements-v1";
  const manualSaveKeys = Array.from({ length: 10 }, (_, index) =>
    index === 0 ? saveKey : `shengjing-rensheng-save-v1-slot-${index + 1}`,
  );
  const makeSaveData = () => ({
    version: 1,
    savedAt: new Date().toISOString(),
    selectedId,
    seed,
    name,
    screen,
    firstChoice,
    openingResolved,
    week,
    schedule,
    playerStats,
    weekRecords,
    selectedBookId,
    selectedModule,
    careerTab,
    pendingEvent,
    eventChoice,
    resolvedEvents,
    storyTags,
    actionCounts,
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
    rivalRelationships,
    inventory,
    weeklyBonusPoints,
    weeklyStudyBoost,
    storeNotice,
    allowanceRequestOpen,
    allowanceChoice,
    allowanceRequestCount,
    postCareerInput,
    postCareerState,
    unlockedAchievements,
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
      setScreen(data.screen);
      setFirstChoice(data.firstChoice);
      setOpeningResolved(data.openingResolved);
      setWeek(data.week);
      setSchedule(data.schedule ?? []);
      setPlayerStats({
        ...data.playerStats,
        slackDependence: data.playerStats.slackDependence ?? 0,
        experimentModules:
          data.playerStats.experimentModules ?? {
            module1: data.playerStats.experiment ?? 0,
            module2: data.playerStats.experiment ?? 0,
            module3: data.playerStats.experiment ?? 0,
            module4: data.playerStats.experiment ?? 0,
          },
      });
      setWeekRecords(data.weekRecords ?? []);
      setSelectedBookId(data.selectedBookId ?? textbooks[0].id);
      setSelectedModule(data.selectedModule ?? "module1");
      // 读档后统一回到周计划，避免玩家被恢复在小卖部或对手页而误以为进度丢失。
      setCareerTab("planner");
      setPendingEvent(data.pendingEvent ?? null);
      setEventChoice(data.eventChoice ?? null);
      setResolvedEvents(data.resolvedEvents ?? []);
      setStoryTags(data.storyTags ?? []);
      setActionCounts(data.actionCounts ?? {});
      setPendingAssessment(data.pendingAssessment ?? null);
      setAssessmentChoice(data.assessmentChoice ?? null);
      setQueuedEvent(data.queuedEvent ?? null);
      setProvincialAttempts(data.provincialAttempts ?? []);
      setNationalAttempts(data.nationalAttempts ?? []);
      setRetirementFlow(data.retirementFlow ?? null);
      setRetirementChoice(data.retirementChoice ?? null);
      setRetirementStageCompleted(data.retirementStageCompleted ?? null);
      setRetirementCooldownUntil(data.retirementCooldownUntil ?? 0);
      setRetirementAttemptCount(data.retirementAttemptCount ?? 0);
      setActiveTeamSize(data.activeTeamSize ?? 0);
      setRetiredRivalIds(data.retiredRivalIds ?? []);
      setRivalRelationships(data.rivalRelationships ?? {});
      setInventory(data.inventory ?? {});
      setWeeklyBonusPoints(data.weeklyBonusPoints ?? 0);
      setWeeklyStudyBoost(data.weeklyStudyBoost ?? 0);
      setStoreNotice(data.storeNotice ?? null);
      setAllowanceRequestOpen(data.allowanceRequestOpen ?? false);
      setAllowanceChoice(data.allowanceChoice ?? null);
      setAllowanceRequestCount(data.allowanceRequestCount ?? 0);
      setPostCareerInput(data.postCareerInput ?? null);
      setPostCareerState(data.postCareerState ?? null);
      setUnlockedAchievements(data.unlockedAchievements ?? {});
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
    setAchievementHydrated(true);
  }, []);

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
    const enteredTeamWithLowAverage = provincialAttempts.some(
      (attempt) => attempt.draftRank <= attempt.teamPlaces && moduleAverage < 65,
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
        Boolean(postCareerInput?.retired) &&
        (postCareerInput?.familySupport ?? 100) < 45 &&
        (postCareerInput?.coachFavor ?? 100) < 0,
      "province-upset": enteredTeamWithLowAverage,
      "province-one": provincialAttempts.some(
        (attempt) => attempt.draftRank <= attempt.firstPrizeEnd,
      ),
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
    const unlocked = achievementDefinitions.find(
      (achievement) =>
        conditions[achievement.id] && !unlockedAchievements[achievement.id],
    );
    if (!unlocked) return;
    setUnlockedAchievements((current) => ({
      ...current,
      [unlocked.id]: new Date().toISOString(),
    }));
    setAchievementToast(unlocked);
  }, [
    achievementToast,
    nationalAttempts,
    playerStats,
    postCareerInput,
    postCareerState,
    provincialAttempts,
    pendingAssessment,
    pendingEvent,
    retirementFlow,
    screen,
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
    });
    setFirstChoice(null);
    setOpeningResolved(false);
    setWeek(1);
    setSchedule([]);
    setWeekRecords([]);
    setCareerTab("planner");
    setSelectedModule("module1");
    setSelectedBookId(textbooks[0].id);
    setPendingEvent(null);
    setEventChoice(null);
    setResolvedEvents([]);
    setStoryTags([`origin:${selected.id}`]);
    setActionCounts({});
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
    setRivalRelationships(
      Object.fromEntries(
        rivals
          .filter((rival) => rival.scope.startsWith("school"))
          .map((rival) => [
            rival.id,
            {
              bond: 4 + (hashSeed(`${seed}-${rival.id}-bond`) % 8),
              tension: hashSeed(`${seed}-${rival.id}-tension`) % 5,
              romance: 0,
            },
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
    setPostCareerInput(null);
    setPostCareerState(null);
    setAchievementOpen(false);
    setAchievementToast(null);
    setScreen("week");
  };

  const confirmOpening = () => {
    const choice = openingEvent.choices.find((item) => item.id === firstChoice);
    if (!choice || !playerStats) return;
    setPlayerStats(applyEffects(playerStats, choice.effects));
    if (choice.effects.tags) {
      setStoryTags((current) => [...new Set([...current, ...choice.effects.tags!])]);
    }
    setOpeningResolved(true);
  };

  const calendar = calendarFor(generated.firstYear, week);
  const weekPhase = getWeekPhase(
    week,
    selected.stats.schoolSupport,
    calendar,
    storyTags,
  );
  const usedTime = schedule.reduce((total, action) => total + action.cost, 0);
  const totalFreePoints = weekPhase.freePoints + weeklyBonusPoints;
  const remainingTime = totalFreePoints - usedTime;

  const addAction = (action: WeeklyAction) => {
    if (!playerStats) return;
    let plannedAction = action;
    if (action.id === "slack-off") {
      const scheduledSlack = schedule.filter(
        (item) => item.id === "slack-off",
      ).length;
      const dependenceLevel = playerStats.slackDependence + scheduledSlack;
      plannedAction = {
        ...action,
        cost: Math.min(3, 1 + Math.floor(dependenceLevel / 3)),
        effects: {
          ...action.effects,
          san: round1(Math.max(2.5, 7 - dependenceLevel * 0.55)),
          mindset: round1(-1 - dependenceLevel * 0.12),
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
        mindset: item.category === "玩具" ? 0.5 : 0,
      }),
    );
    setInventory((current) => ({
      ...current,
      [item.id]: (current[item.id] ?? 0) + 1,
    }));
    if (item.purchaseTag) {
      setStoryTags((current) => [...new Set([...current, item.purchaseTag!])]);
    }
    setActionCounts((current) => ({
      ...current,
      [`shop:${item.id}`]: (current[`shop:${item.id}`] ?? 0) + 1,
    }));
    setStoreNotice(
      `买下了「${item.name}」。${item.flavor} 后续影响要等实际使用或事件发生后才会知道。`,
    );
  };

  const useShopItem = (item: ShopItem) => {
    if (!playerStats || !item.consumable || (inventory[item.id] ?? 0) <= 0)
      return;
    if (item.id === "coffee" && weeklyBonusPoints >= 2) {
      setStoreNotice("本周已经喝了两杯。再喝只会让手抖，不会继续增加行动点。");
      return;
    }
    setInventory((current) => ({
      ...current,
      [item.id]: Math.max(0, (current[item.id] ?? 0) - 1),
    }));
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
    setStoreNotice(
      `使用了「${item.name}」。你感觉到了一点变化，具体数值已经计入状态。`,
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
      baseSupportCost: 1.5,
      title: "只要三十元，买点零食和咖啡",
    },
    {
      id: "medium",
      amount: 80,
      baseSupportCost: 4,
      title: "要八十元，补充一周零花钱",
    },
    {
      id: "large",
      amount: 150,
      baseSupportCost: 7,
      title: "要一百五十元，解释最近确实需要",
    },
  ];

  const resolveAllowanceRequest = () => {
    if (!allowanceRequestOpen || !allowanceChoice || !playerStats) return;
    if (allowanceChoice === "cancel") {
      setAllowanceRequestOpen(false);
      setAllowanceChoice(null);
      return;
    }
    const option = allowanceOptions.find((item) => item.id === allowanceChoice);
    if (!option) return;
    const repetitionMultiplier = 1 + allowanceRequestCount * 0.35;
    const originCostFactor =
      selected.id === "wealthy-family"
        ? 0.7
        : selected.id === "coach-family"
          ? 1.2
          : 1;
    const supportCost = round1(
      option.baseSupportCost * repetitionMultiplier * originCostFactor,
    );
    const originChance =
      selected.id === "wealthy-family"
        ? 0.14
        : selected.id === "coach-family"
          ? 0.05
          : selected.id === "county-school"
            ? -0.05
            : 0;
    const successChance = clamp(
      0.38 +
        playerStats.familySupport / 130 -
        option.amount / 520 -
        allowanceRequestCount * 0.06 +
        originChance,
      0.15,
      0.94,
    );
    const succeeded =
      seededUnit(
        `${seed}-allowance-${week}-${allowanceRequestCount}-${option.id}`,
      ) < successChance;
    setPlayerStats(
      applyEffects(playerStats, {
        pocketMoney: succeeded ? option.amount : 0,
        familySupport: succeeded ? -supportCost : -supportCost * 0.5,
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
    setStoreNotice(
      succeeded
        ? `父母转来了 ¥${option.amount}，但对你近期的花销多问了几句。`
        : "父母没有转钱，并提醒你最近要得有些频繁。",
    );
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
      weeklyStudyBoost,
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
    effectLabels.forEach(([key]) => {
      const amount = scheduledEffects[key];
      if (typeof amount === "number") {
        effects[key] = ((effects[key] as number | undefined) ?? 0) + amount;
      }
    });
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
    const nextExperimentModules = { ...playerStats.experimentModules };
    schedule.forEach((action) => {
      if (!action.experimentModule) return;
      const module = action.experimentModule;
      const current = nextExperimentModules[module];
      const theory = weightedModuleProgress(updatedBooks.next, module);
      const softCap =
        current < 55 ? 1 : current < 72 ? 0.58 : current < 84 ? 0.3 : 0.12;
      const gain =
        (3.4 + theory * 0.032) *
        (0.8 + nextStats.reasoning * 0.0025) *
        adjusted.learningFactor *
        softCap;
      nextExperimentModules[module] = round1(
        Math.min(92, current + gain),
      );
      textbooks
        .filter((book) => book.module === module)
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
    setActionCounts(nextCounts);
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
    setPlayerStats(nextStats);
    setWeekRecords((current) => [
      ...current,
      {
        week,
        headline: weekHeadline(week, effects),
        changes,
        efficiency: adjusted.baseEfficiency,
        fluctuation: adjusted.fluctuation,
      },
    ]);
    let provincialAttempt: ProvincialAttempt | undefined;
    let nextAttempts = provincialAttempts;
    if (assessmentItem?.assessment?.title.includes("联赛")) {
      const attemptNumber: 1 | 2 =
        week === calendar.firstExamWeek ? 1 : 2;
      provincialAttempt = simulateProvincialExam(
        nextStats,
        seed,
        week,
        attemptNumber,
        generated,
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
    const milestone = findMilestoneEvent(
      week + 1,
      nextCalendar,
      resolvedEvents,
      nextAttempts,
      nextNationalAttempts,
      storyTags,
      seed,
    );
    const randomEvent = findWeeklyEvent(
      week + 1,
      nextStats,
      seed,
      resolvedEvents,
      storyTags,
      nextCounts,
      nextWeekPhaseForEvents.isTraining,
    );
    const teammateDeparture = makeTeammateDepartureEvent(
      week + 1,
      seed,
      activeTeamSize,
      generated.schoolTeamSize,
      retiredRivalIds,
    );
    const relationshipTurning = makeRelationshipTurningEvent(
      week + 1,
      rivalRelationships,
      resolvedEvents,
      retiredRivalIds,
    );
    const nextEvent =
      milestone ?? teammateDeparture ?? relationshipTurning ?? randomEvent;
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
      const familyPressureChance =
        nextStats.familySupport <= 24
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
      setPendingAssessment(
        generateAssessmentRecap(
          assessmentItem.assessment,
          nextStats,
          seed,
          week,
          provincialAttempt,
          nationalAttempt,
          nationalStage,
          generated.schoolAcademicStrength,
          generated.schoolParticipants,
        ),
      );
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
          ? { reasoning: 2.5, coachFavor: 1, san: -2 }
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
          ? 2.5
          : pendingAssessment.totalScore >= 580
            ? 1.2
            : pendingAssessment.totalScore < 430
              ? -1.5
              : 0;
    } else if (pendingAssessment.provincialAttempt) {
      familyResult =
        pendingAssessment.provincialAttempt.estimateHigh >= 65 ? 1.5 : 0;
    } else if (
      pendingAssessment.nationalAttempt?.qualifiedForExperiment
    ) {
      familyResult = 3;
    } else if (
      pendingAssessment.type === "competition" &&
      pendingAssessment.rank <= pendingAssessment.participants * 0.2
    ) {
      familyResult = 0.8;
    }
    effects.familySupport = round1(
      (effects.familySupport ?? 0) + familyResult,
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
    setPendingAssessment(null);
    setAssessmentChoice(null);
    setPendingEvent(queuedEvent);
    setQueuedEvent(null);
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
    );
    const nextStats = applyEffects(playerStats, resolvedEffects);
    nextStats.module1 = weightedModuleProgress(nextStats.bookStudy, "module1");
    nextStats.module2 = weightedModuleProgress(nextStats.bookStudy, "module2");
    nextStats.module3 = weightedModuleProgress(nextStats.bookStudy, "module3");
    nextStats.module4 = weightedModuleProgress(nextStats.bookStudy, "module4");
    setPlayerStats(nextStats);
    if (choice.effects.tags) {
      setStoryTags((current) => [...new Set([...current, ...choice.effects.tags!])]);
    }
    const involvedRival = rivalMentionedBy(pendingEvent);
    if (involvedRival) {
      setRivalRelationships((current) => {
        const previous = current[involvedRival.id] ?? {
          bond: 0,
          tension: 0,
          romance: 0,
        };
        const peerChange = resolvedEffects.peerFavor ?? 0;
        const avoided =
          choice.id.includes("avoid") ||
          choice.id.includes("decline") ||
          choice.id.includes("dismiss");
        const choseFriend = choice.id.startsWith("relationship-friend-");
        const choseRivalry = choice.id.startsWith("relationship-rivalry-");
        const choseCrush = choice.id.startsWith("relationship-crush-");
        return {
          ...current,
          [involvedRival.id]: {
            ...previous,
            bond: round1(
              clamp(
                previous.bond +
                  Math.max(0, peerChange) * 2.2 +
                  (choseFriend ? 15 : 0) +
                  (choseCrush ? 8 : 0),
              ),
            ),
            tension: round1(
              clamp(
                previous.tension +
                  Math.max(0, -peerChange) * 2.5 +
                  (avoided ? 2 : 0) +
                  (choseRivalry ? 18 : 0),
              ),
            ),
            romance: round1(
              clamp(previous.romance + (choseCrush ? 18 : 0)),
            ),
          },
        };
      });
    }
    if (pendingEvent.id.startsWith("teammate-departure-")) {
      const rivalId = pendingEvent.id
        .replace("teammate-departure-", "")
        .replace(/-\d+$/, "");
      setActiveTeamSize((current) => Math.max(0, current - 1));
      setRetiredRivalIds((current) => [...new Set([...current, rivalId])]);
    }
    setResolvedEvents((current) => [...current, pendingEvent.id]);
    if (pendingEvent.id === "national-2-award") {
      const secondNational = nationalAttempts.find(
        (attempt) => attempt.attemptNumber === 2,
      );
      enterPostCareer(
        nextStats,
        false,
        undefined,
        secondNational?.finalRank ?? null,
      );
      setEventChoice(null);
      return;
    }
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
      setRetirementFlow({
        ...retirementFlow,
        step: Math.min(2, retirementFlow.step + 1) as 0 | 1 | 2,
        resumeWeek: week + 1,
      });
      setRetirementChoice(null);
      setRetirementAttemptCount((current) => current + 1);
      return;
    }
    if (choice.action === "retire") {
      setRetirementStageCompleted(retirementFlow.stage);
      setRetirementFlow(null);
      setRetirementChoice(null);
      setSchedule([]);
      enterPostCareer(
        nextStats,
        true,
        retirementStageCopy[retirementFlow.stage].label.replace(
          "退赛事件 · ",
          "",
        ),
      );
      return;
    }
    setRetirementCooldownUntil(week + 4);
    setRetirementAttemptCount((current) => current + 1);
    setRetirementFlow(null);
    setRetirementChoice(null);
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

  const achievementUi = (
    <>
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
              {achievementDefinitions.map((achievement) => {
                const unlockedAt = unlockedAchievements[achievement.id];
                return (
                  <article
                    className={unlockedAt ? "unlocked" : "locked"}
                    key={achievement.id}
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
                          {new Date(unlockedAt).toLocaleDateString("zh-CN")}
                        </small>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
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
            <span className="step active">高考篇待续</span>
          </div>
          <span className="seed-chip">{seed}</span>
        </header>
        <section className="retired-ending-card">
          <p className="kicker">DEMO COMPLETE · THANK YOU</p>
          <span className="ending-week">第二次国赛结束</span>
          <h1>感谢游玩。</h1>
          <p className="retired-lead">
            {name}的两年生物竞赛路线暂时写到这里。高三回班、高考与大学录取将在后续版本继续；
            本版本不会再自动推进周数，以免进入尚未完成的流程。
          </p>
          <div className="retired-stats">
            <div>
              <span>四模块平均掌握</span>
              <strong>{moduleAverage.toFixed(1)}</strong>
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
                SAN {playerStats.san.toFixed(1)} · 心态{" "}
                {playerStats.mindset.toFixed(1)}
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
            <span className="step active">常规路线待续</span>
          </div>
          <span className="seed-chip">{seed}</span>
        </header>
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
                {playerStats.academics.toFixed(1)} /{" "}
                {regularUnlockedScore(week).toFixed(1)}
              </strong>
            </div>
            <div>
              <span>高考趋势</span>
              <strong>
                {projectedGaokaoScore(playerStats, week).toFixed(1)} / 750
              </strong>
            </div>
            <div>
              <span>离队时SAN</span>
              <strong>{playerStats.san.toFixed(1)}</strong>
            </div>
          </div>
          <div className="retired-placeholder">
            <strong>常规学习、高三与高考路线将在后续版本开放</strong>
            <p>
              这里将继续处理回班适应、补课、旧队友关系、竞赛经历如何影响高考心态，
              以及最终大学录取。
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
                <strong>¥{selected.stats.pocketMoney.toFixed(1)}</strong>
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
    const latestRecord = weekRecords.at(-1);
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
                    {(playerStats?.san ?? selected.stats.san).toFixed(1)}
                  </strong>
                </span>
                <span>
                  常规积累{" "}
                  <strong>
                    {(playerStats?.academics ?? 0).toFixed(1)} /{" "}
                    {regularUnlockedScore(1).toFixed(1)}
                  </strong>
                </span>
                <span>
                  零花钱{" "}
                  <strong>
                    ¥{(playerStats?.pocketMoney ?? selected.stats.pocketMoney).toFixed(1)}
                  </strong>
                </span>
              </div>
            </aside>

            <article className="event-card">
              <p className="event-index">{openingEvent.label}</p>
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
                      <small>{choice.preview}</small>
                    </span>
                  </button>
                ))}
              </div>

              {selectedOpeningChoice && (
                <div className="decision-note" role="status">
                  {selectedOpeningChoice.result}
                  <span>确认后将看到本周固定安排，并分配剩余时间。</span>
                </div>
              )}
              <button
                className="primary-button event-confirm"
                onClick={confirmOpening}
                disabled={!selectedOpeningChoice}
              >
                确认选择，安排本周 <span>→</span>
              </button>
            </article>
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
                  零花钱 <strong>¥{playerStats.pocketMoney.toFixed(1)}</strong>
                </span>
                <span>
                  家庭支持 <strong>{playerStats.familySupport.toFixed(1)}</strong>
                </span>
                <span>
                  此前申请 <strong>{allowanceRequestCount} 次</strong>
                </span>
              </div>
            </aside>
            <article className="event-card allowance-card">
              <p className="event-index">家庭事件 · 零花钱</p>
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
                        成功后获得 ¥{option.amount} · 家庭支持约 -
                        {round1(
                          option.baseSupportCost *
                            (1 + allowanceRequestCount * 0.35),
                        ).toFixed(1)}
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

    if (
      retirementFlow &&
      playerStats &&
      week >= (retirementFlow.resumeWeek ?? week)
    ) {
      const scene = retirementScene(retirementFlow, playerStats);
      const selectedRetirementChoice = scene.choices.find(
        (choice) => choice.id === retirementChoice,
      );
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
                  SAN <strong>{playerStats.san.toFixed(1)}</strong>
                </span>
                <span>
                  常规{" "}
                  <strong>
                    {playerStats.academics.toFixed(1)} /{" "}
                    {regularUnlockedScore(week).toFixed(1)}
                  </strong>
                </span>
                <span>
                  在队 <strong>{activeTeamSize} 人</strong>
                </span>
              </div>
            </aside>

            <article className="event-card retirement-card">
              <p className="event-index">{scene.label}</p>
              <h2>{scene.title}</h2>
              {scene.body.map((paragraph) => (
                <p className="event-copy" key={paragraph}>
                  {paragraph}
                </p>
              ))}
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
                      <small>{choice.preview}</small>
                    </span>
                  </button>
                ))}
              </div>
              {selectedRetirementChoice && (
                <div className="decision-note" role="status">
                  {selectedRetirementChoice.result}
                </div>
              )}
              <button
                className="primary-button event-confirm"
                onClick={resolveRetirementChoice}
                disabled={!selectedRetirementChoice}
              >
                {selectedRetirementChoice?.action === "retire"
                  ? "确认结束竞赛路线"
                  : "确认选择"}
                <span>→</span>
              </button>
            </article>
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
                  ? "省赛 · 第一次估分"
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
                        : "模拟排名"}
                </span>
                <strong>
                  {provincialEstimate
                    ? `${provincialEstimate.estimateLow.toFixed(1)}—${provincialEstimate.estimateHigh.toFixed(1)}`
                    : isNationalTheory && nationalResult
                      ? nationalResult.theoryT.toFixed(1)
                      : isNationalExperiment && nationalResult
                        ? nationalResult.finalScore.toFixed(1)
                        : pendingAssessment.type === "school" &&
                            pendingAssessment.totalScore
                          ? `${pendingAssessment.totalScore.toFixed(1)} / 750`
                    : pendingAssessment.rank}
                </strong>
                <small>
                  {provincialEstimate
                    ? `预计全省第 ${provincialEstimate.estimateRankLow}—${provincialEstimate.estimateRankHigh} 名`
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
                          ? `校内第 ${pendingAssessment.rank} / ${pendingAssessment.participants} · 当前阶段掌握 ${pendingAssessment.regularCoverage?.toFixed(1)}%`
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
                    {pendingAssessment.projectedGaokao.toFixed(1)} / 750。这里只是趋势，
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
                <span>所有分数保留一位小数</span>
              </div>

              <div className="subject-results">
                {pendingAssessment.subjects.map((subject) => (
                  <div key={subject.name}>
                    <span>{subject.name}</span>
                    <strong>
                      {subject.score.toFixed(1)}
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
            <div className="steps" aria-label="本周事件">
              <span className="step done">第 {week - 1} 周已结算</span>
              <span className="step active">随机事件</span>
              <span className="step">第 {week} 周待安排</span>
            </div>
            <span className="seed-chip">{seed}</span>
          </header>

          <section className="week-layout">
            <aside className="week-meta">
              <p className="kicker">社交事件已解锁</p>
              <h1>第 {week} 周</h1>
              <p>你的关系网让这件事有机会发生。</p>
              <div className="mini-status">
                <span>
                  社交 <strong>{(playerStats?.social ?? 0).toFixed(1)}</strong>
                </span>
                <span>
                  同学好感{" "}
                  <strong>{(playerStats?.peerFavor ?? 0).toFixed(1)}</strong>
                </span>
                <span>
                  SAN <strong>{(playerStats?.san ?? 0).toFixed(1)}</strong>
                </span>
              </div>
            </aside>

            <article className="event-card">
              <p className="event-index">{pendingEvent.label}</p>
              {pendingEvent.inspiration && (
                <p className="event-inspiration">{pendingEvent.inspiration}</p>
              )}
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
                      <small>
                        {pendingEvent.phase !== "exam" &&
                        hashSeed(
                          `${seed}-hidden-preview-${pendingEvent.id}-${choice.id}`,
                        ) %
                          100 <
                          45
                          ? "部分影响不会立即显现；结果还取决于你当前的状态与关系。"
                          : choice.preview}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              {selectedEventChoice && (
                <div className="decision-note" role="status">
                  {seedRivalText(selectedEventChoice.result, seed)}
                </div>
              )}
              <button
                className="primary-button event-confirm"
                onClick={resolvePendingEvent}
                disabled={!selectedEventChoice}
              >
                记录结果，继续本周 <span>→</span>
              </button>
            </article>
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
            </div>
            <span className="seed-chip">{seed}</span>
          </header>

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
                <strong>¥{playerStats.pocketMoney.toFixed(1)}</strong>
                <small>
                  家庭支持 {playerStats.familySupport.toFixed(1)} · 本周额外行动{" "}
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
                  <article className="store-item" key={item.id}>
                    <div className="store-item-top">
                      <span>{item.category}</span>
                      <strong>
                        ¥{salePrice}
                        {salePrice !== item.price && <del>¥{item.price}</del>}
                      </strong>
                    </div>
                    <h2>{item.name}</h2>
                    <p>
                      {owned > 0
                        ? item.description
                        : item.category === "特殊" || item.category === "玩具"
                          ? "看起来未必有用，也许会在未来触发某段经历。"
                          : "可能短暂改变本周状态，实际效果购买或使用后才会揭晓。"}
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
              </div>
              <div>
                {shopItems
                  .filter((item) => (inventory[item.id] ?? 0) > 0)
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
            </div>
            <span className="seed-chip">{seed}</span>
          </header>
          <RivalsPage
            stats={playerStats}
            week={week}
            seed={seed}
            remainingTime={remainingTime}
            storyTags={storyTags}
            schoolName={generated.school}
            relationships={rivalRelationships}
            retiredRivalIds={retiredRivalIds}
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

        <section className="planner-layout">
          <aside className="status-panel">
            <div className="week-number">
              <p className="kicker">WEEKLY SCHEDULE</p>
              <strong>{String(week).padStart(2, "0")}</strong>
              <span>{weekPhase.label}</span>
              <small>
                {calendar.dateLabel} · 距本年度五月联赛{" "}
                {Math.max(
                  0,
                  (week <= calendar.firstExamWeek
                    ? calendar.firstExamWeek
                    : calendar.secondExamWeek) - week,
                )}{" "}
                周
              </small>
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
                        }课程进度+${item.bookEffect.course.toFixed(1)}%`
                      : ""}
                    {item.bookEffect?.practice
                      ? ` · 刷题+${item.bookEffect.practice.toFixed(1)}轮`
                      : ""}
                    {item.coachBonus
                      ? ` · 跟随教练效率×${item.coachBonus.toFixed(1)}`
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
                  {mindsetSanCostMultiplier(playerStats.mindset).toFixed(1)}
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
                      {playerStats.academics.toFixed(1)} /{" "}
                      {regularUnlockedScore(week).toFixed(1)}
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
                      高考趋势 {projectedGaokaoScore(playerStats, week).toFixed(1)} /
                      750 · 当前阶段掌握{" "}
                      {(regularCoverage(playerStats, week) * 100).toFixed(1)}%
                    </small>
                  </div>
                  <StatusNumber label="教练好感" value={playerStats.coachFavor} />
                  <StatusNumber label="同学好感" value={playerStats.peerFavor} />
                  <StatusNumber
                    label="家庭支持"
                    value={playerStats.familySupport}
                  />
                  <StatusNumber label="零花钱" value={playerStats.pocketMoney} money />
                  <StatusNumber label="在队人数" value={activeTeamSize} />
                  <button
                    className="allowance-button"
                    onClick={() => {
                      setAllowanceRequestOpen(true);
                      setAllowanceChoice(null);
                    }}
                  >
                    问父母要点钱
                    <small>次数越多，家庭支持消耗越大。</small>
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
                      {retirementAttemptCount > 0
                        ? `已经历${retirementAttemptCount}轮协商；反复提出会扩大冲突。`
                        : "申请会持续数周，并进入家长与教练协商。"}
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
                行动可以重复选择。结算后必定触发一个本周事件；当前事件链含{" "}
                {linkedEventCount + weeklySocialEvents.length} 个固定或条件节点，
                另含退赛协商、队友离队与人物关系动态事件。
              </p>
            </div>

            {latestRecord && (
              <div className="week-result" role="status">
                <span>第 {latestRecord.week} 周结算</span>
                <strong>{latestRecord.headline}</strong>
                <p>
                  SAN效率 {(latestRecord.efficiency * 100).toFixed(0)}% ·
                  当周波动{" "}
                  {latestRecord.fluctuation >= 1 ? "+" : ""}
                  {((latestRecord.fluctuation - 1) * 100).toFixed(0)}%
                </p>
                <div>
                  {latestRecord.changes.map((change) => (
                    <em key={change.label}>
                      {change.label} {change.value > 0 ? "+" : ""}
                      {change.value.toFixed(1)}
                    </em>
                  ))}
                </div>
              </div>
            )}

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
                      <strong>{average.toFixed(1)}%</strong>
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
                        有效 {progress.toFixed(1)}% · 记忆{" "}
                        {state?.retention.toFixed(1) ?? "100.0"}%
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
                          {playerStats.bookStudy[selectedBook.id].course.toFixed(1)}%
                        </strong>
                      </span>
                      <span>
                        笔记{" "}
                        <strong>
                          {playerStats.bookStudy[selectedBook.id].notes.toFixed(1)}%
                        </strong>
                      </span>
                      <span>
                        刷题{" "}
                        <strong>
                          {playerStats.bookStudy[selectedBook.id].practice.toFixed(1)} 轮
                        </strong>
                      </span>
                      <span>
                        保持率{" "}
                        <strong>
                          {playerStats.bookStudy[selectedBook.id].retention.toFixed(1)}%
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
                            ? `课程 +${action.bookEffect.course.toFixed(1)}% · `
                            : ""}
                          {action.bookEffect?.notes
                            ? `笔记 +${action.bookEffect.notes.toFixed(1)}% · `
                            : ""}
                          {action.bookEffect?.practice
                            ? `刷题 +${action.bookEffect.practice.toFixed(1)}轮 · `
                            : ""}
                          {effectPreview(action.effects)}
                        </i>
                      </button>
                    );
                  })}
                </div>
              </div>
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
                          {playerStats?.experimentModules[module].toFixed(1)} ·
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
                            ? Math.min(
                                3,
                                1 +
                                  Math.floor(
                                    ((playerStats?.slackDependence ?? 0) +
                                      schedule.filter(
                                        (item) => item.id === "slack-off",
                                      ).length) /
                                      3,
                                  ),
                              )
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
                                ? (playerStats?.slackDependence ?? 0) >= 3
                                  ? "依赖正在形成：恢复递减、耗时增加"
                                  : "即时逃避很舒服，长期代价暂不明确"
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
        <button className="brand-button">生竞人生</button>
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
        <span className="version">PROVINCIAL BUILD · 0.9</span>
      </header>
      {saveDialog}
      {achievementUi}

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
            社交 {stats.social.toFixed(1)} · 同学好感 {stats.peerFavor.toFixed(1)}
          </small>
        </div>
      </div>

      <div className="social-unlock-note">
        <strong>社交不是单纯的好感加成。</strong>
        <span>
          它决定你能否听见训练群之外的消息、了解对手的学习方式，并解锁共同学习事件。
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
                  const snapshot = rivalSnapshot(rival, seed, week);
                  const relationship = relationships[rival.id] ?? {
                    bond: 0,
                    tension: 0,
                    romance: 0,
                  };
                  const relationshipRoute =
                    relationship.romance >= 30
                      ? "暧昧"
                      : relationship.tension >= 35
                        ? "宿敌"
                        : relationship.bond >= 38
                          ? "好友"
                          : relationship.tension >= 16
                            ? "竞争升温"
                            : relationship.bond >= 18
                              ? "逐渐熟悉"
                              : "普通队友";
                  const hasRetired = retiredRivalIds.includes(rival.id);
                  return (
                    <article
                      className={`rival-card ${unlocked ? "" : "locked"} ${
                        hasRetired ? "retired-rival" : ""
                      }`}
                      key={rival.id}
                    >
                      <div className="rival-card-top">
                        <span>{rival.gradeRelation}</span>
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
                                {relationship.bond.toFixed(1)} · 张力{" "}
                                {relationship.tension.toFixed(1)}
                              </dd>
                            </div>
                            <div>
                              <dt>能力情报</dt>
                              <dd>
                                {strengthKnown
                                  ? `${rival.hiddenStrength} · 当前估计 ${snapshot.level.toFixed(1)} · ${snapshot.trendLabel}`
                                  : `还需 ${Math.max(0, rival.revealSocial + 8 - stats.social).toFixed(1)} 点社交以确认`}
                              </dd>
                            </div>
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
                              ? `社交达到 ${rival.revealSocial.toFixed(1)} 后解锁`
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
  const parts = effectLabels
    .filter(([key]) => !key.startsWith("module"))
    .map(([key, label]) => {
      const value = effects[key];
      if (typeof value !== "number" || value === 0) return null;
      return `${label}${value > 0 ? "+" : ""}${value.toFixed(1)}`;
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
              <strong>{postKnowledgeTotal(state).toFixed(1)} / 750</strong>
            </div>
            <div>
              <span>SAN</span>
              <strong>{state.san.toFixed(1)}</strong>
            </div>
            <div>
              <span>心态</span>
              <strong>{state.mindset.toFixed(1)}</strong>
            </div>
            <div>
              <span>强基专项</span>
              <strong>{state.strongPrep.toFixed(1)}</strong>
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
                  {value.toFixed(1)} / {postSubjectMaxima[subject]}
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
          <p className="post-scene-detail">{scene.detail}</p>

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
                <strong>{state.gaokao.total.toFixed(1)} / 750</strong>
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
              <strong>{state.strongResult.written.toFixed(1)}</strong>
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
      <strong>{locked ? "未解锁" : value.toFixed(1)}</strong>
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
        {value.toFixed(1)}
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
      <strong>{value.toFixed(1)}</strong>
    </div>
  );
}

function Stat({ name, value }: { name: string; value: number }) {
  return (
    <div className="stat">
      <span>{name}</span>
      <strong>{value.toFixed(1)}</strong>
      <small>{statLabel(value)}</small>
    </div>
  );
}
