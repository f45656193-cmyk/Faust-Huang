export type SupplementaryModule = "module1" | "module2" | "module3" | "module4";

export type SupplementaryBook = {
  id: string;
  title: string;
  module: SupplementaryModule;
  description: string;
  examWeight: number;
  experimentModule?: SupplementaryModule;
  experimentWeight?: number;
};

export type SupplementaryBookState = {
  unlocked: boolean;
  mastery: number;
  retention: number;
  lastStudiedWeek: number;
};

export const supplementaryBooks: SupplementaryBook[] = [
  { id: "gene-xii", title: "《基因 XII》", module: "module1", description: "从基因结构、表达与调控继续向大学教材深处推进。", examWeight: 0.055 },
  { id: "entomology", title: "《昆虫学》", module: "module2", description: "补足昆虫分类、形态、生理与实验观察的专门知识。", examWeight: 0.05, experimentModule: "module2", experimentWeight: 0.045 },
  { id: "comparative-anatomy", title: "《脊索动物比较解剖学》", module: "module2", description: "用比较视角理解脊索动物各器官系统的结构与演化。", examWeight: 0.05 },
  { id: "invertebrate-zoology", title: "《无脊椎动物学》", module: "module2", description: "深入主要无脊椎动物门类的形态、分类与生活史。", examWeight: 0.05 },
  { id: "animal-ecology", title: "《动物生态学原理》", module: "module3", description: "把动物行为、种群、群落与环境适应连接起来。", examWeight: 0.055 },
  { id: "biological-evolution", title: "《生物进化》", module: "module4", description: "在遗传学基础上深入选择、漂变、物种形成与宏演化。", examWeight: 0.055 },
];

export function defaultSupplementaryBookStudy(): Record<string, SupplementaryBookState> {
  return Object.fromEntries(supplementaryBooks.map((book) => [book.id, {
    unlocked: false,
    mastery: 0,
    retention: 100,
    lastStudiedWeek: 0,
  }]));
}

export function effectiveSupplementaryMastery(state?: SupplementaryBookState) {
  if (!state?.unlocked) return 0;
  return Math.round(state.mastery * state.retention) / 100;
}

export function supplementaryExamBonus(
  states: Record<string, SupplementaryBookState> | undefined,
  module: SupplementaryModule,
) {
  return supplementaryBooks
    .filter((book) => book.module === module)
    .reduce((sum, book) => sum + effectiveSupplementaryMastery(states?.[book.id]) * book.examWeight, 0);
}

export function supplementaryExperimentBonus(
  states: Record<string, SupplementaryBookState> | undefined,
  module: SupplementaryModule,
) {
  return supplementaryBooks
    .filter((book) => book.experimentModule === module)
    .reduce((sum, book) => sum + effectiveSupplementaryMastery(states?.[book.id]) * (book.experimentWeight ?? 0), 0);
}
