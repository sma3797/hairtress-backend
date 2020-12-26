const fs = require("fs");
const multer = require("multer");

const User = require("../models/user");
const Quiz = require("../models/quiz");
const Product = require("../models/product");
const Order = require("../models/order");
const HttpError = require("../models/http-error").HttpError;

const { validationResult } = require("express-validator");
const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sendGrid = require("nodemailer-sendgrid-transport");
const spawn = require("child_process").spawn;
// const client = require("twilio")(process.env.ACCOUNTSID, process.env.AUTHTOKEN);

const AWS = require("aws-sdk");
const BUCKET_NAME_IMAGES = "images-rizipt";
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.SECRET,
});

const transporter = nodemailer.createTransport(
    sendGrid({
        auth: {
            api_key: `${process.env.SEND_GRID_API}`,
        },
    }),
);
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
// --------------------------------- User Information

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    const { email, fname, lname, password } = req.body;

    if (!errors.isEmpty()) {
        errors.errors.map((err) => {
            if (err.param === "password") {
                return next(new HttpError("Password length must be greater than 6", 422));
            }
            if (err.param === "fname") {
                return next(new HttpError("First Name is required", 422));
            }
            if (err.param === "lname") {
                return next(new HttpError("Last Name is required", 422));
            }
            if (err.param === "email") {
                return next(new HttpError("Email is required", 422));
            }
        });
    }

    let existingUser;
    try {
        existingUser = await User.findOne({ email });
    } catch (error) {
        const err = new HttpError("Something went wrong, signing up failed...", 500);
        return next(err);
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError("Something went wrong, signing up failed...", 500));
    }

    let user;
    if (existingUser) {
        const err = new HttpError("User exists already!", 500);
        return next(err);
    } else {
        const newUser = new User({
            email,
            fname,
            lname,
            password: hashedPassword,
        });
        try {
            user = await newUser.save();
            transporter.sendMail({
                to: email,
                from: "sma3797@outlook.com",
                subject: "New Signup",
                html: `
            <h1>Hairtress Sign Up</h1>
            <p>Thank You For Signing Up</p>
            `,
            });
        } catch (error) {
            return next(new HttpError("Something went wrong, signing up failed...", 500));
        }
    }
    res.status(201).json({ message: "OK", user: user._id ? true : false });
};
exports.login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errors.errors.map((err) => {
            if (err.param === "email") {
                return next(new HttpError("Email must be valid", 422));
            }
            if (err.param === "password") {
                return next(new HttpError("Password length must be greater than 6", 422));
            }
        });
    }
    const { email, password } = req.body;
    let existingUser;

    try {
        existingUser = await User.findOne({ email });
    } catch (error) {
        const err = new HttpError("Something went wrong, log in fails!", 500);
        return next(err);
    }

    if (!existingUser) {
        const err = new HttpError("No account associated with your provided email...", 401);
        return next(err);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (error) {
        const err = new HttpError("Something went wrong, log in fails!", 500);
        return next(err);
    }
    if (!isValidPassword) {
        const err = new HttpError("Invalid credentials", 401);
        return next(err);
    }

    let token;
    try {
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, process.env.JWT_USER_SECKEY);
    } catch (error) {
        const err = new HttpError("Something went wrong, log in fails!", 500);
        return next(err);
    }

    res.status(201).json({
        fname: existingUser.fname,
        lname: existingUser.lname,
        email: existingUser.email,
        quiz: existingUser.quiz ? true : false,
        phone_number: existingUser.phone_number,
        hair_data: existingUser.hair_data,
        hair_type: existingUser.hair_type,
        userId: existingUser._id,
        token: token,
        picture: existingUser.picture,
    });
};
exports.reset = async (req, res, next) => {
    crypto.randomBytes(32, async (err, buffer) => {
        if (err) {
            return next(new HttpError("Something went wrong!", 500));
        }
        const token = buffer.toString("hex");
        let user;
        try {
            user = await User.findOne({ email: req.body.email });
        } catch (error) {
            return next(new HttpError("Something went wrong!", 500));
        }
        const date = Date.now();
        if (!user) {
            return next(new HttpError("User not found!", 500));
        }
        user.resetToken = token;
        user.resetTokenExpirationTime = date + 3600000;
        try {
            await user.save();
            transporter.sendMail({
                to: req.body.email,
                from: "sma3797@outlook.com",
                subject: "Password Reset",
                html: `
				<h1>Reset Password</h1>
				<p>Click <a href='${process.env.FRONTEND_URL}/reset/${token}'>this</a> to Reset Your Password</p>
				`,
            });
            res.status(200).json({ message: "Reset token sent successfully!" });
        } catch (error) {
            return next(new HttpError("Something went wrong! Try again later...", 500));
        }
    });
};
exports.resetPassword = async (req, res, next) => {
    const token = req.params.token;
    const password = req.body.password;
    const user = await User.findOne({
        resetToken: token,
        // resetTokenExpirationTime: { $gt: Date.now() },
    });
    if (!user) {
        return next(new HttpError("Something went wrong! Or your password reset link has been expired...", 500));
    }
    if (user.resetTokenExpirationTime && user.resetTokenExpirationTime < Date.now()) {
        return next(new HttpError("Your password reset link has been expired...", 500));
    }
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError("Something went wrong! Try again later...", 500));
    }

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpirationTime = undefined;
    try {
        await user.save();
        res.status(200).json({ message: "Password changed successfully!" });
    } catch (error) {
        return next(new HttpError("Something went wrong! Try again later...", 500));
    }
};
exports.changeInformation = async (req, res, next) => {
    const errors = validationResult(req);
    let { fname, lname, address, phone_number, userId } = req.body;
    if (!errors.isEmpty()) {
        errors.errors.map((err) => {
            if (err.param === "fname") {
                return next(new HttpError("First Name is required", 422));
            }
            if (err.param === "lname") {
                return next(new HttpError("Last Name is required", 422));
            }
        });
    }
    const fileContent = req.file && fs.readFileSync(req.file.path);

    let existingUser;
    try {
        existingUser = await User.findOne({ _id: userId });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }

    const params = req.file && {
        Bucket: BUCKET_NAME_IMAGES,
        Key: `${fname ? fname : existingUser.fname}-${req.file.filename}`, // File name you want to save as in S3
        Body: fileContent,
    };

    if (req.file && req.file.path)
        s3.upload(params, async (err, data) => {
            if (err) {
                throw err;
            } else if (data) {
                // console.log(`File uploadeded successfully. ${data.Location}`);
                if (existingUser) {
                    existingUser.fname = fname;
                    existingUser.lname = lname;
                    existingUser.address = address;
                    existingUser.phone_number = phone_number;
                    existingUser.picture = data.Location;
                    const user = await existingUser.save();
                    res.json({
                        message: "Ok",
                        fname: user.fname,
                        lname: user.lname,
                        address: user.address,
                        phone_number: user.phone_number,
                        picture: user.picture,
                    });
                } else {
                    const err = new HttpError("Something went wrong", 500);
                    return next(err);
                }
            }
            if (req.file) {
                fs.unlink(req.file.path, (err) => {
                    // console.log(err);
                });
            }
        });
    else {
        if (existingUser) {
            existingUser.fname = fname;
            existingUser.lname = lname;
            existingUser.address = address;
            existingUser.phone_number = phone_number;
            existingUser.picture = existingUser.picture;
            const user = await existingUser.save();
            res.json({
                message: "Ok",
                fname: user.fname,
                lname: user.lname,
                address: user.address,
                phone_number: user.phone_number,
                picture: user.picture,
            });
        } else {
            const err = new HttpError("Something went wrong", 500);
            return next(err);
        }
    }
};
exports.changePassword = async (req, res, next) => {
    const { oldPassword, password, userId } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ _id: userId });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    if (existingUser) {
        let isValidPassword = false;
        try {
            isValidPassword = await bcrypt.compare(oldPassword, existingUser.password);
        } catch (error) {
            const err = new HttpError("Something went wrong...", 500);
            return next(err);
        }
        if (isValidPassword) {
            let hashedPassword;
            try {
                hashedPassword = await bcrypt.hash(password, 12);
            } catch (error) {
                const err = new HttpError("Something went wrong...", 500);
                return next(err);
            }
            existingUser.password = hashedPassword;
            try {
                const user = await existingUser.save();
                res.json({
                    message: "Ok",
                    password_changed: true,
                });
            } catch (error) {
                const err = new HttpError("Something went wrong...", 500);
                return next(err);
            }
        } else {
            const err = new HttpError("Password doesn't match", 500);
            return next(err);
        }
    } else {
        const err = new HttpError("User doesn't exist", 500);
        return next(err);
    }
};

