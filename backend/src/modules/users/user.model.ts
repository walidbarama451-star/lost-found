import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface UserRecord {
  _id: Types.ObjectId;
  username: string;
  discordUsername?: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserRecord>(
  {
    username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30 },
    discordUsername: { type: String, trim: true, minlength: 2, maxlength: 32 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, maxlength: 30 },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  },
  { timestamps: true },
);

export type UserDoc = HydratedDocument<UserRecord>;

export interface SafeUser {
  id: string;
  username: string;
  discordUsername?: string;
  email: string;
  phone?: string;
  createdAt: Date;
}

export type SafeUserSource = Pick<
  UserRecord,
  'username' | 'email' | 'createdAt'
> & {
  _id: Types.ObjectId | string;
  discordUsername?: string;
  phone?: string;
};

export function toSafeUser(user: SafeUserSource): SafeUser {
  const safe: SafeUser = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
  if (user.discordUsername) safe.discordUsername = user.discordUsername;
  if (user.phone) safe.phone = user.phone;
  return safe;
}

export interface PublicUser {
  id: string;
  username: string;
  discordUsername?: string;
  createdAt: Date;
}

export type PublicUserSource = Pick<UserRecord, 'username' | 'createdAt'> & {
  _id: Types.ObjectId | string;
  discordUsername?: string;
};

export function toPublicUser(user: PublicUserSource): PublicUser {
  const pub: PublicUser = {
    id: user._id.toString(),
    username: user.username,
    createdAt: user.createdAt,
  };
  if (user.discordUsername) pub.discordUsername = user.discordUsername;
  return pub;
}

export const User: Model<UserRecord> = model('User', userSchema);
