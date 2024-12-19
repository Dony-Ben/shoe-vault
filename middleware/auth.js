const userModel = require("../models/User.js");


const ensureGuest = (req, res, next) => {
  // Check if the user is already logged in
  if (req.session.user && req.session.user.id && req.session.user.email) {
    return res.redirect("/home"); 
  }
  next(); 
};

const userAuth = (req, res, next) => {
  if (req.session.user && req.session.user.id && req.session.user.email) {
    userModel.findById(req.session.user.id)
      .then(user => {
        if (user && !user.isblocked) {
          return next();
        }
        console.log('no session stored on user so cant access other routes.')
        req.session.user = null; 
        res.redirect("/login");
      })
      .catch(error => {
        console.log("Error in user auth middleware:", error);
        res.status(500).render('user/page-404', { message: "Internal server error" });
      });
  } else {
    console.log('no session found on user')
    res.redirect("/login");
  }
};

const adminAuth = (req, res, next) => {

  if (req.session.user && req.session.user.id && req.session.user.email) {
    userModel.findOne({ _id: req.session.user.id, isadmin: true })
      .then(data => {
        if (data) {
          next(); // Admin is authenticated
        } else {
          res.redirect("/admin");
        }
      })
      .catch(error => {
        console.log("Error in admin auth middleware:", error);
        res.status(500).render('error', { message: "Internal server error" });
      });
  } else {
    res.redirect("/admin"); // Redirect to admin login if session is invalid
  }
};

module.exports = {
  userAuth,
  adminAuth, 
  ensureGuest, 
};
