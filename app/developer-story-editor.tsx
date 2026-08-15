"use client";

import { useMemo, useState } from "react";
import { rivals, type GameEffect, type GameEvent } from "./game-data";
import bundledStoryTextOverrides from "./default-story-overrides.json";

export type StoryTextOverride = {
  title?: string;
  body?: string[];
  quote?: string;
  choices?: Record<string, { title?: string; preview?: string; result?: string }>;
};

const STORAGE_KEY = "shengjing-story-text-overrides-v1";
const CATALOG_KEY = "shengjing-story-event-catalog-v4";
const BUNDLED_STORY_TEXT_OVERRIDES = bundledStoryTextOverrides as Record<string, StoryTextOverride>;
const CATEGORY_ORDER = ["开局与路线", "赛事与考试", "训练与外培", "日常生活", "家庭与教练", "人物关系", "离队与退赛", "物品与扩充书目", "成就与幻想", "其他"] as const;
type StoryCategory = (typeof CATEGORY_ORDER)[number];

const CHAIN_NAMES: Record<string, string> = {
  slack: "摸鱼与休息", meals: "队友聚餐", coach: "教练讨论", family: "家庭沟通",
  isolation: "队内孤立", rivalry: "竞争与友谊", practice: "模拟训练", "school-exam": "常规考试",
  "textbook-oddity": "教材与勘误", "training-chaos": "外培事故", "answer-dispute": "答案争议",
  "national-organizer": "国赛组织现场",
};

function chainId(event: GameEvent) {
  return event.id.match(/^chain-(.+)-\d{2}$/)?.[1];
}

function storyEventCategory(event: GameEvent): StoryCategory {
  if (event.archive?.category && CATEGORY_ORDER.includes(event.archive.category as StoryCategory)) return event.archive.category as StoryCategory;
  const id = event.id.toLowerCase();
  const text = `${event.label} ${event.title}`;
  if (/^bondstory-|^rel-daily-|relationship|breakup|reunion/.test(id) || /恋爱|挚友|关系剧情|好感/.test(text)) return "人物关系";
  if (/^opening-|^origin-|milestone|leave-application/.test(id) || event.phase === "opening") return "开局与路线";
  if (/^supplementary-|^item-/.test(id)) return "物品与扩充书目";
  if (/^achievement-|^fantasy-/.test(id)) return "成就与幻想";
  if (/retire|departure/.test(id)) return "离队与退赛";
  if (/national|provincial|exam|award|result|theory|chain-national-organizer/.test(id) || event.phase === "exam") return "赛事与考试";
  if (/^training-|camp|hotel|chain-training-chaos|chain-classroom/.test(id) || event.phase === "training") return "训练与外培";
  if (/^routine-/.test(id)) return "日常生活";
  if (/^family-|^chain-family-|^chain-coach-|coach/.test(id) || /家长|家庭|教练/.test(text)) return "家庭与教练";
  if (/关系事件/.test(text)) return "人物关系";
  if (/退赛|离队/.test(text)) return "离队与退赛";
  if (/扩充书目|纪念物|物品/.test(text)) return "物品与扩充书目";
  if (/成就|幻想/.test(text)) return "成就与幻想";
  if (/省赛|联赛|国赛|考试|模考|成绩|奖牌/.test(text)) return "赛事与考试";
  if (/外培|集训|训练/.test(text)) return "训练与外培";
  if (/开局|启程|里程碑|停课/.test(text)) return "开局与路线";
  if (event.phase === "weekly" || /^routine-|^chain-/.test(id)) return "日常生活";
  return "其他";
}

