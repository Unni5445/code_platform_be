import mongoose, { Document, Schema } from "mongoose";

export interface ISubscriptionTier extends Document {
  name: string; // "NONE" | "BASIC" | "PREMIUM"
  level: number; // 0 | 1 | 2
  price: number; // e.g. 0, 299, 599
  currency: string; // "INR"
  features: string[]; // ["courses"], ["courses", "interviews"]
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionTierSchema = new Schema<ISubscriptionTier>(
  {
    name: { type: String, required: true, unique: true, uppercase: true, trim: true },
    level: { type: Number, required: true, unique: true },
    price: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "INR" },
    features: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SubscriptionTier = mongoose.model<ISubscriptionTier>("SubscriptionTier", subscriptionTierSchema);
export default SubscriptionTier;
