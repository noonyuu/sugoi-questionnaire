import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Answer } from "../model/form_model";

export async function convertToFormAnswer(
  transcription: string,
  formData: string,
  env: { GEMINI_API_KEY: string }
): Promise<Answer[]> {
  if (!transcription || !formData) {
    throw new Error("文字起こしデータまたはフォームデータが不足しています。");
  }

  // Gemini API 用のレスポンススキーマ定義
  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      response: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: {
              type: SchemaType.INTEGER,
              description: "質問のID",
            },
            answer: {
              type: SchemaType.STRING,
              description: "質問に対する回答",
            },
          },
          required: ["id", "answer"],
        },
      },
    },
    required: ["response"],
  };

  // Gemini API の初期化
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

  // モデルの初期化
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  // プロンプトの構築
  // TODO: プロンプトの内容を適切に変更
  const promptContent = `
    # Google Form Voice Input Assistant

    あなたは音声入力からGoogleフォームへの回答を適切に変換するAIアシスタントです。ユーザーが話した内容を解析し、Googleフォームの各質問に対する最適な回答を構造化して提供してください。

    ## 入力データ
    1. ユーザーの音声から文字起こしされたテキスト: ${transcription}
    2. Googleフォームから抽出された質問の構造体: ${JSON.stringify(formData)}

    ## 必要な処理
    1. 文字起こしテキストを分析してください
    2. 各質問に対する回答を特定してください
    3. 選択式の質問の場合は、提供されたオプションから最も適切なものを選択してください
    4. テキスト入力の質問の場合は、関連する部分を抽出または要約してください

    回答はJSONスキーマに従った形式で返してください。
  `;

  // Gemini API を呼び出し
  const result = await model.generateContent(promptContent);
  const responseText = await result.response.text();

  // Gemini API からのレスポンスをパース
  let parsedResponse: { response: { id: number; answer: string }[] };
  try {
    parsedResponse = JSON.parse(responseText);
  } catch (error) {
    const jsonMatch =
      responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
      responseText.match(/{[\s\S]*}/);
    if (jsonMatch) {
      parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } else {
      throw new Error("Geminiからの応答をJSONとして解析できませんでした");
    }
  }

  // Gemini API のレスポンスを Answer 型に変換
  const answers: Answer[] = parsedResponse.response.map((item) => ({
    questionId: item.id,
    answerText: item.answer,
  }));

  return answers;
}
