const users = require("../model/userModel");
const catchAsync = require("../utils/catchAsync");
const createError = require("http-errors");
// const multer = require("multer");
// const { GridFsStorage } = require("multer-gridfs-storage");
const { v4: uuidv4 } = require("uuid");
// const DIR = "./public/";
// const url = `mongodb+srv://eloho:${process.env.MONGODB_PASSWORD}@ecommerce.7huagy2.mongodb.net/?retryWrites=true&w=majority`;
// const storage = new GridFsStorage({ url });

// exports.upload = multer({
//   fileFilter: (req, file, cb) => {
//     if (
//       file.mimetype == "image/png" ||
//       file.mimetype == "image/jpg" ||
//       file.mimetype == "image/jpeg"
//     ) {
//       cb(null, true);
//     } else {
//       cb(null, false);
//       return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
//     }
//   },
//   storage,
//   limits: {
//     files: 1,
//     fileSize: 3000000,
//   },
// });

function filterObj(obj) {
  let filtered = {};
  const keys = Object.keys(obj).filter(
    (el, i) => el === "Name" || el === "Email"
  );
  keys.forEach((el, i) => {
    filtered[el] = obj[el];
  });
  return filtered;
}

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.Email || req.body.Name) {
    const updatedBody = filterObj(req.body);
    const user = await users.findById(req.user.id).select("+active");
    user.set(updatedBody);
    await user.save({ validateModifiedOnly: true });
    return res.status(200).json({
      message: "Details changed",
      data: {
        user,
      },
    });
  }
  return next(createError(400, "Please fill one of the fields to proceed"));
});

// exports.uploadImg = catchAsync(async (req, res, next) => {
//   console.log(req.file);
//   const img = `${process.env.RELATIVE_URL_BACKEND}/${req.file.destination}img/${req.file.filename}`;
//   const url = req.protocol + "://" + req.get("host");
//   req.user.Img = `${url}/uploads/${uuidv4()}/${req.file.filename}`;
//   await req.user.save({ validateBeforeSave: false });
//   res.status(200).json({
//     message: "Image uploaded successfully",
//     image: req.user.Img,
//   });
// });
