const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("user/error", {
        message: "Internal Server Error. Please try again later.",
    });
};

module.exports  =  errorHandler;

