import mongoose, { Schema, Document } from 'mongoose';

export interface IMembership extends Document {
  name: string;
  description: string;
  duration: number; // in days
  cost: number; // in points
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true, min: 1 },
  cost: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true },
  companyId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

// Compound index for efficient queries
MembershipSchema.index({ companyId: 1, isActive: 1 });

export const Membership = mongoose.models.Membership || mongoose.model<IMembership>('Membership', MembershipSchema);
