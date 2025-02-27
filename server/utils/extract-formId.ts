export function extractFormId(url: string) {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
}
