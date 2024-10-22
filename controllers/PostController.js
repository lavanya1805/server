// controllers/PostController.js
import PostModel from "../models/postModel.js";
import mongoose from "mongoose";
import schedule from "node-schedule";

// Create a Post
export const createPost = async (req, res) => {
  const newPost = new PostModel(req.body);

  try {
    if (newPost.scheduledTime && newPost.status === 'scheduled') {
      const savedPost = await newPost.save();

      schedule.scheduleJob(new Date(newPost.scheduledTime), async () => {
        try {
          await PostModel.findByIdAndUpdate(savedPost._id, {
            status: 'published',
            publishedAt: new Date()
          });
          console.log(`Post ${savedPost._id} published successfully at scheduled time`);
        } catch (error) {
          console.error(`Error publishing scheduled post ${savedPost._id}:`, error);
        }
      });

      res.status(200).json({ 
        ...savedPost._doc, 
        message: "Post scheduled successfully" 
      });
    } else {
      newPost.status = 'published';
      newPost.publishedAt = new Date();
      const savedPost = await newPost.save();
      res.status(200).json(savedPost);
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// Get a Post
export const getPost = async (req, res) => {
  const id = req.params.id;

  try {
    const post = await PostModel.findById(id);
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json(error);
  }
};

// Update Post
export const updatePost = async (req, res) => {
  const postId = req.params.id;
  const { userId } = req.body;

  try {
    const post = await PostModel.findById(postId);
    if (post.userId === userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json("Post updated");
    } else {
      res.status(403).json("Action forbidden");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// Delete Post
export const deletePost = async (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;

  try {
    const post = await PostModel.findById(id);
    if (post.userId === userId) {
      await post.deleteOne();
      res.status(200).json("Post deleted successfully");
    } else {
      res.status(403).json("Action forbidden");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// Like/Dislike Post
export const likePost = async (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;

  try {
    const post = await PostModel.findById(id);
    if (!post.likes.includes(userId)) {
      await post.updateOne({ $push: { likes: userId } });
      res.status(200).json("Post liked");
    } else {
      await post.updateOne({ $pull: { likes: userId } });
      res.status(200).json("Post unliked");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// Get Timeline Posts
export const getTimelinePosts = async (req, res) => {
  const userId = req.params.id;

  try {
    const currentUserPosts = await PostModel.find({ 
      userId: userId,
      $or: [
        { status: 'published' },
        { status: { $exists: false } }
      ]
    });

    const followingPosts = await UserModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "following",
          foreignField: "userId",
          as: "followingPosts",
        },
      },
      {
        $project: {
          followingPosts: 1,
          _id: 0,
        },
      },
    ]);

    const allPosts = currentUserPosts
      .concat(...followingPosts[0].followingPosts)
      .filter(post => post.status !== 'scheduled')
      .sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json(allPosts);
  } catch (error) {
    res.status(500).json(error);
  }
};

// Get Scheduled Posts
export const getScheduledPosts = async (req, res) => {
  const userId = req.params.id;
  
  try {
    const scheduledPosts = await PostModel.find({
      userId: userId,
      status: 'scheduled',
      scheduledTime: { $gt: new Date() }
    }).sort({ scheduledTime: 1 });

    res.status(200).json(scheduledPosts);
  } catch (error) {
    res.status(500).json(error);
  }
};

export default {
  createPost,
  getPost,
  updatePost,
  deletePost,
  likePost,
  getTimelinePosts,
  getScheduledPosts
};