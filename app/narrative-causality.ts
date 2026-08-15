export type CausalEventRule = {
  /** 同一条因果链的稳定标识。 */
  chainId: string;
  /** 链内顺序；从 1 开始。 */
  step: number;
  requiresEvents?: string[];
  requiresAnyEvents?: string[];
  blockedByEvents?: string[];
  minimumWeeksAfterEvents?: Record<string, number>;
  maximumWeeksAfterEvents?: Record<string, number>;
  /** 后续节点在普通随机事件中的优先级。 */
  followUpWeight?: number;
  closesChain?: boolean;
};

export type NarrativeMemory = {
  eventId: string;
  week: number;
  choiceId: string;
  choiceTitle: string;
  result: string;
  tags: string[];
  chainId?: string;
  chainStep?: number;
};

export type CausalEventLike = {
  id: string;
  body: string[];
  causality?: CausalEventRule;
};

export type CausalContext = {
  week: number;
  resolvedEvents: string[];
  memories: NarrativeMemory[];
};

const memoryFor = (context: CausalContext, eventId: string) =>
  [...context.memories]
    .reverse()
    .find((memory) => memory.eventId === eventId);

export function causalEligibility(
  event: CausalEventLike,
  context: CausalContext,
) {
  const rule = event.causality;
  if (!rule) return { eligible: true, reasons: [] as string[] };
  const happened = new Set(context.resolvedEvents);
  const reasons: string[] = [];
  if (rule.requiresEvents?.some((eventId) => !happened.has(eventId)))
    reasons.push("missing-required-event");
  if (
    rule.requiresAnyEvents?.length &&
    !rule.requiresAnyEvents.some((eventId) => happened.has(eventId))
  )
    reasons.push("missing-any-event");
  if (rule.blockedByEvents?.some((eventId) => happened.has(eventId)))
    reasons.push("blocked-by-event");

  const checkGap = (
    values: Record<string, number> | undefined,
    compare: (elapsed: number, gap: number) => boolean,
    reason: string,
  ) => {
    if (!values) return;
    for (const [eventId, gap] of Object.entries(values)) {
      const memory = memoryFor(context, eventId);
      // 旧存档只有 resolvedEvents、没有周数记忆时，保留兼容性。
      if (memory && compare(context.week - memory.week, gap)) reasons.push(reason);
    }
  };
  checkGap(
    rule.minimumWeeksAfterEvents,
    (elapsed, gap) => elapsed < gap,
    "follow-up-too-soon",
  );
  checkGap(
    rule.maximumWeeksAfterEvents,
    (elapsed, gap) => elapsed > gap,
    "follow-up-expired",
  );
  return { eligible: reasons.length === 0, reasons };
}

export function causalPriority(event: CausalEventLike) {
  if (!event.causality || event.causality.step <= 1) return 1;
  return Math.max(1, event.causality.followUpWeight ?? 1.35);
}

function finalSentence(text: string) {
  const sentences = text
    .split(/(?<=[。！？])/)
    .map((part) => part.trim())
    .filter(Boolean);
  const sentence = sentences.at(-1) ?? text;
  return sentence.length > 92 ? `${sentence.slice(0, 90)}……` : sentence;
}

/** 给后续节点补入真实的上一次结果，而不是泛泛的“此前发生过某事”。 */
export function withCausalContinuity<T extends CausalEventLike>(
  event: T,
  memories: NarrativeMemory[],
): T {
  const previousIds = [
    ...(event.causality?.requiresEvents ?? []),
    ...(event.causality?.requiresAnyEvents ?? []),
  ];
  const previous = [...memories]
    .reverse()
    .find((memory) => previousIds.includes(memory.eventId));
  if (!previous) return event;
  const prelude = `前情记忆 · 第${previous.week}周，你选择了“${previous.choiceTitle}”。${finalSentence(previous.result)}`;
  if (event.body[0] === prelude) return event;
  return { ...event, body: [prelude, ...event.body] };
}

export function recordNarrativeMemory(input: NarrativeMemory) {
  return {
    ...input,
    tags: [...new Set(input.tags)],
    result: input.result.trim(),
  };
}

export type CausalCatalogIssue = {
  eventId: string;
  kind: "missing-predecessor" | "invalid-step" | "impossible-window";
  detail: string;
};

export function validateCausalCatalog(events: CausalEventLike[]) {
  const ids = new Set(events.map((event) => event.id));
  const issues: CausalCatalogIssue[] = [];
  for (const event of events) {
    const rule = event.causality;
    if (!rule) continue;
    if (rule.step < 1)
      issues.push({ eventId: event.id, kind: "invalid-step", detail: `step=${rule.step}` });
    // 同一步允许存在由不同选择标签控制的互斥变体，不能把分支误报为重复节点。
    for (const predecessor of [
      ...(rule.requiresEvents ?? []),
      ...(rule.requiresAnyEvents ?? []),
    ]) {
      if (!ids.has(predecessor))
        issues.push({ eventId: event.id, kind: "missing-predecessor", detail: predecessor });
      const minimum = rule.minimumWeeksAfterEvents?.[predecessor];
      const maximum = rule.maximumWeeksAfterEvents?.[predecessor];
      if (minimum !== undefined && maximum !== undefined && minimum > maximum)
        issues.push({ eventId: event.id, kind: "impossible-window", detail: `${predecessor}:${minimum}>${maximum}` });
    }
  }
  return issues;
}