// --------------------------------- Quiz

exports.quizSubmit = async (req, res, next) => {
    const { userId, answers } = req.body;
    // const pythonProcess = spawn("python", [
    //     "../ai/index.py",
    //     answers.question_1,
    //     answers.question_2,
    //     answers.question_3,
    //     answers.question_4,
    //     answers.question_5,
    // ]);

    // pythonProcess.stdout.on("data", (data) => {
    //     res.json({ message: "Ok", data: JSON.parse(data.toString()) });
    // });
    // return;
    let existingUser;
    try {
        existingUser = await User.findOne({ _id: userId });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }

    if (existingUser) {
        const quiz = new Quiz({
            userId,
            question_1: answers.question_1,
            question_2: answers.question_2,
            question_3: answers.question_3,
            question_4: answers.question_4,
            question_5: answers.question_5,
        });
        try {
            const quiz_completed = await quiz.save();
            existingUser.quiz = quiz_completed._id;
            await existingUser.save();
            // const pythonProcess = spawn("python", [
            //     "../ai/index.py",
            //     answers.question_1,
            //     answers.question_2,
            //     answers.question_3,
            //     answers.question_4,
            //     answers.question_5,
            // ]);

            // pythonProcess.stdout.on("data", (data) => {
            // });
            res.json({ message: "Ok", quiz: existingUser.quiz ? true : false });
        } catch (error) {}
    } else {
        const err = new HttpError("User doesn't exist", 500);
        return next(err);
    }
};

