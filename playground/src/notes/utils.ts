import type { NoteStatus } from './types';

export function filterByTag<T extends { tags: readonly string[] }>(items: readonly T[], tag: string): T[] {
    const wanted = tag.trim().toLowerCase();
    return items.filter((item) => item.tags.includes(wanted));
}

export type SortOrder = 'asc' | 'desc';

export function sortByUpdated<T extends { updatedAt: string }>(items: readonly T[], order: SortOrder = 'desc'): T[] {
    const direction = order === 'desc' ? -1 : 1;
    return items.toSorted((a, b) => direction * (Date.parse(a.updatedAt) - Date.parse(b.updatedAt)));
}

export function groupByStatus<T extends { status: NoteStatus }>(items: readonly T[]): Record<NoteStatus, T[]> {
    return items.reduce<Record<NoteStatus, T[]>>( (groups, item) => { groups[item.status].push(item);
        return groups;
    },
      { draft: [], published: [], archived: [] },
    );
}
