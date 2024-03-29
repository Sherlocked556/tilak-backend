const express = require("express");
const env = require("dotenv");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

//routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin/auth");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const initialDataRoutes = require("./routes/admin/initialData");
const pageRoutes = require("./routes/admin/page");
const addressRoutes = require("./routes/address");
const orderRoutes = require("./routes/order");
const adminOrderRoute = require("./routes/admin/order.routes");
const blogRoutes = require("./routes/blog");
const inventoryRoutes = require("./routes/inventory");
const resellerRoutes = require("./routes/reseller")

//environment variable or you can say constants
env.config();

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);

// mongodb connection
//mongodb+srv://root:<password>@cluster0.8pl1w.mongodb.net/<dbname>?retryWrites=true&w=majority
mongoose
  .connect(process.env.MONGO_PROD_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Database connected");
  });

app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: [
      "https://tilakshringar.com",
      "https://www.tilakshringar.com",
      "http://tilakshringar.com",
      "http://localhost:3000",
      "http://localhost:2000",
    ],
  })
);
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "uploads")));
app.use("/api", authRoutes);
app.use("/api", adminRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", initialDataRoutes);
app.use("/api", pageRoutes);
app.use("/api", addressRoutes);
app.use("/api", orderRoutes);
app.use("/api", adminOrderRoute);
app.use("/api", blogRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", resellerRoutes)

app.listen(2000, () => {
  console.log(`Server is running on port ${2000}`);
});
