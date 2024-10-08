// BACKEND ASSIGNMENT 1:
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Video from "../models/video.models.js";
import mongoose from "mongoose";
import { Like } from "../models/like.model.js";

// get the video comments:
const getVideoComments = asyncHandler(async (req, res) => {
  // Todo: Get All Comments for a video :

  // when client make the request for specific video that time i wii get that videoId:
  const { videoId } = req.params;

  const { page = 1, limit = 10 } = req.query;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found!");
  }

  const commentsAggregate = Comment.aggregate([
    // first pipline for the videoId is used to filter comments based on the video field in your comments -
    // collection, effectively retrieving only the comments related to that specific video.
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId), //matching the specific video
      },
    },
    // 2nd pipeline :
    // matching the localField & foreignField :
    {
      $lookup: {
        from: "users",
        localField: "owner", // this owner field from the comment collection
        foreignField: "_id", // this field from the user collection
        as: "owner",
      },
    },

    // Goal: The code joins the comments collection with the likes collection.
    // Match: It matches the comment's _id (from the comments collection) with the comment field in the likes collection.
    // Result: After the match, the likes related to each comment will be stored in an array called "likes" inside the comment document.
    {
      $lookup: {
        from: "likes",
        localField: "_id", // auto generated id here
        foreignField: "comment", // comment field from likes collection matching both fields
        as: "likes", // array called "likes" will come inside the comment document.
      },
    },

    // pipline for addFields:
    {
      $addFields: {
        likesCount: {
          $size: "$likes", // likes field size we will get here //
        },
        owner: {
          $first: "$owner", // from the owner array we will get first owner info
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] }, // checking req.user is liked the comment or video then its true else false
            then: true,
            else: false,
          },
        },
      },
    },

    // sorting the latest comment :
    // this pipeline for find the latest comment it will come like descending order :
    {
      $sort: {
        createdAt: -1,
      },
    },

    // pipline for selecting specific item to include inside the result or response :
    {
      $project: {
        content: 1,
        createdAt: 1,
        likesCount: 1,

        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
        isLiked: 1,
      },
    },
  ]);
  // pagination options:
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comments = await Comment.aggregatePaginate(commentsAggregate, options);
  // Paginate the comments based on the options

  // return the response:
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments fetched sucessfully!"));
});

// add comment to a video :
const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video :
  const { videoId } = req.params; // this videoId from the specific video

  const { content } = req.body;

  if (!content) {
    throw new ApiError("Content is required!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError("Video Not Found!");
  }

  const comment = await Comment.create({
    content, // this is the comment string from req.body when user commenting the video
    video: videoId, // the comment is related to the specific video //
    owner: req.user?._id, // the comment is the ID of the logged-in user making the comment
  });

  if (!comment) {
    throw new ApiError(500, "Failed to add comment please try again");
  }

  // returning the response to the client :
  return res
    .status(200)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment :

  const { commentId } = req.params; // specific comment id [ auto generated ]

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required!");
  }

  const comment = await Comment.findById(commentId);
  console.log("comment is", comment);

  if (!comment) {
    throw new ApiError(404, "Commnet Not Found!");
  }

  // req.user?._id !== req.user?._id :
  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Only comment owner can edit their comment!");
  }

  // updating the comment:
  const updatedComment = await Comment.findByIdAndUpdate(
    comment.user?._id,
    {
      $set: {
        content,
      },
    },
    {
      new: true, // replaced the original comment
    }
  );

  if (!updatedComment) {
    throw new ApiError(500, "failed to edit the comment please try again!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "Commnet is updated successfully!")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: DELETE a comment :
  const { commentId } = req.params; // specific comment deleting

  const comment = await Comment.findById(commentId); // this comment have content videoId & owner

  if (!comment) {
    throw new ApiError(404, "comment not found!");
  }

  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only comment owner can delete their comment!");
  }

  // deleting the comment id document:
  await Comment.findByIdAndDelete(commentId);

  await Like.deleteMany({
    comment: commentId,
    likedBy: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "comment deleted sucessfully!"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
