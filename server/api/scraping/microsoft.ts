import { Hono } from "hono";
import { chromium } from "playwright";
import { drizzle } from "drizzle-orm/d1";
import { formInfoInsert } from "../../db/db_func/form_info_insert";

import { forms } from "../../db/schema";
import { extractFormId } from "../../utils/extract-formId";

type Bindings = {
  DB: D1Database;
};

const microsoft = new Hono<{ Bindings: Bindings }>();

microsoft.post("/", async (c) => {
  let db;

  try {
    db = drizzle(c.env.DB);
  } catch (error) {
    console.error("DB error:", error);
    return c.json({ error: "Failed to connect to database" }, 500);
  }

  const { formUrl } = await c.req.json();
  // formUrlを文字列に変換する
  const url = formUrl.toString();
  const formId = extractFormId(url) ?? "";

  try {
    // dbからformIDが既に存在するか確認
    const formExists = await db.select().from(forms).where(url).execute();

    if (formExists.length > 0) {
      return c.json({ formExists });
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" }); // 完全に読み込まれるまで待つ

    // すべての質問IDを取得
    const questionElements = await page.$$('[id^="QuestionId_"]');
    const questions = [];

    for (const el of questionElements) {
      const id = await el.getAttribute("id");
      const text = await page.$eval(`#${id} > div:nth-child(1) > span > span:nth-child(1) > span:nth-child(2)`, (el) => el.textContent?.trim() ?? "");

      questions.push({ id, text });
    }

    // 各質問の選択肢を取得
    const formData = [];
    for (const question of questions) {
      const choices = await page.$$eval(`div[role="radiogroup"][aria-labelledby^="${question.id}"] input[type="radio"]`, (elements) =>
        elements.map((el) => ({
          value: (el as HTMLInputElement).value,
          label: el.getAttribute("data-automation-value") || el.getAttribute("aria-label") || (el as HTMLInputElement).value,
        }))
      );

      formData.push({
        questionId: question.id,
        questionText: question.text,
        choices,
      });
    }

    await browser.close();

    const success = await formInfoInsert(db, {
      url,
      formId,
      provider: "microsoft",
    });

    if (!success) {
      return c.json({ error: "Failed to insert form" }, 500);
    }

    return c.json({ formData });
  } catch (error) {
    console.error("Scraping error:", error);
    return c.json({ error: `Failed to scrape: ${error}` }, 500);
  }
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
