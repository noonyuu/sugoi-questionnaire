import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { getFormInfo } from "server/db/db_func/get_form_info";
import { formInfoInsert } from "server/db/db_func/insert_form_info";
import { extractFormId } from "server/utils/extract-formId";
import { getFormProvider } from "~/utils/get-form-provider";

type Bindings = {
  DB: D1Database;
};

type ScrapedData = {
  formData: {
    questionId: string;
    questionText: string;
    questionType: string;
    choices: {
      value: string;
      label: string;
    }[];
  }[];
  question: {
    questionText: string;
    questionType: string;
    position: number;
    required: number;
  }[];
} | null;

const google = new Hono<{ Bindings: Bindings }>();

google.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const { formUrl } = await c.req.json();
  const url = formUrl.toString(); // formUrlを文字列に変換する
  // すでにDBに登録済みのフォームを取得
  // TODO: ここめちゃくちゃ
  const formExists = await getFormInfo(db, url);
  if (formExists.length > 0) {
    return c.json({ formExists });
  }

  // スクレイピングサーバーにリクエストを送信
  const scrapedDataResponse = await fetch(`https://sugoi-scraping.noonyuu.com/${getFormProvider(url)}`,  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formUrl }),
  });
  if (!scrapedDataResponse.ok) {
    return c.json({ error: "Failed to scrape form" }, 500);
  }

  const scrapedData: ScrapedData = await scrapedDataResponse.json();

  if (!scrapedData) {
    return c.json({ error: "No data received from scraper" }, 500);
  }

  const { formData, question } = scrapedData;
  console.log("formData", formData);
  console.log("question", question);
  const success = await formInfoInsert(db, { url, formId: extractFormId(url)!, provider: "google" }, question, formData);

  if (!success) {
    return c.json({ error: "Failed to insert form" }, 500);
  }

  // 挿入後のデータを再取得
  const updatedFormInfo = await getFormInfo(db, extractFormId(url)!);
  return updatedFormInfo.length > 0 ? c.json({ formExists: updatedFormInfo }) : c.json({ error: "Failed to retrieve form data" }, 500);
});

export default google;
