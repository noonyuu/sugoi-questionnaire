import { Hono } from "hono";
import { chromium } from "playwright";
import { drizzle } from "drizzle-orm/d1";

import { formInfoInsert } from "../../db/db_func/insert_form_info";
import { extractFormId } from "../../utils/extract-formId";
import { getFormProvider } from "../../utils/get-form-provider";
import { getFormInfo } from "../../db/db_func/get_form_info";
import { scrapeForm } from "../../func/scrape_microsoft";

type Bindings = {
  DB: D1Database;
};

const microsoft = new Hono<{ Bindings: Bindings }>();

microsoft.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const { formUrl } = await c.req.json();
  const url = formUrl.toString(); // formUrlを文字列に変換する
  const formId = extractFormId(url) ?? "";

  // すでにDBに登録済みのフォームを取得
  const formExists = await getFormInfo(db, formId);
  if (formExists.length > 0) {
    return c.json({ formExists });
  }

  // フォームをスクレイピング
  const scrapedData = await scrapeForm(url);
  if (!scrapedData) {
    return c.json({ error: "Failed to scrape form" }, 500);
  }

  const { formData, question } = scrapedData;
  const success = await formInfoInsert(db, { url, formId, provider: getFormProvider(url) }, question, formData);

  if (!success) {
    return c.json({ error: "Failed to insert form" }, 500);
  }

  // 挿入後のデータを再取得
  const updatedFormInfo = await getFormInfo(db, formId);
  return updatedFormInfo.length > 0 ? c.json({ formExists: updatedFormInfo }) : c.json({ error: "Failed to retrieve form data" }, 500);
});

microsoft.post("/submit", async (c) => {
  const url = "https://forms.office.com/Pages/ResponsePage.aspx?id=qi6vVm7-f0exyJc-kX5OjnJLEew38VVPgTeJag_8BbFUOURCVldTQktGUkNUREo5NDRVOEFLTzFQMy4u";

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    const formData = [
      {
        questionId: "QuestionId_r6d7b82a6bb054e39881ac13bdcd7cca0", // 完全なIDを使用
        answerValue: "ラジオ1",
      },
      {
        questionId: "QuestionId_r7450d27a25164a8398876b7e17c7b5ea", // 単一行テキスト
        answerValue: "はっはー",
      },
      {
        questionId: "QuestionId_r580000ecd54a49a6895b7a29103df5d7", // テキストエリア
        answerValue: "フッフー",
      },
    ];

    for (const response of formData) {
      const nameAttribute = response.questionId.replace("QuestionId_", ""); // name属性用にQuestionId_を削除

      // ラジオボタンの場合
      if (response.answerValue.startsWith("ラジオ")) {
        const radioButtonSelector = `input[name="${nameAttribute}"][value="${response.answerValue}"]`;

        await page.waitForSelector(radioButtonSelector, { timeout: 10000 });
        await page.click(radioButtonSelector);
      }

      // テキスト入力（単一行）の場合
      else if (response.answerValue && typeof response.answerValue === "string") {
        const textSelector = `input[aria-labelledby="${response.questionId} QuestionInfo_${nameAttribute}"], textarea[name="${response.questionId}"]`;
        await page.waitForSelector(textSelector, { timeout: 10000 });
        await page.fill(textSelector, response.answerValue);
      }
    }

    // 送信ボタンの存在確認
    const submitButtonSelector = '[data-automation-id="submitButton"]';
    await page.waitForSelector(submitButtonSelector, { timeout: 30000 });

    // 送信ボタンをクリック
    await page.click(submitButtonSelector);

    // 送信後に表示される要素が表示されるのを待つ
    const successMessageSelector = "#form-main-content1 > div > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > span";
    await page.waitForSelector(successMessageSelector, { timeout: 30000 });

    console.log("Form successfully submitted");

    await browser.close();

    return c.json({ success: true });
  } catch (error) {
    console.error("Submission error:", error);
    return c.json({ error: `Failed to submit: ${error}` }, 500);
  }
});

export default microsoft;
