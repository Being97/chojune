/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/notion_utils.ts

/**
 * Notion의 Title과 Rich Text 속성에서 순수 텍스트만 추출
 */
export const getText = (prop: any): string => {
  if (!prop) return "";
  const richText = prop.title || prop.rich_text;
  if (!Array.isArray(richText)) return "";
  return richText.map((t: any) => t.plain_text).join("");
};

/**
 * Files 속성에서 URL을 추출하여 개수에 따라 string 또는 string[]으로 반환
 */
export const getFiles = (prop: any): string | string[] | null => {
  const files = prop?.files;
  if (!Array.isArray(files) || files.length === 0) return null;

  const urls = files.map((item: any) => {
    return item.type === "file" ? (item.file?.url ?? "") : (item.external?.url ?? "");
  }).filter(Boolean);

  if (urls.length === 0) return null;
  // 하나면 문자열, 여러 개면 배열 반환
  return urls.length === 1 ? urls[0] : urls;
};