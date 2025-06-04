const express = require("express");
const path = require("path");
const dotenv = require('dotenv');
const connectDB = require("./config/db");
const session = require("express-session");
const nocache = require("nocache");
const passport = require("./config/passport");
const userRoutes = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");
const { setupSSE } = require("./helpers/sse");
const cloudinary = require("cloudinary").v2;
const app = express();
setupSSE(app);

// Load Environment Variables
dotenv.config();

// Database Connection
connectDB();


// Configure Application Settings
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware for Parsing Request Body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// Session Handling
app.use(session({
  secret: process.env.SESSION_SECRET || 'd!f$%R@d&fgH(j)kL_mN0pQ2wEyuXzcvbN-n!@#$%^&()',
  resave: false,
  saveUninitialized: false,
}));


// Prevent Caching to Avoid Session Issues
app.use(nocache());

// Initialize Passport for Authentication
app.use(passport.initialize());
app.use(passport.session());

// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.API_key,
  api_secret: process.env.API_secret,
});

// Routes
app.use("/", userRoutes);
app.use("/admin", adminRouter);

// Start the Server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
