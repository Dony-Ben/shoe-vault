const nodemailer = require('nodemailer');
const User = require('../../models/User');
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const crypto = require("crypto");
const Address = require("../../models/address")
const { STATUS_CODES } = require("../../constants/httpStatusCodes");
const { RENDER_PAGE_KEYS } = require("../../constants/renderPageKeys");
const { RESPONSE_SUCCESS, RESPONSE_ERROR } = require('../../constants/responseMessages');

// OTP Generator
function generateOTP() {
    const digits = "123456789";
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += digits[crypto.randomInt(0, digits.length)];
    }
    return otp;
};

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
            to: email,
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

const getForgotPassPage = async (req, res) => {
    try {
        res.render(RENDER_PAGE_KEYS.userForgotPassword, { message: null });
    } catch (error) {
        res.render(RENDER_PAGE_KEYS.userPage404);
    }
};

const forgotEmailValid = async (req, res) => {
    try {
        const email = req.body.email.trim();
        const findUser = await User.findOne({ email });
        if (!findUser) {
            res.render(RENDER_PAGE_KEYS.userForgotPassword, {
                message: RESPONSE_ERROR.userNotFound
            });
        }

        if (findUser) {
            const otp = generateOTP();
            const emailSent = await sendVerificationEmail(email, otp);

            if (emailSent) {
                req.session.userOtp = otp;
                req.session.email = email;
                res.render(RENDER_PAGE_KEYS.userOtpForgotPass, { message: null });
            } else {
                res.render(RENDER_PAGE_KEYS.userForgotPassword, {
                    message: RESPONSE_ERROR.tryAgainLater
                });
            }
        }
    } catch (error) {
        console.error("Error:", error);
        res.render(RENDER_PAGE_KEYS.userPage404);
    }
};

const verifyOtp = async (req, res) => {
    
    try {
        const { userOtp, email } = req.session;
        let enteredOtp;

        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            enteredOtp = req.body.otp ? req.body.otp.toString().trim() : '';
        } else {
            enteredOtp = Object.values(req.body).join("").trim();
        }

        if (!userOtp || !email) {
            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                return res.json({ success: false, message: RESPONSE_ERROR.sessionExpired });
            }
            return res.render(RENDER_PAGE_KEYS.userForgotPassword, { message: RESPONSE_ERROR.sessionExpired });
        }

        if (userOtp.trim() === enteredOtp) {
            req.session.isOtpVerified = true;
            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                return res.json({ success: true, message: RESPONSE_SUCCESS.otpVerified });
            }
            res.render(RENDER_PAGE_KEYS.userNewPassword);
        } else {
            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                return res.json({ success: false, message: RESPONSE_ERROR.invalidOtp });
            }
            res.render(RENDER_PAGE_KEYS.userOtpForgotPass, { message: RESPONSE_ERROR.invalidOtp });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            return res.json({ success: false, message: RESPONSE_ERROR.somethingWentWrong });
        }
        res.render(RENDER_PAGE_KEYS.userPage404, { message: RESPONSE_ERROR.somethingWentWrong });
    }
};


