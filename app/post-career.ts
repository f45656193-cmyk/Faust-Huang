import { buildFutureEpilogue } from "./future-epilogues.ts";
import type { GameEvent } from "./game-data.ts";

export type PostSubject =
  | "语文"
  | "数学"
  | "英语"
  | "物理"
  | "化学"
  | "生物";

export type AdmissionTarget =
  | "qingbei"
  | "east-c9"
  | "other-c9"
  | "upper-985"
  | "regular";

export type ApplicationRoute =
  | "recommendation"
  | "exceptional"
  | "ordinary-strong"
  | "regular";

export type MedalTier =
  | "training-team"
  | "gold"
  | "true-silver"
  | "silver"
  | "bronze"
  | "provincial"
  | "none";

export type PostCareerInput = {
  seed: string;
  name: string;
  originId: string;
  originAcademic: number;
  retiredWeek: number;
  retired: boolean;
  retirementLabel?: string;
  academics: number;
  reasoning: number;
  biologyMastery: number;
  experiment: number;
  san: number;
  mindset: number;
  social: number;
  familySupport: number;
  familyProfileKey?: "anxious" | "results" | "longterm" | "open";
  coachFavor: number;
  peerFavor: number;
  nationalRank: number | null;
  nationalMedal?: string;
  playerGender?: "male" | "female";
  modules?: [number, number, number, number];
  fantasyJoined?: boolean;
  fantasyChats?: number;
  relationships?: Array<{
    name: string;
    route: "dating" | "friend" | "broken-up" | "strained" | "crush";
    bond: number;
    trust: number;
    conflict: number;
    familiarity?: number;
    security?: number;
    estrangement?: number;
    personalityKey?: "reserved" | "warm" | "competitive" | "playful" | "curious";
    innerConflictKey?: "abandonment" | "burden" | "achievement" | "distance" | "caretaking" | "family";
  }>;
};

export type PostChoice = {
  id: string;
  title: string;
  hint: string;
};

export type GaokaoResult = {
  subjects: Record<PostSubject, number>;
  total: number;
  provinceRank: number;
  participants: number;
};

export type StrongResult = {
  written?: number;
  writtenCutoff?: number;
  writtenRank?: number;
  writtenParticipants?: number;
  enteredInterview?: boolean;
  interview?: number;
  composite?: number;
};

export type AdmissionResult = {
  admitted: boolean;
  school: string;
  major: string;
  routeLabel: string;
  ordinaryLine: number;
  title: string;
  letter: string;
};

export type NationalSelection = {
  eligible: boolean;
  theoryScore?: number;
  theoryRank?: number;
  experimentScore?: number;
  finalRank?: number;
  selected?: boolean;
  internationalRank?: number;
  internationalMedal?: "金牌" | "银牌" | "铜牌" | "优胜奖";
};

export type PostCareerState = {
  version: 1;
  stage: string;
  resumeStage?: string;
  bridgeRemaining: number;
  semesterIndex: number;
  subjects: Record<PostSubject, number>;
  san: number;
  mindset: number;
  social: number;
  familySupport: number;
  reasoning: number;
  biologyMastery: number;
  experiment: number;
  medalTier: MedalTier;
  nationalRank: number | null;
  nationalSelection: NationalSelection;
  strongPrep: number;
  interviewPrep: number;
  applicationTarget?: AdmissionTarget;
  applicationRoute?: ApplicationRoute;
  gaokaoForExperience?: boolean;
  gaokao?: GaokaoResult;
  strongResult?: StrongResult;
  admission?: AdmissionResult;
  collapseWarnings: number;
  lastResult?: string;
  history: string[];
  ending?: {
    title: string;
    subtitle: string;
    body: string;
    epilogue: string;
    futureRouteId?: string;
    futureTitle?: string;
    epilogueParagraphs?: string[];
    abnormal?: boolean;
  };
};

export type PostScene = {
  kicker: string;
  title: string;
  lead: string;
  detail: string;
  choices: PostChoice[];
};

const subjectMax: Record<PostSubject, number> = {
  语文: 150,
  数学: 150,
  英语: 150,
  物理: 100,
  化学: 100,
  生物: 100,
};

const subjectNames = Object.keys(subjectMax) as PostSubject[];

const schoolPools: Record<
  Exclude<AdmissionTarget, "regular">,
  Array<{ name: string; major: string }>
