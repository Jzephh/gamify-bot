import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  companyId: string;
  username: string;
  name: string;
  avatarUrl: string;
  points: number;
  freetimeStartDate?: Date;
  freetimeEndDate?: Date;
  lastImageMessage: Date;
  roles: string[];
  stats: Record<string, unknown>;
  membershipStatus: 'none' | 'pending' | 'approved' | 'rejected';
  membershipRequestDate?: Date;
  requestedMembershipId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  username: { type: String, default: '' },
  name: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  points: { type: Number, default: 0 },
  freetimeStartDate: { type: Date, default: null },
  freetimeEndDate: { type: Date, default: null },
  lastImageMessage: { type: Date, default: null },
  roles: { type: [String], default: [] },
  stats: { type: Schema.Types.Mixed, default: {} },
  membershipStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  membershipRequestDate: { type: Date, default: null },
  requestedMembershipId: { type: String, default: null },
}, {
  timestamps: true,
});

// Compound index for efficient queries
UserSchema.index({ userId: 1, companyId: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);