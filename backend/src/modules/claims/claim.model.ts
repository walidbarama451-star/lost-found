import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export type ClaimStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface ClaimRecord {
  _id: Types.ObjectId;
  item: Types.ObjectId;
  claimant: Types.ObjectId;
  message: string;
  status: ClaimStatus;
  decisionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const claimSchema = new Schema<ClaimRecord>(
  {
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    claimant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'], default: 'PENDING' },
    decisionAt: { type: Date },
  },
  { timestamps: true },
);

claimSchema.index({ claimant: 1, createdAt: -1 });
claimSchema.index({ item: 1, createdAt: -1 });
claimSchema.index({ item: 1, claimant: 1 }, { unique: true, partialFilterExpression: { status: 'PENDING' } });

export type ClaimDoc = HydratedDocument<ClaimRecord>;

export const Claim: Model<ClaimRecord> = model('Claim', claimSchema);
