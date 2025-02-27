export const extractFormId = (url: string): string | null => {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
}