const HttpError = require("../models/http-error").HttpError;
const Admin = require("../models/admin");

module.exports = async (req, res, next) => {
    const { userId } = req.body;
    // console.log("yusdasd", userId);
    if (req.method === "OPTIONS") {
        return next();
    }
    // if (userId !== req.userData.userId) {
    //     const err = new HttpError("Invalid credentials!", 401);
    //     return next(err);
    // }
    let existingUser;
    try {
        existingUser = await Admin.findOne({ _id: userId });
    } catch (error) {
        const err = new HttpError("Something went wrong! Try again later...", 500);
        return next(err);
    }

    if (existingUser) {
        // const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : false;
        // if (!token) {
        //     const err = new HttpError("Invalid credentials!", 401);
        //     return next(err);
        // }
        // const decodedToken = jwt.verify(token, process.env.JWT_USER_SECKEY);
        // req.userData = { userId: decodedToken.userId };
        req.userData = { userId: existingUser._id };
    } else {
        const err = new HttpError("Invalid credentials!", 401);
        return next(err);
    }
    next();
};
