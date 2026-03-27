import mongoose, { Document, Schema } from "mongoose";

/** Organisation Interface */
export interface IOrganisation extends Document {
  name: string; // organization name
  address?: string;
  admin?: mongoose.Types.ObjectId; // reference to User with role ADMIN
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

/** Organisation Schema */
const organisationSchema = new Schema<IOrganisation>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, trim: true },
    admin: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Organisation = mongoose.model<IOrganisation>("Organisation", organisationSchema);
export default Organisation;