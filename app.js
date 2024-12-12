const express = require("express");
const path = require("path");
const dotenv = require('dotenv').config();
const connectDB = require("./config/db");
const session=require("express-session")
const userRoutes = require("./routes/userRouter");
const passport=require("./config/passport")
const adminRouter=require("./routes/adminRouter")

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallbackSecretKey',
  resave:false,
  saveUninitialized:false,
}))

app.use(passport.initialize())
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

connectDB()

app.use("/", userRoutes);
app.use('/admin',adminRouter)

const PORT = process.env.PORT||7000
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});