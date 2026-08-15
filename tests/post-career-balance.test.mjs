import test from "node:test";
import assert from "node:assert/strict";
import {
  advancePostCareer,
  createPostCareer,
  getPostScene,
} from "../app/post-career.ts";

function input(seed, overrides = {}) {
  return {
    seed,
    name: "测试选手",
    originId: "elite-school",
    originAcademic: 82,
    retiredWeek: 72,
    retired: true,
    retirementLabel: "回到常规课堂",
    academics: 260,
    reasoning: 52,
    biologyMastery: 58,
    experiment: 35,
    san: 66,
    mindset: 62,
    social: 52,
    familySupport: 58,
    coachFavor: 2,
    peerFavor: 30,
    nationalRank: null,
    ...overrides,
  };
}

function selectChoice(state, scene, strategy) {
  const preferred = {
    bridge: strategy === "weak" ? "bridge-life" : "bridge-steady",
    return: strategy === "weak" ? "return-rest" : "return-plan",
    "first-review":
      strategy === "strong-focus" ? "review-science" : "review-balanced",
    "selection-theory": "selection-theory-balance",
    midterm: strategy === "weak" ? "midterm-talk" : "midterm-review",
    "selection-experiment": "selection-exp-balance",
    mock1: strategy === "regular" ? "mock1-steady" : "mock1-strong",
    application:
      strategy === "recommend"
        ? "apply-recommend-east"
        : strategy === "exception"
          ? "apply-exception-east"
          : strategy === "regular"
            ? "apply-regular"
            : "apply-ordinary-985",
    "recommendation-choice": "recommendation-focus-team",
    "second-review":
      strategy === "weak" ? "second-health" : "second-strong",
    mock2: strategy === "weak" ? "mock2-accept" : "mock2-calm",
    gaokao: "gaokao-enter",
    "strong-written": "written-normal",
    "strong-interview": "interview-honest",
    admission: "admission-open",
    international: "international-compete",
    crisis: "crisis-leave",
    withdrawal: "withdrawal-leave",
  };
  return (
    scene.choices.find((choice) => choice.id === preferred[state.stage]) ??
    scene.choices[0]
  );
}

function play(source, strategy) {
  let state = createPostCareer(source);
  let turns = 0;
  while (state.stage !== "ending" && turns < 40) {
    const scene = getPostScene(state, source);
    const choice = selectChoice(state, scene, strategy);
    assert.ok(choice, `No choice for stage ${state.stage}`);
    state = advancePostCareer(state, choice.id, source);
    turns += 1;
  }
  assert.equal(state.stage, "ending");
  return state;
}

test("two complete hand-play routes reach coherent endings", () => {
  const ordinary = play(
    input("FULL-ROUTE-ORDINARY", {
      retiredWeek: 20,
      originAcademic: 76,
      academics: 245,
      san: 72,
      mindset: 66,
    }),
    "ordinary",
  );
  const trainingTeam = play(
    input("FULL-ROUTE-TRAINING", {
      retired: false,
      retiredWeek: 108,
      academics: 190,
      reasoning: 72,
      biologyMastery: 87,
      experiment: 84,
      san: 70,
      mindset: 72,
      nationalRank: 28,
    }),
    "recommend",
  );

  console.log(
    JSON.stringify(
      {
        ordinary: {
          gaokao: ordinary.gaokao?.total,
          route: ordinary.admission?.routeLabel,
          school: ordinary.admission?.school,
        },
        trainingTeam: {
          gaokao: trainingTeam.gaokao?.total ?? null,
          route: trainingTeam.admission?.routeLabel,
          selectionRank: trainingTeam.nationalSelection.finalRank,
          international: trainingTeam.nationalSelection.internationalMedal,
        },
      },
      null,
      2,
    ),
  );

  assert.ok(ordinary.gaokao);
  assert.ok(ordinary.admission);
  assert.equal(trainingTeam.admission?.routeLabel, "国家集训队保送");
  assert.equal(trainingTeam.gaokao, undefined);
});

