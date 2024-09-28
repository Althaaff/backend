import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// registering the user:
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend :
  // validation not-empty :
  // check if user is already exists:
  // check for images, check for avatar :
  // upload them to cloudinary, check the avatar:
  // create user object - create entry in DB :
  // remove password and refresh token field from response :
  // check for user creation:
  // return response:
  const { fullName, email, username, password } = req.body;
  console.log("request body: ", req.body);
  console.log("email: ", email);

  // if (fullName === "") {
  //   throw new ApiError(400, "full name is required!");
  // } /* u can use this above code also */

  if (
    [fullName, username, password, email].some((field) => field?.trim() === "") // here some means any one statement is true then it will move forward //
  ) {
    throw new ApiError(400, "All fields are required!");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("existed user is :", existedUser);
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists!");
  }
  const avatarLoacalPath = req.files?.avatar[0]?.path;
  console.log("avatar,s local path is", avatarLoacalPath);

  if (!avatarLoacalPath) {
    throw new ApiError(400, "Avatar file is required!");
  }

  // const coverImageLocalPath = req.files?.coverimage[0]?.path;
  // this code coverImage handeling is commented bcoz
  // if user don't need upload cover image then above line of code will provide error //

  // Here This code is handled if user not uploaded cover image (above bug fixed) :
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
    console.log("coverimage's localPath is : ", coverImageLocalPath);
  }
  console.log("files :", req.files);

  const avatar = await uploadOnCloudinary(avatarLoacalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required!!");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  console.log("user:", user); // here password will come.

  const createdUser = await User.findById(user._id).select(
    // if user is created then hide that user password and refresh token //
    "-password -refreshToken" // here password is not will come bcz of this line of code
    // password is sensitive //
  );
  console.log("user is created Here :", createdUser);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Sucessfully!"));
});

const generateAccessAndRefereshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken; // user.refereshToken means database document refresh token's to this refresh token assignes //
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong While generating access token!"
    );
  }
};

// Login the user:
const loginUser = asyncHandler(async (req, res) => {
  console.log("Request Body: ", req.body);
  // 1. take the data from requset Body*
  // 2. usernameor or email
  // 3. find the user ( if user is there or not checking if user is there then login process othervise just error message )
  // 4. password checking
  // ( password process is done then below acess & refresh tokens )
  // 6. access token and refresh token
  // 7. send cookie

  // This code if username is present but email is not it will throw the error //
  const { email, username, password } = req.body;
  console.log("password :", password);

  // if (!username || !email) {
  //   throw new ApiError(400, "username or email is required!");
  // }
  // Here is an alternative of above code based on logic discussion:
  // In this alternative code, we are using the NOT (!) operator to negate the result of the OR (||) operator.
  // This means that the condition will be true only if both username and email are falsy.
  // if (!(username || email)) {
  // username is there but email is not it will not throw error both not there then only ERROR(below)
  //   throw new ApiError(400, "username or email is required!!");
  // }

  // this code is same as above second code ex: username is present email is not it will not throw the error
  if (!username && !email) {
    throw new ApiError(400, "username or email is required!");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  // console.log('')
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials!");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefereshToken(
    user._id
  );

  console.log("registerA.Token:", accessToken);
  console.log("register RefreshToken:", refreshToken);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("loggedInUser:", loggedInUser);

  // accessToken is the JWT generated by the server.
  // `options` may include settings like httpOnly,
  //-secure, maxAge, etc., which control the behavior and security of the cookie.

  const options = {
    httpOnly: true, // these options bcoz that cookies sever only can modify. but client or frontend can't //
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    await req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from the document
      },
    },
    {
      new: true, // this new true means we will get updated doucment instead of getting original document //
    }
  );
  const options = {
    // why here in this code getting false @ POSTMAN //
    httpOnly: true, // these options bcoz that cookies sever only can modify. but client or frontend can't //
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options) // here options bcoz in same security user should logged out //
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out!"));
});

