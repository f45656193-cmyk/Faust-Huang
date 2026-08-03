import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  displayKeepsake,
  keepsakeDefinitions,
  newlyUnlockedKeepsakes,
} from "../app/keepsakes.ts";

function context(overrides = {}) {
  return {
    week: 1,
    storyTags: [],
    resolvedEvents: [],
    actionCounts: {},
    inventory: {},
    experimentUnlocked: false,
    experiment: 0,
    experimentModules: [0, 0, 0, 0],
    retiredRivalCount: 0,
    relationships: [],
    provincialAttempts: [],
    nationalAttempts: [],
    ...overrides,
  };
}

test("首批纪念物是完整的64格图集且编号唯一", async () => {
  assert.equal(keepsakeDefinitions.length, 64);
  assert.equal(new Set(keepsakeDefinitions.map((item) => item.id)).size, 64);
  assert.deepEqual(
    keepsakeDefinitions.map((item) => item.atlasIndex).sort((a, b) => a - b),
    Array.from({ length: 64 }, (_, index) => index),
  );
  const atlasModule = await readFile(
    new URL("../app/keepsake-atlas-data.ts", import.meta.url),
    "utf8",
  );
  assert.ok(atlasModule.length > 100_000);
  assert.match(atlasModule, /data:image\/png;base64,/);
});

test("白色物品没有奖励，金色同时包含功能型与纯纪念型", () => {
  const white = keepsakeDefinitions.filter((item) => item.rarity === "white");
  assert.ok(white.length > 8);
  assert.ok(white.every((item) => !item.reward));
  const gold = keepsakeDefinitions.filter((item) => item.rarity === "gold");
  assert.ok(gold.some((item) => item.reward));
  assert.ok(gold.some((item) => !item.reward));
  assert.equal(
    keepsakeDefinitions.find((item) => item.id === "admission-letter").reward,
    undefined,
  );
});

test("所有一次性道具奖励总量受控，不足以替代正常行动", () => {
  const totals = {};
  for (const item of keepsakeDefinitions) {
    for (const [key, value] of Object.entries(item.reward ?? {})) {
      if (typeof value === "number") totals[key] = (totals[key] ?? 0) + value;
    }
  }
  assert.ok((totals.san ?? 0) <= 4);
  assert.ok((totals.mindset ?? 0) <= 4);
  assert.ok((totals.social ?? 0) <= 1);
  assert.ok((totals.reasoning ?? 0) <= 0.5);
  assert.ok((totals.experiment ?? 0) <= 0.7);
});

test("里程碑只按真实状态解锁，国赛奖牌会随名次改变等级", () => {
  const empty = newlyUnlockedKeepsakes(context(), {});
  assert.ok(empty.some((item) => item.id === "coach-schedule"));
  assert.ok(!empty.some((item) => item.id === "provincial-team-notice"));

  const teamContext = context({
    week: 48,
    storyTags: ["第1次省赛-进入省队"],
    provincialAttempts: [{ enteredTeam: true, finalAward: "省一等奖" }],
  });
  assert.ok(
    newlyUnlockedKeepsakes(teamContext, {}).some(
      (item) => item.id === "provincial-team-notice",
    ),
  );

  const medal = keepsakeDefinitions.find((item) => item.id === "national-medal");
  const gold = displayKeepsake(
    medal,
    context({ nationalAttempts: [{ finalRank: 120, medal: "金牌", theoryRank: 90 }] }),
  );
  const trueSilver = displayKeepsake(
    medal,
    context({ nationalAttempts: [{ finalRank: 205, medal: "银牌", theoryRank: 180 }] }),
  );
  assert.equal(gold.rarity, "gold");
  assert.equal(trueSilver.rarity, "purple");
});
