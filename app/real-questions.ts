export type RealQuestionModule = "module1" | "module2" | "module3" | "module4";
export type TruthValue = "T" | "F";

export type RealQuestion = {
  id: string;
  year: number;
  number: number;
  module: RealQuestionModule;
  prompt: string;
  statements: [string, string, string, string];
  answers: [TruthValue, TruthValue, TruthValue, TruthValue];
  source: string;
};

const answer = (letters: string): [TruthValue, TruthValue, TruthValue, TruthValue] =>
  (["A", "B", "C", "D"].map((letter) => letters.includes(letter) ? "T" : "F") as [TruthValue, TruthValue, TruthValue, TruthValue]);

/** Reviewed against the uploaded 2024 paper and its official adjusted answer sheet. */
const manuallyReviewedQuestionBank: RealQuestion[] = [
  { id: "2024-4", year: 2024, number: 4, module: "module1", prompt: "三羧酸循环由 8 步反应组成，其中不可逆的反应是：", statements: ["柠檬酸经顺乌头酸转变为异柠檬酸", "异柠檬酸氧化脱羧转变为 α-酮戊二酸", "α-酮戊二酸氧化脱羧生成琥珀酰辅酶 A", "琥珀酰辅酶 A 经底物水平磷酸化形成琥珀酸"], answers: answer("BC"), source: "2024 年全国中学生生物学联赛试题" },
  { id: "2024-21", year: 2024, number: 21, module: "module1", prompt: "关于接受并传递信号的各种类型受体分子，以下描述正确的有：", statements: ["NO 受体具有酶活性", "类固醇激素受体定位于细胞膜", "受体酪氨酸激酶能引发共价修饰", "G 蛋白偶联受体可以通过第二信使 cAMP 介导细胞内信号传递"], answers: answer("ACD"), source: "2024 年全国中学生生物学联赛试题" },
  { id: "2024-38", year: 2024, number: 38, module: "module2", prompt: "关于茎的维管形成层，下列叙述正确的是：", statements: ["束中形成层来源于原形成层，属于次生分生组织", "束间形成层来源于髓射线，属于次生分生组织", "束中形成层来源于原形成层，属于初生分生组织", "束间形成层来源于髓射线，属于初生分生组织"], answers: answer("BC"), source: "2024 年全国中学生生物学联赛试题" },
  { id: "2024-46", year: 2024, number: 46, module: "module2", prompt: "关于自然界花粉颜色的说法，正确的有：", statements: ["黄色花粉中色素多为黄酮类化合物、类胡萝卜素", "蓝色花粉中主要含有花青素", "紫色花粉中色素多为黄酮类化合物、类胡萝卜素", "白色花粉中主要含有花青素"], answers: answer("AB"), source: "2024 年全国中学生生物学联赛试题" },
  { id: "2024-68", year: 2024, number: 68, module: "module3", prompt: "关于神经元轴突与初级纤毛之间的新型突触，下列说法正确的有：", statements: ["初级纤毛可通过信号改变突触后神经元的功能状态", "这种突触不依靠化学信号", "初级纤毛因体积较小，传递信号效率一定低于传统突触", "初级纤毛上的 GPCR 在信号传递中发挥作用"], answers: answer("AD"), source: "2024 年全国中学生生物学联赛试题" },
  { id: "2024-69", year: 2024, number: 69, module: "module3", prompt: "以下关于神经组织的表述，正确的有：", statements: ["成熟的神经元可以不断分裂", "星形胶质细胞有营养支持作用", "星形胶质细胞参与血脑屏障形成", "星形胶质细胞能对一些神经活性物质产生反应"], answers: answer("BCD"), source: "2024 年全国中学生生物学联赛试题" },
  { id: "2024-85", year: 2024, number: 85, module: "module4", prompt: "白眼雌果蝇与红眼雄果蝇杂交，后代出现一只由 X 染色体不分离造成的白眼雌蝇。不分离可能发生于：", statements: ["母本第一次减数分裂", "母本第二次减数分裂", "父本第一次减数分裂", "父本第二次减数分裂"], answers: answer("AB"), source: "2024 年全国中学生生物学联赛试题" },
  { id: "2024-95", year: 2024, number: 95, module: "module4", prompt: "下列属于新基因产生方式的有：", statements: ["反转录转座子插入", "水平基因转移", "染色体丢失", "基因复制"], answers: answer("ABD"), source: "2024 年全国中学生生物学联赛试题" },
];

/** Balanced across 2020–2026 source papers; only complete four-option text and official keys are admitted. */
export const reviewedQuestionBank: RealQuestion[] = [
  ...manuallyReviewedQuestionBank,
  ...(generatedQuestionBank as RealQuestion[]),
];

export function drawRealQuestions(seed: string) {
  const hash = (value: string) => [...value].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return (["module1", "module2", "module3", "module4"] as RealQuestionModule[]).map((module) => {
    const pool = reviewedQuestionBank.filter((question) => question.module === module);
    return pool[hash(`${seed}-${module}`) % pool.length];
  });
}

export function scoreRealQuestion(question: RealQuestion, response: Array<TruthValue | null>) {
  const matches = question.answers.reduce((total, expected, index) => total + (response[index] === expected ? 1 : 0), 0);
  return { matches, fraction: matches === 4 ? 1 : matches === 3 ? 0.5 : matches === 2 ? 0.1 : 0 };
}

export type MistakeRecord = { questionId: string; recordedAt: string; attempts: number; bestMatches: number };
import generatedQuestionBank from "./real-question-bank.generated.ts";
