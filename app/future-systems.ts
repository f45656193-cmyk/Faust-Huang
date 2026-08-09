/** Stable extension points for the next content update. They are deliberately
 * not exposed in the current UI until a reviewed question set and balanced
 * talent catalogue exist. */
export type ContestQuestion = {
  id: string;
  sourceYear: number;
  stage: "provincial" | "national-theory";
  module: "module1" | "module2" | "module3" | "module4" | "literature";
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  scoreWeight: number;
};

export type QuestionAnswerMode = "manual" | "auto";

export type OpeningTalent = {
  id: string;
  title: string;
  description: string;
  cost: number;
  conflictsWith?: string[];
};

export const reviewedQuestionBank: ContestQuestion[] = [];
export const openingTalents: OpeningTalent[] = [];

