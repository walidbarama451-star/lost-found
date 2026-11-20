import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export type ItemStatus = 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'CLOSED' | 'HIDDEN';

export interface ItemImage {
  url: string;
  publicId: string;
  embedding?: number[];
}

export interface ItemRecord {
  _id: Types.ObjectId;
  title: string;
  images: ItemImage[];
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
    images: {
      type: [imageSchema],
      default: [],
      validate: [(v: unknown[]) => v.length > 0, 'At least one image is required'],
    },
    status: { type: String, enum: ['ACTIVE', 'CLAIMED', 'RETURNED', 'CLOSED', 'HIDDEN'], default: 'ACTIVE' },    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    acceptedClaim: { type: Schema.Types.ObjectId, ref: 'Claim' },
    returnedAt: { type: Date },
  },
  { timestamps: true },
);

itemSchema.index({ status: 1, createdAt: -1 });
itemSchema.index({ createdBy: 1, createdAt: -1 });

export type ItemDoc = HydratedDocument<ItemRecord>;

export const Item: Model<ItemRecord> = model('Item', itemSchema);
