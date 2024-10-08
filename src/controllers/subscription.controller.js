import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse";

const toggleSubScription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  console.log("channel Id: ", channelId);

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Inavlid channel Id!");
  }

  const isSubScribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channelId: channelId,
  });

  // if logged in user is subscribed to another channel (channelId) -
  // then also u can unsubscribe the channe (channelId)
  if (isSubScribed) {
    await Subscription.findByIdAndDelete(isSubScribed._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribed: false },
          "Unsubscribed successfully!"
        )
      );
  }

  // if user is subscribed the channel :
  await Subscription.create({
    subscriber: req.user?._id,
    channelId: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribed: true }, "Subscribed successfully!")
    );
});

// controller to return subscriber list of a channel :
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  channelId = new mongoose.Types.ObjectId(channelId);

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: channelId,
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",

        // nested pipeline:
        pipeline: [
          {
            $lookup: {
              from: "subscription",
              localField: "_id",
              foreignField: "channel",
              as: "subscribedToSubscriber",
            },
          },

          {
            $addFields: {
              subscribedToSubscriber: {
                $cond: {
                  if: {
                    in: [channelId, "$subscribedToSubscriber.subscriber"], // the specific channel (channelId) subscriber is subscribed then true //
                  },
                  then: true,
                  else: false,
                },
              },
              subscribersCount: {
                $size: "$subscribedToSubscriber",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },

    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          username: 1,
          fullName: 1,
          "avatar.url": 1,
          subscribedToSubscriber: 1, // Boolean indicating if the current user is subscribed ?
          subscribersCount: 1,
        },
      },
    },
  ]);
  console.log("subscriber :", subscribers);

  // return the response:
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "subscribers fetched successfully!")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscribedChannels = await Subscription.aggregate([
    // subscribed channels
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",

        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
            },
          },

          {
            $addFields: {
              latestVideo: {
                $last: "$videos",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscribedChannel",
    },

    {
      $project: {
        _id: 0,
        subscribedChannel: {
          _id: 1,
          username: 1,
          fullName: 1,
          "avatar.url": 1,
          latestVideo: {
            _id: 1,
            "videoFile.url": 1,
            "thumbnail.url": 1,
            owner: 1,
            title: 1,
            description: 1,
            duration: 1,
            createdAt: 1,
            views: 1,
          },
        },
      },
    },
  ]);

  // return the reponse :
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully!"
      )
    );
});

export { toggleSubScription, getUserChannelSubscribers, getSubscribedChannels };
