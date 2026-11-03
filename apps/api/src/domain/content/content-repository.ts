export const CONTENT_ENTITIES = ['profiles', 'social_links', 'skills', 'experiences', 'blogs', 'inbox_messages'] as const;
export type ContentEntity = typeof CONTENT_ENTITIES[number];
export type ContentRecord = Record<string, unknown>;

export interface ContentRepository {
  list(entity: ContentEntity, options?: { publishedOnly?: boolean }): Promise<ContentRecord[]>;
  find(entity: ContentEntity, id: number, options?: { publishedOnly?: boolean }): Promise<ContentRecord | null>;
  create(entity: ContentEntity, input: ContentRecord): Promise<ContentRecord>;
  update(entity: ContentEntity, id: number, input: ContentRecord): Promise<ContentRecord | null>;
  delete(entity: ContentEntity, id: number): Promise<boolean>;
}
