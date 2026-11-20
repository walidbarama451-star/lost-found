import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export type LostReportStatus = 'OPEN' | 'CLOSED';

export interface LostReportImage {
  url: string;
  publicId: string;
  embedding?: number[];
}

export type MatchMethod = 'photo' | 'text';

export interface LostReportMatch {
  item: Types.ObjectId;
  score: number;
  method: MatchMethod;
  matchedAt: Date;
}

export interface LostReportRecord {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  images: LostReportImage[];
  status: LostReportStatus;
  matches: LostReportMatch[];
  lastSearchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<LostReportImage>(
  {
    url: { type: String, required: true, maxlength: 1000 },
    publicId: { type: String, required: true, maxlength: 500 },
    embedding: { type: [Number], default: undefined, select: false },
  },
  { _id: false },
);

const matchSchema = new Schema<LostReportMatch>(
  {
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    score: { type: Number, required: true, min: 0, max: 1 },
    method: { type: String, enum: ['photo', 'text'], required: true },
    matchedAt: { type: Date, required: true },
  },
  { _id: false },
);

const lostReportSchema = new Schema<LostReportRecord>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    images: {
      type: [imageSchema],
      required: true,
      validate: [(v: unknown[]) => v.length > 0, 'At least one photo is required'],
    },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    matches: { type: [matchSchema], default: [] },
    lastSearchedAt: { type: Date },
  },
  { timestamps: true },
);

lostReportSchema.index({ owner: 1, createdAt: -1 });
lostReportSchema.index({ 'matches.item': 1 });

export type LostReportDoc = HydratedDocument<LostReportRecord>;

export const LostReport: Model<LostReportRecord> = model('LostReport', lostReportSchema);
