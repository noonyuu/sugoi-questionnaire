import { Hono } from "hono";
import { chromium } from "playwright";

const google = new Hono();

google.get("/", async (c) => {
  const url = "https://docs.google.com/forms/d/e/1FAIpQLSfBR1QRKw2D_cl1RehnHe-LOMwco8CQmpqo_wekM-DRyTlwmg/viewform?usp=preview";

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" }); // DOMの読み込み完了を待機

    // 質問が含まれるセクションのベースセレクタ
    const sectionBaseSelector = "/html/body/div/div[2]/form/div[2]/div/div[2]";
    const questionBoxSelector = "Qr7Oae"; // 質問ボックスのセレクタ(class)

    // 質問ボックスの数を取得
    const questionBoxCount = await page.$$eval(`.${questionBoxSelector}`, (elements) => elements.length);

    // 質問格納用
    const questions = [];

    // 質問を取得
    for (let i = 1; i <= questionBoxCount; i++) {
      const questionXPath = `${sectionBaseSelector}/div[${i}]/div/div/div[1]/div/div[1]/span[1]`;

      // XPathを使って質問を取得
      const questionLocator = page.locator(`xpath=${questionXPath}`);

      // 要素がDOMに追加されるのを待機
      await questionLocator.waitFor({ timeout: 60000, state: "attached" });

      // 質問のテキストを取得
      const question = await questionLocator.textContent();

      // 回答欄取得
      const answerBoxXPath = `${sectionBaseSelector}/div[${i}]/div/div/div[2]`;

      // answerBoxXPathに対してlocatorを作成
      const answerLocator = page.locator(`xpath=${answerBoxXPath}`);

      // answerLocatorからラジオボタン選択肢を取得
      const choices = await answerLocator.locator('[role="radio"]').evaluateAll((elements) =>
        elements.map((el) => ({
          value: el.getAttribute("data-value") || el.getAttribute("aria-label") || "No Label",
          label: el.getAttribute("aria-label") || el.getAttribute("data-value") || "No Label",
        }))
      );

      // 質問と選択肢を格納
      questions.push({
        question,
        choices,
      });
    }

    await browser.close();

    return c.json({ questions });
  } catch (error) {
    console.error("Scraping error:", error);
    return c.json({ error: `Failed to scrape: ${error}` }, 500);
  }
});

export default google;
