function errorController(err, req, res, next) {
  function errMsg(error, statusCode, message = error.message, res) {
    error.expose = true;
    error.statusCode = statusCode;
    error.status = statusCode;
    error.message = message;

    process.env.NODE_ENV === 'development'
      ? devErrors(res, error)
      : prodErrors(res, error);
  }

  //ERRORS SENT FOR DEVELOPMENT
  function devErrors(res, error) {
    const errCode = error.status || 500;
    res.status(errCode).json({
      message: error.message,
      stack: err.stack,
      status: err.status,
      err: error,
    });
  }
  // ERRORS SEND FOR PRODUCTION
  function prodErrors(res, error) {
    const errCode = error.status || 500;
    if (error.expose === false)
      return res.status(errCode).json({
        status: error.status,
        message: "something went terribly wrong. That's all we know",
      });
    return res.status(errCode).json({
      status: error.status,
      message: error.message,
    });
  }

  // DUPLICATE FIELDS WITH THE UNIQUE TYPE SCHEMA
  function handleDuplicateErr(error) {
    const errKey = Object.keys(error.keyPattern);
    const message = `The ${errKey},${error.keyValue.Email} already Exists`;
    errMsg(error, 400, message, res);
  }

  //HANDLE JWT EXPIRED ERROR
  function handleTokenExpiredError(error) {
    errMsg(error, 401, 'The token given has already expired', res);
  }

  function handleValidationError(error) {
    const msg = error.message.split(': ')[2];
    errMsg(error, 400, msg, res);
  }

  function handleJsonWebTokenError() {
    errMsg(error, 401, 'The token provied is not valid', res);
  }

  function handleCastError(error) {
    const message = 'Something went wrong while trying to process that request';
    errMsg(error, 404, message, res);
  }

  function otherErrors(error) {
    if (process.env.NODE_ENV === 'development') return devErrors(res, error);
    else return prodErrors(res, error);
  }

  function handleInvalidFileInput(error) {
    const message = 'Please select a file';
    errMsg(error, 400, message, res);
  }

  if (err.code === 11000) return handleDuplicateErr(err);
  if (err.name === 'TokenExpiredError') return handleTokenExpiredError(err);
  if (err.name === 'ValidationError') return handleValidationError(err);
  if (err.name === 'CastError') return handleCastError(err);
  if (err.name === 'JsonWebTokenError') return handleJsonWebTokenError(err);
  if (
    err.message === "Cannot read properties of undefined (reading 'filename')"
  )
    return handleInvalidFileInput(err);
  return otherErrors(err);
}

module.exports = errorController;