// endpoint for `refresh` access token :
const refreshAccessToken = asyncHandler(async (req, res) => {
  // refrsh accessing from cookies (cookies enpoint):
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unathorized request!");
  }

  // now verifying the jwt : user getting the token is token encrypter ex: ehjjfefebdedede (for security)
  // and @ database storing token is decoded token like username: althaf etc..
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // already we defined the id of the user @ usermodel.js and generating the refreshToken method
    // that id will help to get the user info for refresh token:

    // here we will get the decoded user info :
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token!");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw ApiError(401, error?.message || "Invalid refresh token!");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // if u want confirm password ?
  // const { confPassword } = req.body;
  // // here condition for confPassword :
  // if(!(newPassword === confPassword)) {
  //   throw new ApiError(400, "password does'nt match!");
  // }

  const user = await User.findById(req.user?._id);
  console.log("old password :", user.password);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password!");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully!"));
});

//get current user :
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched Successfully!"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body; // here is new values

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id, // tbis line of cocde checks if the user is there then access the user id that use come from authmiddleware //
    {
      $set: {
        // set for here is updating or setting that new values updting only fullName & email //
        fullName,
        email: email, // u can use es6
      },
    },
    {
      new: true, // This option tells Mongoose to return the updated (changed) document instead of the original one.
    }
  ).select("-password"); // exclude password (password field is already in our database)

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Acccount details updated Successfully!"));
});

// multer middleware for updating the files :
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLoacalPath = req.file?.path;
  if (!avatarLoacalPath) {
    throw new ApiError(400, "Avatar file is misssing!");
  }

  const avatar = await uploadOnCloudinary(avatarLoacalPath); // uploaded that avatar image to cloudinary //

  // after uploading the any file on cloudinary
  // cloudinary will provide URL
  if (!avatar.url) {
    // here not providing?
    throw new ApiError(400, "Error while uploading on avatar!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  // returning the response:
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Image is Updated Successfully!"));
});

// coverImage Updating:
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image File is Missing!");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading the cover image!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  // returning the response:
  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage is Updated Successfully!"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing!");
  }

  // Writing the aggregate pipeline like this : 1st pipeine 1object 2nd one in 2object etc..
  //  User.aggregate([{}, {}, {}])
  const channel = await User.aggregate([
    // 1st pipeline for matching the database userId & logged in user id  :
    {
      $match: {
        username: username?.toLowerCase(), // left side username is from the database collection username.
        // and this assigned `username?` this is comming from request paramater
      },
    },
    // 2nd pipeline :
    {
      $lookup: {
        from: "subscriptions", //
        localField: "_id", // local id means i have one utube channel that channel id 102
        foreignField: "channel", // 102 is the channel. whoever subscribed to 102 channel. their ID's should match
        as: "subscribers", // array of documents //
      },
    },
    // 3rd pipeline :
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id", // this is the utube channel ( if user id is 101 )
        foreignField: "subscriber", // user id 101 how many channels he subscribedTo. their ID's should match.
        as: "subscribedTo",
      },
    },
    // 4th pipeline for counting how many subscribers are there :
    {
      // adding extra fields of the doc :
      $addFields: {
        subScribersCount: {
          $size: "$subscribers", // getting subscribers size of the channel
        },
        channelsSubScribedToCount: {
          $size: "$subscribedTo", // getting the im subscribed size of the channel
        },
        // this is for if user is subscribed then button subscribed else subscribe //
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    // pipeline 5 is final result querying selected field should include in the result (1 means include 0 means exclu):
    {
      $project: {
        fullName: 1,
        username: 1,
        subScribersCount: 1,
        channelsSubScribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  // if no channel :
  if (!channel?.length) {
    throw new ApiError(400, "channel does not exist!");
  }
  console.log("channel : ", channel);

  // returning the response to the frontend :
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fethed successfully!")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    // pipline 1: matching mongoose database ID & logged in user id
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    // 2nd pipline :
    {
      $lookup: {
        from: "videos", // this is the collection from video model `Video` here should be lowercase plural //
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",

        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",

              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
                {
                  $addFields: {
                    owner: {
                      $first: "$owner",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  // finally returning the response:
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched sucessfully!"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
