import test from "node:test";
import assert from "node:assert/strict";
import {
  buildFutureEpilogue,
  futureRouteCatalog,
  futureRouteCount,
} from "../app/future-epilogues.ts";

const base = {
  seed: "FUTURE-001",
  name: "林知夏",
  school: "之江大学",
  major: "生物工程（强基计划）",
  routeLabel: "竞赛破格强基",
  originId: "elite-school",
  retired: false,
  retiredWeek: 80,
  academics: 560,
  reasoning: 72,
  biologyMastery: 78,
  experiment: 70,
  social: 58,
  mindset: 63,
  san: 61,
  familySupport: 55,
  medalTier: "gold",
  nationalRank: 82,
  modules: [82, 76, 74, 80],
};

test("成年后日谈至少提供二十条互不重复的未来路线", () => {
  assert(futureRouteCount() >= 20);
  assert.equal(new Set(futureRouteCatalog.map((item) => item.id)).size, futureRouteCount());
});

test("后日谈覆盖大学、成年职业和更远生活，而非高中复盘", () => {
  const ending = buildFutureEpilogue(base);
  assert(ending.paragraphs.length >= 4);
  assert(ending.paragraphs.join("").length > 350);
  assert(ending.paragraphs.some((paragraph) => /大学|毕业|后来|多年/.test(paragraph)));
});

test("恋人与挚友经历会进入成年后日谈附章", () => {
  const romance = buildFutureEpilogue({
    ...base,
    relationships: [
      { name: "闻星回", route: "dating", bond: 70, trust: 62, conflict: 10 },
    ],
    fantasyJoined: true,
    fantasyChats: 18,
  });
  const text = romance.paragraphs.join("");
  assert.match(text, /闻星回/);
  assert.match(text, /幻想乡/);
});

test("休学和退学获得面向恢复与非传统路径的未来，而不是戛然而止", () => {
  const pause = buildFutureEpilogue({ ...base, abnormal: "pause", san: 8, mindset: 12 });
  const withdrawal = buildFutureEpilogue({ ...base, abnormal: "withdrawal" });
  assert.equal(pause.routeId, "ordinary-restart");
  assert.equal(withdrawal.routeId, "alternative-path");
  assert(pause.paragraphs.length >= 4);
  assert(withdrawal.paragraphs.length >= 4);
});

