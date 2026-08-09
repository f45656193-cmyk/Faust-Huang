import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  advancePostCareer,
  createPostCareer,
  getPostScene,
} from "../app/post-career.ts";

const medalInput = {
  seed: "REGRESSION-GOLD",
  name: "测试选手",
  originId: "elite-school",
  originAcademic: 82,
  retiredWeek: 108,
  retired: false,
  academics: 205,
  reasoning: 66,
  biologyMastery: 82,
  experiment: 72,
  san: 68,
  mindset: 66,
  social: 55,
  familySupport: 65,
  coachFavor: 20,
  peerFavor: 35,
  nationalRank: 120,
};

function reachApplication(input) {
  let state = createPostCareer(input);
  let guard = 0;
  const route = {
    bridge: "bridge-steady",
    return: "return-plan",
    "first-review": "review-balanced",
    midterm: "midterm-review",
    mock1: "mock1-steady",
  };
  while (state.stage !== "application" && guard < 20) {
    const scene = getPostScene(state, input);
    const choice = scene.choices.find((item) => item.id === route[state.stage]) ?? scene.choices[0];
    assert.ok(choice, `missing choice at ${state.stage}`);
    state = advancePostCareer(state, choice.id, input);
    guard += 1;
  }
  assert.equal(state.stage, "application");
  return state;
}

function finishRegular(input) {
  let state = createPostCareer(input);
  let guard = 0;
  const route = {
    bridge: "bridge-steady",
    return: "return-plan",
    "first-review": "review-balanced",
    midterm: "midterm-review",
    mock1: "mock1-steady",
    application: "apply-regular",
    "second-review": "second-gaokao",
    mock2: "mock2-calm",
    gaokao: "gaokao-enter",
    admission: "admission-open",
  };
  while (state.stage !== "ending" && guard < 30) {
    const scene = getPostScene(state, input);
    const choice = scene.choices.find((item) => item.id === route[state.stage]) ?? scene.choices[0];
    assert.ok(choice, `missing regular choice at ${state.stage}`);
    state = advancePostCareer(state, choice.id, input);
    guard += 1;
  }
  assert.equal(state.stage, "ending");
  return state;
}

test("gold and true-silver non-Qingbei exceptional routes bypass written exam", () => {
  for (const [rank, seed] of [[120, "GOLD"], [205, "TRUE-SILVER"]]) {
    const input = { ...medalInput, seed, nationalRank: rank };
    let state = reachApplication(input);
    const application = getPostScene(state, input);
    assert.ok(application.choices.some((choice) => choice.id === "apply-exception-east"));
    assert.ok(!application.choices.some((choice) => choice.id === "apply-ordinary-east"));
    state = advancePostCareer(state, "apply-exception-east", input);
    for (const id of ["second-health", "mock2-calm", "gaokao-enter"]) {
      state = advancePostCareer(state, id, input);
    }
    assert.equal(state.stage, "strong-interview");
  }
});

test("province achievements rely on official tags rather than draft estimates", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const achievementBlock = page.slice(
    page.indexOf("const enteredTeamWithLowAverage"),
    page.indexOf("const unlocked = achievementDefinitions.find"),
  );
  assert.match(achievementBlock, /storyTags\.includes\(`第\$\{attempt\}次省赛-进入省队`\)/);
  assert.doesNotMatch(achievementBlock, /draftRank/);
  assert.match(page, /forcedSecondFailure/);
  assert.match(page, /second-failure-return-class/);
  assert.match(page, /第二次省赛后被迫退赛/);
  assert.doesNotMatch(page, /你不会被系统自动判定退赛/);
});

test("internal tests use the active school team and speed affects both major exams", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Math\.max\(2, activeSchoolTeamSize\)/);
  assert.match(page, /requiredSpeed/);
  assert.match(page, /theoryQuestionLoad/);
  assert.match(page, /teammate-wave-/);
});

test("ordinary 985 admission never carries a six-figure-sized rank fraction", () => {
  const results = Array.from({ length: 80 }, (_, index) =>
    finishRegular({
      ...medalInput,
      seed: `RANK-${index}`,
      retired: true,
      retiredWeek: 30,
      nationalRank: null,
      academics: 235,
      originAcademic: 78,
    }),
  );
  const ordinary985 = results.filter(
    (result) =>
      result.admission?.routeLabel === "普通高考志愿" &&
      !["临江师范大学", "青岚理工大学", "云泽医科大学"].includes(result.admission.school),
  );
  assert.ok(ordinary985.length > 0);
  assert.ok(
    ordinary985.every(
      (result) => result.gaokao.provinceRank / result.gaokao.participants <= 0.12,
    ),
  );
});

