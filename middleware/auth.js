const userModel = require("../models/User.js");

const userAuth = (req, res, next) => {
  console.log("session in auth",req.session.user);
  
  if (req.session.user) {
    userModel.findById(req.session.user.id)
      .then(data => {
        if (data && !data.isblocked) {
          next(); 
        } else {
          res.redirect("/login");
        }
      })
      .catch(error => {
        console.log("Error in user auth middleware:", error);
        res.status(500).render('user/page-404', { message: "Internal server error" });
      });
  } else {
    res.redirect("/login");
  }
};

const adminAuth = (req, res, next) => {
  if (req.session.admin) {
    userModel.findOne({ isadmin: true })
      .then(data => {
        if (data) {
          next();
        } else {
          res.redirect("/admin");
        }
      })
      .catch(error => {
        console.log("Error in admin auth middleware:", error);
        res.status(500).render('error', { message: "Internal server error" });
      });
  } else {
    res.redirect("/admin");
  }
};

module.exports = {
  userAuth,
  adminAuth,  
};