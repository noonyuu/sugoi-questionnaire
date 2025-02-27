import { sql } from "drizzle-orm/sql";
import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const forms = sqliteTable(
  "forms",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull(), // フォームのURL
    formId: text("form_id").notNull().unique(), // フォームのID
    provider: text("provider").notNull(), // formの提供元（Google / Microsoft など）
    createAt: text("create_at")
      .notNull()
      .default(sql`(datetime('now', 'localtime'))`),
  },
  (table) => [index("form_id_index").on(table.formId)]
);

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey().notNull(),
  formId: integer("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }), // フォームID
  questionText: text("question_text").notNull(), // 質問の内容
  questionType: text("question_type").notNull(), // 質問の種類（text, multiple_choice, checkbox など）
  position: integer("position").notNull(), // フォーム内の並び順
  required: integer("required").notNull().default(0), // 必須かどうか（0 = false, 1 = true）
});

export const options = sqliteTable("options", {
  id: integer("id").primaryKey().notNull(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }), // 質問ID
  optionText: text("option_text").notNull(), // 選択肢のテキスト
  position: integer("position").notNull(), // 選択肢の並び順
});
