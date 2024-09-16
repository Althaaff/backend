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



