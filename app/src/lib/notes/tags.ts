/** Обрізає пробіли, переводить у нижній регістр, прибирає порожні й дублікати. */
export function normalizeTags(tags: readonly string[]): string[] {
  const cleaned = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
  return [...new Set(cleaned)];
}

/** Рядок з форми "Робота, ідеї ,робота" → ['робота', 'ідеї']. */
export function parseTagList(text: string): string[] {
  return normalizeTags(text.split(','));
}