> = {
  qingbei: [
    { name: "北辰大学", major: "生物科学（强基计划）" },
    { name: "清岚大学", major: "生命科学（强基计划）" },
  ],
  "east-c9": [
    { name: "之江大学", major: "生物工程（强基计划）" },
    { name: "沪江大学", major: "生物科学（强基计划）" },
    { name: "海城交通大学", major: "生物医学科学（强基计划）" },
  ],
  "other-c9": [
    { name: "金陵大学", major: "生物科学（强基计划）" },
    { name: "长安理工大学", major: "生物技术（强基计划）" },
    { name: "瀚海科技大学", major: "生命科学（强基计划）" },
  ],
  "upper-985": [
    { name: "岭南大学", major: "生物科学" },
    { name: "华中生命科技大学", major: "生物工程" },
    { name: "西川大学", major: "生物科学" },
    { name: "齐鲁大学", major: "生物技术" },
  ],
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function seededUnit(value: string) {
  return (hashSeed(value) % 10000) / 9999;
}

function medalTierFor(input: PostCareerInput): MedalTier {
  if (
    input.nationalRank !== null &&
    input.nationalRank <= NATIONAL_TRAINING_TEAM_CUTOFF
  )
    return "training-team";
  if (
    input.nationalRank !== null &&
    input.nationalRank <= NATIONAL_GOLD_CUTOFF
  )
    return "gold";
  if (
    input.nationalRank !== null &&
    input.nationalRank <= NATIONAL_TRUE_SILVER_END
  )
    return "true-silver";
  if (
    input.nationalRank !== null &&
    input.nationalRank <= NATIONAL_SILVER_CUTOFF
  )
    return "silver";
  if (input.nationalRank !== null) return "bronze";
  if (!input.retired && input.retiredWeek >= 40) return "provincial";
  return "none";
}

function distributeInitialScore(
  total: number,
  input: PostCareerInput,
): Record<PostSubject, number> {
  const biologyTransfer = clamp((input.biologyMastery - 55) * 0.22, 0, 10);
  const reasoningTransfer = clamp((input.reasoning - 45) * 0.08, 0, 5);
  const shares: Record<PostSubject, number> = {
    语文: 0.19,
    数学: 0.2,
    英语: 0.19,
    物理: 0.135,
    化学: 0.135,
    生物: 0.14,
  };
  const subjects = Object.fromEntries(
    subjectNames.map((subject) => [
      subject,
      round1(Math.min(subjectMax[subject] * 0.92, total * shares[subject])),
    ]),
  ) as Record<PostSubject, number>;
  subjects.生物 = round1(
    Math.min(subjectMax.生物 * 0.96, subjects.生物 + biologyTransfer),
  );
  subjects.化学 = round1(
    Math.min(subjectMax.化学 * 0.94, subjects.化学 + biologyTransfer * 0.35),
  );
  subjects.数学 = round1(
    Math.min(subjectMax.数学 * 0.94, subjects.数学 + reasoningTransfer),
  );
  subjects.物理 = round1(
    Math.min(subjectMax.物理 * 0.93, subjects.物理 + reasoningTransfer * 0.5),
  );
  return subjects;
}

export function createPostCareer(input: PostCareerInput): PostCareerState {
  const earlyRetirementBonus = input.retired && input.retiredWeek <= 32 ? 26 : 0;
  const competitionGap =
    !input.retired && input.retiredWeek >= 80
      ? 34
      : input.retiredWeek >= 60
        ? 30
        : input.retiredWeek >= 36
          ? 16
          : 0;
  const medalLearningTransfer =
    input.nationalRank !== null
      ? input.nationalRank <= NATIONAL_TRAINING_TEAM_CUTOFF
        ? 28
        : input.nationalRank <= NATIONAL_GOLD_CUTOFF
          ? 24
          : input.nationalRank <= NATIONAL_TRUE_SILVER_END
            ? 20
            : input.nationalRank <= NATIONAL_SILVER_CUTOFF
              ? 12
              : 8
      : 0;
  const currentCoverage = clamp(input.academics / 6.2, 0, 95);
  const startingTotal = clamp(
    330 +
      input.originAcademic * 2.05 +
      currentCoverage * 0.45 +
      earlyRetirementBonus -
      competitionGap +
      medalLearningTransfer,
    405,
    570,
  );
  const bridgeRemaining = input.retired
    ? input.retiredWeek <= 16
      ? 4
      : input.retiredWeek <= 40
        ? 3
        : input.retiredWeek <= 64
          ? 2
          : 1
    : 0;
  const tier = medalTierFor(input);
  return {
    version: 1,
    stage: bridgeRemaining > 0 ? "bridge" : "return",
    bridgeRemaining,
    semesterIndex: 5 - bridgeRemaining,
    subjects: distributeInitialScore(startingTotal, input),
    san: round1(input.san),
    mindset: round1(input.mindset),
    social: round1(input.social),
    familySupport: round1(input.familySupport),
    reasoning: round1(input.reasoning),
    biologyMastery: round1(input.biologyMastery),
    experiment: round1(input.experiment),
    medalTier: tier,
    nationalRank: input.nationalRank,
    nationalSelection: { eligible: tier === "training-team" },
    strongPrep: 0,
    interviewPrep: 0,
    collapseWarnings: 0,
    history: [
      input.retired
        ? `${input.retirementLabel ?? "退赛谈话"}结束后，你回到了常规课堂。`
        : `第二次全国决赛结束，你带着全国第${input.nationalRank ?? "—"}名回到班级。`,
    ],
  };
}

function applySubjectGains(
  subjects: Record<PostSubject, number>,
  gains: Partial<Record<PostSubject, number>>,
) {
  return Object.fromEntries(
    subjectNames.map((subject) => [
      subject,
      round1(
        clamp(
          subjects[subject] + (gains[subject] ?? 0) * 0.65,
          0,
          subjectMax[subject] * 0.97,
        ),
      ),
    ]),
  ) as Record<PostSubject, number>;
}

function allGain(amount: number): Partial<Record<PostSubject, number>> {
  return {
    语文: amount * 1.1,
    数学: amount * 1.15,
    英语: amount,
    物理: amount * 0.72,
    化学: amount * 0.72,
    生物: amount * 0.68,
  };
}

function totalKnowledge(state: PostCareerState) {
  return round1(
    subjectNames.reduce((total, subject) => total + state.subjects[subject], 0),
  );
}

function healthIntervention(
  state: PostCareerState,
  intendedStage: string,
): PostCareerState {
  if (
    !["crisis", "withdrawal", "ending"].includes(intendedStage) &&
    state.san <= 9 &&
    state.mindset <= 16
  ) {
    return {
      ...state,
      stage: state.collapseWarnings >= 1 ? "withdrawal" : "crisis",
      resumeStage: intendedStage,
      collapseWarnings: state.collapseWarnings + 1,
    };
  }
  return { ...state, stage: intendedStage };
}

function update(
  state: PostCareerState,
  values: {
    stage: string;
    gains?: Partial<Record<PostSubject, number>>;
    san?: number;
    mindset?: number;
    social?: number;
    familySupport?: number;
    strongPrep?: number;
    interviewPrep?: number;
    result: string;
  },
) {
  const next: PostCareerState = {
    ...state,
    subjects: applySubjectGains(state.subjects, values.gains ?? {}),
    san: round1(clamp(state.san + (values.san ?? 0))),
    mindset: round1(clamp(state.mindset + (values.mindset ?? 0))),
    social: round1(clamp(state.social + (values.social ?? 0))),
    familySupport: round1(
      clamp(state.familySupport + (values.familySupport ?? 0)),
    ),
    strongPrep: round1(clamp(state.strongPrep + (values.strongPrep ?? 0))),
    interviewPrep: round1(
      clamp(state.interviewPrep + (values.interviewPrep ?? 0)),
    ),
    lastResult: values.result,
    history: [...state.history, values.result],
  };
  return healthIntervention(next, values.stage);
}

function simulateSelectionTheory(state: PostCareerState, seed: string) {
  const player =
    state.reasoning * 0.42 +
    state.biologyMastery * 0.38 +
    state.mindset * 0.08 +
    state.san * 0.04 +
    clamp((51 - (state.nationalRank ?? 50)) * 0.18, 0, 8) +
    (seededUnit(`${seed}-selection-theory-player`) - 0.5) * 18;
  const rivals = Array.from(
    { length: 49 },
    (_, index) =>
      61 +
      seededUnit(`${seed}-selection-theory-${index}`) * 29 +
      (seededUnit(`${seed}-selection-theory-form-${index}`) - 0.5) * 12,
  );
  return {
    score: round1(clamp(player)),
    rank: 1 + rivals.filter((score) => score > player).length,
  };
}

function simulateSelectionExperiment(state: PostCareerState, seed: string) {
  const theoryRank = state.nationalSelection.theoryRank ?? 50;
  const playerExperiment =
    state.experiment * 0.57 +
    state.biologyMastery * 0.2 +
    state.mindset * 0.08 +
    state.reasoning * 0.07 +
    clamp((51 - (state.nationalRank ?? 50)) * 0.12, 0, 6) +
    (seededUnit(`${seed}-selection-exp-player`) - 0.5) * 20;
  const playerComposite =
    (state.nationalSelection.theoryScore ?? 0) * 0.45 +
    playerExperiment * 0.55;
  const rivals = Array.from({ length: 49 }, (_, index) => {
    const latent =
      65 +
      seededUnit(`${seed}-selection-latent-${index}`) * 27 +
      (index < 10 ? 4 : 0);
    const experiment =
      latent +
      (seededUnit(`${seed}-selection-exp-${index}`) - 0.5) * 18;
    const theory =
      latent +
      (seededUnit(`${seed}-selection-th-${index}`) - 0.5) * 15;
    return theory * 0.45 + experiment * 0.55;
  });
  const finalRank =
    1 + rivals.filter((score) => score > playerComposite).length;
  return {
    experimentScore: round1(clamp(playerExperiment)),
    finalRank,
    selected: finalRank <= 5,
  };
}

function simulateGaokao(state: PostCareerState, seed: string): GaokaoResult {
  const condition =
    clamp(0.91 + state.san * 0.0008 + state.mindset * 0.0007, 0.88, 1.04);
  const subjects = Object.fromEntries(
    subjectNames.map((subject, index) => {
      const max = subjectMax[subject];
      const volatility =
        subject === "语文" || subject === "英语" ? 12 : max === 150 ? 15 : 10;
      const noise =
        (seededUnit(`${seed}-gaokao-${subject}-${index}`) +
          seededUnit(`${seed}-gaokao-b-${subject}-${index}`) -
          1) *
        volatility;
      const cascade =
        state.mindset < 28 && seededUnit(`${seed}-gaokao-cascade-${subject}`) < 0.22
          ? -8
          : 0;
      return [
        subject,
        round1(clamp(state.subjects[subject] * condition + noise + cascade, 0, max)),
      ];
    }),
  ) as Record<PostSubject, number>;
  const total = round1(
    subjectNames.reduce((sum, subject) => sum + subjects[subject], 0),
  );
  const participants = 265000 + (hashSeed(`${seed}-gaokao-size`) % 260001);
  // 以公开的一分一段表为锚点，再按本种子的省份规模同比缩放。
  // 这样位次与分数保持单调，也不会出现普通志愿上985却排十万名之后。
  const rankAnchors: Array<[number, number]> = [
    [700, 0.00035], [690, 0.00176], [675, 0.00874], [660, 0.0241],
    [650, 0.03886], [640, 0.0578], [630, 0.082], [620, 0.1104],
    [610, 0.1439], [600, 0.1806], [590, 0.22], [580, 0.2616],
    [560, 0.3455], [540, 0.4307], [520, 0.5144], [500, 0.5954],
    [450, 0.765], [400, 0.875], [300, 0.98],
  ];
  const provinceDifficultyShift =
    (seededUnit(`${seed}-province-score-shift`) - 0.5) * 5;
  const comparableScore = total + provinceDifficultyShift;
  let percentile = rankAnchors[rankAnchors.length - 1][1];
  for (let index = 0; index < rankAnchors.length - 1; index += 1) {
    const [highScore, highPct] = rankAnchors[index];
    const [lowScore, lowPct] = rankAnchors[index + 1];
    if (comparableScore <= highScore && comparableScore >= lowScore) {
      const t = (highScore - comparableScore) / (highScore - lowScore);
      percentile = highPct + (lowPct - highPct) * t;
      break;
    }
    if (comparableScore > rankAnchors[0][0]) percentile = rankAnchors[0][1];
  }
  const provinceRank = Math.max(
    1,
    Math.round(
      participants *
        clamp(
          percentile +
            (seededUnit(`${seed}-gaokao-rank-noise`) - 0.5) * 0.002,
          0.0001,
          0.999,
        ),
    ),
  );
  return { subjects, total, provinceRank, participants };
}

function targetBaseline(target: AdmissionTarget, seed: string) {
  const base: Record<AdmissionTarget, number> = {
    qingbei: 688,
    "east-c9": 661,
    "other-c9": 646,
    "upper-985": 615,
    regular: 590,
  };
  return round1(
    base[target] + (seededUnit(`${seed}-line-${target}`) - 0.5) * 18,
  );
}

function simulateStrongWritten(state: PostCareerState, seed: string) {
  const math = state.gaokao?.subjects.数学 ?? state.subjects.数学;
  const chemistry = state.gaokao?.subjects.化学 ?? state.subjects.化学;
  const player =
    (math / 150) * 43 +
    (chemistry / 100) * 31 +
    state.reasoning * 0.1 +
    state.strongPrep * 0.18 +
    state.san * 0.03 +
    (seededUnit(`${seed}-strong-written-player`) - 0.5) * 16;
  const participants =
    220 + (hashSeed(`${seed}-strong-written-size`) % 241);
  const target = state.applicationTarget ?? "upper-985";
  const difficulty =
    target === "qingbei" ? 8 : target === "east-c9" ? 4 : target === "other-c9" ? 1 : -3;
  const rivalScores = Array.from(
    { length: participants - 1 },
    (_, index) =>
      46 +
      difficulty +
      seededUnit(`${seed}-strong-rival-${index}`) * 39 +
      (seededUnit(`${seed}-strong-rival-form-${index}`) - 0.5) * 14,
  );
  const written = round1(clamp(player));
  const rank = 1 + rivalScores.filter((score) => score > written).length;
  const slots =
    target === "qingbei"
      ? 14
      : target === "east-c9"
        ? 20
        : target === "other-c9"
          ? 24
          : 30;
  const interviewPlaces = slots * (target === "qingbei" ? 4 : 5);
  const sorted = [...rivalScores].sort((a, b) => b - a);
  const cutoff = round1(sorted[Math.min(sorted.length - 1, interviewPlaces - 1)]);
  return {
    written,
    writtenCutoff: cutoff,
    writtenRank: rank,
    writtenParticipants: participants,
    enteredInterview: rank <= interviewPlaces,
  };
}

function simulateStrongInterview(state: PostCareerState, seed: string) {
  const routeBoost =
    state.applicationRoute === "exceptional"
      ? state.medalTier === "gold"
        ? 13
        : state.medalTier === "true-silver"
          ? 9
          : state.medalTier === "silver"
            ? 4
            : 1
      : 0;
  const interview = round1(
    clamp(
      24 +
        state.reasoning * 0.24 +
        state.social * 0.14 +
        state.mindset * 0.12 +
        state.interviewPrep * 0.18 +
        routeBoost +
        (seededUnit(`${seed}-strong-interview`) - 0.5) * 18,
    ),
  );
  const highExam = state.gaokao?.total ?? totalKnowledge(state);
  const schoolScore =
    state.applicationRoute === "ordinary-strong"
      ? ((state.strongResult?.written ?? 0) * 2 + interview) / 3
      : interview;
  const composite = round1((highExam / 750) * 850 + schoolScore * 1.5);
  return { interview, composite };
}

function pickSchool(target: Exclude<AdmissionTarget, "regular">, seed: string) {
  const pool = schoolPools[target];
  return pool[hashSeed(`${seed}-school-${target}`) % pool.length];
}

function regularAdmission(
  state: PostCareerState,
  seed: string,
): AdmissionResult {
  const total = state.gaokao?.total ?? totalKnowledge(state);
  const rankFraction = state.gaokao
    ? state.gaokao.provinceRank / state.gaokao.participants
    : 1;
  const candidates =
    rankFraction <= 0.0025
      ? schoolPools.qingbei
      : rankFraction <= 0.025
        ? schoolPools["east-c9"]
        : rankFraction <= 0.055
          ? schoolPools["other-c9"]
          : rankFraction <= 0.12
            ? schoolPools["upper-985"]
            : [
                { name: "临江师范大学", major: "生物科学" },
                { name: "青岚理工大学", major: "生物工程" },
                { name: "云泽医科大学", major: "基础医学" },
              ];
  const school = candidates[hashSeed(`${seed}-regular-admission`) % candidates.length];
  const admitted985 = rankFraction <= 0.12;
  return {
    admitted: true,
    school: school.name,
    major: school.major,
    routeLabel: admitted985 ? "普通高考志愿" : "普通本科志愿",
    ordinaryLine: targetBaseline(admitted985 ? "upper-985" : "regular", seed),
    title: admitted985 ? "一张靠自己追回来的通知书" : "另一条可以继续生长的路",
    letter: `${school.name}决定录取你进入${school.major}专业。`,
  };
}

function resolveAdmission(
  state: PostCareerState,
  seed: string,
): AdmissionResult {
  if (
    state.applicationRoute === "recommendation" &&
    state.medalTier === "training-team"
  ) {
    const recommendationTarget =
      state.applicationTarget && state.applicationTarget !== "regular"
        ? state.applicationTarget
        : "east-c9";
    const school = pickSchool(recommendationTarget, seed);
    return {
      admitted: true,
      school: school.name,
      major: school.major,
      routeLabel: "国家集训队保送",
      ordinaryLine: targetBaseline(recommendationTarget, seed),
      title: "名单上最早确定的名字",
      letter: `${school.name}确认接收你进入${school.major}专业。高考不再是录取条件，但你的训练仍未结束。`,
    };
  }
  const target = state.applicationTarget;
  if (state.applicationRoute === "regular" || !target || target === "regular")
    return regularAdmission(state, seed);
  if (
    state.applicationRoute === "ordinary-strong" &&
    !state.strongResult?.enteredInterview
  )
    return regularAdmission(state, `${seed}-strong-failed`);

  const total = state.gaokao?.total ?? totalKnowledge(state);
  const ordinaryLine = targetBaseline(target, seed);
  const route = state.applicationRoute;
  const medalBoost =
    route === "exceptional"
      ? state.medalTier === "gold"
        ? target === "qingbei"
          ? 15
          : 74
        : state.medalTier === "true-silver"
          ? target === "qingbei"
            ? 5
            : 65
          : state.medalTier === "silver"
            ? target === "upper-985"
              ? 25
              : target === "qingbei"
                ? 2
                : 48
            : target === "upper-985"
              ? 8
              : 0
      : 0;
  const writtenBoost =
    route === "ordinary-strong"
      ? clamp((state.strongResult?.written ?? 45) - 50, -8, 22) * 0.8
      : 0;
  const interviewBoost = clamp(
    (state.strongResult?.interview ?? 48) - 48,
    -10,
    22,
  );
  const targetRisk =
    target === "qingbei" ? 9 : target === "east-c9" ? 3 : target === "other-c9" ? 0 : -4;
  const annualDemand =
    (seededUnit(`${seed}-recruiting-demand-${target}`) - 0.5) * 18;
  const effective = total + medalBoost + writtenBoost + interviewBoost + annualDemand;
  const threshold =
    ordinaryLine -
    (route === "ordinary-strong"
      ? target === "east-c9"
        ? 21
        : target === "other-c9"
          ? 18
          : 13
      : target === "east-c9"
        ? 30
        : target === "other-c9"
          ? 27
          : 16) +
    targetRisk;
  const admitted = effective >= threshold;
  if (!admitted) return regularAdmission(state, `${seed}-fallback`);
  const school = pickSchool(target, seed);
  return {
    admitted: true,
    school: school.name,
    major: school.major,
    routeLabel:
      route === "exceptional" ? "竞赛破格强基" : "普通强基计划",
    ordinaryLine,
    title:
      route === "exceptional"
        ? "奖牌的另一种含义"
        : "笔试之后，门真的开了",
    letter: `${school.name}强基计划录取你进入${school.major}专业。`,
  };
}

function endingFor(
  state: PostCareerState,
  admission: AdmissionResult,
  input: PostCareerInput,
) {
  const total = state.gaokao?.total;
  const international = state.nationalSelection.internationalMedal;
  const title =
    international === "金牌"
      ? "世界尽头仍有一道实验题"
      : state.applicationRoute === "recommendation"
        ? "名单上最早确定的名字"
        : admission.routeLabel === "竞赛破格强基"
          ? state.medalTier === "true-silver"
            ? "银牌的另一种含义"
            : "奖牌留在抽屉里"
          : admission.routeLabel === "普通强基计划"
            ? "笔试之后，门真的开了"
            : total && total >= 625
              ? "回到教室之后"
              : "两条路都走过";
  const future = buildFutureEpilogue({
    ...input,
    school: admission.school,
    major: admission.major,
    routeLabel: admission.routeLabel,
    medalTier: state.medalTier,
    nationalRank: state.nationalRank,
    internationalMedal: international,
  });
  return {
    title,
    subtitle: `${admission.school} · ${admission.major}`,
    body: `${admission.letter}${
      total ? ` 高考成绩最终停在${total.toFixed(1)}分。` : ""
    }`,
    epilogue: future.paragraphs[0],
    futureRouteId: future.routeId,
    futureTitle: `${future.title} · ${future.subtitle}`,
    epilogueParagraphs: future.paragraphs,
  };
}

function abnormalEnding(
  input: PostCareerInput,
  state: PostCareerState,
  kind: "pause" | "withdrawal",
  base: { title: string; subtitle: string; body: string },
) {
  const future = buildFutureEpilogue({
    ...input,
    school: kind === "pause" ? "复学后的新起点" : "非传统教育路径",
    major: "仍在形成的人生方向",
    routeLabel: base.subtitle,
    medalTier: state.medalTier,
    nationalRank: state.nationalRank,
    abnormal: kind,
  });
  return {
    ...base,
    epilogue: future.paragraphs[0],
    futureRouteId: future.routeId,
    futureTitle: `${future.title} · ${future.subtitle}`,
    epilogueParagraphs: future.paragraphs,
    abnormal: true,
  };
}

function internationalResult(state: PostCareerState, seed: string) {
  const player =
    state.reasoning * 0.3 +
    state.biologyMastery * 0.26 +
    state.experiment * 0.34 +
    state.mindset * 0.06 +
    (seededUnit(`${seed}-international-player`) - 0.5) * 16;
  const participants = 78;
  const rivals = Array.from(
    { length: participants - 1 },
    (_, index) =>
      61 +
      seededUnit(`${seed}-international-${index}`) * 32 +
      (seededUnit(`${seed}-international-form-${index}`) - 0.5) * 13,
  );
  const rank = 1 + rivals.filter((score) => score > player).length;
  const medal =
    rank <= 8 ? "金牌" : rank <= 24 ? "银牌" : rank <= 48 ? "铜牌" : "优胜奖";
  return { rank, medal } as const;
}

function familyMidtermScene(input: PostCareerInput): PostScene {
  const profile = input.familyProfileKey ?? "results";
  const scenes: Record<NonNullable<PostCareerInput["familyProfileKey"]>, PostScene> = {
    anxious: {
      kicker: "SENIOR YEAR · FAMILY",
      title: "成绩单被拍进家族群以前，母亲先撤回了三次消息",
      lead: "父亲一边说这只是第一次回班考试，一边把你与年级前列的分差写在纸上。两个人都想让你别紧张，问出口的却全是最坏情况。",
      detail: "焦虑型家庭并非不愿支持，而是会把不确定自动翻译成危险。你可以给他们抓手，也可以拒绝替全家承担对未来的恐慌。",
      choices: [
        { id: "family-anxious-calendar", title: "把下一次模考前的计划贴在冰箱上", hint: "用可见进度换取暂时安定" },
        { id: "family-anxious-boundary", title: "要求他们一周只问一次成绩", hint: "建立边界，也允许家里暂时不适应" },
        { id: "family-anxious-confess", title: "承认自己也害怕追不回来", hint: "不再独自扮演最冷静的人" },
      ],
    },
    results: {
      kicker: "SENIOR YEAR · FAMILY",
      title: "父亲把这次排名与退赛前的投入放进同一张表",
      lead: "餐桌上没有人提高声音。家里只是逐项核算培训、停课、回班后的分数变化，仿佛只要算得足够清楚，就能判断过去两年究竟值不值得。",
      detail: "结果导向型家庭愿意继续提供资源，但每一次投入都期待可见回报。你可以接受这套交换，也可以把人生中无法结算的部分留在表格之外。",
      choices: [
        { id: "family-results-target", title: "和他们约定下一次只检查三个具体目标", hint: "继续用结果协商，但缩小考核范围" },
        { id: "family-results-cost", title: "把竞赛留下的能力和损失都写进去", hint: "拒绝只用一次排名清算过去" },
        { id: "family-results-own", title: "不再申请额外课程，自己承担这段追赶", hint: "换取自主，也失去部分资源" },
      ],
    },
    longterm: {
      kicker: "SENIOR YEAR · FAMILY",
      title: "母亲没有先看名次，而是问你最近能不能在十二点前睡着",
      lead: "父亲摊开三条路线：普通高考、强基和暂时降低目标。每条路线都写了停止条件，没有哪一条被冠上坚持到底才算成功。",
      detail: "长期规划型家庭更在意路线能否持续，却也可能把生活安排得过分完整。你需要决定是接受保护，还是为自己保留一部分不可预测。",
      choices: [
        { id: "family-longterm-review", title: "一起重写计划，把退出条件也保留下来", hint: "降低失控风险，不承诺唯一结局" },
        { id: "family-longterm-space", title: "保留两晚不被安排的空白时间", hint: "牺牲一点效率，换回个人生活" },
        { id: "family-longterm-ambition", title: "告诉他们你仍想冲一次更高的目标", hint: "主动选择风险，而非被计划保护" },
      ],
    },
    open: {
      kicker: "SENIOR YEAR · FAMILY",
      title: "晚饭吃到一半，父母才问你愿不愿意谈这次考试",
      lead: "他们没有准备结论，只说如果你今天不想谈，也可以等周末。那份宽松让人松一口气，也让所有决定重新落回你自己手里。",
      detail: "包容沟通型家庭不会替你规定路线，但自由并不等于没有代价。你仍要把需要的帮助、愿意承担的风险和无法保证的结果说清楚。",
      choices: [
        { id: "family-open-ask", title: "主动请他们陪你复盘最差的一科", hint: "把支持变成具体行动" },
        { id: "family-open-silence", title: "今晚不谈成绩，陪他们把饭吃完", hint: "保留喘息，问题留到周末" },
        { id: "family-open-decision", title: "直接说出接下来想走的路线", hint: "获得自主，也承担选择后果" },
      ],
    },
  };
  return scenes[profile];
}

function gaokaoEveScene(input: PostCareerInput): PostScene {
  const relation = [...(input.relationships ?? [])]
    .filter((item) => ["dating", "friend", "crush"].includes(item.route))
    .sort((a, b) =>
      (b.bond + b.trust + (b.security ?? 0) - (b.estrangement ?? 0)) -
      (a.bond + a.trust + (a.security ?? 0) - (a.estrangement ?? 0)),
    )[0];
  if (!relation) {
    return {
      kicker: "JUNE · THE NIGHT BEFORE",
      title: "宿舍熄灯以后，没有人再讨论押题",
      lead: "你把准考证放进透明袋，检查两遍路线，然后独自坐在窗边听完操场最后一声哨响。过去两年认识的人散在不同考场，有些已经很久没有联系。",
      detail: "今晚没有需要完成的关系任务。你可以复习、休息，也可以允许那些没有得到结论的经历暂时留在原处。",
      choices: [
        { id: "eve-alone-check", title: "再检查一次文具，然后按时关灯", hint: "稳定状态" },
        { id: "eve-alone-letter", title: "给高一时的自己写一封不寄出的信", hint: "整理经历，可能睡得更晚" },
      ],
    };
  }
  const name = relation.name;
  const scenes: Record<NonNullable<typeof relation.personalityKey>, PostScene> = {
    reserved: {
      kicker: "JUNE · THE NIGHT BEFORE",
      title: `${name}发来一张没有批注的考场路线图`,
      lead: "消息下面只有一句“确认过了”。你知道TA大概删掉了更多话；过去越重要的时刻，TA越习惯把关心压缩成不会给人添麻烦的格式。",
      detail: "你们之间的沉默曾经可靠，也曾经让误会存活太久。高考前夜，你可以接受这份克制，或者邀请TA多说一句。",
      choices: [
        { id: "eve-reserved-thanks", title: "回复收到，再把自己的路线也发过去", hint: "用同样克制的方式互相确认" },
        { id: "eve-reserved-call", title: "拨过去，问TA现在真正紧张什么", hint: "打破沉默，也可能触碰旧事" },
      ],
    },
    warm: {
      kicker: "JUNE · THE NIGHT BEFORE",
      title: `${name}把早餐、铅笔和雨伞逐项问了一遍`,
      lead: "TA记得你容易在紧张时忘记吃东西，也记得你讨厌别人把照顾说成命令。最后一条消息停在“还有什么需要我做”，没有替你决定答案。",
      detail: "被照顾可以让人安定，也可能再次唤起亏欠。你需要回应的不是一张物品清单，而是两个人是否仍允许彼此伸手。",
      choices: [
        { id: "eve-warm-receive", title: "说清自己需要什么，也问TA需要什么", hint: "让关心保持双向" },
        { id: "eve-warm-rest", title: "告诉TA都准备好了，催TA先去睡觉", hint: "温柔收住对话，不继续互相操心" },
      ],
    },
    competitive: {
      kicker: "JUNE · THE NIGHT BEFORE",
      title: `${name}发来一句：明天谁都别输给一道不会的题`,
      lead: "这不像祝福，更像你们熟悉的挑战。TA没有问你的目标分，也没有拿最后一次模考比较，只把真正的对手缩小成考场里那一刻的慌乱。",
      detail: "竞争曾让你们靠近，也曾把脆弱变成不能承认的败局。今晚可以继续用战书壮胆，也可以第一次把胜负放下。",
      choices: [
        { id: "eve-competitive-pact", title: "回一句：考完再来对答案", hint: "保留熟悉的火花" },
        { id: "eve-competitive-truth", title: "承认自己害怕发挥失常", hint: "放下逞强，关系可能更稳" },
      ],
    },
    playful: {
      kicker: "JUNE · THE NIGHT BEFORE",
      title: `${name}给准考证照片加了一个荒唐的“SSR”边框`,
      lead: "你笑出声以后，TA才补发一句很短的认真话：如果睡不着就回一个句号。那个玩笑没有否认紧张，只是替你们留了一扇不必解释太多的门。",
      detail: "幽默能让夜晚轻一点，却不能代替真正回应。你可以接住玩笑，也可以让句号后面出现一段不那么轻松的谈话。",
      choices: [
        { id: "eve-playful-meme", title: "回敬一张更离谱的表情包，然后关机", hint: "让轻松停在刚好的位置" },
        { id: "eve-playful-dot", title: "发出那个句号，承认自己还没睡", hint: "允许玩笑之后出现真话" },
      ],
    },
    curious: {
      kicker: "JUNE · THE NIGHT BEFORE",
      title: `${name}问：如果明天的分数不定义你，它还会改变什么？`,
      lead: "TA没有立即追问答案，只把问题留在聊天框里。你们过去常靠问题接近彼此，也曾因为一直分析而错过简单地陪伴。",
      detail: "高考当然会改变录取，却无法一次回答人生。你可以继续讨论，也可以告诉TA今晚不需要把一切想明白。",
      choices: [
        { id: "eve-curious-answer", title: "认真回答会改变的、不会改变的部分", hint: "整理边界，也消耗一点睡眠" },
        { id: "eve-curious-pause", title: "约定考完再谈，今晚只互道晚安", hint: "让问题暂时没有答案" },
      ],
    },
  };
  return scenes[relation.personalityKey ?? "reserved"];
}

function scoreReleaseScene(state: PostCareerState, input: PostCareerInput): PostScene {
  const total = state.gaokao?.total.toFixed(1) ?? "—";
  const rank = state.gaokao?.provinceRank ?? "—";
  const profile = input.familyProfileKey ?? "results";
  const scenes: Record<NonNullable<PostCareerInput["familyProfileKey"]>, PostScene> = {
    anxious: {
      kicker: "JUNE · SCORE RELEASE",
      title: "查询页面刚跳出来，家里三个人同时开始算另一种可能",
      lead: `总分 ${total}，全省约第 ${rank} 名。母亲先问有没有复核机会，父亲已经打开往年位次表；他们并非不接受结果，只是还没学会在不确定结束时停下来。`,
      detail: "你可以和他们一起核对，也可以先把电脑合上。",
      choices: [
        { id: "score-anxious-check", title: "陪他们核对完必要信息，再停止反复刷新", hint: "给焦虑一个边界" },
        { id: "score-anxious-walk", title: "先离开房间，到楼下走一圈", hint: "保护情绪，家里会暂时不安" },
      ],
    },
    results: {
      kicker: "JUNE · SCORE RELEASE",
      title: "父亲念出总分，随后问这个位次能兑现哪些选择",
      lead: `总分 ${total}，全省约第 ${rank} 名。过去的培训、退赛与追赶被暂时搁置，餐桌上只剩招生线、专业和录取概率。`,
      detail: "结果终于出现，却仍然可以被解释成收益、损失或一段已经完成的经历。",
      choices: [
        { id: "score-results-plan", title: "先按位次列学校，不评价过去值不值得", hint: "把结算推迟到情绪平稳以后" },
        { id: "score-results-refuse", title: "拒绝立刻复盘两年投入", hint: "守住感受，也会产生冲突" },
      ],
    },
    longterm: {
      kicker: "JUNE · SCORE RELEASE",
      title: "父母把提前准备的三份志愿方案依次拿了出来",
      lead: `总分 ${total}，全省约第 ${rank} 名。方案没有哪一份写着失败，只标了风险、城市、专业和以后改变方向的成本。`,
      detail: "规划让结果迅速获得位置，也可能让你还没来得及感受就进入下一项任务。",
      choices: [
        { id: "score-longterm-plan", title: "先确认方向，再约定明天继续讨论", hint: "利用准备，也保留今晚" },
        { id: "score-longterm-feel", title: "请他们暂时收起方案，听你说完这一刻", hint: "让情绪进入长期规划" },
      ],
    },
    open: {
      kicker: "JUNE · SCORE RELEASE",
      title: "父母看完分数，没有替你决定该笑还是该难过",
      lead: `总分 ${total}，全省约第 ${rank} 名。母亲只问你想先吃饭、先看位次，还是先一个人待会儿；选择下一步的权利依旧在你手里。`,
      detail: "宽松没有消除现实门槛，却允许你用自己的顺序接受结果。",
      choices: [
        { id: "score-open-together", title: "请他们一起打开位次表", hint: "共同面对现实信息" },
        { id: "score-open-alone", title: "先独自消化，再回来谈志愿", hint: "保留私人空间" },
      ],
    },
  };
  return scenes[profile];
}

export function getPostScene(
  state: PostCareerState,
  input: PostCareerInput,
): PostScene {
  const scenes: Record<string, PostScene> = {
    bridge: {
      kicker: `RETURN TO CLASS · 第${state.semesterIndex}阶段`,
      title: state.bridgeRemaining >= 4 ? "竞赛教室只待了一个夏天" : "课本翻回常规章节",
      lead:
        "退赛没有让时间快进。你仍要在原来的班级里完成剩下的学期，也会不断遇见还留在竞赛队的人。",
      detail:
        "这一阶段会压缩为一次关键选择。竞赛知识不会清零，但常规课程、同学关系和对退赛的感受会继续变化。",
      choices: [
        {
          id: "bridge-steady",
          title: "按部就班补齐课堂与作业",
          hint: "最稳妥地修复常规基础，也保留一点生活空间",
        },
        {
          id: "bridge-catchup",
          title: "用一个学期追赶落下的进度",
          hint: "提升更快，但精神负担明显增加",
        },
        {
          id: "bridge-life",
          title: "先重新适应班级和校园生活",
          hint: "恢复状态与关系，成绩提升较慢",
        },
      ],
    },
    return: {
      kicker: "SENIOR YEAR · RETURN",
      title: input.retired ? "回到教室之后" : "奖牌不会替你写完高三",
      lead: input.retired
        ? "竞赛队的座位已经换了人。班主任给你搬来一摞卷子，没有追问你是否后悔。"
        : "国赛结束后的第一节课，黑板上已经写到你从未学过的章节。有人向你借奖牌看，也有人只问你这次月考参不参加。",
      detail:
        "从现在开始，常规六科重新成为主线。生物竞赛会带来迁移，也会留下知识断层和疲劳。",
      choices: [
        {
          id: "return-plan",
          title: "和班主任制定一份可执行的回班计划",
          hint: "稳定、均衡地开始修补断层",
        },
        {
          id: "return-sprint",
          title: "不解释，先把缺的卷子全部补完",
          hint: "短期追分更快，但容易透支",
        },
        {
          id: "return-rest",
          title: "先用两周恢复作息，再开始追赶",
          hint: "恢复状态，但会继续落后一小段进度",
        },
      ],
    },
    "first-review": {
      kicker: "SENIOR YEAR · FIRST ROUND",
      title: "一轮复习开始覆盖整本高中教材",
      lead:
        "老师讲得很快，因为多数同学只是复习。对你而言，有些章节却近似第一次听见。",
      detail:
        "一轮复习决定六科知识面的完整程度。只押优势科目会让总分出现明显短板。",
      choices: [
        {
          id: "review-balanced",
          title: "六科跟紧课堂，建立错题索引",
          hint: "均衡推进，适合大多数路线",
        },
        {
          id: "review-science",
          title: "优先追数学、物理和化学",
          hint: "理科提升更快，也为强基笔试打底",
        },
        {
          id: "review-language",
          title: "先补语文和英语的长期欠账",
          hint: "补齐竞赛生常见短板",
        },
      ],
    },
    "selection-theory": {
      kicker: "NATIONAL TEAM · THEORY",
      title: "国家集训队第一次选拔",
      lead:
        "五十个人再次坐进考场。这次没有奖牌线，名单最末端只留下五个位置。",
      detail:
        "理论选拔重视知识广度、文献分析和极端题目下的稳定性。成绩将与后续实验选拔合并排名。",
      choices: [
        {
          id: "selection-theory-focus",
          title: "集中准备理论选拔",
          hint: "提高选拔表现，但挤占常规复习",
        },
        {
          id: "selection-theory-balance",
          title: "集训与高三复习各留一半时间",
          hint: "两边都不放弃，选拔优势会变小",
        },
      ],
    },
    midterm: {
      kicker: "SENIOR YEAR · MIDTERM",
      title: "第一次真正看见自己回班后的排名",
      lead:
        "成绩单不关心你为何缺了那么多课。每一科的空白都被换算成一个具体分数。",
      detail: `目前六科知识基准约为 ${totalKnowledge(state).toFixed(1)} / 750。`,
      choices: [
        {
          id: "midterm-review",
          title: "逐科复盘失分，不回避最差的一门",
          hint: "稳定提高六科下限",
        },
        {
          id: "midterm-pressure",
          title: "把排名贴在桌前，强迫自己加速",
          hint: "推进较快，心态风险更高",
        },
        {
          id: "midterm-talk",
          title: "找同学交换笔记，请老师重新讲难点",
          hint: "依靠关系修补知识断层",
        },
      ],
    },
    "family-midterm": familyMidtermScene(input),
    "selection-experiment": {
      kicker: "NATIONAL TEAM · EXPERIMENT",
      title: "第二次选拔只看手上功夫",
      lead:
        "移液器、解剖镜、未知样品和严格计时重新占满一天。理论名次领先的人也可能在这里被反超。",
      detail: `理论选拔暂列第 ${state.nationalSelection.theoryRank ?? "—"} / 50；最终只留下5人。`,
      choices: [
        {
          id: "selection-exp-focus",
          title: "接受封闭实验强化",
          hint: "尽可能冲击国家队，常规学习暂停一段时间",
        },
        {
          id: "selection-exp-balance",
          title: "维持实验手感，同时保住高三复习",
          hint: "降低透支，国家队竞争力略降",
        },
      ],
    },
    mock1: {
      kicker: "SENIOR YEAR · FIRST MOCK",
      title: "一模把所有科目放进同一张成绩单",
      lead:
        "生物接近满分并不能遮住语文作文和数学压轴题留下的缺口。总分第一次有了高考的形状。",
      detail:
        "接下来必须决定：继续只修补高考，还是为强基笔试额外腾出时间。",
      choices: [
        {
          id: "mock1-steady",
          title: "按照一模暴露的问题均衡调整",
          hint: "高考总分最稳定",
        },
        {
          id: "mock1-strong",
          title: "提前加入数学、化学强基题",
          hint: "兼顾强基准备，但消耗更多精力",
        },
        {
          id: "mock1-recover",
          title: "减少套卷，先修复睡眠和心态",
          hint: "分数推进较慢，临场状态更稳",
        },
      ],
    },
    application: {
      kicker: "APRIL · APPLICATION",
      title: "强基计划只能选择一所高校",
      lead:
        "教练、班主任和家长给出了不同意见。风险不会写在简章上，但一旦确认报名，就不能再同时选择另一所强基高校。",
      detail:
        state.medalTier === "training-team"
          ? "你拥有保送资格，也可以放弃保送继续冲击其他选择。"
          : state.medalTier === "gold" || state.medalTier === "true-silver"
            ? "你的国赛奖牌可以申请破格审核；清北层级的实际筛选明显更严格。"
            : state.medalTier === "silver" || state.medalTier === "bronze"
              ? "普通银牌与铜牌在破格审核中的认可度较低；你也可以改走普通强基，先凭笔试争取面试资格。"
              : "你可以走普通强基：先参加笔试，只有过线才能进入面试。",
      choices: [],
    },
    "second-review": {
      kicker: "SENIOR YEAR · SECOND ROUND",
      title: "二轮复习只剩下取舍",
      lead:
        "知识点已经来不及从头学起。专题、套卷、强基题和睡眠在同一张日程表上争夺时间。",
      detail:
        state.applicationRoute === "ordinary-strong"
          ? `你已选择普通强基，目前专项准备 ${state.strongPrep.toFixed(1)}。`
          : state.applicationRoute === "exceptional"
            ? state.applicationTarget === "qingbei"
              ? "你已提交清北层级竞赛破格申请，仍需准备具有筛选作用的笔试与面试。"
              : "你已提交非清北竞赛破格申请，金牌或真银牌通过审核后免笔试，接下来主要准备面试。"
            : "你把主要希望放在高考与普通志愿上。",
      choices: [
        {
          id: "second-gaokao",
          title: "全部回到高考六科",
          hint: "最大化高考稳定性",
        },
        {
          id: "second-strong",
          title:
            state.applicationRoute === "exceptional" && state.applicationTarget !== "qingbei"
              ? "高考之外准备强基面试"
              : "高考之外继续准备强基笔试",
          hint:
            state.applicationRoute === "exceptional" && state.applicationTarget !== "qingbei"
              ? "免笔试路线；提高表达与材料熟悉度，但仍会占用复习时间"
              : "校测更有竞争力，但会牺牲部分总分",
        },
        {
          id: "second-health",
          title: "守住作息，只做真正不会的题",
          hint: "提升较慢，但降低崩盘概率",
        },
      ],
    },
    "recommendation-choice": {
      kicker: "RECOMMENDATION · CONFIRMED",
      title: "保送解决了录取，却没有替你安排剩下的高三",
      lead:
        "高校已经确认接收。班主任说你可以把精力放在国家队训练，也可以继续坐在教室里参加高考，看看这一年究竟能走到哪里。",
      detail:
        "参加高考只生成成绩和经历，不会改变已经确认的保送录取；不参加则直接进入录取通知书与后续赛事。",
      choices: [
        {
          id: "recommendation-focus-team",
          title: "不再准备高考，专注国家队与自己的生活",
          hint: "直接进入保送录取确认",
        },
        {
          id: "recommendation-experience-gaokao",
          title: "回到高三，参加高考体验生活",
          hint: "完整经历二轮复习和高考，但分数不影响保送",
        },
      ],
    },
    mock2: {
      kicker: "SENIOR YEAR · FINAL MOCK",
      title: "最后一次大型模拟考试",
      lead:
        "最后的校内排名不会写进档案，却会决定考前那几周你怎样看待自己。",
      detail: `当前知识基准 ${totalKnowledge(state).toFixed(1)} / 750，SAN ${state.san.toFixed(1)}，心态 ${state.mindset.toFixed(1)}。`,
      choices: [
        {
          id: "mock2-calm",
          title: "按正式高考作息完成并认真复盘",
          hint: "稳定临场表现",
        },
        {
          id: "mock2-last-sprint",
          title: "把最后一个月压到极限",
          hint: "可能再涨一截，也可能透支",
        },
        {
          id: "mock2-accept",
          title: "接受当前水平，不再追逐每一道怪题",
          hint: "恢复心态，减少连锁失误",
        },
      ],
    },
    "gaokao-eve": gaokaoEveScene(input),
    gaokao: {
      kicker: "JUNE · GAOKAO",
      title: "六张试卷，七百五十分",
      lead:
        "竞赛、退赛、回班、错题和模考都被压缩进这几天。没有一张卷子会单独询问你的经历。",
      detail:
        "每科都会受到知识基础、SAN、心态和独立临场波动影响。低心态可能让一道难题演变为后续连锁失误。",
      choices: [
        {
          id: "gaokao-enter",
          title: "进入考场",
          hint: "正式生成六科成绩与全省位次",
        },
      ],
    },
    "score-release": scoreReleaseScene(state, input),
    "strong-written": {
      kicker: "STRONG FOUNDATION · WRITTEN",
      title:
        state.applicationRoute === "exceptional"
          ? "清北层级破格校测：笔试仍会真正筛人"
          : "强基初试：笔试先决定谁有资格面试",
      lead:
        "数学和化学的题目比高考更陌生。报名人数很多，面试名单只按笔试排名截取。",
      detail:
        state.applicationRoute === "exceptional"
          ? "金牌带来破格报名资格，但清北层级仍保留实质性笔试；未过线会回到普通志愿。"
          : "普通强基考生若未通过笔试，将直接退出强基流程，但仍可参加后续普通志愿录取。",
      choices: [
        {
          id: "written-normal",
          title: "按照准备好的节奏完成笔试",
          hint: "让专项准备与临场状态共同决定结果",
        },
        {
          id: "written-risk",
          title: "优先攻克高区分度题目",
          hint: "波动更大，适合专项准备充分的玩家",
        },
      ],
    },
    "strong-setback": {
      kicker: "STRONG FOUNDATION · AFTERMATH",
      title: "面试楼仍然开放，但你的准考证不能再进入下一道门",
      lead: `笔试排名第 ${state.strongResult?.writtenRank ?? "—"} / ${state.strongResult?.writtenParticipants ?? "—"}。复试线落在你前面，普通志愿仍会继续，今天却确实有一条路在这里结束。`,
      detail: "落选不会自动转化成成长，也不必被解释成整个高中的失败。你只需要决定怎样离开这栋楼。",
      choices: [
        { id: "strong-setback-review", title: "去公告栏抄下分段与复试线", hint: "保留事实，暂时不评价自己" },
        { id: "strong-setback-peer", title: "和同样落选的考生一起去车站", hint: "交换经历，不独自消化" },
        { id: "strong-setback-leave", title: "把准考证收进包里，直接回家", hint: "停止追问，把精力留给普通志愿" },
      ],
    },
    "strong-interview": {
      kicker: "STRONG FOUNDATION · INTERVIEW",
      title: "面试室里的问题没有标准答案",
      lead:
        state.applicationRoute === "exceptional"
          ? "奖牌让你绕过笔试，却没有替你回答为什么还想继续学生命科学。"
          : "通过笔试后，你终于得到向教授解释自己的机会。",
      detail:
        "专业兴趣、思辨、表达、心态与竞赛经历都会影响结果；体测主要作为流程和同分参考。",
      choices: [
        {
          id: "interview-honest",
          title: "诚实谈竞赛的收获、疲惫与仍未解决的问题",
          hint: "依赖思辨和真实的专业兴趣",
        },
        {
          id: "interview-polished",
          title: "按照准备好的结构完整作答",
          hint: "依赖面试准备，发挥更稳定",
        },
      ],
    },
    admission: {
      kicker: "JULY · ADMISSION",
      title: "查询页面刷新之前",
      lead:
        "强基综合成绩、普通志愿和当年招生行情已经在后台完成排序。老师不再给出建议，所有人只能等待。",
      detail:
        "正式流程会在录取通知书到手时结束；随后生成与你的竞赛、关系、身心状态相对应的后日谈。",
      choices: [
        {
          id: "admission-open",
          title: "打开录取结果",
          hint: "查看最终学校、专业与录取路径",
        },
      ],
    },
    international: {
      kicker: "INTERNATIONAL OLYMPIAD",
      title: "国际生物学竞赛：国家队的最后一场考试",
      lead:
        "五名队员面对来自不同国家和地区的选手。理论与实验各自计分，过去一年的训练终于没有下一轮选拔可以推迟。",
      detail:
        "国际赛成绩不会改变已经取得的大学录取，但会改写最终后日谈。",
      choices: [
        {
          id: "international-compete",
          title: "参加理论与实验考试",
          hint: "生成国际排名与奖牌",
        },
      ],
    },
    crisis: {
      kicker: "SPECIAL ENDING · INTERVENTION",
      title: "这一次，身体先替你按下了暂停",
      lead:
        "连续失眠、无法进食和上课时的失神终于被老师发现。校医、家长和班主任都不再把它称作“再坚持一下”。",
      detail:
        "休学不会清空人生，但这一届高考需要放下。继续硬撑可能进入更严重的退学风险。",
      choices: [
        {
          id: "crisis-leave",
          title: "接受休学与治疗安排",
          hint: "触发休学结局，保留未来复学可能",
        },
        {
          id: "crisis-continue",
          title: "拒绝暂停，要求继续完成这一届",
          hint: "回到原流程，但再次崩溃将触发更严重后果",
        },
      ],
    },
    withdrawal: {
      kicker: "SPECIAL ENDING · WITHDRAWAL",
      title: "学校已经无法继续假装一切正常",
      lead:
        "第二次严重失能后，学籍、治疗和家庭冲突被放到同一张桌上。继续原有轨道已经不再是可用选项。",
      detail:
        "你仍可以保留学籍休学，也可以主动离开这所学校，之后通过其他教育路径重新开始。",
      choices: [
        {
          id: "withdrawal-leave",
          title: "保留学籍，正式办理休学",
          hint: "触发休学结局",
        },
        {
          id: "withdrawal-dropout",
          title: "办理退学，离开原来的评价体系",
          hint: "触发极少见的退学结局",
        },
      ],
    },
    ending: {
      kicker: "THE END",
      title: state.ending?.title ?? "录取通知书",
      lead: state.ending?.body ?? "",
      detail: state.ending?.epilogue ?? "",
      choices: [],
    },
  };
  const scene = scenes[state.stage] ?? scenes.return;
  if (state.stage !== "application") return scene;

  const choices: PostChoice[] = [];
  if (state.medalTier === "training-team") {
    choices.push({
      id: "apply-recommend-east",
      title: "接受华东C9层级高校的保送考核",
      hint: "录取最稳，专业方向受基础学科培养限制",
    });
    choices.push({
      id: "apply-recommend-qingbei",
      title: "申请清北层级高校保送考核",
      hint: "学校层级更高，审核与考核仍有风险",
    });
  }
  if (["training-team", "gold"].includes(state.medalTier)) {
    choices.push({
      id: "apply-exception-qingbei",
      title: "用国奖破格申请清北层级强基",
      hint: "高风险路线，笔试与面试会真正筛人",
    });
  }
  if (["training-team", "gold", "true-silver"].includes(state.medalTier)) {
    choices.push({
      id: "apply-exception-east",
      title: "用国奖破格申请华东C9层级强基",
      hint: "金牌或真银牌通过破格审核后免笔试，直接进入面试与体测流程",
    });
    choices.push({
      id: "apply-exception-985",
      title: "用国奖申请一所中上游985",
      hint: "更稳妥，也会放弃冲击顶尖高校的机会",
    });
  }
  if (!["training-team", "gold", "true-silver"].includes(state.medalTier)) {
    choices.push({
      id: "apply-ordinary-east",
      title: "报名华东C9层级普通强基",
      hint: "先考数学、化学笔试，过线后才有面试资格",
    });
    choices.push({
      id: "apply-ordinary-other",
      title: "报名其他C9普通强基",
      hint: "笔试仍有淘汰，竞争强度稍低",
    });
    choices.push({
      id: "apply-ordinary-985",
      title: "报名中上游985普通强基",
      hint: "录取门槛较低，但仍需要校测发挥",
    });
  }
  choices.push({
    id: "apply-regular",
    title: "不报强基，只走普通高考志愿",
    hint: "把所有时间留给高考，不承担校测风险",
  });
  return { ...scene, choices };
}

export function advancePostCareer(
  state: PostCareerState,
  choiceId: string,
  input: PostCareerInput,
): PostCareerState {
  const seed = input.seed;
  if (state.stage === "bridge") {
    const nextBridge = Math.max(0, state.bridgeRemaining - 1);
    const nextStage = nextBridge === 0 ? "return" : "bridge";
    const base = {
      ...state,
      bridgeRemaining: nextBridge,
      semesterIndex: state.semesterIndex + 1,
    };
    if (choiceId === "bridge-catchup")
      return update(base, {
        stage: nextStage,
        gains: allGain(3.3),
        san: -7,
        mindset: -1,
        result:
          "你把缺失章节按课堂顺序重新拆开，每天补一小段，再用周测确认哪些内容真正接上。成绩从最初的大片空白慢慢恢复，但最忙的几周里，你只记得起床、上课、写卷子和关灯，甚至说不清自己是否仍在理解。追赶确实缩短了差距，也让这个学期几乎没有留下成绩以外的记忆。",
      });
    if (choiceId === "bridge-life")
      return update(base, {
        stage: nextStage,
        gains: allGain(1.6),
        san: 7,
        mindset: 4,
        social: 4,
        result:
          "你重新参加班会、值日和那场并不重要的班级球赛，也允许晚饭后与同学多走一圈。常规成绩恢复得比冲刺路线慢，老师几次提醒你不要把回班适应当作无限期缓冲；但当同学不再先问竞赛结果、而是自然给你留座时，你第一次重新拥有一种不需要奖牌或退赛理由才能进入的普通高中生活。",
      });
    return update(base, {
      stage: nextStage,
      gains: allGain(2.5),
      san: -2,
      mindset: 2,
      result:
        "你按照课堂进度补最必要的章节，遇到无法一次填平的断层便记进下周，而不是熬夜把计划伪装成已经完成。提升没有戏剧性，月考排名甚至反复过几次；可到期末，老师点名时不再附带‘刚退赛’的解释，同学借笔记也不再刻意照顾你的缺课经历。你仍然落后，只是不再被过去的路线单独命名。",
    });
  }
  if (state.stage === "return") {
    if (choiceId === "return-sprint")
      return update(state, {
        stage: "first-review",
        gains: allGain(3.8),
        san: -10,
        mindset: -2,
        result:
          "你按年份把积压卷子排成几摞，连续两周只在吃饭和洗漱时离开书桌。空白页迅速减少，陌生章节也获得了最初轮廓；第三个清晨醒来时，你却盯着闹钟很久才想起今天有没有早读。短期追赶证明你仍能承受高强度，也暴露这套方法无法长期复制：卷子补完以后，身体已经开始替计划收取欠款。",
      });
    if (choiceId === "return-rest")
      return update(state, {
        stage: "first-review",
        gains: allGain(1.4),
        san: 11,
        mindset: 5,
        result:
          "你没有立刻追那摞卷子，而是先把入睡时间从凌晨一点点拉回午夜，恢复早餐和固定起床。两周后，进度与同学相比仍然难看，家里也几次怀疑你是否太松；但重新坐进教室时，你终于能连续听完一节课，不再靠意志维持睁眼。恢复没有替你补知识，却让之后每一小时学习重新具备被真正吸收的可能。",
      });
    return update(state, {
      stage: "first-review",
      gains: allGain(2.8),
      san: -3,
      mindset: 3,
      social: 2,
      result:
        "班主任把你原先写满整页的计划删去大半，只保留当天课堂、最薄弱章节和一项可以检查的订正。你起初觉得这份安排过于保守，几周后却第一次没有靠周末通宵偿还欠账。计划既没有制造迅速逆袭，也没有把任何科目彻底放弃；它的价值只是每天都能被完成，并在做不到时允许你准确指出问题出在哪里。",
    });
  }
  if (state.stage === "first-review") {
    const nextStage = state.nationalSelection.eligible
      ? "selection-theory"
      : "midterm";
    if (choiceId === "review-science")
      return update(state, {
        stage: nextStage,
        gains: { 数学: 8, 物理: 6, 化学: 6, 生物: 3, 语文: 1, 英语: 1 },
        san: -7,
        strongPrep: 4,
        result:
          "你把大部分额外时间投向数学、物理和化学，熟悉的推理节奏很快重新出现，理综排名也比其他科目先回升。与此同时，语文作文仍在相同区间徘徊，英语阅读速度甚至因长期搁置继续下降。语文老师在作文本末尾写下‘别把所有希望都压在理科’，那句话没有否定你的优势，只提醒总分会替每一门被忽略的课留下位置。",
      });
    if (choiceId === "review-language")
      return update(state, {
        stage: nextStage,
        gains: { 语文: 7, 英语: 7, 数学: 3, 物理: 2, 化学: 2, 生物: 2 },
        san: -4,
        mindset: 2,
        result:
          "你开始每天固定背单词、整理作文素材，并把过去总想跳过的长阅读完整计时。它们没有竞赛题那种突然看懂结构的兴奋，进步也常常只能在几次考试后的均分里确认；可那些长期沉默的失分终于不再被一句‘文科靠积累’带过。理科推进稍慢了一些，换来的是总分不再完全依赖某一张卷子的发挥。",
      });
    return update(state, {
      stage: nextStage,
      gains: allGain(4.1),
      san: -5,
      mindset: 1,
      result:
        "你按六科分别建立错题索引，不要求每门都成为优势，只把重复失分的问题标成必须解决。错题本很快变厚，进度看上去远不如专攻一科漂亮；但每一页都有来源、原因和再次检查的日期，不再只是抄写正确答案。均衡路线没有给你突出的单科排名，却逐渐抬高了任何一张试卷都不至于崩塌的下限。",
    });
  }
  if (state.stage === "selection-theory") {
    const focused = choiceId === "selection-theory-focus";
    const prepared = focused
      ? {
          ...state,
          reasoning: round1(clamp(state.reasoning + 3)),
          biologyMastery: round1(clamp(state.biologyMastery + 2)),
          san: round1(clamp(state.san - 10)),
          subjects: applySubjectGains(state.subjects, { 生物: 2, 化学: 1 }),
        }
      : {
          ...state,
          san: round1(clamp(state.san - 5)),
          subjects: applySubjectGains(state.subjects, allGain(1.6)),
        };
    const selection = simulateSelectionTheory(prepared, seed);
    return healthIntervention(
      {
        ...prepared,
        nationalSelection: {
          ...prepared.nationalSelection,
          theoryScore: selection.score,
          theoryRank: selection.rank,
        },
        lastResult: `国家集训队理论选拔结束：${selection.score.toFixed(1)}分，暂列第${selection.rank}/50。实验选拔仍可能彻底改变名单。`,
        history: [
          ...prepared.history,
          `国家集训队理论选拔暂列第${selection.rank}/50。`,
        ],
      },
      "midterm",
    );
  }
  if (state.stage === "midterm") {
    const resumeStage = state.nationalSelection.eligible
      ? "selection-experiment"
      : "mock1";
    const withFamilyConversation = { ...state, resumeStage };
    if (choiceId === "midterm-pressure")
      return update(withFamilyConversation, {
        stage: "family-midterm",
        gains: allGain(4.8),
        san: -9,
        mindset: -4,
        result:
          "你把排名贴在桌前，每次想停下来时都先看一眼与前列的距离。额外套卷确实让名次上升，几个长期空白也被高强度重复强行填住；代价是一次计算错误都会被你解释成重新下滑，吃饭和睡眠也开始围绕下次考试让路。那张纸没有说话，却像持续亮着的屏幕，让任何一天都难以真正结束。",
      });
    if (choiceId === "midterm-talk")
      return update(withFamilyConversation, {
        stage: "family-midterm",
        gains: allGain(3.2),
        san: -2,
        mindset: 3,
        social: 5,
        result:
          "几名同学把笔记、课堂录音和老师补充的题单分给你，也坦白其中有些章节他们自己同样没弄懂。你们用午休交换讲解，省下了大量重新誊写的时间，却也需要迁就彼此节奏。回班不再是一场独自证明适应能力的考试；接受别人帮助会暴露缺口，也让关系从礼貌照顾变成真正共同完成任务。",
      });
    return update(withFamilyConversation, {
      stage: "family-midterm",
      gains: allGain(4),
      san: -4,
      mindset: 2,
      result:
        "你按失分原因逐科拆开成绩，先处理最差科目里反复出现的基础题，而没有被最高分那门带来的安全感转移注意。下一次小测仍然没有显著逆袭，却不再出现整章空白，总分波动也慢慢收窄。复盘没有改变过去缺课的事实，只让问题从‘来不及了’变成几项能够判断是否改善的具体任务。",
    });
  }
  if (state.stage === "family-midterm") {
    const nextStage = state.resumeStage ?? "mock1";
    const familyChoices: Record<string, Parameters<typeof update>[1]> = {
      "family-anxious-calendar": {
        stage: nextStage,
        gains: allGain(1.5), familySupport: 3, san: -2, mindset: 1,
        result: "你没有承诺下一次一定考到多少名，只把每天能完成的任务、允许休息的晚上和需要求助的节点写清。计划贴上冰箱后，父母仍会忍不住经过时多看一眼，却终于不再每顿饭都重新询问同一个最坏结果。那张纸也约束了你：如果连续两周无法执行，就必须承认原路线需要改变。",
      },
      "family-anxious-boundary": {
        stage: nextStage,
        familySupport: -1, san: 4, mindset: 2,
        result: "父亲起初认为一周一次太少，母亲则问突发情况算不算例外。你们在争执中把‘关心’拆成询问、提醒和替你作决定三件不同的事，最后约定周日晚饭后统一谈。前几天他们明显不习惯，你也几次想主动汇报来安抚气氛；但沉默没有酿成灾难，家里开始学习让焦虑停留在成年人自己手里。",
      },
      "family-anxious-confess": {
        stage: nextStage,
        familySupport: 4, san: 2, mindset: -1,
        result: "你承认自己并不像表现出来的那样笃定，也害怕最后既失去竞赛路线，又追不回常规成绩。父母安慰得并不熟练，母亲甚至立刻红了眼眶，谈话一度比原先更乱。可从这晚起，家里不再把你当作负责提供确定答案的人；三个人都害怕，却终于可以分别承担自己的那一份。",
      },
      "family-results-target": {
        stage: nextStage,
        gains: allGain(2.2), familySupport: 2, san: -3, mindset: 2,
        result: "你把下一阶段缩成三个目标：最弱科不再下滑、总分稳定完成两套卷、睡眠不连续三天低于六小时。父亲删掉了原表里那些无法控制的名次要求，保留月底复盘。交换仍然存在，只是从‘证明过去值得’变成‘验证当前方法是否有效’；你得到继续投入的资源，也接受届时必须面对记录。",
      },
      "family-results-cost": {
        stage: nextStage,
        familySupport: 1, san: -1, mindset: 3,
        result: "你把竞赛带来的知识、推理能力、朋友和疲惫逐项写进同一张表，也把缺课、花费与错过的普通生活留下。表格因此失去了清晰的盈亏结论，父亲看了很久，最后承认有些东西只能描述，不能折算成一次考试的回报率。你们没有因此达成完全一致，却停止拿眼前排名替过去两年作唯一判决。",
      },
      "family-results-own": {
        stage: nextStage,
        gains: allGain(1.2), familySupport: -3, san: 2, mindset: 5,
        result: "你谢绝了家里准备购买的新课程，决定先用学校现有资料完成追赶。父母把这理解为你愿意为选择负责，也担心这是赌气。接下来的复习少了一条昂贵捷径，却多出一块不必每次用成绩续费的自主空间；如果效果不好，你不能再简单归因于资源不足。",
      },
      "family-longterm-review": {
        stage: nextStage,
        gains: allGain(1.8), familySupport: 3, san: 2, mindset: 3,
        result: "你们把计划重新分成继续条件、调整条件和停止条件。任何一次失利都不会自动结束路线，连续失眠、长期无法完成基础任务也不再被写成意志问题。那份文件没有削弱目标，反而使继续冲刺第一次不需要假装没有退路。父母答应执行同一套规则，你也失去了临时改变口径逃避复盘的余地。",
      },
      "family-longterm-space": {
        stage: nextStage,
        gains: allGain(0.8), familySupport: 1, san: 6, social: 2, mindset: 2,
        result: "你坚持在周计划里留下两晚空白，不补课、不做整套卷，也不需要把休息转化成某种成长任务。父亲担心它们最终被手机吞掉，母亲则提出只保留一晚，你没有继续让步。几周后成绩推进稍慢，但那两晚让你重新知道晚风、散步和与同学闲聊并非复习失败后的补偿。",
      },
      "family-longterm-ambition": {
        stage: nextStage,
        gains: allGain(2.7), familySupport: 1, san: -6, mindset: 4,
        result: "你告诉父母，自己明白更稳妥的路线在哪里，却仍想为更高目标承担一次可控风险。家里没有立刻赞同，而是要求你亲自写出代价和停止线。这个决定不再是被期待推着前进，也不是靠反抗证明独立；接下来每一次加码都属于你主动签下的责任。",
      },
      "family-open-ask": {
        stage: nextStage,
        gains: allGain(1.6), familySupport: 4, san: 1, mindset: 2,
        result: "你把最差一科的卷子摊开，请父母先听你解释哪里真的不会、哪里只是时间不够。他们帮不上具体题目，却替你联系老师、调整家务安排，也答应不把这次求助扩大成全面接管。支持终于从一句‘都听你的’变成几件可执行的小事，而你也必须在需要时明确开口。",
      },
      "family-open-silence": {
        stage: nextStage,
        familySupport: 1, san: 5, social: 1,
        result: "你说今晚不想再看成绩，父母便把手机收起来，继续谈菜市场、亲戚家的猫和周末要修的水龙头。问题没有被解决，却第一次没有霸占整顿晚饭。到了周末，你仍需要主动重启谈话；自由没有替你做决定，只为决定到来以前保留了一段完整的普通生活。",
      },
      "family-open-decision": {
        stage: nextStage,
        gains: allGain(2), familySupport: 2, san: -2, mindset: 5,
        result: "你直接说出接下来准备主攻的科目、愿意承担的排名波动，以及如果状态再次恶化会怎样调整。父母没有用赞同替你兜底，只确认需要提供哪些支持。被允许自己选择并不轻松，因为以后很难把代价归给谁的强迫；但这条路线第一次完整地使用了你的口吻。",
      },
    };
    return update({ ...state, resumeStage: undefined }, familyChoices[choiceId] ?? {
      stage: nextStage,
      result: "谈话没有得到统一结论，却把下一阶段的边界第一次说成了可以执行的约定。家里仍会担心，你也没有保证成绩必然回升；至少之后再出现分歧时，所有人需要指出究竟是哪项计划、哪条界限或哪次失约出了问题，而不能重新把过去两年的每个选择混在一起清算。",
    });
  }
  if (state.stage === "selection-experiment") {
    const focused = choiceId === "selection-exp-focus";
    const prepared = focused
      ? {
          ...state,
          experiment: round1(clamp(state.experiment + 5)),
          san: round1(clamp(state.san - 12)),
          subjects: applySubjectGains(state.subjects, { 生物: 2 }),
        }
      : {
          ...state,
          experiment: round1(clamp(state.experiment + 2)),
          san: round1(clamp(state.san - 6)),
          subjects: applySubjectGains(state.subjects, allGain(1.5)),
        };
    const result = simulateSelectionExperiment(prepared, seed);
    return healthIntervention(
      {
        ...prepared,
        nationalSelection: {
          ...prepared.nationalSelection,
          experimentScore: result.experimentScore,
          finalRank: result.finalRank,
          selected: result.selected,
        },
        lastResult: result.selected
          ? `理论与实验合并后，你排在第${result.finalRank}/50。最终名单只有5人，你进入了国家队。`
          : `最终选拔排名第${result.finalRank}/50。国家队名单在第5名处截断，你回到高三主线。`,
        history: [
          ...prepared.history,
          result.selected
            ? `国家队选拔第${result.finalRank}/50，入选最终5人。`
            : `国家队选拔第${result.finalRank}/50，未进入最终5人。`,
        ],
      },
      "mock1",
    );
  }
  if (state.stage === "mock1") {
    if (choiceId === "mock1-strong")
      return update(state, {
        stage: "application",
        gains: { 数学: 6, 化学: 5, 物理: 3, 生物: 2, 语文: 1, 英语: 1 },
        san: -8,
        strongPrep: 12,
        interviewPrep: 2,
        result:
          "你在高考套卷之外加入强基数学和化学题，最初几次几乎无法完整写出过程，只能把陌生方法逐项拆回基础。它们没有立刻提高一模总分，还占用了原本可以补语文和英语的时间；但校测终于从招生简章上的抽象门槛变成一种可以准备、也可能真实淘汰你的考试。你选择提前承担这部分风险。",
      });
    if (choiceId === "mock1-recover")
      return update(state, {
        stage: "application",
        gains: allGain(2.4),
        san: 9,
        mindset: 5,
        result:
          "你减少整套卷数量，先把睡眠拉回稳定区间，并练习在一道题卡住时主动跳过。排名因此没有继续快速上升，家里也担心你在最关键阶段放松；可下一次模拟里，你第一次没有让前半场的失误拖垮后面所有科目。恢复并未增加知识上限，却把原本容易连锁崩塌的发挥重新收回可控范围。",
      });
    return update(state, {
      stage: "application",
      gains: allGain(4.2),
      san: -5,
      mindset: 2,
      result:
        "你放弃继续抬高最有把握的单科，把时间移向那些每次都会稳定丢分的章节。成绩单因此没有出现特别醒目的高分，最差科目却逐渐从拖垮总分的位置退开。班主任第一次拿出往年位次表，说这个分数已经可以开始谈志愿；那不是胜利宣告，只意味着你的选择终于不再只剩下孤注一掷。",
    });
  }
  if (state.stage === "application") {
    let applicationRoute: ApplicationRoute = "regular";
    let applicationTarget: AdmissionTarget = "regular";
    if (choiceId.startsWith("apply-recommend")) {
      applicationRoute = "recommendation";
      applicationTarget = choiceId.endsWith("qingbei") ? "qingbei" : "east-c9";
    } else if (choiceId.startsWith("apply-exception")) {
      applicationRoute = "exceptional";
      applicationTarget = choiceId.endsWith("qingbei")
        ? "qingbei"
        : choiceId.endsWith("east")
          ? "east-c9"
          : "upper-985";
    } else if (choiceId.startsWith("apply-ordinary")) {
      applicationRoute = "ordinary-strong";
      applicationTarget = choiceId.endsWith("east")
        ? "east-c9"
        : choiceId.endsWith("other")
          ? "other-c9"
          : "upper-985";
    }
    const targetName: Record<AdmissionTarget, string> = {
      qingbei: "清北层级高校",
      "east-c9": "华东C9层级高校",
      "other-c9": "其他C9高校",
      "upper-985": "中上游985高校",
      regular: "普通高考志愿",
    };
    return {
      ...state,
      applicationRoute,
      applicationTarget,
      stage:
        applicationRoute === "recommendation"
          ? "recommendation-choice"
          : "second-review",
      lastResult: `报名确认：${targetName[applicationTarget]} · ${
        applicationRoute === "recommendation"
          ? "保送接收"
          : applicationRoute === "exceptional"
            ? "竞赛破格强基"
            : applicationRoute === "ordinary-strong"
              ? "普通强基"
              : "普通志愿"
      }。选择已经锁定。`,
      history: [
        ...state.history,
        applicationRoute === "recommendation"
          ? `凭国家集训队资格选择由${targetName[applicationTarget]}保送接收。`
          : `强基报名选择了${targetName[applicationTarget]}。`,
      ],
    };
  }
  if (state.stage === "recommendation-choice") {
    if (choiceId === "recommendation-experience-gaokao") {
      return {
        ...state,
        gaokaoForExperience: true,
        stage: "second-review",
        lastResult:
          "保送资格和高校接收都已确认。你选择回到高三参加高考，但成绩不会改变录取结果。",
        history: [...state.history, "保送后自愿回班参加高考体验。"],
      };
    }
    return {
      ...state,
      gaokaoForExperience: false,
      stage: "admission",
      lastResult:
        "你不再准备高考，把剩余时间留给国家队训练、恢复和真正想读的内容。",
      history: [...state.history, "保送后不再参加高考。"],
    };
  }
  if (state.stage === "second-review") {
    if (choiceId === "second-strong")
      return state.applicationRoute === "exceptional" && state.applicationTarget !== "qingbei"
        ? update(state, {
            stage: "mock2",
            gains: allGain(2.6),
            san: -6,
            interviewPrep: 14,
            result:
              "你确认这条破格路线通过审核后并不存在需要准备的笔试，于是没有为了安心去刷一套虚构考纲，而是核对证明材料、整理竞赛经历，并练习怎样说明兴趣而不把回答背成获奖陈述。高考六科推进因此稍慢，面试准备却第一次针对真实流程展开。少做题并非偷懒，而是拒绝把努力浪费在不存在的门槛上。",
          })
        : update(state, {
            stage: "mock2",
            gains: { 数学: 7, 化学: 6, 物理: 2, 生物: 2, 语文: 0.5, 英语: 0.5 },
            san: -9,
            strongPrep: 18,
            interviewPrep: 3,
            result:
              "你继续投入强基数学和化学，逐渐能识别高区分度题目的常见入口，模拟笔试也不再完全依靠临场猜测。代价同样清楚：语文积累和英语阅读几乎停在原处，高考总分的安全余量被进一步压缩。你没有把这称作兼顾，而是承认自己正在用一部分稳定性交换校测竞争力，并愿意承担落空时的后果。",
          });
    if (choiceId === "second-health")
      return update(state, {
        stage: "mock2",
        gains: allGain(2.8),
        san: 8,
        mindset: 6,
        result:
          "你删掉重复套卷和无法复盘的偏题，只保留真正不会的专题、正常作息和固定休息。短期进度明显慢下来，周围冲刺的节奏也偶尔让你怀疑是否过于保守；但你很久没有再在半夜因为一道题醒来，白天也能完整完成计划。守住健康没有保证更高分，只降低了最重要几天彻底失常的概率。",
      });
    return update(state, {
      stage: "mock2",
      gains: allGain(4.7),
      san: -6,
      mindset: 2,
      result:
        "你把二轮时间重新集中到高考六科，按专题解决仍会重复失分的问题，没有再额外追逐强基难题。总分继续缓慢上升，专项校测准备则停在原先水平；这并不是同时保住所有机会，而是明确把最可靠的录取底线放在前面。每一小时都被用在更可能兑现的地方，也接受如果校测失利便没有临时补救。",
    });
  }
  if (state.stage === "mock2") {
    if (choiceId === "mock2-last-sprint")
      return update(state, {
        stage: "gaokao-eve",
        gains: allGain(5.2),
        san: -13,
        mindset: -4,
        result:
          "你把最后一个月排到几乎没有空隙，错题、套卷和背诵按小时轮换，模拟总分也确实又涨了一截。与此同时，吃饭和睡觉开始依靠闹钟提醒，稍微停下来便会产生强烈的落后感。冲刺为你换来一部分仍可能增长的分数，也把临场状态压在更窄的边缘；现在谁也不能保证这笔交换会在正式考试中兑现。",
      });
    if (choiceId === "mock2-accept")
      return update(state, {
        stage: "gaokao-eve",
        gains: allGain(2.6),
        san: 7,
        mindset: 8,
        result:
          "你停止收集来源不明的怪题，只按正式考试难度维持手感，并接受某些高区分度题可能永远不会完整掌握。理论上可以争取的几分被主动放下，换来的是每张卷子都能按顺序完成、每晚也知道何时结束。接受当前水平不是宣称已经足够，而是不再让极小概率的收益占用全部注意力。",
      });
    return update(state, {
      stage: "gaokao-eve",
      gains: allGain(4.1),
      san: -4,
      mindset: 4,
      result:
        "你完全按照正式高考的起床、进场、午休和答题节奏完成最后一次模拟，遇到卡题便执行预先约定的跳题规则。成绩没有出现鼓舞人的奇迹，也没有因一次失误连续崩盘。复盘结束后你只改动少量细节，没有推翻整套计划；在考前充满传言和临时技巧的几周里，这种可重复的平静本身已经是一项真实能力。",
    });
  }
  if (state.stage === "gaokao-eve") {
    const effects: Record<string, { san: number; mindset: number; social?: number; result: string }> = {
      "eve-alone-check": { san: 4, mindset: 4, result: "你把准考证、身份证和文具按使用顺序放好，设完闹钟便关掉手机。黑暗里仍有很多念头经过，却没有一个被允许重新打开整套复习计划。你没有获得临考秘诀，只用一晚正常睡眠承认：明天能控制的事情已经不多，而休息本身也是最后一项准备。" },
      "eve-alone-letter": { san: 1, mindset: 6, result: "你从高一第一次走进竞赛教室写起，没有替过去的自己总结教训，也没有保证一切最终值得。信写到凌晨，里面同时留下兴奋、难堪、喜欢过的人和没能完成的计划。合上本子时你有些疲惫，却不再需要明天的分数替整段经历提供唯一解释。" },
      "eve-reserved-thanks": { san: 3, mindset: 4, social: 1, result: "你回复收到，又把自己的路线和集合时间发过去。两张地图并排躺在聊天记录里，没有人继续添加煽情的话。那份克制仍是你们最熟悉的语言：它不保证亲密永远存在，却在重要时刻给出可验证的在场。确认彼此都准备好后，你们几乎同时结束了对话。" },
      "eve-reserved-call": { san: 1, mindset: 5, social: 2, result: "电话接通后沉默了好几秒，TA才承认最害怕的不是难题，而是考完之后很多关系会失去自然见面的理由。你没有急着许诺永远联系，只和TA约定成绩出来前先吃一次饭。那些删掉的话终于拥有声音，也使离别从模糊预感变成可以共同面对的事实。" },
      "eve-warm-receive": { san: 4, mindset: 4, social: 2, result: "你说自己需要明早一句叫醒，也认真问TA有没有忘带东西。对话第一次没有停在单方面照料：TA承认也在紧张，请你进考场前回一个表情。你们各自收下对方能给的小帮助，没有谁因为需要别人而欠下一笔必须用成绩偿还的债。" },
      "eve-warm-rest": { san: 5, mindset: 3, result: "你逐项告诉TA都准备好了，然后反过来催TA别再检查第四遍。TA发来一个不太放心的晚安，终于没有继续追问。照顾在这里停住，不是因为在意变少，而是你们开始相信对方可以带着一点遗漏进入明天，不必由另一个人负责消除全部风险。" },
      "eve-competitive-pact": { san: 2, mindset: 6, result: "你回了一句考完再对答案，又约定谁先在群里估分谁请饮料。熟悉的挑战让心跳重新有了方向，却没有变成新的排名赌约。明天你们仍会在不同考场独自作答；今晚这句战书只是提醒彼此，难题出现时别把一次卡顿误认成整场失败。" },
      "eve-competitive-truth": { san: 1, mindset: 7, social: 1, result: "你承认自己害怕在最熟悉的科目上失常，也害怕看见TA发挥得比自己好。对面没有趁机说漂亮话，只回答TA也会嫉妒、也会慌。竞争没有因此消失，却第一次不再要求任何人假装刀枪不入；你们约好考后无论结果如何，先各自吃完一顿饭再谈分数。" },
      "eve-playful-meme": { san: 5, mindset: 4, result: "你给TA的准考证加上一圈更夸张的像素特效，又宣布聊天窗口将在十分钟后强制停服。最后一个表情包停在刚好还能让人笑的位置，没有滑向熬夜的长谈。手机关机后，紧张依然存在，却不再占满房间；有些陪伴的价值正是知道什么时候结束。" },
      "eve-playful-dot": { san: 2, mindset: 6, social: 2, result: "你发出句号，TA没有继续抛梗，只问你最担心哪一科。你们谈了十几分钟，也说到比赛结束后逐渐疏远的朋友。玩笑没有被否定，只是暂时让位给那些一直找不到合适气氛出现的真话。挂断前TA说，明晚可以再恢复胡说八道，今晚先允许彼此认真。" },
      "eve-curious-answer": { san: -1, mindset: 7, social: 2, result: "你说分数会改变城市、学校和一部分见面频率，却不会决定你是否真正喜欢生物，也不能替任何一段关系判定真假。TA补充了自己的答案，两个人不断修改边界，直到意识到已经很晚。问题仍不完整，但你不再要求明天的卷子承担它无力回答的部分。" },
      "eve-curious-pause": { san: 5, mindset: 5, result: "你告诉TA这个问题值得保留，却不值得用睡眠交换。TA没有失望，只把它记进考后清单，随后与你互道晚安。对话停在未完成的位置并不意味着逃避；有时信任恰恰是相信一个问题不用立刻回答，也不会因此永远失去机会。" },
    };
    const chosen = effects[choiceId] ?? effects["eve-alone-check"];
    return update(state, { stage: "gaokao", ...chosen });
  }
  if (state.stage === "gaokao") {
    const gaokao = simulateGaokao(state, seed);
    const nextStage =
      state.applicationRoute === "ordinary-strong"
        ? "strong-written"
        : state.applicationRoute === "exceptional"
          ? state.applicationTarget === "qingbei"
            ? "strong-written"
            : "strong-interview"
          : "admission";
    return {
      ...state,
      gaokao,
      stage: "score-release",
      resumeStage: nextStage,
      lastResult: `高考总分 ${gaokao.total.toFixed(1)} / 750，全省约第${gaokao.provinceRank}名。`,
      history: [
        ...state.history,
        `高考${gaokao.total.toFixed(1)}分，全省约第${gaokao.provinceRank}名。`,
      ],
    };
  }
  if (state.stage === "score-release") {
    const scoreEffects: Record<string, { san: number; mindset: number; familySupport: number; result: string }> = {
      "score-anxious-check": { san: -1, mindset: 2, familySupport: 3, result: "你们只核对姓名、科目、位次和复核规则，把可能学校留到第二天再查。母亲几次想重新计算假设分，最终按约定关掉页面。焦虑没有因为成绩落地自动消失，却第一次被限制在必要信息之内；今晚没有人继续用另一个版本的你反复覆盖已经发生的结果。" },
      "score-anxious-walk": { san: 5, mindset: 3, familySupport: -1, result: "你没有回应接连出现的问题，拿上钥匙下楼走了一圈。回来时父母已经把几张截图发进家庭群，气氛仍然紧绷。你承认离开让他们更不安，也说明自己需要先恢复呼吸再讨论未来。这个边界并不温柔，却阻止一场刚出分就开始的全面复盘吞掉整晚。" },
      "score-results-plan": { san: -2, mindset: 4, familySupport: 2, result: "你们按位次筛出几档学校，只记录城市、专业和风险，不讨论这两年是否划算。父亲几次把话题拉回投入产出，又自己停住。结果导向并没有消失，只是被推迟到你们都能承受的时候；眼下这张成绩单先是一份招生信息，而不是对过去全部选择的终审判决。" },
      "score-results-refuse": { san: 3, mindset: 5, familySupport: -2, result: "你明确拒绝在今天计算竞赛带来的净收益。父亲认为这是回避，母亲则试图缓和，两句话很快顶成争执。你没有得到一个平静的查分夜，却保住了不让单次结果定义全部经历的权利。讨论最终暂停，代价是这笔旧账以后仍会回来，而且不会因为你说过一次拒绝就自动消失。" },
      "score-longterm-plan": { san: 2, mindset: 4, familySupport: 3, result: "你从三套方案里圈出两条可以继续调查的方向，然后要求今晚到此为止。父母接受了，因为停止时间本来就在计划里。准备充分让你们避开慌乱，也让成绩迅速变成下一阶段任务；至少关灯以后，那些表格被留在客厅，没有跟进卧室继续排列未来。" },
      "score-longterm-feel": { san: 4, mindset: 5, familySupport: 2, result: "你请父母把文件夹合上，先听自己说查到分数时究竟是轻松、失落还是茫然。语言几次互相矛盾，他们也没有急着替你归纳。长期计划第一次容纳了一段无法立刻转成行动项的情绪；明天仍要谈志愿，但今晚不再只是通往下一张表格的过道。" },
      "score-open-together": { san: 1, mindset: 4, familySupport: 4, result: "你把电脑转向餐桌中央，三个人一起查位次、专业和招生变化。父母会提出意见，却每次都先问你怎么看。宽松因此不再只是退到一旁，而成为一种共同工作的方式：他们提供经验和时间，你保留最后决定，也必须认真回应现实门槛。" },
      "score-open-alone": { san: 5, mindset: 4, familySupport: 1, result: "你独自在房间坐了很久，没有立刻比较同学分数，也没有强迫自己产生某种合适情绪。走出房门时，父母仍在客厅等着，却没有追问刚才做了什么。你主动约定第二天下午一起谈志愿；私人空间不是无限延期，而是让你能用自己的状态重新回到共同决定。" },
    };
    const chosen = scoreEffects[choiceId] ?? scoreEffects["score-open-together"];
    return update({ ...state, resumeStage: undefined }, { stage: state.resumeStage ?? "admission", ...chosen });
  }
  if (state.stage === "strong-written") {
    let writtenState = state;
    if (choiceId === "written-risk") {
      writtenState = {
        ...state,
        strongPrep: round1(clamp(state.strongPrep + 3)),
        san: round1(clamp(state.san - 3)),
      };
    }
    const result = simulateStrongWritten(writtenState, `${seed}-${choiceId}`);
    return {
      ...writtenState,
      strongResult: result,
      stage: result.enteredInterview ? "strong-interview" : "strong-setback",
      resumeStage: result.enteredInterview ? undefined : "admission",
      lastResult: result.enteredInterview
        ? `强基笔试 ${result.written.toFixed(1)}分，排名第${result.writtenRank}/${result.writtenParticipants}，越过约${result.writtenCutoff.toFixed(1)}分的复试线。`
        : `强基笔试 ${result.written.toFixed(1)}分，排名第${result.writtenRank}/${result.writtenParticipants}，未达到约${result.writtenCutoff.toFixed(1)}分的复试线。你不能参加面试。`,
      history: [
        ...writtenState.history,
        result.enteredInterview
          ? state.applicationRoute === "exceptional"
            ? "清北层级破格笔试入围面试。"
            : "普通强基笔试入围复试。"
          : state.applicationRoute === "exceptional"
            ? "清北层级破格申请止步笔试。"
            : "普通强基止步笔试。",
      ],
    };
  }
  if (state.stage === "strong-setback") {
    const outcomes: Record<string, { san: number; mindset: number; social?: number; result: string }> = {
      "strong-setback-review": { san: -2, mindset: 4, result: "你没有在公告栏前估算‘如果那道题多拿几分’，只抄下自己的排名、复试线和今年人数。数字证明差距真实存在，也阻止传言把它夸成完全不可能或只差一点运气。纸折进文件袋后，这场考试终于从反复重演的假设变成一份已经结束的记录。" },
      "strong-setback-peer": { san: 3, mindset: 3, social: 4, result: "车站里几个人交换了各自不会的题，也谈到有人本来就准备走普通志愿，有人已经第二次在类似选拔落空。没有谁负责把气氛变得励志，失望只是被放进更宽的人群里。分别前你们互留联系方式，却没有承诺以后一定会成为朋友。" },
      "strong-setback-leave": { san: 5, mindset: 2, result: "你绕开公告栏和复盘人群，把准考证放进包最深处。回程中几次有人发来询问，你只回复结果，没有解释原因。直接离开让一些细节永远没有答案，却也保住了之后整理普通志愿所需的精力；不是每一次失败都必须当场榨出意义。" },
    };
    const chosen = outcomes[choiceId] ?? outcomes["strong-setback-leave"];
    return update({ ...state, resumeStage: undefined }, { stage: state.resumeStage ?? "admission", ...chosen });
  }
  if (state.stage === "strong-interview") {
    const prepared =
      choiceId === "interview-polished"
        ? { ...state, interviewPrep: round1(clamp(state.interviewPrep + 8)) }
        : {
            ...state,
            reasoning: round1(clamp(state.reasoning + 1)),
            mindset: round1(clamp(state.mindset + 2)),
          };
    const result = simulateStrongInterview(prepared, `${seed}-${choiceId}`);
    return {
      ...prepared,
      strongResult: { ...prepared.strongResult, ...result },
      stage: "admission",
      lastResult: `面试评分 ${result.interview.toFixed(1)}，校测与高考折算后的综合成绩为 ${result.composite.toFixed(1)}。`,
      history: [...prepared.history, `完成强基面试，评分${result.interview.toFixed(1)}。`],
    };
  }
  if (state.stage === "admission") {
    const admission = resolveAdmission(state, seed);
    const ending = endingFor(state, admission, input);
    if (state.nationalSelection.selected) {
      return {
        ...state,
        admission,
        stage: "international",
        lastResult: `${admission.letter}录取已经确定，而国家队还要去完成最后一场国际比赛。`,
        history: [...state.history, admission.letter],
      };
    }
    return { ...state, admission, ending, stage: "ending", lastResult: admission.letter };
  }
  if (state.stage === "international") {
    const result = internationalResult(state, seed);
    const nationalSelection = {
      ...state.nationalSelection,
      internationalRank: result.rank,
      internationalMedal: result.medal,
    };
    const admission = state.admission ?? regularAdmission(state, seed);
    const ending = endingFor({ ...state, nationalSelection }, admission, input);
    return {
      ...state,
      nationalSelection,
      ending,
      stage: "ending",
      lastResult: `国际赛最终排名第${result.rank}/${78}，获得${result.medal}。`,
      history: [...state.history, `国际赛第${result.rank}名，获得${result.medal}。`],
    };
  }
  if (state.stage === "crisis") {
    if (choiceId === "crisis-leave") {
      return {
        ...state,
        stage: "ending",
        ending: abnormalEnding(input, state, "pause", {
          title: "暂停键不是删除键",
          subtitle: "休学结局 · 保留学籍",
          body:
            "你没有参加这一届高考。医院的诊断、学校的休学手续和被清空的日程表一度让生活显得异常安静，原本每天催促你的倒计时突然失去作用。最初几周并没有轻松，睡眠、进食和简单出门都需要重新练习；同学继续向考场前进，你则第一次把恢复本身当作不需要用成绩证明的正式安排。",
        }),
        lastResult: "你接受了休学和治疗安排。这一届高考不再继续。",
      };
    }
    return {
      ...state,
      san: round1(clamp(state.san + 2)),
      mindset: round1(clamp(state.mindset - 4)),
      stage: state.resumeStage ?? "first-review",
      lastResult:
        "你拒绝了休学，坚持回到原来的日程。老师保留了干预记录，也明确告诉你：下一次不会再允许这样硬撑。",
      history: [...state.history, "第一次身心干预后选择继续。"],
    };
  }
  if (state.stage === "withdrawal") {
    const dropout = choiceId === "withdrawal-dropout";
    return {
      ...state,
      stage: "ending",
      ending: dropout
        ? abnormalEnding(input, state, "withdrawal", {
            title: "离开那张排名表",
            subtitle: "退学结局 · 非传统教育路径",
            body:
              "你办理了退学。没有高考倒计时，也没有录取通知书，只有一段突然空出来、必须重新安排的生活。离开学校并未自动消除疲惫或家庭冲突，反而让每一天都失去现成结构；你需要从治疗、基础课程和新的教育路径重新搭起时间。原来的评价体系不再拥有全部权力，新的自由也不会替你完成任何决定。",
          })
        : abnormalEnding(input, state, "pause", {
            title: "这一届先到这里",
            subtitle: "休学结局 · 等待复学",
          body:
            "学校保留了你的学籍，高考被推迟一年，竞赛和排名也第一次从每天的生活中退了出去。办理手续后，你并没有立刻知道复学时会回到哪间教室，也不知道旧关系还能保留多少；但治疗、作息和重新接触课程终于获得不必与这一届进度赛跑的空间。暂停改变了时间表，却没有把此前的人生从档案里删除。",
          }),
      lastResult: dropout ? "你办理了退学手续。" : "你正式办理休学，保留学籍。",
    };
  }
  return state;
}

export function postKnowledgeTotal(state: PostCareerState) {
  return totalKnowledge(state);
}

/**
 * 将高考后流程中存在人物差异的场景完整暴露给开发者文本编辑器。
 * 这里逐个生成家长与 NPC 性格版本，不使用运行时姓名作为归档标题，
 * 但正文仍保留动态姓名占位能力。
 */
export function postCareerDeveloperCatalog(): GameEvent[] {
  const baseInput: PostCareerInput = {
    seed: "developer-post-career",
    name: "{主角}",
    originId: "ordinary",
    originAcademic: 62,
    retiredWeek: 104,
    retired: false,
    academics: 72,
    reasoning: 70,
    biologyMastery: 76,
    experiment: 68,
    san: 58,
    mindset: 61,
    social: 55,
    familySupport: 60,
    coachFavor: 35,
    peerFavor: 45,
    nationalRank: 120,
    nationalMedal: "银牌",
    playerGender: "female",
    modules: [76, 72, 70, 68],
  };
  const events: GameEvent[] = [];
  const addScene = (
    stage: string,
    variantKey: string,
    variantLabel: string,
    group: string,
    order: number,
    input: PostCareerInput,
    statePatch: Partial<PostCareerState> = {},
  ) => {
    const state = { ...createPostCareer(input), ...statePatch, stage };
    const scene = getPostScene(state, input);
    const editorBody = stage === "score-release" && state.gaokao
      ? [scene.lead, scene.detail].map((text) => text
          .replaceAll(state.gaokao!.total.toFixed(1), "{高考总分}")
          .replaceAll(String(state.gaokao!.provinceRank), "{全省位次}"))
      : [scene.lead, scene.detail];
    events.push({
      id: `post-career-editor-${stage}-${variantKey}`,
      phase: "ending",
      label: scene.kicker,
      title: scene.title,
      body: editorBody,
      concealConsequences: true,
      trigger: { earliestWeek: 105, latestWeek: 160 },
      archive: {
        category: "高考与后续人生",
        group,
        clusterKey: `post-career-${stage}`,
        variantKey,
        variantLabel,
        timingNote: stage === "score-release"
          ? "竞赛主线结束后进入；{高考总分}与{全省位次}会在实际游玩时动态替换"
          : "竞赛主线结束后，按实际前置结果进入",
        order,
      },
      choices: scene.choices.map((choice) => ({
        id: `${stage}-${variantKey}-${choice.id}`,
        title: choice.title,
        preview: "",
        result: advancePostCareer(state, choice.id, input).lastResult ?? scene.detail,
        effects: {},
      })),
    });
  };

  const parentVariants: Array<[NonNullable<PostCareerInput["familyProfileKey"]>, string]> = [
    ["anxious", "焦虑保护型家长"],
    ["results", "结果导向型家长"],
    ["longterm", "长期规划型家长"],
    ["open", "开放支持型家长"],
  ];
  parentVariants.forEach(([familyProfileKey, label], index) => {
    const input = { ...baseInput, familyProfileKey };
    addScene("family-midterm", familyProfileKey, label, "高三期中后的家庭谈话", 10 + index, input, { resumeStage: "mock1" });
    addScene(
      "score-release",
      familyProfileKey,
      label,
      "高考查分后的家庭反应",
      40 + index,
      input,
      {
        resumeStage: "admission",
        gaokao: { subjects: { 语文: 116, 数学: 128, 英语: 132, 物理: 86, 化学: 88, 生物: 91 }, total: 641, provinceRank: 2460, participants: 320000 },
      },
    );
  });

  const npcVariants: Array<[NonNullable<NonNullable<PostCareerInput["relationships"]>[number]["personalityKey"]>, string]> = [
    ["reserved", "克制寡言型 NPC"],
    ["warm", "温和照料型 NPC"],
    ["competitive", "竞争好胜型 NPC"],
    ["playful", "轻快玩笑型 NPC"],
    ["curious", "好奇探索型 NPC"],
  ];
  npcVariants.forEach(([personalityKey, label], index) => {
    const input: PostCareerInput = {
      ...baseInput,
      relationships: [{
        name: "{关系对象}",
        route: "dating",
        bond: 78,
        trust: 72,
        conflict: 18,
        familiarity: 76,
        security: 69,
        estrangement: 8,
        personalityKey,
      }],
    };
    addScene("gaokao-eve", personalityKey, label, "高考前夜的人际支线", 25 + index, input, { resumeStage: "gaokao" });
  });

  addScene("gaokao-eve", "alone", "没有亲近关系", "高考前夜的人际支线", 30, baseInput, { resumeStage: "gaokao" });
  addScene(
    "strong-setback",
    "written-failure",
    "强基笔试落选",
    "失败路线",
    60,
    baseInput,
    { resumeStage: "admission", strongResult: { written: 68, writtenCutoff: 72, enteredInterview: false } },
  );
  return events;
}

export const postSubjectMaxima = subjectMax;
import {
  NATIONAL_GOLD_CUTOFF,
  NATIONAL_SILVER_CUTOFF,
  NATIONAL_TRAINING_TEAM_CUTOFF,
  NATIONAL_TRUE_SILVER_END,
} from "./national-rules.ts";