const resetPassword = async (req, res) => {

    try {
        const { email, isOtpVerified } = req.session;
        const { newPassword, confirmPassword } = req.body;
        if (!isOtpVerified) {
            return res.render(RENDER_PAGE_KEYS.userForgotPassword, { message: RESPONSE_ERROR.unauthorized });
        }
        if (!newPassword || !confirmPassword) {
            return res.render(RENDER_PAGE_KEYS.userNewPassword, { message: RESPONSE_ERROR.allFieldsRequired });
        }
        if (newPassword !== confirmPassword) {
            return res.render(RENDER_PAGE_KEYS.userNewPassword, { message: RESPONSE_ERROR.passwordMismatch });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.render(RENDER_PAGE_KEYS.userNewPassword, { message: "User not found." });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await User.updateOne({ email }, { $set: { password: hashedPassword } });

        if (result.modifiedCount === 0) {
            return res.render(RENDER_PAGE_KEYS.userNewPassword, { message: RESPONSE_ERROR.operationFailed });
        }

        req.session.isOtpVerified = null;
        req.session.email = null;
        req.session.userOtp = null;
        req.flash("success",RESPONSE_SUCCESS.resetpassword)
        res.redirect("/login");
    } catch (error) {
        console.error("Error resetting password:", error);
        res.render(RENDER_PAGE_KEYS.userPage404);
    }
};


const loadProfile = async (req, res,next) => {
    try {
         if (!req.user) {
            return res.status(STATUS_CODES.Unauthorized).render("user/error", { message: RESPONSE_ERROR.unauthorized });
        }
        const userId = req.session.user.id;

        if (!userId) {
            return res.redirect('/login');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.render(RENDER_PAGE_KEYS.userProfile, { user: null, error: RESPONSE_ERROR.userNotFound });
        }

        res.render(RENDER_PAGE_KEYS.userProfile, { user });
    } catch (err) {
        next(err)
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
            return res.render(RENDER_PAGE_KEYS.userProfile, { user: null, error: RESPONSE_ERROR.userNotFound });
        }

        res.render(RENDER_PAGE_KEYS.userEditProfile, { user });
    } catch (err) {
        next(err)
    }
};

const editprofile = async (req, res) => {
    try {
        const userId = req.session.user.id
        const { name, email, } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { firstname: name } },
            { new: true }
        );
        console.log(updatedUser);
        if (!updatedUser) {
            return res.status(STATUS_CODES.NotFound).render("user/editprofile", {
                user: req.session.user,
                error: "User not found."
            });
        }
        res.render(RENDER_PAGE_KEYS.userProfile, { user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(STATUS_CODES.InternalServerError).render("user/editprofile", {
            user: req.session.user,
            error: "An error occurred while updating the profile."
        });
    }
};

const loadAddresses = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(STATUS_CODES.BadRequest).send(RESPONSE_ERROR.sessionExpired);
        }

        const userId = req.session.user.id;

        const addressList = await Address.find({ userId });

        res.render(RENDER_PAGE_KEYS.userAddress, { address: addressList });
    } catch (err) {
        console.error("Error in loadAddresses:", err);
        res.status(STATUS_CODES.InternalServerError).send(RESPONSE_ERROR.serverError);
    }
};


const AddAddressForm = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(STATUS_CODES.BadRequest).json({ success: false, message: RESPONSE_ERROR.sessionExpired });
        }

        const userId = req.session.user.id;
        const { name, city, state, pincode, phone, addressType } = req.body;

        if (!name || !phone || !city || !state || !pincode || !addressType) {
            return res.status(STATUS_CODES.BadRequest).json({ success: false, message: RESPONSE_ERROR.allFieldsRequired });
        }

        const newAddress = new Address({ userId, name, city, state, pincode, phone, addressType });
        await newAddress.save();

        // Check if this is an AJAX request (from checkout page)
        if (req.xhr || req.headers['content-type'] === 'application/json') {
            return res.json({ success: true, message: RESPONSE_SUCCESS.addressAdded, address: newAddress });
        }

        // For regular form submissions (from address page)
        const addressList = await Address.find({ userId });
        res.render(RENDER_PAGE_KEYS.userAddress, { address: addressList });
    } catch (err) {
        console.error("Error in AddAddressForm:", err);
        if (req.xhr || req.headers['content-type'] === 'application/json') {
            return res.status(STATUS_CODES.InternalServerError).json({ success: false, message: RESPONSE_ERROR.serverError });
        }
        res.status(STATUS_CODES.InternalServerError).send(RESPONSE_ERROR.serverError);
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
            if (req.xhr || req.headers['content-type'] === 'application/json') {
                return res.status(STATUS_CODES.NotFound).json({ success: false, message: RESPONSE_ERROR.notFound });
            }
            return res.status(STATUS_CODES.NotFound).send(RESPONSE_ERROR.notFound);
        }

        // Check if this is an AJAX request (from checkout page)
        if (req.xhr || req.headers['content-type'] === 'application/json') {
            return res.json({ success: true, message: RESPONSE_SUCCESS.addressUpdated, address: updatedAddress });
        }

        // For regular form submissions (from address page)
        res.redirect('/address');
    } catch (error) {
        console.error('Error updating address:', error);
        if (req.xhr || req.headers['content-type'] === 'application/json') {
            return res.status(STATUS_CODES.InternalServerError).json({ success: false, message: RESPONSE_ERROR.internalServerError });
        }
        res.status(STATUS_CODES.InternalServerError).send(RESPONSE_ERROR.internalServerError);
    }
};