function storyEventGroup(event: GameEvent, category = storyEventCategory(event)) {
  if (event.archive?.group) return event.archive.group;
  const id = event.id;
  const chain = chainId(event);
  if (chain) return `行为链 · ${CHAIN_NAMES[chain] ?? chain}`;
  if (id.startsWith("family-weekly-")) return "家庭日常谈话";
  if (id.startsWith("family-checkpoint-")) return "家庭阶段节点";
  if (id.startsWith("bondstory-")) {
    const label = event.label ?? "";
    if (id.includes("-personality-")) {
      if (/恋爱/.test(label)) return "性格专属 · 恋爱日常";
      if (/挚友/.test(label)) return "性格专属 · 挚友日常";
      if (/朦胧好感/.test(label)) return "性格专属 · 朦胧好感";
      return "性格专属 · 关系初期";
    }
    if (id.includes("-daily-")) {
      if (/恋爱/.test(label)) return "恋爱日常";
      if (/挚友/.test(label)) return "挚友日常";
      if (/朦胧好感/.test(label)) return "朦胧好感日常";
      return "人物共通日常";
    }
    if (/恋爱/.test(label)) return "恋爱主线";
    if (/挚友/.test(label)) return "挚友主线";
    if (/朦胧好感/.test(label)) return "朦胧好感主线";
    return "人物关系主线";
  }
  if (id.startsWith("rel-daily-")) return "人物日常结算";
  if (id.startsWith("routine-")) return "无特殊事件时的日常";
  if (id.startsWith("supplementary-")) return "扩充书目解锁";
  if (id.startsWith("item-")) return "纪念物与生活物件";
  if (id.startsWith("fantasy-")) return "幻想乡支线";
  if (id.startsWith("achievement-")) return "成就剧情";
  if (id.includes("retirement") || id.includes("retire")) return "主动退赛流程";
  if (id.includes("departure")) return "人物离队事件";
  if (/provincial|省赛|联赛/.test(`${id}${event.label}`)) return "联赛流程";
  if (/national|国赛/.test(`${id}${event.label}`)) return "国赛流程";
  if (/leave-application|停课/.test(`${id}${event.label}`)) return "停课与路线选择";
  if (/training|camp|hotel|外培|集训/.test(`${id}${event.label}`)) return "外培与集训";
  if (category === "开局与路线") return "开局与早期选择";
  return (event.label ?? "").split("·")[0].trim() || "未细分";
}

function eventNpcId(event: GameEvent) {
  const source = `${event.id ?? ""} ${event.title ?? ""} ${Array.isArray(event.body) ? event.body.join(" ") : ""}`;
  return [...rivals].sort((a, b) => b.id.length - a.id.length)
    .find((rival) => event.id.includes(rival.id) || source.includes(rival.name))?.id;
}

function storyClusterKey(event: GameEvent) {
  if (event.archive?.clusterKey) return event.archive.clusterKey;
  const npcId = eventNpcId(event);
  if (npcId) return event.id.replace(npcId, "{NPC}");
  if (event.id.startsWith("family-weekly-")) return event.id.replace(/-(anxious|results|longterm|open)$/, "");
  if (event.id.startsWith("family-checkpoint-")) return event.id.replace(/-(anxious|results|longterm|open)$/, "");
  return event.id;
}

function eventEditorKey(event: GameEvent) {
  return event.archive?.variantKey ? `${event.id}::${event.archive.variantKey}` : event.id;
}

function replaceEventText(event: GameEvent, replacer: (text: string) => string): GameEvent {
  return {
    ...event,
    title: replacer(event.title ?? ""),
    body: Array.isArray(event.body) ? event.body.map(replacer) : [],
    quote: event.quote ? replacer(event.quote) : event.quote,
    choices: event.choices.map((choice) => ({ ...choice, title: replacer(choice.title), preview: replacer(choice.preview ?? ""), result: replacer(choice.result ?? "") })),
  };
}

function tokenizeEventNpc(event: GameEvent, npcNames: Record<string, string>) {
  const npcId = eventNpcId(event);
  if (!npcId) return event;
  const canonicalName = rivals.find((rival) => rival.id === npcId)?.name;
  const visibleName = npcNames[npcId];
  const names = [...new Set([visibleName, canonicalName].filter(Boolean) as string[])];
  return replaceEventText(event, (value) => names.reduce((text, name) => text.replaceAll(name, "{NPC}"), value));
}

function overrideFor(event: GameEvent, overrides: Record<string, StoryTextOverride>) {
  return overrides[eventEditorKey(event)] ?? overrides[event.id];
}

export function applyStoryTextOverride(event: GameEvent, overrides: Record<string, StoryTextOverride>, npcNames: Record<string, string> = {}) {
  const override = overrideFor(event, overrides);
  if (!override) return event;
  const customized = {
    ...event,
    title: override.title ?? event.title,
    body: override.body ?? event.body,
    quote: override.quote ?? event.quote,
    choices: event.choices.map((choice) => ({ ...choice, ...(override.choices?.[choice.id] ?? {}) })),
  };
  const npcId = eventNpcId(event);
  const npcName = npcId ? npcNames[npcId] : undefined;
  return npcName ? replaceEventText(customized, (text) => text.replaceAll("{NPC}", npcName)) : customized;
}

export function loadStoryTextOverrides(): Record<string, StoryTextOverride> {
  if (typeof window === "undefined") return BUNDLED_STORY_TEXT_OVERRIDES;
  try {
    const local = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, StoryTextOverride>;
    const merged = { ...BUNDLED_STORY_TEXT_OVERRIDES };
    for (const [eventId, override] of Object.entries(local)) {
      const bundled = merged[eventId];
      merged[eventId] = {
        ...bundled,
        ...override,
        choices: bundled?.choices || override.choices
          ? { ...(bundled?.choices ?? {}), ...(override.choices ?? {}) }
          : undefined,
      };
    }
    return merged;
  } catch {
    return BUNDLED_STORY_TEXT_OVERRIDES;
  }
}

