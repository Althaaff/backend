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
