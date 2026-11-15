import { describe, it, expect } from 'vitest';
import { normalizeTags, parseTagList } from '$lib/notes/tags';

describe('normalizeTags', () => {
  it('merges tags that differ only by case and spaces', () => {
    expect(normalizeTags(['Work', 'work', ' WORK '])).toEqual(['work']);
  });

  it('drops empty tags', () => {
    expect(normalizeTags(['', '  ', 'ideas'])).toEqual(['ideas']);
  });
});

describe('parseTagList', () => {
  it('splits a comma separated string', () => {
    expect(parseTagList(' Робота, ідеї ,робота')).toEqual(['робота', 'ідеї']);
  });
});