import { buildFutureEpilogue } from "./future-epilogues.ts";

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
          "你用一个学期把课堂、作业和考试重新接上。成绩明显恢复，但有几周你只是机械地完成日程。",
      });
    if (choiceId === "bridge-life")
      return update(base, {
        stage: nextStage,
        gains: allGain(1.6),
        san: 7,
        mindset: 4,
        social: 4,
        result:
          "你重新参加班级活动，也学会不再把每一次休息解释成浪费。成绩恢复得慢，却第一次像普通高中生那样生活。",
      });
    return update(base, {
      stage: nextStage,
      gains: allGain(2.5),
      san: -2,
      mindset: 2,
      result:
        "你没有突然逆袭，只是把每周欠下的内容一点点补完。到了期末，老师已经不再把你称作“刚退赛的那个”。",
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
          "两周里你几乎住在书桌前。卷子补完了，但第三个清晨醒来时，你一时想不起今天是星期几。",
      });
    if (choiceId === "return-rest")
      return update(state, {
        stage: "first-review",
        gains: allGain(1.4),
        san: 11,
        mindset: 5,
        result:
          "你先把睡眠从凌晨拉回午夜。进度仍落后，但重新坐进教室时，至少能听懂老师正在说什么。",
      });
    return update(state, {
      stage: "first-review",
      gains: allGain(2.8),
      san: -3,
      mindset: 3,
      social: 2,
      result:
        "班主任删掉了不可能完成的部分，只留下每天必须补齐的任务。计划不漂亮，却真的执行了下去。",
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
          "数学和理综开始明显回升。语文老师在作文本上写了一句：别把所有希望都压在理科。",
      });
    if (choiceId === "review-language")
      return update(state, {
        stage: nextStage,
        gains: { 语文: 7, 英语: 7, 数学: 3, 物理: 2, 化学: 2, 生物: 2 },
        san: -4,
        mindset: 2,
        result:
          "单词和作文素材没有竞赛题那样刺激，却一点点填上总分里最沉默的缺口。",
      });
    return update(state, {
      stage: nextStage,
      gains: allGain(4.1),
      san: -5,
      mindset: 1,
      result:
        "你没有让任何一科彻底掉队。错题本越来越厚，但至少每一页都知道为什么被写进去。",
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
    const nextStage = state.nationalSelection.eligible
      ? "selection-experiment"
      : "mock1";
    if (choiceId === "midterm-pressure")
      return update(state, {
        stage: nextStage,
        gains: allGain(4.8),
        san: -9,
        mindset: -4,
        result:
          "名次确实上升了，代价是你开始把每次小失误都理解成退步。那张排名表像一块持续亮着的屏幕。",
      });
    if (choiceId === "midterm-talk")
      return update(state, {
        stage: nextStage,
        gains: allGain(3.2),
        san: -2,
        mindset: 3,
        social: 5,
        result:
          "同学的笔记替你省下了许多无效整理。你也第一次承认，回班并不意味着必须一个人补完全部空白。",
      });
    return update(state, {
      stage: nextStage,
      gains: allGain(4),
      san: -4,
      mindset: 2,
      result:
        "复盘没有制造奇迹，但最差的那门课终于不再继续下坠。总分开始变得可以预测。",
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
          "你开始接触强基数学和化学题。它们没有立刻提高一模总分，却让校测不再只是报名页面上的两个字。",
      });
    if (choiceId === "mock1-recover")
      return update(state, {
        stage: "application",
        gains: allGain(2.4),
        san: 9,
        mindset: 5,
        result:
          "减少套卷后，排名没有立刻上升。但你终于能在一道难题之后继续完成整张试卷。",
      });
    return update(state, {
      stage: "application",
      gains: allGain(4.2),
      san: -5,
      mindset: 2,
      result:
        "你没有追逐最好看的单科，而是把所有明显缺口逐一补到不再致命。班主任第一次说，这个总分可以谈志愿了。",
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
              "你没有去刷一场并不存在的破格笔试，而是反复核对材料、整理竞赛经历并练习面试表达。高考推进因此稍慢。",
          })
        : update(state, {
            stage: "mock2",
            gains: { 数学: 7, 化学: 6, 物理: 2, 生物: 2, 语文: 0.5, 英语: 0.5 },
            san: -9,
            strongPrep: 18,
            interviewPrep: 3,
            result:
              "强基题开始有了固定解法，高考语文和英语却几乎停在原地。你接受了这次交换。",
          });
    if (choiceId === "second-health")
      return update(state, {
        stage: "mock2",
        gains: allGain(2.8),
        san: 8,
        mindset: 6,
        result:
          "你删掉了那些只会制造焦虑的任务。进度没有冲刺，却很久没有在半夜因为一道题醒来。",
      });
    return update(state, {
      stage: "mock2",
      gains: allGain(4.7),
      san: -6,
      mindset: 2,
      result:
        "六科总分继续缓慢上升。强基准备没有额外推进，但高考这条底线变得更可靠。",
    });
  }
  if (state.stage === "mock2") {
    if (choiceId === "mock2-last-sprint")
      return update(state, {
        stage: "gaokao",
        gains: allGain(5.2),
        san: -13,
        mindset: -4,
        result:
          "最后一个月的分数确实又涨了一截。与此同时，你开始依靠闹钟提醒自己吃饭和睡觉。",
      });
    if (choiceId === "mock2-accept")
      return update(state, {
        stage: "gaokao",
        gains: allGain(2.6),
        san: 7,
        mindset: 8,
        result:
          "你不再追逐每一道怪题。放弃几分理论上可能得到的分数后，整张卷子反而变得可以完成。",
      });
    return update(state, {
      stage: "gaokao",
      gains: allGain(4.1),
      san: -4,
      mindset: 4,
      result:
        "最后一次模拟按正式作息结束。没有奇迹，也没有崩盘，这种平静本身已经很珍贵。",
    });
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
      stage: nextStage,
      lastResult: `高考总分 ${gaokao.total.toFixed(1)} / 750，全省约第${gaokao.provinceRank}名。`,
      history: [
        ...state.history,
        `高考${gaokao.total.toFixed(1)}分，全省约第${gaokao.provinceRank}名。`,
      ],
    };
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
      stage: result.enteredInterview ? "strong-interview" : "admission",
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
            "你没有参加这一届高考。医院的诊断、学校的休学手续和被清空的日程表一度让生活显得异常安静。",
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
              "你办理了退学。没有高考倒计时，也没有录取通知书，只有一段突然空出来、必须重新安排的生活。",
          })
        : abnormalEnding(input, state, "pause", {
            title: "这一届先到这里",
            subtitle: "休学结局 · 等待复学",
            body:
              "学校保留了你的学籍。高考被推迟一年，竞赛和排名也第一次从每天的生活中退了出去。",
          }),
      lastResult: dropout ? "你办理了退学手续。" : "你正式办理休学，保留学籍。",
    };
  }
  return state;
}

export function postKnowledgeTotal(state: PostCareerState) {
  return totalKnowledge(state);
}

export const postSubjectMaxima = subjectMax;
import {
  NATIONAL_GOLD_CUTOFF,
  NATIONAL_SILVER_CUTOFF,
  NATIONAL_TRAINING_TEAM_CUTOFF,
  NATIONAL_TRUE_SILVER_END,
} from "./national-rules.ts";
