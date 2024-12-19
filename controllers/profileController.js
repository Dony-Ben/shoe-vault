const nodemailer = require('nodemailer');
const User = require('../models/User');
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");
const crypto = require("crypto");
const Address = require("../models/address")
// OTP Generator
function generateOTP() {
    const digits = "123456789";
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += digits[crypto.randomInt(0, digits.length)];
    }
    return otp;
}

const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "donybenny612@gmail.com",
            subject: 'Your OTP for Password Reset',
            text: `Your OTP is ${otp}`,
            html: `<b><h4>Your OTP: ${otp}</h4></b>`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

// Render Forgot Password Page
const getForgotPassPage = async (req, res) => {
    try {
        res.render("user/forgotpassword", { message: null });
    } catch (error) {
        res.render("user/page-404");
    }
};

const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email });

        if (findUser) {
            const otp = generateOTP();
            const emailSent = await sendVerificationEmail(email, otp);

            if (emailSent) {
                req.session.userOtp = otp;
                req.session.email = email;
                res.render("user/otpforgotpass", { message: null });
                console.log("OTP:", otp);
            } else {
                res.render("user/forgotpassword", {
                    message: "Failed to send OTP. Please try again."
                });
            }
        } else {
            res.render("user/forgotpassword", {
                message: "User with this email does not exist."
            });
        }
    } catch (error) {
        console.error("Error:", error);
        res.render("user/page-404");
    }
};

// Verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { userOtp, email } = req.session;
        const enteredOtp = Object.values(req.body).join("");

        if (!userOtp || !email) {
            return res.render("user/forgotpassword", { message: "Session expired. Please request a new OTP." });
        }

        console.log("Entered OTP:", enteredOtp);
        console.log("Stored OTP:", userOtp);

        if (userOtp === enteredOtp) {
            console.log("OTP Verified for email:", email);
            req.session.isOtpVerified = true;
            console.log("Rendering newpassword page...");

            res.render("user/newpassword");
        } else {
            req.session.message = "Invalid OTP. Please try again.";
            res.redirect("/passwordreset");
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.render("user/page-404", { message: "Something went wrong. Please try again." });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, isOtpVerified } = req.session;
        const { newPassword, confirmPassword } = req.body;

        console.log("resetPassword request body:", req.body);

        if (!isOtpVerified) {
            return res.render("user/forgotpassword", { message: "OTP verification required." });
        }

        if (!newPassword || !confirmPassword) {
            return res.render("user/newpassword", { message: "Both password fields are required." });
        }
        if (newPassword !== confirmPassword) {
            return res.render("user/newpassword", { message: "Passwords do not match." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render("user/newpassword", { message: "User not found." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log("Hashed password:", hashedPassword);
        console.log("Updating password...");

        const result = await User.updateOne({ email }, { $set: { password: hashedPassword } });
        console.log("Update result:", result);

        if (result.modifiedCount === 0) {
            return res.render("user/newpassword", { message: "Failed to update password." });
        }

        console.log("Password updated successfully.");

        req.session.destroy();
        res.render("user/login", { message: "Password reset successful. Please log in." });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.render("user/page-404");
    }
};

const loadProfile = async (req, res) => {
    try {
        const userId = req.session.user.id;

        if (!userId) {
            return res.redirect('/login');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.render("user/userProfile", { user: null, error: "User not found" });
        }

        res.render("user/userProfile", { user });
    } catch (error) {
        console.error("Error while loading user profile:", error);
        res.status(500).send("Internal Server Error");
    }
};

const geteditprofile = async (req, res) => {
    try {
        const userId = req.session.user.id;

        if (!userId) {
            return res.redirect('/login');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.render("user/userProfile", { user: null, error: "User not found" });
        }

        res.render("user/editProfile", { user });
    } catch (error) {
        console.error("Error while loading user profile:", error);
        res.status(500).send("Internal Server Error");
    }
};

const editprofile = async (req, res) => {
    try {
        const userId = req.session.user.id
        console.log(userId);
        const { name, email, } = req.body;
        console.log(req.body);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { firstname: name } },
            { new: true }
        );
        console.log(updatedUser);
        if (!updatedUser) {
            return res.status(404).render("user/editprofile", {
                user: req.session.user,
                error: "User not found."
            });
        }
        res.render("user/userProfile", { user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).render("user/editprofile", {
            user: req.session.user,
            error: "An error occurred while updating the profile."
        });
    }
};

const loadAddresses = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(400).send("User not logged in or session expired");
        }

        const userId = req.session.user.id;

        const addressList = await Address.find({ userId });

        res.render('user/useraddress', { address: addressList });
    } catch (err) {
        console.error("Error in loadAddresses:", err);
        res.status(500).send("Server Error");
    }
};


const AddAddressForm = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(400).send("User not logged in or session expired");
        }

        const userId = req.session.user.id;

        const { name, city, state, pincode, phone, addressType } = req.body;

        if (!name || !phone || !city || !state || !pincode || !addressType) {
            return res.status(400).send("All fields are required");
        }

        const newAddress = new Address({ userId, name, city, state, pincode, phone, addressType });
        await newAddress.save();

        const addressList = await Address.find({ userId });

        res.render('user/useraddress', { address: addressList });
    } catch (err) {
        console.error("Error in AddAddressForm:", err);
        res.status(500).send("Server Error");
    }
};

const editAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const { addressType, name, phone, city, state, pincode } = req.body;
        
        console.log("Request body:", req.body);

        const updatedAddress = await Address.findByIdAndUpdate(addressId, {
            addressType,
            name,
            phone,
            city,
            state,
            pincode,
        }, { new: true }); 
        
        if (!updatedAddress) {
            return res.status(404).send('Address not found');
        }

        res.redirect('/address');
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getAddressById = async (req, res) => {
    try {
        const addressId = req.params.id;
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json(address); 
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    sendVerificationEmail,
    getForgotPassPage,
    forgotEmailValid,
    verifyOtp,
    resetPassword,
    loadProfile,
    geteditprofile,
    editprofile,
    loadAddresses,
    AddAddressForm,
    editAddress,
    getAddressById,
};
