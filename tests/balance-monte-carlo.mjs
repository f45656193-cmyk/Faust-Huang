import assert from "node:assert/strict";
import test from "node:test";
import {
  nationalMedalForRank,
  nationalParticipantCount,
} from "../app/national-rules.ts";

const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));
const round1 = (value) => Math.round(value * 10) / 10;
const hashSeed = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
};
const seededUnit = (value) => (hashSeed(value) % 10000) / 9999;
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const average = (values) =>
  values.reduce((total, value) => total + value, 0) / values.length;

function provincial(seed, player, participants = 1300, teamPlaces = 17) {
  const week = 44;
  const literatureCount = 22 + (hashSeed(`${seed}-literature-${week}`) % 7);
  const paperWeirdness = seededUnit(`${seed}-paper-weirdness-${week}`);
  const requiredSpeed = 42 + paperWeirdness * 13 + (literatureCount - 22) * 0.45;
  const questions = Array.from({ length: 80 }, (_, index) => ({
    index,
    isLiterature: index >= 80 - literatureCount,
    moduleIndex:
      hashSeed(`${seed}-province-module-${week}-${index}`) % 4,
    strange:
      seededUnit(`${seed}-strange-${week}-${index}`) <
      0.07 + seededUnit(`${seed}-paper-weirdness-${week}`) * 0.12,
    difficulty:
      0.82 + seededUnit(`${seed}-difficulty-${week}-${index}`) * 0.44,
  }));
  const score = (modules, reasoning, speed, san, mindset, neglect, key) => {
    const form =
      (seededUnit(`${key}-form-a`) + seededUnit(`${key}-form-b`) - 1) *
      0.14;
    let correct = 0;
    for (const question of questions) {
      const ability = modules[question.moduleIndex];
      const base = question.isLiterature
        ? 0.15 + reasoning * 0.0045 + ability * 0.0022
        : 0.18 + ability * 0.0052 + reasoning * 0.001;
      const condition =
        (0.86 + san * 0.0016) *
        (0.94 + mindset * 0.0008) *
        Math.max(0.52, 1 - neglect * 0.05);
      const completion = clamp(0.7 + speed / (requiredSpeed * 3.25), 0.7, 1);
      const position = (question.index + 1) / questions.length;
      const pacing = position <= completion
        ? 1 - Math.max(0, position - 0.62) * Math.max(0, requiredSpeed - speed) / 95
        : 0.12;
      const probability = clamp(
        (base - (question.strange ? 0.11 : 0) + form) *
          condition * pacing /
          question.difficulty,
        0.055,
        0.91,
      );
      if (seededUnit(`${key}-answer-${question.index}`) < probability) {
        correct += 1;
      }
    }
    return correct * 2;
  };
  const playerScore = score(
    player.modules,
    player.reasoning,
    player.speed,
    player.san,
    player.mindset,
    player.neglect ?? 0,
    `${seed}-province-player-${week}`,
  );
  const rivals = Array.from({ length: participants - 1 }, (_, index) => {
    const namedCore = index < 70;
    const elite =
      seededUnit(`${seed}-province-elite-${week}-${index}`) < 0.045 ? 10 : 0;
    const grade = index % 7 === 0 ? 6 : index % 5 === 0 ? -4 : 0;
    const latent = clamp(
      namedCore
        ? 40 +
            seededUnit(`${seed}-named-core-a-${week}-${index}`) * 32 +
            (seededUnit(`${seed}-named-core-b-${week}-${index}`) - 0.5) * 10
        : 22 +
            seededUnit(`${seed}-province-level-a-${week}-${index}`) * 44 +
            (seededUnit(`${seed}-province-level-b-${week}-${index}`) - 0.5) * 16 +
            elite +
            grade,
      10,
      91,
    );
    const modules = Array.from({ length: 4 }, (_, moduleIndex) =>
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
        (seededUnit(`${seed}-province-reason-${week}-${index}`) - 0.5) * 20,
    );
    const speed = clamp(
      latent * 0.76 + 9 +
        (seededUnit(`${seed}-province-speed-${week}-${index}`) - 0.5) * 22,
    );
    return score(
      modules,
      reasoning,
      speed,
      58 + seededUnit(`${seed}-province-san-${week}-${index}`) * 34,
      52 + seededUnit(`${seed}-province-mind-${week}-${index}`) * 38,
      seededUnit(`${seed}-province-neglect-${week}-${index}`) < 0.12 ? 2 : 0,
      `${seed}-province-candidate-${week}-${index}`,
    );
  });
  const rank = 1 + rivals.filter((rivalScore) => rivalScore > playerScore).length;
  const cutoff = [...rivals].sort((a, b) => b - a)[teamPlaces - 1];
  return { playerScore, rank, cutoff, qualified: rank <= teamPlaces };
}

