import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export const ITEM_CATEGORIES = [
  'ELECTRONICS',
  'DOCUMENTS',
  'KEYS',
  'BAGS',
  'ACCESSORIES',
  'CLOTHING',
  'JEWELRY',
  'PETS',
  'OTHER',
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export type ItemStatus = 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'CLOSED' | 'HIDDEN';

export interface ItemImage {
  url: string;
  publicId: string;
  /** CLIP-style vector; absent when the embedding service was unavailable. */
  embedding?: number[];
}

export interface ItemRecord {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: ItemCategory;
  images: ItemImage[];
  dateFound: Date;
  status: ItemStatus;
  createdBy: Types.ObjectId;
  acceptedClaim?: Types.ObjectId;
  returnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<ItemImage>(
  {
    url: { type: String, required: true, maxlength: 1000 },
    publicId: { type: String, required: true, maxlength: 500 },
    embedding: { type: [Number], default: undefined, select: false },
  },
  { _id: false },
);

const itemSchema = new Schema<ItemRecord>(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    category: { type: String, required: true, enum: ITEM_CATEGORIES },
    images: {
      type: [imageSchema],
      default: [],
      validate: [(v: unknown[]) => v.length > 0, 'At least one image is required'],
    },
    dateFound: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'CLAIMED', 'RETURNED', 'CLOSED', 'HIDDEN'], default: 'ACTIVE' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    acceptedClaim: { type: Schema.Types.ObjectId, ref: 'Claim' },
    returnedAt: { type: Date },
  },
  { timestamps: true },
);

itemSchema.index({ status: 1, createdAt: -1 });
itemSchema.index({ category: 1, status: 1, createdAt: -1 });
itemSchema.index({ createdBy: 1, createdAt: -1 });
itemSchema.index({ dateFound: -1 });

export type ItemDoc = HydratedDocument<ItemRecord>;

export const Item: Model<ItemRecord> = model('Item', itemSchema);