export function loadCapturedStoryEvents(): GameEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(CATALOG_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((event) => event?.id && typeof event?.title === "string" && Array.isArray(event?.body) && Array.isArray(event?.choices)) : [];
  } catch { return []; }
}

export function captureStoryEvent(event: GameEvent, npcNames: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const captured = loadCapturedStoryEvents();
  const key = eventEditorKey(event);
  if (captured.some((item) => eventEditorKey(item) === key)) return;
  const tokenized = tokenizeEventNpc(event, npcNames);
  const textOnlyEvent = { ...tokenized, choices: tokenized.choices.map((choice) => ({ ...choice, effects: {} })) };
  try { window.localStorage.setItem(CATALOG_KEY, JSON.stringify([...captured, textOnlyEvent].slice(-1200))); }
  catch { /* 内置目录仍可使用。 */ }
}

function effectsLabel(effects: GameEffect) {
  const labels: Record<string, string> = { san: "SAN", academics: "常规", familySupport: "家庭", coachFavor: "教练", peerFavor: "同伴", social: "社交", mindset: "心态", reasoning: "思辨", problemSpeed: "速度", experiment: "实验", module1: "模块一", module2: "模块二", module3: "模块三", module4: "模块四", pocketMoney: "零花钱", competitionTime: "竞赛时间" };
  const values = Object.entries(effects).filter(([key]) => key !== "tags").map(([key, value]) => `${labels[key] ?? key} ${Number(value) > 0 ? "+" : ""}${value}`);
  if (effects.tags?.length) values.push(`标签：${effects.tags.join("、")}`);
  return values.join("　") || "无数值变化";
}

function timingLabel(event: GameEvent) {
  const { earliestWeek, latestWeek, allowedWeeks, probability, requiredTags, blockedTags, requiredActionCounts, minimumWeeksAfterTags, maximumWeeksAfterTags } = event.trigger;
  const range = event.archive?.timingNote ?? (allowedWeeks?.length ? `限定周：${allowedWeeks.join("、")}` : earliestWeek === latestWeek ? `第 ${earliestWeek} 周` : `第 ${earliestWeek}–${latestWeek} 周`);
  const conditions = [
    requiredTags?.length ? `前置：${requiredTags.join("、")}` : "",
    blockedTags?.length ? `触发后停用：${blockedTags.join("、")}` : "",
    requiredActionCounts && Object.keys(requiredActionCounts).length
      ? `行为累计：${Object.entries(requiredActionCounts).map(([key, value]) => `${key}≥${value}`).join("、")}`
      : "",
    minimumWeeksAfterTags && Object.keys(minimumWeeksAfterTags).length
      ? `前因后等待：${Object.entries(minimumWeeksAfterTags).map(([key, value]) => `${key}后至少${value}周`).join("、")}`
      : "",
    maximumWeeksAfterTags && Object.keys(maximumWeeksAfterTags).length
      ? `因果有效期：${Object.entries(maximumWeeksAfterTags).map(([key, value]) => `${key}后${value}周内`).join("、")}`
      : "",
  ].filter(Boolean);
  return `${range}${probability == null ? "" : ` · 单次判定 ${Math.round(probability * 100)}%`}${conditions.length ? ` · ${conditions.join(" · ")}` : ""}`;
}

