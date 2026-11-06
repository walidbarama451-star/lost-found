import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export type NotificationType = 'CLAIM_SUBMITTED' | 'CLAIM_ACCEPTED' | 'CLAIM_REJECTED' | 'ITEM_RETURNED';

export interface NotificationRecord {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedItem?: Types.ObjectId;
  relatedClaim?: Types.ObjectId;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationRecord>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['CLAIM_SUBMITTED', 'CLAIM_ACCEPTED', 'CLAIM_REJECTED', 'ITEM_RETURNED'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    relatedItem: { type: Schema.Types.ObjectId, ref: 'Item' },
    relatedClaim: { type: Schema.Types.ObjectId, ref: 'Claim' },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1 });

export type NotificationDoc = HydratedDocument<NotificationRecord>;

export const Notification: Model<NotificationRecord> = model('Notification', notificationSchema);
