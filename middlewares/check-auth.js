const HttpError = require("../models/http-error").HttpError;
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
    if (req.method === "OPTIONS") {
        return next();
    }
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            throw new HttpError("Authentication failed", 404);
        }
        const decodedToken = jwt.verify(token, process.env.JWT_USER_SECKEY);
        req.userData = { userId: decodedToken.userId };
        next();
    } catch (error) {
        return next(new HttpError("Authentication failed", 404));
    }
};