function meanAndSd(values) {
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return { mean, sd: Math.max(1, Math.sqrt(variance)) };
}

function national(seed, player) {
  const week = 56;
  const participants = nationalParticipantCount(
    hashSeed(`${seed}-national-size-${week}`),
  );
  const knowledge = average(player.modules);
  const condition =
    (0.87 + player.san * 0.0015) *
    (0.95 + player.mindset * 0.0007) *
    Math.max(0.55, 1 - (player.neglect ?? 0) * 0.05);
  const form =
    (seededUnit(`${seed}-national-form-a-${week}`) +
      seededUnit(`${seed}-national-form-b-${week}`) -
      1) *
    12;
  const questionLoad = 88 + (hashSeed(`${seed}-national-load-${week}`) % 29);
  const pacing = clamp(0.73 + player.speed * 0.0037 - (questionLoad - 88) * 0.0025, 0.7, 1.02);
  const literature = clamp(
    (23 + player.reasoning * 0.5 + knowledge * 0.18) * condition * pacing +
      form +
      (seededUnit(`${seed}-national-lit-${week}`) - 0.5) * 10,
  );
  const foundation = clamp(
    (12 + knowledge * 0.65 + player.reasoning * 0.06) * condition +
      form * 0.65 +
      (seededUnit(`${seed}-national-foundation-${week}`) - 0.5) * 9,
  );
  const raw = round1(literature * 0.9 + foundation * 0.1);
  const rivals = Array.from({ length: participants - 1 }, (_, index) => {
    const powerhouse =
      seededUnit(`${seed}-national-powerhouse-${week}-${index}`) < 0.22
        ? 11
        : 0;
    const latent = clamp(
      48 +
        seededUnit(`${seed}-national-latent-a-${week}-${index}`) * 34 +
        (seededUnit(`${seed}-national-latent-b-${week}-${index}`) - 0.5) * 14 +
        powerhouse,
      35,
      96,
    );
    const rivalKnowledge = clamp(
      latent +
        (seededUnit(`${seed}-national-knowledge-${week}-${index}`) - 0.5) * 13,
    );
    const reasoning = clamp(
      latent * 0.82 +
        10 +
        (seededUnit(`${seed}-national-reason-${week}-${index}`) - 0.5) * 15,
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
    const rivalForm =
      (seededUnit(`${seed}-national-rival-form-a-${week}-${index}`) +
        seededUnit(`${seed}-national-rival-form-b-${week}-${index}`) -
        1) *
      11;
    return {
      index,
      latent,
      knowledge: rivalKnowledge,
      experiment,
      theory: round1(
        ((23 + reasoning * 0.5 + rivalKnowledge * 0.18) *
          clamp(0.73 + speed * 0.0037 - (questionLoad - 88) * 0.0025, 0.7, 1.02) +
          rivalForm) * 0.9 +
          (12 +
            rivalKnowledge * 0.65 +
            reasoning * 0.06 +
            rivalForm * 0.65) *
            0.1,
      ),
    };
  });
  const theoryScores = rivals.map((rival) => rival.theory);
  const theoryDistribution = meanAndSd([...theoryScores, raw]);
  const theoryRank = 1 + theoryScores.filter((score) => score > raw).length;
  if (theoryRank > 240) {
    return {
      raw,
      theoryRank,
      qualified: false,
      finalRank: theoryRank,
      medal: nationalMedalForRank(theoryRank),
    };
  }

  const practical = average(player.experimentModules);
  const experimentRaw = average(
    player.experimentModules.map((moduleExperiment, index) =>
      clamp(
        8 +
          (moduleExperiment * 0.78 + practical * 0.22) * 0.52 +
          player.modules[index] * 0.22 +
          player.mindset * 0.04 +
          (seededUnit(`${seed}-national-exp-${week}-${index}`) - 0.5) * 22,
      ),
    ),
  );
  const qualifiedRivals = [...rivals]
    .sort((a, b) => b.theory - a.theory)
    .slice(0, 239);
  const rivalExperiment = qualifiedRivals.map((rival) =>
    clamp(
      8 +
        rival.experiment * 0.52 +
        rival.knowledge * 0.22 +
        rival.latent * 0.04 +
        (seededUnit(
          `${seed}-national-qualified-exp-${week}-${rival.index}`,
        ) -
          0.5) *
          22,
    ),
  );
  const experimentDistribution = meanAndSd([...rivalExperiment, experimentRaw]);
  const theoryT =
    50 + ((raw - theoryDistribution.mean) / theoryDistribution.sd) * 10;
  const experimentT =
    50 +
    ((experimentRaw - experimentDistribution.mean) /
      experimentDistribution.sd) *
      10;
  const finalScore = theoryT * 0.3 + experimentT * 0.7;
  const rivalFinal = qualifiedRivals.map((rival, index) => {
    const rivalTheoryT =
      50 +
      ((rival.theory - theoryDistribution.mean) / theoryDistribution.sd) * 10;
    const rivalExperimentT =
      50 +
      ((rivalExperiment[index] - experimentDistribution.mean) /
        experimentDistribution.sd) *
        10;
    return rivalTheoryT * 0.3 + rivalExperimentT * 0.7;
  });
  const finalRank = 1 + rivalFinal.filter((score) => score > finalScore).length;
  return {
    raw,
    theoryRank,
    qualified: true,
    finalRank,
    medal: nationalMedalForRank(finalRank),
  };
}

function sample(label, player, count = 120) {
  const province = Array.from({ length: count }, (_, index) =>
    provincial(`BAL-${label}-${index}`, player),
  );
  const nationals = Array.from({ length: count }, (_, index) =>
    national(`BAL-${label}-${index}`, player),
  );
  const qualifiedNationals = nationals.filter((item) => item.qualified);
  return {
    label,
    provinceAverage: round1(average(province.map((item) => item.playerScore))),
    provinceAverageRate: round1(
      average(province.map((item) => (item.playerScore / 160) * 100)),
    ),
    provinceMedianRank: median(province.map((item) => item.rank)),
    provinceTeamRate: round1(
      (province.filter((item) => item.qualified).length / count) * 100,
    ),
    provinceAverageCutoff: round1(average(province.map((item) => item.cutoff))),
    provinceAverageCutoffRate: round1(
      average(province.map((item) => (item.cutoff / 160) * 100)),
    ),
    nationalAverageRaw: round1(average(nationals.map((item) => item.raw))),
    nationalMedianTheoryRank: median(nationals.map((item) => item.theoryRank)),
    nationalExperimentRate: round1(
      (qualifiedNationals.length / count) * 100,
    ),
    nationalMedianFinalRank: qualifiedNationals.length
      ? median(
          qualifiedNationals
            .map((item) => item.finalRank)
            .filter((rank) => rank !== null),
        )
      : null,
    nationalTop50Rate: round1(
      (qualifiedNationals.filter(
        (item) => item.finalRank !== null && item.finalRank <= 50,
      ).length /
        count) *
        100,
    ),
  };
}

function rationalShopRoute(player) {
  const purchases = [
    { id: "coffee", name: "冰美式", price: 12, count: 8 },
    { id: "chocolate", name: "抽屉里的巧克力", price: 10, count: 9 },
    { id: "mint", name: "薄荷糖与荧光笔套装", price: 24, count: 6 },
    { id: "earplugs", name: "隔音耳塞", price: 22, count: 4 },
    { id: "hardback-notebook", name: "深绿色硬壳笔记本", price: 30, count: 1 },
  ];
  const totalCost = purchases.reduce(
    (total, purchase) => total + purchase.price * purchase.count,
    0,
  );
  // 以普通开局零花钱 160 元、每四周 45 元计算。玩家只在高强度周使用，
  // 咖啡带来的行动点重新投入学习，恢复品留给模考与国赛周，不假设无限叠加。
  const twoYearBudget = 160 + Math.floor(104 / 4) * 45;
  return {
    purchases,
    totalCost,
    twoYearBudget,
    player: {
      ...player,
      modules: player.modules.map((value) => clamp(value + 0.8)),
      reasoning: clamp(player.reasoning + 0.4),
      speed: clamp(player.speed + 1.1),
      san: clamp(player.san + 4.5),
      mindset: clamp(player.mindset + 1.6),
      experimentModules: player.experimentModules.map((value) =>
        clamp(value + 0.5),
      ),
    },
  };
}

const books = [
  ["biochemistry", 8, 5, 48, 4],
  ["molecular", 6, 4, 50, 4],
  ["cell", 6, 4, 50, 4],
  ["bioinformatics", 3, 3, 58, 4],
  ["botany", 5, 3, 52, 4],
  ["zoology", 8, 4, 50, 4],
  ["plant-physiology", 6, 4, 52, 4],
  ["animal-physiology", 10, 5, 48, 4],
  ["behavior", 3, 2, 70, 4],
  ["ecology", 4, 3, 60, 4],
  ["genetics", 5, 5, 68, 5],
  ["evolution", 3, 3, 62, 4],
].map(([id, baseWeeks, difficulty, lectureCap, maxLectures]) => ({
  id,
  baseWeeks,
  difficulty,
  lectureCap,
  maxLectures,
}));

function progression(strategy, weeks = 104) {
  const states = Object.fromEntries(
    books.map((book) => [
      book.id,
      { course: 0, notes: 0, retention: 100, last: 0, lectures: 0 },
    ]),
  );
  let cursor = 0;
  for (let week = 1; week <= weeks; week += 1) {
    for (const state of Object.values(states)) {
      const idle = state.last === 0 ? 0 : week - state.last;
      if (idle > 2) {
        state.retention = Math.max(
          15,
          state.retention * Math.min(0.985, 0.955 + state.notes * 0.0002),
        );
      }
    }
    const actions =
      strategy === "regular"
        ? week % 2 === 0
          ? 1
          : 0
        : strategy === "balanced"
          ? week % 2 === 0
            ? 3
            : 2
          : 3;
    const factor =
      strategy === "regular" ? 0.84 : strategy === "balanced" ? 0.82 : 0.74;
    for (let action = 0; action < actions; action += 1) {
      const book = books[cursor % books.length];
      cursor += 1;
      const state = states[book.id];
      let course;
      let noteGain = 0;
      let retentionGain;
      if (state.lectures < book.maxLectures && state.course < 52) {
        course = (book.lectureCap / book.maxLectures) * 1.32;
        retentionGain = 5;
        state.lectures += 1;
      } else if (state.notes < 70) {
        course = (100 / book.baseWeeks) * 0.85;
        noteGain = 100 / book.baseWeeks;
        retentionGain = 10;
      } else {
        course = 5.5 + book.difficulty * 0.7;
        retentionGain = 8;
      }
      const mastery =
        state.course < 65
          ? 0.67
          : state.course < 75
            ? 0.42
            : state.course < 85
              ? 0.24
              : 0.1;
      state.course = Math.min(94, state.course + course * factor * mastery);
      state.notes = Math.min(100, state.notes + noteGain * factor);
      state.retention = Math.min(100, state.retention + retentionGain * factor);
      state.last = week;
    }
  }
  const effective = books.map((book) => {
    const state = states[book.id];
    return state.course * (state.retention / 100);
  });
  return {
    average: round1(average(effective)),
    minimum: round1(Math.min(...effective)),
    maximum: round1(Math.max(...effective)),
    all: effective.map(round1),
  };
}

test("104-week study routes do not fill every textbook to 100", () => {
  const regular = progression("regular");
  const balanced = progression("balanced");
  const competition = progression("competition");
  console.log(JSON.stringify({ progression: { regular, balanced, competition } }, null, 2));
  assert.ok(regular.average < 50);
  assert.ok(balanced.average >= 70);
  assert.ok(balanced.average <= 85);
  assert.ok(competition.maximum < 94);
});

test("Monte Carlo balance keeps effort, luck, and elite difficulty distinct", () => {
  const regularOnly = sample("regular", {
    modules: [24, 28, 22, 26],
    reasoning: 22,
    speed: 25,
    san: 76,
    mindset: 68,
    experimentModules: [8, 8, 8, 8],
    neglect: 8,
  });
  const balanced = sample("balanced", {
    modules: [80, 78, 82, 79],
    reasoning: 58,
    speed: 61,
    san: 62,
    mindset: 64,
    experimentModules: [70, 72, 68, 70],
  });
  const nationalSeed = sample("national-seed", {
    modules: [85, 83, 87, 84],
    reasoning: 66,
    speed: 70,
    san: 68,
    mindset: 70,
    experimentModules: [79, 81, 78, 80],
  });
  const elite = sample("elite", {
    modules: [88, 86, 90, 87],
    reasoning: 70,
    speed: 78,
    san: 72,
    mindset: 75,
    experimentModules: [84, 82, 86, 83],
  });

  console.log(
    JSON.stringify({ regularOnly, balanced, nationalSeed, elite }, null, 2),
  );
  assert.equal(regularOnly.provinceTeamRate, 0);
  assert.ok(balanced.provinceAverageCutoff >= 96);
  assert.ok(balanced.provinceAverageCutoff <= 107.2);
  assert.ok(balanced.provinceAverageCutoffRate >= 60);
  assert.ok(balanced.provinceAverageCutoffRate <= 67);
  assert.ok(balanced.nationalAverageRaw >= 57);
  assert.ok(balanced.nationalAverageRaw <= 65);
  assert.ok(nationalSeed.nationalTop50Rate >= 5);
  assert.ok(nationalSeed.nationalTop50Rate <= 45);
  assert.ok(elite.nationalTop50Rate > balanced.nationalTop50Rate);
  assert.ok(elite.nationalTop50Rate < 80);
});

test("rational shopping and item use help without replacing study", () => {
  const basePlayer = {
    modules: [80, 78, 82, 79],
    reasoning: 58,
    speed: 61,
    san: 62,
    mindset: 64,
    experimentModules: [70, 72, 68, 70],
  };
  const shopping = rationalShopRoute(basePlayer);
  const withoutItems = sample("rational-items", basePlayer, 80);
  const withItems = sample("rational-items", shopping.player, 80);
  console.log(
    JSON.stringify(
      {
        rationalShopping: {
          purchases: shopping.purchases,
          totalCost: shopping.totalCost,
          twoYearBudget: shopping.twoYearBudget,
          withoutItems,
          withItems,
        },
      },
      null,
      2,
    ),
  );
  assert.ok(shopping.totalCost <= shopping.twoYearBudget * 0.45);
  assert.ok(withItems.nationalAverageRaw >= withoutItems.nationalAverageRaw);
  assert.ok(
    withItems.nationalAverageRaw - withoutItems.nationalAverageRaw <= 3,
  );
  assert.ok(withItems.provinceTeamRate - withoutItems.provinceTeamRate <= 15);
  assert.ok(withItems.nationalTop50Rate - withoutItems.nationalTop50Rate <= 10);
});
