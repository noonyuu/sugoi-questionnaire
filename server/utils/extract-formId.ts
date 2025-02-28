import { getFormProvider } from "~/utils/get-form-provider";

export const extractFormId = (url: string): string | null => {
  if (getFormProvider(url) === "google") {
    const match = url.match(/\/e\/([a-zA-Z0-9_-]+)\//);
    return match ? match[1] : null;
  } else if (getFormProvider(url) === "microsoft") {
    const match = url.match(/[?&]id=([^&]+)/);
    return match ? match[1] : null;
  }
  return null;
};
