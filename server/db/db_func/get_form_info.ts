import { asc, eq, sql } from "drizzle-orm";
import { forms, options, questions } from "../schema";
import { DrizzleD1Database } from "drizzle-orm/d1";

export async function getFormInfo(db: DrizzleD1Database, url: string) {
  return db
    .select({
      question: questions.questionText,
      questionType: questions.questionType,
      options: sql<string>`JSON_GROUP_ARRAY(${options.optionText} ORDER BY ${options.id} ASC)`.as("options"),
    })
    .from(forms)
    .leftJoin(questions, eq(forms.id, questions.formId))
    .leftJoin(options, eq(questions.id, options.questionId))
    .where(eq(forms.formId, url))
    .groupBy(questions.id)
    .orderBy(asc(questions.id))
    .execute();
}
