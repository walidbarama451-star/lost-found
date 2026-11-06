import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface UserRecord {
  _id: Types.ObjectId;
  username: string;
  email: string;
  /** Never returned by any API response. */
  passwordHash: string;
  phone?: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserRecord>(
  {
    username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, maxlength: 30 },
    avatarUrl: { type: String, trim: true, maxlength: 500 },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  },
  { timestamps: true },
);

export type UserDoc = HydratedDocument<UserRecord>;

/** Public-safe projection of the user collection. */
export interface SafeUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: Date;
}

/** Maps a user document to the shape allowed in API responses. */
export function toSafeUser(user: UserDoc): SafeUser {
  const safe: SafeUser = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
  if (user.phone) safe.phone = user.phone;
  if (user.avatarUrl) safe.avatarUrl = user.avatarUrl;
  return safe;
}

export const User: Model<UserRecord> = model('User', userSchema);