test("Monte Carlo keeps 985 and C9 outcomes valuable rather than automatic", () => {
  const count = 180;
  const ordinary = Array.from({ length: count }, (_, index) =>
    play(
      input(`POST-ORD-${index}`, {
        retiredWeek: 38,
        originAcademic: 74,
        academics: 235,
        san: 66,
        mindset: 61,
      }),
      "ordinary",
    ),
  );
  const weak = Array.from({ length: count }, (_, index) =>
    play(
      input(`POST-WEAK-${index}`, {
        retiredWeek: 78,
        originAcademic: 66,
        academics: 150,
        reasoning: 38,
        biologyMastery: 35,
        san: 58,
        mindset: 52,
      }),
      "weak",
    ),
  );
  const gold = Array.from({ length: count }, (_, index) =>
    play(
      input(`POST-GOLD-${index}`, {
        retired: false,
        retiredWeek: 108,
        originAcademic: 78,
        academics: 185,
        reasoning: 66,
        biologyMastery: 84,
        experiment: 76,
        san: 66,
        mindset: 66,
        nationalRank: 121,
      }),
      "exception",
    ),
  );
  const trueSilver = Array.from({ length: count }, (_, index) =>
    play(
      input(`POST-SILVER-${index}`, {
        retired: false,
        retiredWeek: 108,
        originAcademic: 76,
        academics: 180,
        reasoning: 62,
        biologyMastery: 80,
        experiment: 70,
        san: 64,
        mindset: 63,
        nationalRank: 205,
      }),
      "exception",
    ),
  );
  const ordinarySilver = Array.from({ length: count }, (_, index) =>
    play(
      input(`POST-ORDINARY-SILVER-${index}`, {
        retired: false,
        retiredWeek: 108,
        originAcademic: 75,
        academics: 178,
        reasoning: 60,
        biologyMastery: 78,
        experiment: 67,
        san: 63,
        mindset: 62,
        nationalRank: 325,
      }),
      "exception",
    ),
  );
  const bronze = Array.from({ length: count }, (_, index) =>
    play(
      input(`POST-BRONZE-${index}`, {
        retired: false,
        retiredWeek: 108,
        originAcademic: 74,
        academics: 175,
        reasoning: 58,
        biologyMastery: 76,
        experiment: 64,
        san: 62,
        mindset: 61,
        nationalRank: 465,
      }),
      "exception",
    ),
  );

  const is985 = (result) =>
    result.admission &&
    !["临江师范大学", "青岚理工大学", "云泽医科大学"].includes(
      result.admission.school,
    );
  const ordinary985Rate =
    ordinary.filter(is985).length / ordinary.length;
  const weak985Rate = weak.filter(is985).length / weak.length;
  const goldC9Rate =
    gold.filter((result) => result.admission?.routeLabel === "竞赛破格强基")
      .length / gold.length;
  const trueSilverC9Rate =
    trueSilver.filter(
      (result) => result.admission?.routeLabel === "竞赛破格强基",
    ).length / trueSilver.length;
  const ordinarySilverC9Rate =
    ordinarySilver.filter(
      (result) => result.admission?.routeLabel === "竞赛破格强基",
    ).length / ordinarySilver.length;
  const bronzeC9Rate =
    bronze.filter(
      (result) => result.admission?.routeLabel === "竞赛破格强基",
    ).length / bronze.length;
  const average = (values) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;

  console.log(
    JSON.stringify(
      {
        ordinary985Rate: Math.round(ordinary985Rate * 1000) / 10,
        ordinaryGaokaoAverage: Math.round(
          average(ordinary.map((result) => result.gaokao.total)) * 10,
        ) / 10,
        weak985Rate: Math.round(weak985Rate * 1000) / 10,
        weakGaokaoAverage: Math.round(
          average(weak.map((result) => result.gaokao.total)) * 10,
        ) / 10,
        goldC9Rate: Math.round(goldC9Rate * 1000) / 10,
        trueSilverC9Rate: Math.round(trueSilverC9Rate * 1000) / 10,
        ordinarySilverC9Rate:
          Math.round(ordinarySilverC9Rate * 1000) / 10,
        bronzeC9Rate: Math.round(bronzeC9Rate * 1000) / 10,
      },
      null,
      2,
    ),
  );

  assert.ok(ordinary985Rate >= 0.25);
  assert.ok(ordinary985Rate <= 0.85);
  assert.ok(weak985Rate < ordinary985Rate);
  assert.ok(weak985Rate <= 0.3);
  assert.ok(goldC9Rate >= 0.95);
  assert.ok(goldC9Rate < 1);
  assert.ok(trueSilverC9Rate >= 0.5);
  assert.ok(trueSilverC9Rate <= 0.9);
  assert.ok(ordinarySilverC9Rate < trueSilverC9Rate);
  assert.ok(ordinarySilverC9Rate <= 0.2);
  assert.ok(bronzeC9Rate <= 0.12);
});
