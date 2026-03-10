const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const bookingRoutes = require("./routes/bookingRoutes");
const carRoutes = require("./routes/carRoutes");
const authRoutes = require("./routes/authRoutes");

const Car = require("./models/carModel");
const Booking = require("./models/bookingModel");

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// connect MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/carRentalDB";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// routes (auth không cần JWT)
app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);
app.use("/cars", carRoutes);

// view routes (EJS pages that call APIs)
app.get("/", (req, res) => res.render("index"));
app.get("/views/login", (req, res) => res.render("login"));
app.get("/views/register", (req, res) => res.render("register"));

app.get("/views/cars", async (req, res) => {
  try {
    const cars = await Car.find();
    res.render("cars", { cars });
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi tải dữ liệu xe");
  }
});

app.get("/views/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ startDate: -1 });
    res.render("bookings", { bookings });
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi tải danh sách đặt xe");
  }
});

app.get("/views/overdue", async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const results = await Booking.aggregate([
      {
        $match: {
          $or: [
            { endDate: null },
            { endDate: { $exists: false } },
            { endDate: "" },
            { endDate: "null" },
          ],
          startDate: { $lte: twentyFourHoursAgo },
        },
      },
      {
        $lookup: {
          from: "cars",
          localField: "carNumber",
          foreignField: "carNumber",
          as: "car",
        },
      },
      { $unwind: { path: "$car", preserveNullAndEmptyArrays: true } },
      { $sort: { startDate: -1 } },
    ]);

    res.render("overdue", {
      overdueBookings: results,
      asOf: now.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi tải danh sách quá hạn");
  }
});

// start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
