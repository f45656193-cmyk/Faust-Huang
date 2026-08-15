import fs from "node:fs";
import path from "node:path";
import { linkedStoryDeveloperEvents } from "../app/event-library.ts";
import { causalLifeEvents } from "../app/causal-life-events.ts";
import { validateCausalCatalog } from "../app/narrative-causality.ts";
import {
  defaultRelationship,
  normalizeRelationship,
  settleRelationshipWeek,
} from "../app/relationship-content.ts";
import {
  advancePostCareer,
  createPostCareer,
  getPostScene,
} from "../app/post-career.ts";

const familyProfiles = ["anxious", "results", "longterm", "open"];
const personalities = ["reserved", "warm", "competitive", "playful", "curious"];
const causalEvents = [...linkedStoryDeveloperEvents, ...causalLifeEvents];
const catalogIssues = validateCausalCatalog(causalEvents);
const chainCounts = Object.fromEntries(
  [...Map.groupBy(causalEvents, (event) => event.causality?.chainId ?? "untracked")]
    .map(([chainId, events]) => [chainId, events.length]),
);

function relationshipRun(route, maintained, seedIndex) {
  let relation = normalizeRelationship({
    ...defaultRelationship(`DEBUG-${seedIndex}`, `npc-${seedIndex}`),
    route,
    bond: route === "dating" ? 70 : 60,
    trust: route === "dating" ? 62 : 55,
    romance: route === "dating" ? 58 : route === "crush" ? 35 : 0,
    familiarity: 58,
    security: 54,
    reciprocity: 50,
    meaningfulInteractions: 10 + (seedIndex % 20),
    lastInteractionWeek: 1,
    lastMeaningfulWeek: 1,
  }, `DEBUG-${seedIndex}`, `npc-${seedIndex}`);
  for (let week = 2; week <= 52; week += 1) {
    const interacted = maintained && week % (route === "dating" ? 2 : 4) === 0;
    relation = settleRelationshipWeek(relation, interacted, week);
  }
  return relation;
}

const relationshipMetrics = {};
for (const route of ["dating", "friend", "crush"]) {
  const abandoned = Array.from({ length: 250 }, (_, index) => relationshipRun(route, false, index));
  const maintained = Array.from({ length: 250 }, (_, index) => relationshipRun(route, true, index));
  const average = (records, key) =>
    Number((records.reduce((sum, record) => sum + record[key], 0) / records.length).toFixed(2));
  relationshipMetrics[route] = {
    abandoned: {
      bond: average(abandoned, "bond"), trust: average(abandoned, "trust"),
      familiarity: average(abandoned, "familiarity"), security: average(abandoned, "security"),
      estrangement: average(abandoned, "estrangement"),
    },
    maintained: {
      bond: average(maintained, "bond"), trust: average(maintained, "trust"),
      familiarity: average(maintained, "familiarity"), security: average(maintained, "security"),
      estrangement: average(maintained, "estrangement"),
    },
  };
}

function postInput(index) {
  return {
    seed: `POST-DEBUG-${index}`,
    name: "自动试玩者",
    originId: index % 2 ? "county-school" : "top-scorer",
    originAcademic: 62 + (index % 34),
    retiredWeek: 8 + (index % 92),
    retired: index % 4 !== 0,
    academics: 65 + (index % 150), reasoning: 38 + (index % 58),
    biologyMastery: 35 + ((index * 3) % 64), experiment: 25 + ((index * 5) % 70),
    san: 20 + ((index * 7) % 79), mindset: 18 + ((index * 11) % 80),
    social: 24 + ((index * 13) % 74), familySupport: 24 + ((index * 17) % 74),
    familyProfileKey: familyProfiles[index % 4], coachFavor: index % 60,
    peerFavor: 10 + (index % 85), nationalRank: index % 6 === 0 ? 20 + (index % 230) : null,
    relationships: [{
      name: `NPC${index % 12}`, route: index % 2 ? "friend" : "dating",
      bond: 45 + (index % 48), trust: 38 + (index % 52), conflict: index % 45,
      familiarity: 40 + (index % 52), security: 30 + (index % 58), estrangement: index % 25,
      personalityKey: personalities[index % 5],
    }],
  };
}

const endings = {};
const stageVisits = {};
const failures = [];
for (let index = 0; index < 500; index += 1) {
  const input = postInput(index);
  let state = createPostCareer(input);
  for (let step = 0; step < 90 && state.stage !== "ending"; step += 1) {
    stageVisits[state.stage] = (stageVisits[state.stage] ?? 0) + 1;
    const scene = getPostScene(state, input);
    if (!scene.title || !scene.lead || !scene.detail || scene.choices.length === 0) {
      failures.push({ index, stage: state.stage, reason: "empty-scene" });
      break;
    }
    const choice = scene.choices[(index * 11 + step * 5) % scene.choices.length];
    state = advancePostCareer(state, choice.id, input);
    const bounded = [state.san, state.mindset, state.social, state.familySupport]
      .every((value) => value >= 0 && value <= 100);
    if (!bounded) {
      failures.push({ index, stage: state.stage, reason: "stat-out-of-range" });
      break;
    }
  }
  if (state.stage !== "ending") failures.push({ index, stage: state.stage, reason: "no-ending" });
  else {
    const ending = state.ending?.subtitle ?? "missing-ending";
    endings[ending] = (endings[ending] ?? 0) + 1;
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  causalCatalog: {
    eventCount: causalEvents.length,
    chainCount: Object.keys(chainCounts).length,
    chainCounts,
    issues: catalogIssues,
  },
  relationships: relationshipMetrics,
  postCareer: { simulations: 500, failures, endings, stageVisits },
  verdict: catalogIssues.length === 0 && failures.length === 0 ? "pass" : "fail",
};

const output = path.resolve("work/causal-debug-report.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  verdict: report.verdict,
  causalEvents: report.causalCatalog.eventCount,
  causalChains: report.causalCatalog.chainCount,
  catalogIssues: catalogIssues.length,
  postCareerSimulations: report.postCareer.simulations,
  postCareerFailures: failures.length,
  endings: Object.keys(endings).length,
  report: output,
}, null, 2));
if (report.verdict !== "pass") process.exitCode = 1;