function editorEventOrder(left: GameEvent, right: GameEvent) {
  const explicitLeft = left.archive?.order;
  const explicitRight = right.archive?.order;
  if (explicitLeft !== undefined || explicitRight !== undefined) {
    const orderDifference = (explicitLeft ?? Number.MAX_SAFE_INTEGER) - (explicitRight ?? Number.MAX_SAFE_INTEGER);
    if (orderDifference !== 0) return orderDifference;
  }
  const chainStep = (event: GameEvent) => Number(event.id.match(/-(\d{2})$/)?.[1] ?? Number.NaN);
  const leftStep = chainStep(left);
  const rightStep = chainStep(right);
  if (Number.isFinite(leftStep) && Number.isFinite(rightStep) && leftStep !== rightStep)
    return leftStep - rightStep;
  const causalOrder = (event: GameEvent) => {
    const id = event.id;
    const exact: Record<string, number> = {
      "item-plant-sprout": 10, "item-plant-drought": 11, "item-plant-aphids": 12, "item-plant-flower": 13,
      "item-lucky-pen-test": 20, "item-lucky-pen-lost": 21,
    };
    if (exact[id] !== undefined) return exact[id];
    const relationshipChapters = [
      "-desk", "-night", "-turn", "-rain", "-confession", "-after-exam-answer",
      "-ordinary-date", "-interference", "-secret-discovered", "-reunion-after",
      "-repair", "-different-results", "-friend-vow", "-friend-crisis",
    ];
    const relationshipIndex = relationshipChapters.findIndex((chapter) => id.endsWith(chapter));
    if (relationshipIndex >= 0) return 100 + relationshipIndex;
    return Number.NaN;
  };
  const leftCause = causalOrder(left);
  const rightCause = causalOrder(right);
  if (Number.isFinite(leftCause) && Number.isFinite(rightCause) && leftCause !== rightCause)
    return leftCause - rightCause;
  if (left.trigger.earliestWeek !== right.trigger.earliestWeek)
    return left.trigger.earliestWeek - right.trigger.earliestWeek;
  return (left.title ?? "").localeCompare(right.title ?? "", "zh-CN");
}

function editorVariantOrder(left: { variant: string; event: GameEvent }, right: { variant: string; event: GameEvent }) {
  const knownOrder: Record<string, number> = {
    anxious: 1, results: 2, longterm: 3, open: 4,
    reserved: 1, warm: 2, competitive: 3, playful: 4, curious: 5,
  };
  const leftKey = left.event.archive?.variantKey ?? "";
  const rightKey = right.event.archive?.variantKey ?? "";
  const difference = (knownOrder[leftKey] ?? 99) - (knownOrder[rightKey] ?? 99);
  return difference || left.variant.localeCompare(right.variant, "zh-CN");
}

