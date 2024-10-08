import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    thumbnail: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregatePaginate);
// above plugin this mongooseAggregatePaginate means ?
// bfore we should define option variable store how much video once u want in your page like that
// --> The line videoSchema.plugin(mongooseAggregatePaginate) adds pagination to the Video model, allowing you to fetch small chunks of data instead of all the data at once. This makes your app faster and more efficient,
//just like how YouTube only loads a few videos at a time when you browse the platform.

export const Video = mongoose.model("Video", videoSchema);
