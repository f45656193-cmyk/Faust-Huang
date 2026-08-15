import assert from "node:assert/strict";
import test from "node:test";
import { breakupRelationship, attemptRelationshipReunion, defaultRelationship, settleRelationshipWeek } from "../app/relationship-content.ts";
import { defaultSupplementaryBookStudy, supplementaryExamBonus } from "../app/supplementary-books.ts";
import { drawRealQuestions, reviewedQuestionBank, scoreRealQuestion } from "../app/real-questions.ts";
import { developerChangelog } from "../app/developer-changelog.ts";

test("扩充书目不进入基础模块，但能提供受控的局部考试权重", () => {
  const study = defaultSupplementaryBookStudy();
  assert.equal(supplementaryExamBonus(study, "module2"), 0);
  study.entomology = { unlocked: true, mastery: 80, retention: 75, lastStudiedWeek: 20 };
  const bonus = supplementaryExamBonus(study, "module2");
  assert.ok(bonus > 0 && bonus < 5);
});

test("真实题库每个模块都可抽题，四项 T/F 按 4/3/2 重合计权", () => {
  assert.equal(reviewedQuestionBank.length, 200);
  for (const module of ["module1", "module2", "module3", "module4"]) {
    assert.equal(reviewedQuestionBank.filter((question) => question.module === module).length, 50);
  }
  assert.equal(new Set(reviewedQuestionBank.map((question) => question.module)).size, 4);
  assert.equal(drawRealQuestions("REAL-TEST").length, 4);
  const question = reviewedQuestionBank[0];
  assert.deepEqual(scoreRealQuestion(question, question.answers), { matches: 4, fraction: 1 });
  const three = [...question.answers]; three[0] = three[0] === "T" ? "F" : "T";
  assert.deepEqual(scoreRealQuestion(question, three), { matches: 3, fraction: 0.5 });
  const two = [...three]; two[1] = two[1] === "T" ? "F" : "T";
  assert.deepEqual(scoreRealQuestion(question, two), { matches: 2, fraction: 0.1 });
});

test("长期不联系会压低恋爱和挚友关系，分手和复合最多一次", () => {
  const base = { ...defaultRelationship("REL", "r"), route: "dating", bond: 70, trust: 65, romance: 60, lastInteractionWeek: 1 };
  const faded = settleRelationshipWeek(base, false, 9);
  assert.ok(faded.bond < base.bond && faded.trust < base.trust && faded.romance < base.romance);
  const breakup = breakupRelationship(faded, "forced", 9);
  assert.equal(breakup.relation.route, "broken-up");
  assert.equal(breakup.relation.forcedBreakup, true);
  const reunion = attemptRelationshipReunion({ ...breakup.relation, bond: 90, trust: 90, conflict: 0 }, "warm", "REUNION", 12);
  assert.notEqual(reunion.outcome, "unavailable");
  assert.equal(reunion.relation.reunionUsed, true);
  assert.equal(attemptRelationshipReunion(reunion.relation, "warm", "REUNION", 13).outcome, "unavailable");
});

test("开发者更新日志保持倒序且本次内容已登记", () => {
  assert.ok(developerChangelog.length >= 2);
  assert.equal(developerChangelog[0].version, "1.1.2");
  assert.ok(developerChangelog[0].items.some((item) => item.includes("人物记忆")));
});
