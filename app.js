require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const userRouter = require("./router/userRouter");
const productRouter = require("./router/productRouter");
const errorHandler = require("./controller/errorController");
const helmet = require("helmet");
const compression = require("compression");
(async function () {
  try {
    await mongoose.connect(
      `mongodb+srv://eloho:${process.env.MONGODB_PASSWORD}@ecommerce.7huagy2.mongodb.net/?retryWrites=true&w=majority`
    );
    console.log("database connected");
  } catch (err) {
    console.log("something went wrong");
  }
})();

process.on("uncaughtExcepiton", (err) => {
  console.log("UNCAUGHT EXCPTION");
  console.log(err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});
app.use(compression());
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use("/uploads/:id", express.static("public"));

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "DELETE", "PATCH"],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => console.log("server started"));
