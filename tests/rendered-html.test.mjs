import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the biology olympiad simulator start screen", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>生竞人生｜生物竞赛生模拟器<\/title>/);
  assert.match(html, /选择你的起点/);
  assert.match(html, /竞赛教练之子/);
  assert.match(html, /中考状元/);
  assert.match(html, /世界种子/);
  assert.match(html, /生成档案/);
});

test("keeps the ten-slot save archive and competition systems in source", async () => {
  const [page, data, postCareer, nationalRules] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/game-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/post-career.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/national-rules.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Array\.from\(\{ length: 10 \}/);
  assert.match(page, /存档柜/);
  assert.match(page, /自动续玩档/);
  assert.match(page, /simulateProvincialExam/);
  assert.match(page, /simulateNationalExam/);
  assert.match(page, /近六百人/);
  assert.match(page, /experimentModules/);
  assert.match(page, /slackDependence/);
  assert.match(page, /achievementDefinitions/);
  assert.match(page, /废墟图书馆/);
  assert.match(page, /肖申克的救赎/);
  assert.match(data, /experimentModule/);
  assert.match(postCareer, /普通强基/);
  assert.match(postCareer, /国家集训队保送/);
  assert.match(nationalRules, /NATIONAL_GOLD_CUTOFF = 150/);
  assert.match(nationalRules, /NATIONAL_SILVER_CUTOFF = 410/);
  assert.match(postCareer, /国际生物学竞赛/);
  assert.match(postCareer, /休学结局/);
  assert.match(postCareer, /退学结局/);
});
