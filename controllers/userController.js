const mongoose = require('mongoose');
const product = require("../models/product.js");
const userModel = require('../models/User.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Account",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);">
            <div style="padding: 20px;">
              <h1 style="color: #333; font-size: 24px; margin-bottom: 10px;">Verify Your Account</h1>
              <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
                Please use the following OTP to verify your account. This code is valid for the next 10 minutes.
              </p>
              <div style="background-color: #fafafa; border: 1px solid #ddd; padding: 15px; border-radius: 5px; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #1a73e8;">${otp}</span>
              </div>
              <p style="color: #777; font-size: 14px; margin-top: 20px;">
                If you did not request this OTP, please ignore this email or contact support.
              </p>
            </div>
          </div>
          <p style="color: #aaa; font-size: 12px; margin-top: 20px;">
            &copy; 2024 ShoeShop. All rights reserved.
          </p>
        </div>
      `,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email.");
    // return false;
  }
}

const userSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).send("All fields are required.");
    }
    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(409).send("Email is already registered.");
    }

    const otp = generateOTP();
    req.session.userOtp = otp;
    console.log("generateOTP", req.session.userOtp);

    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json("email-error")
    }

    req.session.userData = { email, password, firstName, lastName };
    res.redirect("/otp");
  } catch (error) {
    console.error("Signup error:", error);
    res.redirect("/pageNotFound")
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Failed to hash password.");
  }
}

const resentOtp = async (req, res) => {
  try {
    if (!req.session || !req.session.userData) {
      return res.status(400).json({ success: false, message: "Session data not found." });
    }

    const { email } = req.session.userData;
    req.session.userOtp = null;
    const otp = generateOTP();
    req.session.resendOtp = otp;
    console.log("req.session.userOtp", req.session.resendOtp);
    console.log("Resend OTP:", otp);
    const emailSent = await sendVerificationEmail(email, otp);

    if (emailSent) {

      res.status(200).json({ success: true, message: "OTP resent successfully" });
    } else {
      res.status(500).json({ success: false, message: "Failed to resend OTP. Please try again." });
    }
  } catch (error) {
    console.error("Error resending OTP:", error.message);
    res.status(500).json({ success: false, message: "Internal server error. Please try again." });
  }
};

const verifyotp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log("verifyotp", req.session.userOtp, otp);

    if (req.session.userOtp == otp || req.session.resendOtp == otp) {
      const user = req.session.userData
      console.log(req.session.userData);

      const passwordHash = await securePassword(user.password);
      const saveUserData = new userModel({
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        password: passwordHash,
      });

      await saveUserData.save()

      if (!req.session) {
        return res.status(500).json({
          success: false,
          message: "Session not initialized.",
        });
      }

      req.session.user = saveUserData.id;
      res.redirect("login");
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP, plase try again" })
    }
  } catch (error) {
    console.error("Error verifiying otp,error", error);
    res.status(500).json({ success: false, message: "An error is occured" })

  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("user/login", { message: "Email and password are required." });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      console.warn("Login attempt failed: User not found with email:", email);
      return res.render('user/login', { message: 'User not found. Please signup' });
    }

    if (user.isblocked) {
      console.warn("Login attempt failed: User is blocked with email:", email);
      return res.render("user/login", { message: "You are blocked by admin." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.warn("Login attempt failed: Invalid password for email:", email);
      return res.render("user/login", { message: "Invalid email or password." });
    }

    // Set session
    req.session.user = { id: user._id, email: user.email };
    console.log("User session set:", req.session.user);

    // Redirect to home page after successful login
    return res.redirect("/home");

  } catch (error) {
    console.error("Error during login process:", error.message, error.stack);
    return res.status(500).send("Something went wrong. Please try again later.");
  }
};


const logout = async (req, res) => {
  try {
    req.session.user.id = null;
    req.session.user.email = null;

    console.log("Session after logout:", req.session);

    return res.redirect("/");
  } catch (error) {
    console.log("Logout error", error);
    return res.redirect("/pageNotFound");
  }
}

module.exports = {
  userLogin,
  userSignup,
  verifyotp,
  resentOtp,
  logout,
};