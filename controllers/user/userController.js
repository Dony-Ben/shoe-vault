const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { RESPONSE_SUCCESS, RESPONSE_ERROR } = require("../../constants/responseMessages");
const userModel = require('../../models/User.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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
    console.log("Email sent:", info);
    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email.");
  }
}

const userSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.render(RENDER_PAGE_KEYS.userSignup, { message: RESPONSE_ERROR.allFieldsRequired });
    }
    if (password !== confirmPassword) {
      return res.render(RENDER_PAGE_KEYS.userSignup, { message: RESPONSE_ERROR.passwordMismatch });
    }

    if (!validatePassword(password)) {
      return res.render(RENDER_PAGE_KEYS.userSignup, { message: RESPONSE_ERROR.invalidPassword });
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.render(RENDER_PAGE_KEYS.userSignup, { message: RESPONSE_ERROR.emailAlreadyExists });
    }

    const otp = generateOTP();
    console.log("Generated OTP:", otp);
    req.session.userOtp = otp;
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.render(RENDER_PAGE_KEYS.userSignup, { message: RESPONSE_ERROR.tryAgainLater });
    }

    req.session.userData = { email, password, firstName, lastName };
    res.redirect("/otp");
  } catch (error) {
    console.error("Signup error:", error);
    res.render(RENDER_PAGE_KEYS.userSignup, { message: RESPONSE_ERROR.somethingWentWrong });
  }
};

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
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
      return res.status(400).json({ success: false, message: RESPONSE_ERROR.sessionNotFound });
    }

    const { email } = req.session.userData;
    req.session.userOtp = null;
    const otp = generateOTP();
    req.session.resendOtp = otp;
    console.log("req.session.userOtp", req.session.resendOtp);
    console.log("Resend OTP:", otp);
    const emailSent = await sendVerificationEmail(email, otp);

    if (emailSent) {

      res.status(200).json({ success: true, message: RESPONSE_SUCCESS.otpResent });
    } else {
      res.status(500).json({ success: false, message: RESPONSE_ERROR.tryAgainLater });
    }
  } catch (error) {
    console.error("Error resending OTP:", error.message);
    res.status(500).json({ success: false, message: RESPONSE_ERROR.internalServerError });
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
          message: RESPONSE_ERROR.sessionNotFound,
        });
      }

      req.session.user = { id: saveUserData._id, email: saveUserData.email };
      res.redirect("/login");
    } else {
      res.status(400).json({ success: false, message: RESPONSE_ERROR.invalidOtp })
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: RESPONSE_ERROR.somethingWentWrong })

  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render(RENDER_PAGE_KEYS.userLogin, { message: RESPONSE_ERROR.allFieldsRequired });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      console.warn("Login attempt failed: User not found with email:", email);
      return res.render(RENDER_PAGE_KEYS.userLogin, { message: RESPONSE_ERROR.userNotFound });
    }

    if (user.isblocked) {
      console.warn("Login attempt failed: User is blocked with email:", email);
      return res.render(RENDER_PAGE_KEYS.userLogin, { message: RESPONSE_ERROR.userBlocked });
    }

    if (!user.password) {
      console.error("Login error: User password is missing in the database for email:", email);
      return res.render(RENDER_PAGE_KEYS.userLogin, { message: RESPONSE_ERROR.tryAgainLater });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.warn("Login attempt failed: Invalid password for email:", email);
      return res.render(RENDER_PAGE_KEYS.userLogin, { message: RESPONSE_ERROR.invalidCredentials });
    }

    req.session.user = { id: user._id, email: user.email };
    console.log("User session set:", req.session.user);

    return res.redirect("/home");

  } catch (error) {
    console.error("Error during login process:", error.message, error.stack);
    return res.render(RENDER_PAGE_KEYS.userLogin, { message: RESPONSE_ERROR.tryAgainLater });
  }
};


const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Logout error:", err);
        return res.redirect("/pageNotFound");
      }
      res.clearCookie('connect.sid');
      return res.redirect("/");
    });
  } catch (error) {
    console.log("Logout error:", error);
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