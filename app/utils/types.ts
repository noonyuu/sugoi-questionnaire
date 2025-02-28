// フォームの質問タイプ
export type FormQuestion = {
  id: string
  question: string
  type: string
  options?: string[]
}

// チャットメッセージタイプ
export type Message = {
  id: string
  role: "system" | "user"
  content: string
  isQuestion?: boolean
  questionId?: string
}

// フォーム解析レスポンス
export type ParseFormResponse = {
  success: boolean
  questions?: FormQuestion[]
  error?: string
}

// フォーム送信リクエスト
export type SubmitFormRequest = {
  url: string
  answers: Record<string, string>
}

// フォーム送信レスポンス
export type SubmitFormResponse = {
  success: boolean
  error?: string
}

