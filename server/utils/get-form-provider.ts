export const getFormProvider = (url: string): string | null => {
  if (url.includes("forms.office.com")) {
    return "microsoft";
  } else if (url.includes("docs.google.com/forms")) {
    return "google";
  }
  return "not provider"; // 未対応のURL
};
