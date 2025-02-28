import { drizzle } from "drizzle-orm/d1";
import { Form, Question } from "../../model/form_model";
import { forms, options, questions } from "../schema";

type FormDataItem = {
  choices: { value: string; label: string }[];
};

export const formInfoInsert = async (db: ReturnType<typeof drizzle>, form: Form, questionList: Question[], formData: FormDataItem[]) => {
  try {
    // フォーム情報を挿入
    const insertResult = await db.insert(forms).values(form).returning({ id: forms.id }).execute();
    const formId = insertResult[0]?.id; // IDを取得

    if (!formId) {
      throw new Error("フォーム情報の挿入に失敗しました");
    }

    console.log("フォーム情報を挿入しました:", questionList);
    // フォームIDを各質問に設定
    const questionData = questionList.map((q) => ({
      ...q,
      formId,
      questionType: q.questionType ?? "",
    }));

    // 質問データを挿入
    const questionResults = await db.insert(questions).values(questionData).returning({ id: questions.id }).execute();
    const questionIds = questionResults.map((q) => q.id); // 複数の質問IDを取得

    if (questionIds.length === 0) {
      throw new Error("質問データの挿入に失敗しました");
    }

    // ラベルやチェックボックスの選択肢(option)を生成
    const optionData = formData
      .map((q, questionIndex) => {
        return q.choices.map((c, i) => ({
          questionId: questionIds[questionIndex], // 各質問のIDを対応させる
          optionText: c.value, // `value` を使用
          position: i,
        }));
      })
      .flat();

    // オプションデータを挿入
    await db.insert(options).values(optionData).execute();

    console.log("フォーム情報と質問データを挿入しました:", formId);
    return true;
  } catch (error) {
    console.error("DB挿入エラー:", error);
    return false;
  }
};
