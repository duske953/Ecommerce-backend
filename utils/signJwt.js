const jwt = require('jsonwebtoken');
exports.signJwt = async (id) => {
  const token = await jwt.sign({ data: id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return token;
};
