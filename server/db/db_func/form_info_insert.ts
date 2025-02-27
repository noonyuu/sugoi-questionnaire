import { drizzle } from "drizzle-orm/d1";
import { Form } from "../../model/form_model";
import { forms } from "../schema";

export const formInfoInsert = async (db: ReturnType<typeof drizzle>, form: Form) => {
  try {
    await db.insert(forms).values(form).execute();
    return true;
  } catch (error) {
    console.error("DB挿入エラー:", error);
    return false;
  }
};