const getAddressById = async (req, res) => {
    try {
        const addressId = req.params.id;
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(STATUS_CODES.NotFound).json({ message: RESPONSE_ERROR.notFound });
        }

        res.json(address);
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(STATUS_CODES.InternalServerError).json({ message: RESPONSE_ERROR.serverError });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressId = req.params.id;

        const result = await Address.deleteOne({ _id: addressId, userId });
        console.log("address deleted successfully");

        // Check if this is an AJAX request (from checkout page)
        if (req.xhr || req.headers['content-type'] === 'application/json') {
            if (result.deletedCount > 0) {
                return res.json({ success: true, message: RESPONSE_SUCCESS.addressDeleted });
            } else {
                return res.status(STATUS_CODES.NotFound).json({ success: false, message: RESPONSE_ERROR.notFound });
            }
        }

        // For regular form submissions (from address page)
        res.redirect("/address");
    } catch (error) {
        console.error("Error deleting address:", error);
        if (req.xhr || req.headers['content-type'] === 'application/json') {
            return res.status(STATUS_CODES.InternalServerError).json({ success: false, message: RESPONSE_ERROR.operationFailed });
        }
        res.status(STATUS_CODES.InternalServerError).send(RESPONSE_ERROR.operationFailed);
    }
}

const getNewPasswordPage = async (req, res) => {
    try {
        if (!req.session || !req.session.isOtpVerified) {
            return res.redirect("/forgotpassword");
        }
        res.render(RENDER_PAGE_KEYS.userNewPassword);
    } catch (error) {
        console.error("Error loading new password page:", error);
        res.render(RENDER_PAGE_KEYS.userPage404, { message: RESPONSE_ERROR.somethingWentWrong });
    }
};

const resendForgotOtp = async (req, res) => {
    try {
        if (!req.session || !req.session.email) {
            return res.status(STATUS_CODES.BadRequest).json({ success: false, message: RESPONSE_ERROR.sessionNotFound });
        }

        const { email } = req.session;
        req.session.userOtp = null;
        const otp = generateOTP();
        req.session.userOtp = otp;
        console.log("Resend Forgot OTP:", otp);
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            res.status(STATUS_CODES.OK).json({ success: true, message: RESPONSE_SUCCESS.otpResent });
        } else {
            res.status(STATUS_CODES.InternalServerError).json({ success: false, message: RESPONSE_ERROR.tryAgainLater });
        }
    } catch (error) {
        console.error("Error resending forgot OTP:", error.message);
        res.status(STATUS_CODES.InternalServerError).json({ success: false, message: RESPONSE_ERROR.internalServerError });
    }
};

module.exports = {
    sendVerificationEmail,
    getForgotPassPage,
    forgotEmailValid,
    verifyOtp,
    resetPassword,
    getNewPasswordPage,
    resendForgotOtp,
    loadProfile,
    geteditprofile,
    editprofile,
    loadAddresses,
    AddAddressForm,
    editAddress,
    getAddressById,
    deleteAddress,

};
