// formのモデル
export interface Form {
  id?: number; // 新規作成時は null
  url: string;
  formId: string;
  provider: string;
  createAt?: string;
}

// 質問のモデル
export interface Question {
  id?: number;
  formId?: number;
  questionText: string;
  questionType: string | null;
  position: number;
  required: number;
}

// 質問の回答のモデル
export interface Answer {
  id?: number;
  questionId: number;
  answerText: string;
}

// 選択肢のモデル
export interface Option {
  id?: number;
  questionId?: number;
  optionText: string;
  position: number;
}
