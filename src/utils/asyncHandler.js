const asyncHandler = (requestHandler) => { // here requestHandler expecting another function that have 
  (req, res, next) => {  // three paramaters that req, res, next 
                         // Here, requestHandler(req, res, next) is called, which is expected to return a promise (since it's asynchronous).
                         // Promise.resolve is used to ensure that it is treated as a promise, even if requestHandler does not explicitly return a promise.
    Promise.resolve(requestHandler(req, res, next))
    .catch((err) => next(err))  // It passes the error to the next middleware function with next(err). This ensures that any errors are handled by Express’s
                               // error-handling middleware.
  }
}

export { asyncHandler }  // this code explaintion and also code as same as below code 2 ways possible //







// const asyncHandler = (fn) => async (req, res, next) => {  
//   try {
//     await fn(req, res, next)
//   } catch(error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     })
//   }
// }