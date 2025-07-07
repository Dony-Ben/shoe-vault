const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
// const env = require("dotenv").config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
   try {
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
        return done(null, user);
    } else {
        user = new User({
            firstname: profile.name.givenName,
            lastname: profile.name.familyName,
            email: profile.emails[0].value,
            googleId: profile.id,
        });
        await user.save();
        return done(null, { id: user._id, email: user.email }); }
   } catch (error) {
    return done(error, null); 
   } 
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select("_id email firstname lastname");
        if (user) {
            done(null, { id: user._id, email: user.email });
        } else {
            done(null, null);
        }
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
