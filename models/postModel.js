import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    userId: { type: String, required: true },
    desc: String,
    likes: [],
    image: String,
    status: {
      type: String,
      enum: ['published', 'scheduled'],
      default: 'published'
    },
    scheduledTime: Date,
    publishedAt: Date
  },
  {
    timestamps: true,
  }
);

const PostModel = mongoose.model("Posts", postSchema);
export default PostModel;