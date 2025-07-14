const bcrypt = require("bcrypt");
const user = require("../../models/User");

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
        const { email, password } = req.body;
        const admin = await user.findOne({ email, isadmin: true });
        if (!admin) {
            return res.render('admin/login', { error: 'Email not found' });
        }
        const passwordmatch = await bcrypt.compare(password, admin.password);
        if (!passwordmatch) {
            return res.render('admin/login', { error: 'Incorrect password' });
        }
        req.session.admin = { id: admin._id, email: admin.email };
        req.session.loginSuccess = true;
        return res.redirect("/admin/dashboard");
    } catch (error) {
        console.log("Login error", error);
        return res.render('admin/login', { error: "An error occurred during login" });
    }
};

const adminlogout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout failed", err);
            }
            res.redirect("/admin");
        });
    } catch (error) {
        console.error("Unexpected error during logout:", error);
        res.redirect("/pageError");
    }
};

module.exports = {
    pageError,
    loadlogin,
    handleLogin,
    adminlogout,
};
