import { Video } from "../models/video.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

// get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  // console.log("userId :", userId);

  const pipeLine = [];
  // for using Full Text based search u need to create a search index in mongoDB atlas
  // you can include field mapppings in search index eg.title, description, as well
  // Field mappings specify which fields within your documents should be indexed for text search.
  // this helps in seraching only in title, desc providing faster search results
  // here the name of search index is 'search-videos'

  if (query) {
    pipeLine.push({
      $search: {
        index: "search-videos",

        text: {
          query: query,
          path: ["title", "description"], // u can search only video title or description
        },
      },
    });
  }

  // checking user id is valid Object Id or not :
  if (userId) {
    console.log("valid user id: ", userId);
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid User Object Id!");
    }

    // matching user Id & owner Object Id:
    pipeLine.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId), // it matches if userId is true
      },
    });
  }

  // fetch the videos only that are set isPublished as true :
  // In simple terms, it's saying: "Only include documents (e.g., videos)
  // -that are published."
  pipeLine.push({
    $match: {
      isPublished: true,
    },
  });

  //sortBy can be views, createdAt, duration :
  //sortType can be ascending(-1) or descending(1) :

  if (sortBy && sortType) {
    pipeLine.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1, //sortBy is from client request//
      },
    });
  } else {
    pipeLine.push({
      $sort: { createdAt: -1 }, // newest will come first
    });
  }

  pipeLine.push(
    {
      $lookup: {
        from: "users",
        localField: "owner", // owner field from the Video collection
        foreignField: "_id", // this field from the users collection
        as: "ownerDetails",

        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails", // deconstruct the ownerDetails array also creating the separate doc
      // including id and title & owner ownerDetails object relationship with the Video //
    }
  );

  const videoAggregate = Video.aggregate(pipeLine);
  // options for paginate :
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(videoAggregate, options);

  // finally returning the response:
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos fetched successfully!"));
});

// get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields are required!");
  }

  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Videofile localpath is required!");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail localpath is required!");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "video file is not found!");
  }

  if (!thumbnail) {
    throw new ApiError(400, "thumbnail is not found!");
  }

  const video = await Video.create({
    title,
    description,
    duration: videoFile.duration,

    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id, // uploaded videos unique `ID`
    },
    thumbnail: {
      url: thumbnail.url,
      public_id: thumbnail.public_id,
    },
    owner: req.user?._id,
    isPublished: true, // when u testing in postman getAllVideos in get request that time it should be true othervise docs will be empty //
  });

  const videoUploaded = await Video.findById(video._id); // video uploaded document

  if (!videoUploaded) {
    throw new ApiError(500, "video uploaded failed please try again!");
  }

  // finally return th response:
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video is uploaded successfully!"));
});

// get video by the id :
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // let userId = req.body;
  // userId = new mongoose.Types.ObjectId(userId);

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id!");
  }

  if (!isValidObjectId(req.user?._id)) {
    throw new ApiError(400, "Inavlid userId!");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId), // specific video to match //
      },
    },
    {
      $lookup: {
        from: "likes", // likes collection
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",

        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id", // id from the users collection //
              foreignField: "channel", // the channel being subscribed to
              as: "subscribers",
            },
          },
          // add fields pipeline:
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              "avatar.url": 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },

    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },

    // finally projected or selected field to include in the response :
    {
      $project: {
        "videoFile.url": 1,
        "thumbnail.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  console.log("video is:", video);

  if (!video) {
    throw new ApiError(500, "failed to fetch the video!");
  }

  // increment views if video fetched successfully:
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  // if login user watched the videoId's video then this below code will work:
  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  // finally return the response:
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully!"));
});

// update video details like title, description, thumbnail:
const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // access the specific videoId :
  const { videoId } = req.params;

  if (!(title && description)) {
    throw new ApiError(400, "title and description required!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Inavlid video Id!");
  }

  // find the video document by their Id:
  const video = await Video.findById(videoId);
  // console.log("video docs :", video);

  // if video is not found! throw error :
  if (!video) {
    throw new ApiError(404, "Video is Not Found!");
  }
  if (video.owner?.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't edit this video as you are not the owner"
    );
  }
  // thumbnail :
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  const thumbnailDelete = video.thumbnail?.public_id;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is required!");
  }
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path; // Accessing the uploaded videoFile
  const videoFileDelete = video.videoFile?.public_id;
  // client Error ( 400 ):
  if (!videoFileLocalPath) {
    throw new ApiError(400, "video file is required!");
  }

  // upload to cloudinary :
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  console.log("video file :", videoFile);
  console.log("thumbnail :", thumbnail);

  if (!thumbnail) {
    throw new ApiError(404, "thumbnail is not found!");
  }

  if (!videoFile) {
    throw new ApiError(404, "video file not found!");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,

    {
      $set: {
        title,
        description,
        thumbnail: {
          public_id: thumbnail.public_id,
          url: thumbnail.url,
        },
        videoFile: {
          public_id: videoFile.public_id,
          url: videoFile.url,
        },
      },
    },
    {
      new: true,
      select: {
        title: 1,
        description: 1,
        "thumbnail.public_id": 1,
        "thumbnail.url": 1,
        "videoFile.public_id": 1,
        "videoFile.url": 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    }
  );

  console.log("Video updated :", updatedVideo);

  if (!updatedVideo) {
    throw new ApiError(500, "fail to update a video please try again!");
  }

  // if successfully files updated then delete the old one from the cloudinary:
  if (updatedVideo) {
    await deleteOnCloudinary(thumbnailDelete);
  }

  if (updatedVideo) {
    await deleteOnCloudinary(videoFileDelete);
  }

  // finally return the response:
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video updated successfully!"));
});

// delete the video :

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner?.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't delete this video as you are not the owner"
    );
  }

  await Video.findByIdAndDelete(video?._id);

  await deleteOnCloudinary(video.thumbnail.public_id);
  await deleteOnCloudinary(video.videoFile.public_id, "video");

  await Like.deleteMany({ video: videoId });
  await Comment.deleteMany({ video: videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// toggle publish status of a video :
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Inavlid videoId!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Not Video Found!");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't toogle publish status as you are not the owner!"
    );
  }

  const toggledVideoPublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );

  if (!toggledVideoPublish) {
    throw new ApiError(500, "Failed to toggle video publish status");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toggledVideoPublish.isPublished,
        "Video publish  toggled successfully!"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
