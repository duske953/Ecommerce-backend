const createError = require("http-errors");

module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(createError(500, err)));
  };
};
