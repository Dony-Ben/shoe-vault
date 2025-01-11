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
        res.redirect("/admin");
    }
};