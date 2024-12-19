const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userModel = require("../models/User");

const pageError = async (req, res) => {
    res.render("/pageError")
}

const loadlogin = (req, res) => {
    if (req.session.admin) {
        return res.redirect("/admin/dashboard")
    }

    res.render('admin/login', { message: null });
};

const handleLogin = async (req, res) => {
    try {
        // console.log("res in admin", req.body);

        const { email, password } = req.body;
        const admin = await userModel.findOne({ email, isadmin: true });
        console.log(admin);

        if (admin) {

            const passwordmatch = await bcrypt.compare(password, admin.password);
            if (passwordmatch) {

                req.session.admin = true;
                return res.redirect("/admin/dashboard")
            } else {
                return res.render('admin/login', { message: 'Invalid password' });
            }
        } else {
            return res.render('admin/login', { message: 'Admin not found' });
        }
    } catch (error) {
        console.log("Login error", error);
        return res.render('error', { message: "An error occurred during login" });
    }
}
const loaddashboard = async (req, res) => {
    if (req.session.admin) {
        try {
            const totalUsers = await userModel.countDocuments({ isadmin: false });
            res.render("admin/dashboard", { totalUsers })
        } catch (error) {
            console.log("Dashboard error", error);
            res.render('error', { message: "An error occurred while loading the dashboard" });
        }
    } else {
        return res.redirect("/admin");  
    }

}

const adminlogout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
               
            }

            res.redirect("/admin");
        });
    } catch (error) {
        console.error("Unexpected error during logout:", error);
        res.redirect("/pageError");
    }
};
module.exports = {
    loadlogin,
    handleLogin,
    loaddashboard,
    adminlogout,
};
