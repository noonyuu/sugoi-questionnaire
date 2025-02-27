import { chromium } from "playwright";

export async function scrapeForm(url: string) {
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    // 質問を取得
    const questionElements = await page.$$('[id^="QuestionId_"]');
    const questionsList = await Promise.all(
      questionElements.map(async (el) => {
        const id = await el.getAttribute("id");
        if (!id) return null;

        const nameAttribute = id.replace("QuestionId_", "");
        const text = await page.$eval(`#${id} > div:nth-child(1) > span > span:nth-child(1) > span:nth-child(2)`, (el) => el.textContent?.trim() ?? "");
        const typeElement = await page.$(`[aria-labelledby="${id} QuestionInfo_${nameAttribute}"]`);
        const type = typeElement ? (await typeElement.getAttribute("data-automation-id")) || (await typeElement.getAttribute("role")) : "";
        return { id, text, type };
      })
    );

    const filteredQuestions = questionsList.filter((q) => q !== null) as { id: string; text: string; type: string }[];

    // 選択肢を取得
    const formData = await Promise.all(
      filteredQuestions.map(async (question) => {
        const choices = await page.$$eval(`div[role="radiogroup"][aria-labelledby^="${question.id}"] input[type="radio"]`, (elements) =>
          elements.map((el) => ({
            value: (el as HTMLInputElement).value,
            label: el.getAttribute("data-automation-value") || el.getAttribute("aria-label") || (el as HTMLInputElement).value,
          }))
        );

        return { questionId: question.id, questionText: question.text, questionType: question.type, choices };
      })
    );
    
    const question = formData.map((q) => ({
      questionText: q.questionText,
      questionType: q.questionType,
      position: 0, // TODO: 並び順を取得する
      required: 0, // TODO: 必須かどうかを取得する
    }));

    await browser.close();
    return { formData, question };
  } catch (error) {
    console.error("Scraping error:", error);
    if (browser) await browser.close();
    return null;
  }
}
