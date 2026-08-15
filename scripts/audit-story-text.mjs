import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const files = [
  "app/page.tsx",
  "app/game-data.ts",
  "app/event-library.ts",
  "app/fantasy-content.ts",
  "app/achievement-events.ts",
  "app/relationship-content.ts",
  "app/relationship-dailies.ts",
  "app/relationship-personality-dailies.ts",
  "app/family-weekly-content.ts",
  "app/family-checkpoint-content.ts",
];
// 75 字以下通常意味着情节或结果尚未交代完整；75–84 字只作人工复核提示。
// 不能为了达到偏好长度机械追加套话。
const minimumNarrativeLength = 75;
const preferredNarrativeLength = 85;

function propertyName(node) {
  return node.name && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) ? node.name.text : "";
}

function textValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((span) => `{变量}${span.literal.text}`)].join("");
  return "";
}

function collectStrings(node) {
  const values = [];
  const visit = (current) => {
    const value = textValue(current);
    if (value) values.push(value);
    else ts.forEachChild(current, visit);
  };
  visit(node);
  return values;
}

function nearestTitle(node) {
  let current = node.parent;
  while (current) {
    if (ts.isObjectLiteralExpression(current)) {
      const title = current.properties.find((property) => ts.isPropertyAssignment(property) && propertyName(property) === "title");
      if (title && ts.isPropertyAssignment(title)) return collectStrings(title.initializer).join(" ");
    }
    current = current.parent;
  }
  return "";
}

function normalized(value) {
  return value.replace(/\{变量\}/g, "").replace(/[\s，。！？；：、“”‘’（）《》·—…,.!?;:'"()\-]/g, "");
}

function grams(value) {
  const clean = normalized(value);
  const result = new Set();
  for (let index = 0; index < clean.length - 2; index += 1) result.add(clean.slice(index, index + 3));
  return result;
}

function similarity(a, b) {
  const left = grams(a);
  const right = grams(b);
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const gram of left) if (right.has(gram)) common += 1;
  return common / Math.max(left.size, right.size);
}

const records = [];
for (const relative of files) {
  const sourceText = fs.readFileSync(relative, "utf8");
  const source = ts.createSourceFile(relative, sourceText, ts.ScriptTarget.Latest, true, relative.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && ["body", "result"].includes(propertyName(node))) {
      const value = propertyName(node) === "body" ? collectStrings(node.initializer).join("") : collectStrings(node.initializer).join("");
      if (value) {
        const position = source.getLineAndCharacterOfPosition(node.getStart(source));
        records.push({
          kind: propertyName(node),
          file: relative,
          line: position.line + 1,
          title: nearestTitle(node),
          text: value,
          length: [...value].length,
        });
      }
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const helper = node.expression.text;
      if (["choice", "hidden"].includes(helper) && node.arguments[2]) {
        const value = collectStrings(node.arguments[2]).join("");
        if (value) {
          const position = source.getLineAndCharacterOfPosition(node.getStart(source));
          records.push({
            kind: "result",
            file: relative,
            line: position.line + 1,
            title: collectStrings(node.arguments[1]).join(" "),
            text: value,
            length: [...value].length,
          });
        }
      }
      if (helper === "event" && node.arguments[4]) {
        const value = collectStrings(node.arguments[4]).join("");
        if (value) {
          const position = source.getLineAndCharacterOfPosition(node.getStart(source));
          records.push({
            kind: "body",
            file: relative,
            line: position.line + 1,
            title: collectStrings(node.arguments[3]).join(" "),
            text: value,
            length: [...value].length,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

const resultRecords = records.filter((record) => record.kind === "result");
const bodyRecords = records.filter((record) => record.kind === "body");
const duplicateGroups = [...Map.groupBy(resultRecords, (record) => normalized(record.text)).entries()]
  .filter(([key, group]) => key.length >= 12 && group.length > 1)
  .map(([, group]) => group.map(({ file, line, title }) => ({ file, line, title })));
const similarPairs = [];
for (let left = 0; left < resultRecords.length; left += 1) {
  for (let right = left + 1; right < resultRecords.length; right += 1) {
    const score = similarity(resultRecords[left].text, resultRecords[right].text);
    if (score >= 0.72 && normalized(resultRecords[left].text) !== normalized(resultRecords[right].text)) {
      similarPairs.push({ score: Number(score.toFixed(2)), left: resultRecords[left], right: resultRecords[right] });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  totals: { bodies: bodyRecords.length, results: resultRecords.length },
  thresholds: { minimumNarrativeLength, preferredNarrativeLength },
  shortBodies: bodyRecords.filter((record) => record.length < minimumNarrativeLength).sort((a, b) => a.length - b.length),
  shortResults: resultRecords.filter((record) => record.length < minimumNarrativeLength).sort((a, b) => a.length - b.length),
  preferredLengthWarnings: records
    .filter((record) => record.length >= minimumNarrativeLength && record.length < preferredNarrativeLength)
    .sort((a, b) => a.length - b.length),
  duplicateGroups,
  similarPairs: similarPairs.sort((a, b) => b.score - a.score).slice(0, 100),
};

const output = path.resolve("work/story-text-audit.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  ...report.totals,
  shortBodies: report.shortBodies.length,
  shortResults: report.shortResults.length,
  preferredLengthWarnings: report.preferredLengthWarnings.length,
  exactDuplicateGroups: report.duplicateGroups.length,
  highSimilarityPairs: report.similarPairs.length,
  report: output,
}, null, 2));
