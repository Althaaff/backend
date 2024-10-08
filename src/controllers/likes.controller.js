import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Like } from "../models/like.model";
import { ApiResponse } from "../utils/ApiResponse";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Inavlid videoId!");
  }

  const likedAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    // return the response :
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  // return the response :
  return res.status(200).json(
    new ApiResponse(200, {
      isLiked: true,
    })
  );
});

// toggle comment like :
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // user id already liked the comment :
  const likedAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id, // logged in user is liked the comment
  });

  // delete likes :
  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  // if user is liked then create database document:
  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  // retrun the response:
  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

// toggle tweet like:
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Inavlid TweetId!");
  }

  const likedAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  // if user is liked then delete the tweet :
  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  // user is liked the tweet :
  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

// getLikedVideos :
const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideosAggegate = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",

        // nested pipeline for video owner details :
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },

          {
            $unwind: "$ownerDetails", // example code in Readme.md file //
          },
        ],
      },
    },

    {
      $unwind: "$likedVideo", // separate object will create for liked videos
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $project: {
        _id: 0,
        likedVideo: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          owner: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullName: 1,
            "avatar.url": 1,
          },
        },
      },
    },
  ]);

  // return the response :
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideosAggegate,
        "liked videos fetched successfully"
      )
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