exports.getUser = async (req, res, next) => {
    let { userId } = req.body;
    let existingUser;
    // console.log("userId", userId);
    try {
        existingUser = await User.findOne({ _id: userId });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    if (!existingUser) {
        return next(new HttpError("Something went wrong!", 500));
    }
    // console.log("existingUser", existingUser);
    res.status(200).json({
        user: {
            fname: existingUser.fname,
            lname: existingUser.lname,
            email: existingUser.email,
            quiz: existingUser.quiz,
            phone_number: existingUser.phone_number,
            address: existingUser.address,
            picture: existingUser.picture,
        },
    });
};

exports.email = async (req, res, next) => {
    const errors = validationResult(req);
    let email = true;
    if (!errors.isEmpty()) {
        errors.errors.map((err) => {
            if (err.param === "email") {
                email = false;
                return next(new HttpError("Valid email is required", 422));
            }
        });
    }
    if (email) {
        const { email } = req.body;
        let emailToSaved = new Email({
            email: email.toLowerCase(),
        });
        try {
            let emailSaved = await emailToSaved.save();
            res.status(200).json({ message: "Ok", email: emailSaved._id ? true : false });
        } catch (error) {
            const err = new HttpError("Something went wrong", 500);
            return next(err);
        }
    }
};

exports.allProducts = async (req, res, next) => {
    const skip = req.query.skip && /^\d+$/.test(req.query.skip) ? Number(req.query.skip) : 0;
    const { query, type } = req.body;
    // console.log("object", query, type, skip);
    const regex = new RegExp(escapeRegex(query ? query : ""), "gi");
    let products;
    try {
        if (type === "c")
            products = await Product.find({ name: regex, crafts: true }, undefined, {
                skip,
                limit: 10,
            }).sort({ createdAt: -1 });
        if (type === "p")
            products = await Product.find({ name: regex, pros: true }, undefined, {
                skip,
                limit: 10,
            }).sort({ createdAt: -1 });
        if (type === "s")
            products = await Product.find({ name: regex, studies: true }, undefined, {
                skip,
                limit: 10,
            }).sort({ createdAt: -1 });
        if (type === "pr")
            products = await Product.find({ name: regex, product: true }, undefined, {
                skip,
                limit: 10,
            }).sort({ createdAt: -1 });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    // console.log("products", products.length);
    res.status(200).json({ message: "Ok", products });
};

exports.recommendedProducts = async (req, res, next) => {
    const skip = req.query.skip && /^\d+$/.test(req.query.skip) ? Number(req.query.skip) : 0;
    const { query, type, userId } = req.body;

    const regex = new RegExp(escapeRegex(query ? query : ""), "gi");
    let existingUser;
    try {
        existingUser = await User.findOne({ _id: userId }).populate("quiz");
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    console.log("existingUser", existingUser._id, userId);
    let pros = [],
        crafts = [],
        studies = [],
        product = [],
        products = [];
    if (!existingUser) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    } else if (existingUser.quiz) {
        const pythonProcess = spawn("python", [
            "../ai/index.py",
            existingUser.quiz.question_1,
            existingUser.quiz.question_2,
            existingUser.quiz.question_3,
            existingUser.quiz.question_4,
            existingUser.quiz.question_5,
        ]);

        pythonProcess.stdout.on("data", async (data) => {
            let dataJSON = JSON.parse(data.toString());
            pros = dataJSON.salon.map((i) => i._id);
            crafts = dataJSON.video.map((i) => i._id);
            studies = dataJSON.article.map((i) => i._id);
            product = dataJSON.product.map((i) => mongoose.Types.ObjectId(i._id));
            try {
                if (type === "c")
                    products = await Product.find({ _id: { $in: crafts }, name: regex, crafts: true }, undefined, {
                        skip,
                        limit: 10,
                    }).sort({ createdAt: -1 });
                if (type === "p")
                    products = await Product.find({ _id: { $in: pros }, name: regex, pros: true }, undefined, {
                        skip,
                        limit: 10,
                    }).sort({ createdAt: -1 });
                if (type === "s")
                    products = await Product.find({ _id: { $in: studies }, name: regex, studies: true }, undefined, {
                        skip,
                        limit: 10,
                    }).sort({ createdAt: -1 });
                if (type === "pr")
                    products = await Product.find({ _id: { $in: product }, name: regex, product: true }, undefined, {
                        skip,
                        limit: 10,
                    }).sort({ createdAt: -1 });
                res.status(200).json({ message: "Ok", products });
            } catch (error) {
                const err = new HttpError("Something went wrong", 500);
                return next(err);
            }
        });
    } else {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
};

exports.fetchCart = async (req, res, next) => {};
exports.oldCart = async (req, res, next) => {};
exports.addToCart = async (req, res, next) => {};
exports.addQuantity = async (req, res, next) => {};
exports.removeProduct = async (req, res, next) => {};
exports.checkout = async (req, res, next) => {};
exports.orders = async (req, res, next) => {};
