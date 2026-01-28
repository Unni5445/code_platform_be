import mongoose, { Schema, Document } from "mongoose";

export interface IOrganisation extends Document {
  name: string;
  address?: string;
  type : "COLLEGE" | "ORGANISATION";
  admins: mongoose.Types.ObjectId[];
  isDeleted : boolean;
}

const organisationSchema = new Schema<IOrganisation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum : ["COLLEGE" , "ORGANISATION"],
      default : "ORGANISATION"
    },

    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeleted : {
      type: Boolean,
      default : false
    }
  },
  { timestamps: true }
);

const Organisation = mongoose.model<IOrganisation>(
  "Organisation",
  organisationSchema
);

export default Organisation;
