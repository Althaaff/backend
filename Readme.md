# This is backend Series :

This video series on backend development with javascript - [Model link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj?origin=share)

# ApiError.js FIle:

class ApiError extends Error {
constructor(statusCode, message = "Something went wrong!", errors = [], stack = "") {
super(message);
this.statusCode = statusCode;
this.errors = errors;

    if (stack) {
      this.stack = stack; // Custom stack trace
    } else {
      Error.captureStackTrace(this, this.constructor); // Automatically capture stack trace
    }

}
}

// Example 1: No custom stack trace provided
const error1 = new ApiError(404, "Not Found");
console.log(error1.stack); // Automatically generated stack trace

// Example 2: Custom stack trace provided
const customStack = "CustomStackTrace: line 1 at customFunction()";
const error2 = new ApiError(500, "Server Error", [], customStack);
console.log(error2.stack); // Output: CustomStackTrace: line 1 at customFunction()

# In backend ( utils ) folder is used for :

---> In a backend project, the utils folder typically contains utility functions or helper modules that are reusable across various parts of the application. These functions are generally independent of the core business logic and are used to avoid code duplication, improve code organization, and promote reusability.

Common purposes for a utils folder include:

General Purpose Functions: Functions like data validation, string manipulation, formatting, logging, etc.
API Helpers: Functions to handle repetitive API call tasks such as constructing headers or managing responses.
Error Handling: Utility functions for consistent error formatting or handling.
Date/Time Manipulation: Utilities for parsing, formatting, or calculating dates and times.
Configuration Parsing: Functions to read and manage configurations (e.g., reading environment variables).
File Management: Helpers to read, write, or manage files.
Third-Party Service Wrappers: If you are interacting with third-party APIs, you may include wrappers for their API calls.
By placing these functions in a utils folder, it centralizes common logic, making the code more maintainable and easier to test.

# getWatchHistory functions pipeline doubts complete explaination here :

- Suppose the users collection has a document with the following watchHistory array field:
- like this doucment user have :
  {
  "\_id": ObjectId,
  "username": ---, etc.. info

  "watchHistory": [
  ObjectId("video1"),
  ObjectId("video2"),
  ObjectId("video3")
  ]
  }

# The pipeline will join this document with the corresponding video documents in the videos collection, like this:

- joining this document with the corresponding video documents in the videos collection like this :
  ex:

* videos can have info like Youtube duration and some video info :

  {
  "\_id": ObjectId,
  "watchHistory": [
  {
  "_id": ObjectId("video1"),
  "title": "Video 1",
  "owner": ObjectId("owner1")
  },
  {
  "_id": ObjectId("video2"),
  "title": "Video 2",
  "owner": ObjectId("owner2")
  },
  {
  "_id": ObjectId("video3"),
  "title": "Video 3",
  "owner": ObjectId("owner3")
  }
  ]
  }

# after video collection inside owner array field is also Visualized Here :

The pipeline performs the following joins:

users watchHistory array field -> videos is (based on watchHistory and \_id)
videos lookup inside nested lookup -> users is (based on owner and \_id)

- The resulting document will contain the video information, including the owner information like this below :
  {
  "\_id": ObjectId,
  "watchHistory": [
  {
  "_id": ObjectId("video1"),
  "title": "Video 1",
  "owner": {
  "_id": ObjectId("owner1"),
  "fullName": "John Doe",
  "username": "johndoe"
  }
  },
  {
  "_id": ObjectId("video2"),
  "title": "Video 2",
  "owner": {
  "_id": ObjectId("owner2"),
  "fullName": "Jane Doe",
  "username": "janedoe"
  }
  },
  {
  "_id": ObjectId("video3"),
  "title": "Video 3",
  "owner": {
  "_id": ObjectId("owner3"),
  "fullName": "Bob Smith",
  "username": "bobsmith"
  }
  }
  ]
  }

# Handling the comments and Their Replies 1st approch also u can use piplines approch :

try {
const { videoId } = req.params;
const { page = 1, limit = 10 } = req.query; // here req.query means These parameters are typically used to send additional data to the server, like filters or pagination settings.

    // skipping commments bcz one page only can have 10 commnets :
    const skip = (page - 1) * 10;

    const comments = await Comment.find({ videoId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip) // pagination logic [skip the previous comments one page should have only 10 comments]
      .limit(parseInt(limit)); // Limit to the number of comments per page

    // Check if there are no comments
    if (!comments.length) {
      return res.status(200).json({
        success: true,
        message: "No comments found",
        data: [], // Empty array when no comments
      });
    }
    // handle the nested comments:
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentId: comment._id });
        return {
          ...comments._doc,
          replies: replies.length === 0 ? [] : replies,
        };
      })
    );

    const response = new ApiResponse(
      200,
      {
        page,
        limit,
        totalComments: comments.length,
        comments: commentsWithReplies,
      },
      "Comments fetched successfully!"
    );

    // send the response:
    res.status(response.statusCode).json(response);

} catch (error) {
// Handle errors
const response = new ApiError(500, null, "Failed to fetch comments.");
res.status(response.statusCode).json(response);
}

