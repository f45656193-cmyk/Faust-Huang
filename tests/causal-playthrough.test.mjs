import assert from "node:assert/strict";
import test from "node:test";
import { advancePostCareer, createPostCareer, getPostScene, postCareerDeveloperCatalog } from "../app/post-career.ts";

const familyProfiles = ["anxious", "results", "longterm", "open"];
const personalities = ["reserved", "warm", "competitive", "playful", "curious"];

function inputFor(index) {
  return {
    seed: `AUTO-CAUSE-${index}`,
    name: "自动试玩者",
    originId: index % 3 === 0 ? "top-scorer" : "county-school",
    originAcademic: 68 + (index % 22),
    retiredWeek: 12 + (index % 80),
    retired: index % 4 !== 0,
    retirementLabel: "自动试玩退赛",
    academics: 80 + (index % 120),
    reasoning: 45 + (index % 42),
    biologyMastery: 42 + (index % 50),
    experiment: 30 + (index % 55),
    san: 28 + (index % 65),
    mindset: 24 + ((index * 3) % 68),
    social: 30 + ((index * 7) % 65),
    familySupport: 32 + ((index * 5) % 65),
    familyProfileKey: familyProfiles[index % familyProfiles.length],
    coachFavor: 8 + (index % 50),
    peerFavor: 18 + (index % 70),
    nationalRank: index % 5 === 0 ? 30 + (index % 180) : null,
    relationships: [{
      name: `NPC${index % 9}`,
      route: index % 2 === 0 ? "friend" : "dating",
      bond: 50 + (index % 35),
      trust: 42 + (index % 38),
      conflict: index % 30,
      familiarity: 48 + (index % 40),
      security: 38 + (index % 45),
      estrangement: index % 18,
      personalityKey: personalities[index % personalities.length],
    }],
  };
}

function choose(scene, seedIndex, step) {
  return scene.choices[(seedIndex * 7 + step * 3) % scene.choices.length]?.id;
}

test("两百条中后期人生自动试玩都能抵达结局且没有未知空场景", () => {
  const endings = new Map();
  const visitedStages = new Set();
  for (let index = 0; index < 200; index += 1) {
    const input = inputFor(index);
    let state = createPostCareer(input);
    const seen = new Map();
    for (let step = 0; step < 80 && state.stage !== "ending"; step += 1) {
      visitedStages.add(state.stage);
      const scene = getPostScene(state, input);
      assert(scene.title && scene.lead && scene.detail, `空场景: ${state.stage}`);
      assert(scene.choices.length > 0, `无选项场景: ${state.stage}`);
      const choiceId = choose(scene, index, step);
      assert(choiceId, `无法选择: ${state.stage}`);
      const key = `${state.stage}:${choiceId}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
      assert((seen.get(key) ?? 0) <= 5, `疑似循环: ${key}`);
      state = advancePostCareer(state, choiceId, input);
      for (const value of [state.san, state.mindset, state.social, state.familySupport])
        assert(value >= 0 && value <= 100, `数值越界: ${value}`);
    }
    assert.equal(state.stage, "ending", `未抵达结局: ${index} / ${state.stage}`);
    const ending = state.ending?.subtitle ?? "missing";
    endings.set(ending, (endings.get(ending) ?? 0) + 1);
  }
  for (const required of ["family-midterm", "gaokao-eve", "score-release", "strong-setback"])
    assert(visitedStages.has(required), `自动试玩未覆盖阶段: ${required}`);
  assert(endings.size >= 4, "结局分布过于单一");
});

test("家长四性格与NPC五性格拥有独立标题、起因和选项文本", () => {
  const familyScenes = familyProfiles.map((profile, index) => {
    const input = { ...inputFor(index), familyProfileKey: profile };
    const state = { ...createPostCareer(input), stage: "family-midterm" };
    return getPostScene(state, input);
  });
  assert.equal(new Set(familyScenes.map((scene) => scene.title)).size, 4);
  assert.equal(new Set(familyScenes.map((scene) => scene.lead)).size, 4);
  assert.equal(new Set(familyScenes.flatMap((scene) => scene.choices.map((choice) => choice.title))).size, 12);

  const npcScenes = personalities.map((personality, index) => {
    const input = inputFor(index);
    input.relationships[0].personalityKey = personality;
    const state = { ...createPostCareer(input), stage: "gaokao-eve" };
    return getPostScene(state, input);
  });
  assert.equal(new Set(npcScenes.map((scene) => scene.title)).size, 5);
  assert.equal(new Set(npcScenes.map((scene) => scene.lead)).size, 5);
  assert.equal(new Set(npcScenes.flatMap((scene) => scene.choices.map((choice) => choice.title))).size, 10);
});

test("开发者目录不泄露预览用固定成绩或示例人物名", () => {
  const catalog = postCareerDeveloperCatalog();
  const scoreScenes = catalog.filter((event) => event.id.includes("score-release"));
  assert.equal(scoreScenes.length, 4);
  assert(scoreScenes.every((event) => event.body.join(" ").includes("{高考总分}")));
  assert(scoreScenes.every((event) => event.body.join(" ").includes("{全省位次}")));
  assert(scoreScenes.every((event) => !/641(?:\.0)?|2460/.test(event.body.join(" "))));
  assert(catalog.every((event) => !/自动试玩者|NPC\d+/.test([event.title, ...event.body].join(" "))));
});
