const userModel = require("../models/User.js");


const ensureGuest = (req, res, next) => {
  // Check if the user is already logged in
  if (req.session.user && req.session.user.id && req.session.user.email) {
    return res.redirect("/login");
  }
  next();
};

const userAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  // If AJAX request, send JSON
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.status(401).json({ message: "Please login to add to cart." });
  }
  // Otherwise, redirect
  res.redirect('/login');
};


module.exports = {
  userAuth,
  ensureGuest,
};
