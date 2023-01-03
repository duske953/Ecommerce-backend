const rateLimit = require("express-rate-limit");

function Limiter(ms, max) {
  const apiLimiter = rateLimit({
    windowMs: ms, // 15 minutes
    max, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  return apiLimiter;
}

module.exports = Limiter;