export function DeveloperStoryEditor({ events, npcNames, npcLabels = {} }: { events: GameEvent[]; npcNames: Record<string, string>; npcLabels?: Record<string, string> }) {
  const [capturedEvents] = useState<GameEvent[]>(() => loadCapturedStoryEvents());
  const entries = useMemo(() => {
    const tokenized = [...capturedEvents, ...events].map((event) => tokenizeEventNpc(event, npcNames));
    return [...new Map(tokenized.map((event) => [eventEditorKey(event), event])).entries()].map(([key, event]) => ({
      key, event, category: storyEventCategory(event), group: storyEventGroup(event), cluster: storyClusterKey(event),
      variant: event.archive?.variantLabel ?? (eventNpcId(event) ? (npcLabels[eventNpcId(event)!] ?? "NPC 风格变体") : "通用版本"),
    }));
  }, [events, capturedEvents, npcNames, npcLabels]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"全部" | StoryCategory>("全部");
  const [group, setGroup] = useState("全部");
  const [selectedKey, setSelectedKey] = useState(entries[0]?.key ?? "");
  const [overrides, setOverrides] = useState<Record<string, StoryTextOverride>>(() => loadStoryTextOverrides());
  const [importText, setImportText] = useState("");

  const categoryEntries = entries.filter((entry) => category === "全部" || entry.category === category);
  const groups = [...new Set(categoryEntries.map((entry) => entry.group))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const visible = categoryEntries.filter((entry) => group === "全部" || entry.group === group).filter(({ event }) => `${event.id} ${event.label} ${event.title}`.toLowerCase().includes(query.toLowerCase()));
  const clusters = Map.groupBy(visible, (entry) => entry.cluster);
  // 搜索或切换目录后，旧 selectedKey 可能仍然存在于总目录，却已不在当前
  // 可见结果里；此时必须落到当前结果第一项，否则左栏事件和右侧正文会错位。
  const selectedEntry = visible.find((entry) => entry.key === selectedKey) ?? visible[0] ?? entries[0];
  const selected = selectedEntry?.event;
  const current = selected ? applyStoryTextOverride(selected, overrides) : null;
  const categoryCounts = useMemo(() => entries.reduce<Record<StoryCategory, number>>((counts, entry) => { counts[entry.category] += 1; return counts; }, Object.fromEntries(CATEGORY_ORDER.map((key) => [key, 0])) as Record<StoryCategory, number>), [entries]);

  const chooseCategory = (next: "全部" | StoryCategory) => { setCategory(next); setGroup("全部"); const first = entries.find((entry) => next === "全部" || entry.category === next); if (first) setSelectedKey(first.key); };
  const chooseGroup = (next: string) => { setGroup(next); const first = categoryEntries.find((entry) => next === "全部" || entry.group === next); if (first) setSelectedKey(first.key); };
  const update = (next: StoryTextOverride) => {
    if (!selectedEntry) return;
    const value = { ...overrides, [selectedEntry.key]: { ...overrides[selectedEntry.key], ...next } };
    setOverrides(value); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  };
  const updateChoice = (choiceId: string, field: "title" | "preview" | "result", value: string) => update({ choices: { ...(overrides[selectedEntry.key]?.choices ?? {}), [choiceId]: { ...(overrides[selectedEntry.key]?.choices?.[choiceId] ?? {}), [field]: value } } });
  const exportJson = () => { const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `生竞人生-剧情文本覆盖-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); };
  const importJson = () => { try { const value = JSON.parse(importText); setOverrides(value); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); setImportText(""); } catch { window.alert("JSON 格式无法识别，请检查后重试。"); } };

  return <>
    <button className="developer-editor-launch" onClick={() => setOpen(true)}>剧情文本编辑器</button>
    {open && <div className="developer-editor-backdrop"><section className="developer-editor" role="dialog" aria-modal="true" aria-label="开发者剧情文本编辑器">
      <header><div><p className="kicker">DEVELOPER STORY WORKBENCH</p><h2>剧情文本编辑器</h2><p>已归档 {entries.length} 个文本变体。目录按“大类 → 事件群 → 事件与人物/家庭变体”展开；“通用版本”指代码内基础稿，标有“已覆盖”的条目会在游戏中优先采用你的修改。</p></div><button onClick={() => setOpen(false)}>×</button></header>
      <div className="developer-editor-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索事件 ID、标题或正文归档名"/><button onClick={exportJson}>导出修改</button></div>
      <div className="developer-editor-layout">
        <nav className="developer-editor-categories" aria-label="事件大类"><button className={category === "全部" ? "selected" : ""} onClick={() => chooseCategory("全部")}><strong>全部事件</strong><small>{entries.length}</small></button>{CATEGORY_ORDER.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => chooseCategory(item)}><strong>{item}</strong><small>{categoryCounts[item]}</small></button>)}</nav>
        <nav className="developer-editor-groups" aria-label="事件子类群"><button className={group === "全部" ? "selected" : ""} onClick={() => chooseGroup("全部")}><strong>全部子类群</strong><small>{categoryEntries.length}</small></button>{groups.map((item) => <button key={item} className={group === item ? "selected" : ""} onClick={() => chooseGroup(item)}><strong>{item}</strong><small>{categoryEntries.filter((entry) => entry.group === item).length}</small></button>)}</nav>
        <nav className="developer-editor-events" aria-label="事件与文本变体">{[...clusters.entries()].sort(([, a], [, b]) => editorEventOrder(a[0].event, b[0].event)).map(([cluster, variants]) => <section className="developer-editor-cluster" key={cluster}><h3>{variants[0].event.title ?? "未命名事件"}</h3>{[...variants].sort(editorVariantOrder).map((entry) => <button key={entry.key} className={selectedEntry?.key === entry.key ? "selected" : ""} onClick={() => setSelectedKey(entry.key)}><strong>{entry.variant}{overrideFor(entry.event, overrides) ? " · 已覆盖" : ""}</strong><small>{entry.event.label ?? "旧版动态收录"} · {entry.event.id}</small></button>)}</section>)}{!visible.length && <p className="developer-editor-empty">当前目录没有匹配事件。</p>}</nav>
        {current && <div className="developer-editor-form"><div className="developer-editor-meta"><strong>{selectedEntry.category} / {selectedEntry.group}</strong><span>{timingLabel(selected!)}</span></div><label>事件标题<input value={current.title} onChange={(event) => update({ title: event.target.value })}/></label><label>正文<textarea rows={7} value={current.body.join("\n\n")} onChange={(event) => update({ body: event.target.value.split(/\n\s*\n/) })}/></label><label>引用/补充<textarea rows={3} value={current.quote ?? ""} onChange={(event) => update({ quote: event.target.value })}/></label><h3>选项、结果与实际数值</h3>{current.choices.map((choice) => <fieldset key={choice.id}><legend>{choice.id}</legend><label>选项<input value={choice.title} onChange={(event) => updateChoice(choice.id, "title", event.target.value)}/></label><label>选择后结果<textarea rows={4} value={choice.result} onChange={(event) => updateChoice(choice.id, "result", event.target.value)}/></label><p className="developer-editor-effects">{effectsLabel(choice.effects)}</p></fieldset>)}</div>}
      </div>
      <details><summary>导入文本覆盖 JSON</summary><textarea rows={5} value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="粘贴此前导出的 JSON"/><button onClick={importJson} disabled={!importText.trim()}>导入并保存</button></details>
    </section></div>}
  </>;
}
