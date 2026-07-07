import mongoose, { Document, Schema } from "mongoose";

export interface ISubscription extends Document {
  student: mongoose.Types.ObjectId;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  tier: mongoose.Types.ObjectId; // Reference to SubscriptionTier
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "EXPIRED"], default: "INACTIVE" },
    tier: { type: Schema.Types.ObjectId, ref: "SubscriptionTier", required: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema);
export default Subscription;
