import type { ContentEntity, ContentRecord, ContentRepository } from '../../domain/content/content-repository';

export class ContentService {
  constructor(private readonly repository: ContentRepository) {}
  list(entity: ContentEntity, options?: { publishedOnly?: boolean }) { return this.repository.list(entity, options); }
  find(entity: ContentEntity, id: number, options?: { publishedOnly?: boolean }) { return this.repository.find(entity, id, options); }
  create(entity: ContentEntity, input: ContentRecord) { return this.repository.create(entity, input); }
  update(entity: ContentEntity, id: number, input: ContentRecord) { return this.repository.update(entity, id, input); }
  delete(entity: ContentEntity, id: number) { return this.repository.delete(entity, id); }
}