test("event feedback is revealed only after the player records a choice", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /记录选择，查看结果/);
  assert.match(page, /你选择了：\{seedRivalText\(eventResultNotice\.choice, seed\)\}/);
  assert.match(page, /onClick=\{continueAfterEventResult\}/);
  assert.doesNotMatch(page, /selectedOpeningChoice\.result/);
  assert.doesNotMatch(page, /selectedRetirementChoice\.result/);
  assert.doesNotMatch(page, /selectedEventChoice\.result/);
  assert.doesNotMatch(page, /<p className="event-index">/);
  assert.doesNotMatch(page, /pendingEvent\.inspiration/);
  assert.match(page, /type: "national-finish"/);
  assert.match(page, /type: "retirement-finish"/);
});

test("monthly pocket money and weekly chocolate limits are settled in gameplay", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /week % 4 === 0 \? selected\.stats\.monthlyPocketMoney : 0/);
  assert.match(page, /本月零花钱到账 ¥\$\{monthlyPocketMoney\}/);
  assert.match(page, /每四周固定到账 ¥/);
  assert.match(page, /const weeklySingleUse = \[[\s\S]*?"chocolate"/);
  assert.match(page, /lastChocolateWeek === week - 1 \? current \+ 1 : 1/);
});

test("allowance requests and family trust have bounded, event-driven costs", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /amount: 30,[\s\S]*?baseSupportCost: 3/);
  assert.match(page, /amount: 80,[\s\S]*?baseSupportCost: 6/);
  assert.match(page, /amount: 150,[\s\S]*?baseSupportCost: 10/);
  assert.match(page, /Math\.min\(1\.8, 1 \+ allowanceRequestCount \* 0\.1\)/);
  assert.match(page, /function makeFamilyCheckpointEvent/);
  assert.match(page, /key: "national-one"/);
  assert.match(page, /nextStats\.regularNeglectWeeks >= 4/);
  assert.match(page, /pendingAssessment\.totalScore >= 650/);
  assert.match(page, /pendingAssessment\.nationalStage === "experiment"/);
});

test("individual departures have varied causes and aftermaths", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  for (const phrase of [
    "健康暂停",
    "与教练长期冲突",
    "兴趣转移",
    "家庭突发变故",
    "departure-aftermath",
  ]) {
    assert.match(page, new RegExp(phrase));
  }
  assert.match(page, /const waveScenes = \[/);
  assert.match(page, /const scenes = \[[\s\S]*?省联考群里/);
});

test("retired rivals freeze and cannot re-enter generic mock events", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /retiredRivalWeeks/);
  assert.match(page, /退赛后停止训练/);
  assert.match(page, /mentionedRival && retiredRivalIds\.includes\(mentionedRival\.id\)/);
  assert.match(page, /departure-persuade-success/);
  assert.match(page, /relation\.tension >= 35/);
});

test("national contest scenes stay in one chained week and mock papers are not estimated", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /type: "continue-event"/);
  assert.match(page, /makeNationalExperimentEvent/);
  assert.doesNotMatch(page, /calendar\.firstNationalWeek \+ 3, makeNationalAwardEvent/);
  assert.match(page, /assessmentItem\?\.assessment\?\.title === "全国中学生生物学联赛"/);
});

test("provincial exams and mocks use 160 raw points plus a displayed rate", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const PROVINCIAL_QUESTION_COUNT = 80/);
  assert.match(page, /const PROVINCIAL_POINTS_PER_QUESTION = 2/);
  assert.match(page, /correctTotal \* PROVINCIAL_POINTS_PER_QUESTION/);
  assert.match(page, /pendingAssessment\.maxScore === PROVINCIAL_MAX_SCORE/);
  assert.match(page, /得分率.*provincialScoreRate/);
  assert.match(page, /normalizeProvincialAttemptScoreScale/);
});

test("named rivals occupy real provincial and national exam slots", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /world\.provinceParticipants - 1 - eligibleNamedRivals\.length/);
  assert.match(page, /participants - 1 - eligibleNamedRivals\.length/);
  assert.match(page, /generatedCoreRivalContexts/);
  assert.match(page, /coreSameGrade: 30 \+/);
  assert.match(page, /coreUpperGrade: 30 \+/);
  assert.match(page, /coreLowerGrade: 30 \+/);
  assert.match(page, /retiredWeek === undefined \|\| retiredWeek > week/);
  assert.match(page, /namedResults: NamedProvincialResult\[\]/);
  assert.match(page, /namedResults: NamedNationalResult\[\]/);
  assert.match(page, /最近正式成绩/);
  assert.match(page, /联赛之后 · 熟人榜单/);
  assert.match(page, /national-rest-rival-/);
});
