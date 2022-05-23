import { CollectionEntity } from './collection.entity';

export interface CollectionRO {
  collection: CollectionEntity;
}

export interface CollectionsRO {
  collections: CollectionEntity[];
  collectionsCount: number;
}