---

# getVideoComments functionality output prediction :

Output Context:
The output from the getVideoComments function would reflect all comments related to that specific video, whether they are made by the logged-in user or other users. The isLiked property in the output will indicate if the logged-in user has liked any of the displayed comments.

---

# Video CONTROLLER:

Summary:
GET /: Fetch all videos.
POST /: Authenticated users can upload a video and thumbnail.
GET /v/:videoId: Retrieve a specific video's details.
DELETE /v/:videoId: Authenticated users can delete their own videos.
PATCH /v/:videoId: Update video details (e.g., title, description, thumbnail).
PATCH /toggle/publish/:videoId: Toggle the video’s publish status (public/private)

---

# which controller after video controller ?

# Comment Controller: Since videos can have comments, this would naturally follow after the video controller to manage comment creation, deletion, and retrieval.

# Like Controller: After comments, handling likes is important for both videos and comments, so implementing this will cover user interactions with video content.

# Subscription Controller: Managing user subscriptions to channels or playlists could come next, as it's related to user-video relationships.

# Playlist Controller: After subscriptions, managing playlists would be a good next step, allowing users to organize videos.

# Tweet Controller: If tweets are integrated with video or user interactions, handling tweets can come after playlists.

# Dashboard Controller: This controller would likely handle aggregated data or statistics, so it would make sense to implement after the core user, video, and interaction features are in place.

# Healthcheck Controller: You can implement this last, as it's typically used for server monitoring and ensuring that the API is up and running smoothly.

---END---

# $unwind operator example code :

[
{
"\_id": "video123",
"title": "Sample Video with Two Owners",
"owner": ["user123", "user456"],
"ownerDetails": {
"\_id": "user123",
"username": "johnDoe",
"fullName": "John Doe",
"avatar": {
"url": "avatar1.jpg"
}
}
},
{
"\_id": "video123",
"title": "Sample Video with Two Owners",
"owner": ["user123", "user456"],
"ownerDetails": {
"\_id": "user456",
"username": "janeSmith",
"fullName": "Jane Smith",
"avatar": {
"url": "avatar2.jpg"
}
}
}
]

---

# PATCH USE CASES IN REAL WORLD APPLICATION :

PATCH is a widely used HTTP method in real-world applications, especially in RESTful APIs. It's used to update a resource partially, which means only the fields that need to be updated are sent in the request body.

Example Use Cases

Here are some examples of how PATCH is used in real-world applications:

Updating a user's profile: When a user updates their profile information, such as their name or email address, a PATCH request is sent to the server with only the updated fields.
Editing a blog post: When a blogger edits a blog post, a PATCH request is sent to the server with only the updated fields, such as the title or content.
Updating a product's price: When a merchant updates the price of a product, a PATCH request is sent to the server with only the updated price field.

# route explaination of the addVidoeToPlaylist & removeVideoFromPlaylist :

YouTube Example

Let's say we're building a YouTube-like application, and we want to allow users to add and remove videos from their playlists.

Here's how the code would work in a real-world scenario:

Adding a video to a playlist

When a user clicks the "Add to playlist" button on a video page, the application sends a PATCH request to the /add/:videoId/:playlistId endpoint.

:videoId is the ID of the video being added to the playlist.
:playlistId is the ID of the playlist where the video is being added.
The addVideoToPlaylist function is called, which updates the playlist document in the database by adding the video ID to the videos array.

Removing a video from a playlist

When a user clicks the "Remove from playlist" button on a video page, the application sends a PATCH request to the /remove/:videoId/:playlistId endpoint.

:videoId is the ID of the video being removed from the playlist.
:playlistId is the ID of the playlist where the video is being removed.
The removeVideoFromPlaylist function is called, which updates the playlist document in the database by removing the video ID from the videos array.

Router Code

The router code defines two endpoints:

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
These endpoints are used to handle the PATCH requests sent by the application when a user adds or removes a video from a playlist.

Example Request

Here's an example request that might be sent to the /add/:videoId/:playlistId endpoint:

URL: /add/12345/67890
Method: PATCH
Headers: Content-Type: application/json
Body: None (since it's a PATCH request, the request body is not used)
In this example, the request is adding a video with ID 12345 to a playlist with ID 67890. The addVideoToPlaylist function would be called to update the playlist document in the database.

---

# $match operator in mongodb and why its used in this code ?

$match helps in limiting the documents that need to be processed in the subsequent stages of the pipeline.

ex:
{
$match: {
owner: new mongoose.Types.ObjectId(userId)
}
}

# explaination :-

owner: new mongoose.Types.ObjectId(userId): Filters tweets where the owner field matches the userId (which is likely the ObjectId of the user whose tweets you want to retrieve).
This means only the tweets created by this specific user will pass through to the rest of the aggregation pipeline.

# PATCH is used for :

The PATCH method is used for making partial modifications to a current resource without changing the whole data.

# PUT is used for :

The PUT Method
PUT is used to send data to a server to create/update a resource. The difference between POST and PUT is that PUT requests are idempotent. That is, calling the same PUT request multiple times will always produce the same result.
