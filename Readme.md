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
console.log(error1.stack);  // Automatically generated stack trace

// Example 2: Custom stack trace provided
const customStack = "CustomStackTrace: line 1 at customFunction()";
const error2 = new ApiError(500, "Server Error", [], customStack);
console.log(error2.stack);  // Output: CustomStackTrace: line 1 at customFunction()
