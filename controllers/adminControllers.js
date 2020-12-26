const fs = require("fs");
const multer = require("multer");

const Admin = require("../models/admin");
const Quiz = require("../models/quiz");
const User = require("../models/user");
const Product = require("../models/product");
const ProductType = require("../models/product_type");
const ProductBestHairType = require("../models/product_best_hair_type");
const ProductCompany = require("../models/product_company");
const ProductTag = require("../models/product_tag");
const Email = require("../models/email");
const HttpError = require("../models/http-error").HttpError;

const { validationResult } = require("express-validator");
const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sendGrid = require("nodemailer-sendgrid-transport");
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
    const { email, name, password } = req.body;

    if (!errors.isEmpty()) {
        errors.errors.map((err) => {
            if (err.param === "password") {
                return next(new HttpError("Password length must be greater than 6", 422));
            }
            if (err.param === "name") {
                return next(new HttpError("First Name is required", 422));
            }
            if (err.param === "email") {
                return next(new HttpError("Email is required", 422));
            }
        });
    }

    let existingUser;
    try {
        existingUser = await Admin.findOne({ email });
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
        const newUser = new Admin({
            email,
            name,
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
        existingUser = await Admin.findOne({ email });
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
        name: existingUser.name,
        email: existingUser.email,
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
            user = await Admin.findOne({ email: req.body.email });
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
				<p>Click <a href='${process.env.FRONTEND_ADMIN_URL}/reset/${token}'>this</a> to Reset Your Password</p>
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
    const user = await Admin.findOne({
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
exports.changePassword = async (req, res, next) => {
    const { oldPassword, password, userId } = req.body;

    let existingUser;
    try {
        existingUser = await Admin.findOne({ _id: userId });
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

// --------------------------------- Products
exports.allUsers = async (req, res, next) => {
    const skip = req.query.skip && /^\d+$/.test(req.query.skip) ? Number(req.query.skip) : 0;
    let users;
    try {
        users = await User.find({}, undefined, { limit: 20, skip }).sort({ createdAt: -1 });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    res.status(200).json({ message: "Ok", users });
};
exports.allEmails = async (req, res, next) => {
    let emails;
    try {
        emails = await Email.find({}, undefined, {}).sort({ createdAt: -1 });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    res.status(200).json({ message: "Ok", emails });
};

exports.addProductType = async (req, res, next) => {
    const type = req.query.type;
    // console.log(type);
    // const productType = type.toString().substring(1, type.length - 1);
    const newProductType = new ProductType({
        type: type,
    });
    try {
        const addedProduct = await newProductType.save();
        res.status(200).json({ message: "Ok", addedType: addedProduct });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
};
exports.addProductTag = async (req, res, next) => {
    const type = req.query.type;
    // const productType = type.toString().substring(1, type.length - 1);
    const newProductType = new ProductTag({
        type: type,
    });
    try {
        const addedProduct = await newProductType.save();
        res.status(200).json({ message: "Ok", addedType: addedProduct });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
};
exports.addProductCompany = async (req, res, next) => {
    const type = req.query.type;
    // console.log(type);
    const newProductType = new ProductCompany({
        type: type,
    });
    try {
        const addedProduct = await newProductType.save();
        res.status(200).json({ message: "Ok", addedType: addedProduct });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
};
exports.addProductBestHairType = async (req, res, next) => {
    const type = req.query.type;
    const newProductType = new ProductBestHairType({
        type: type,
    });
    try {
        const addedProduct = await newProductType.save();
        res.status(200).json({ message: "Ok", addedType: addedProduct });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
};

exports.editProductType = async (req, res, next) => {
    const { _id, type } = req.body;

    // console.log(" _id, type", _id, type);
    let toEdit;
    try {
        toEdit = await ProductType.findOne({ _id });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    let edited;
    if (toEdit) {
        toEdit.type = type;
        try {
            edited = await toEdit.save();
        } catch (error) {}
    } else {
        const err = new HttpError("Nothing has been found with the provided ID", 500);
        return next(err);
    }

    res.status(200).json({ message: "Ok", edited });
};
exports.editProductTag = async (req, res, next) => {
    const { _id, type } = req.body;

    // console.log(" _id, type", _id, type);
    let toEdit;
    try {
        toEdit = await ProductTag.findOne({ _id });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    let edited;
    if (toEdit) {
        toEdit.type = type;
        try {
            edited = await toEdit.save();
        } catch (error) {}
    } else {
        const err = new HttpError("Nothing has been found with the provided ID", 500);
        return next(err);
    }

    res.status(200).json({ message: "Ok", edited });
};
exports.editProductCompany = async (req, res, next) => {
    const { _id, type } = req.body;

    // console.log(" _id, type", _id, type);
    let toEdit;
    try {
        toEdit = await ProductCompany.findOne({ _id });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    let edited;
    if (toEdit) {
        toEdit.type = type;
        try {
            edited = await toEdit.save();
        } catch (error) {}
    } else {
        const err = new HttpError("Nothing has been found with the provided ID", 500);
        return next(err);
    }

    res.status(200).json({ message: "Ok", edited });
};
exports.editProductBestHairType = async (req, res, next) => {
    const { _id, type } = req.body;

    // console.log(" _id, type", _id, type);
    let toEdit;
    try {
        toEdit = await ProductBestHairType.findOne({ _id });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    let edited;
    if (toEdit) {
        toEdit.type = type;
        try {
            edited = await toEdit.save();
        } catch (error) {}
    } else {
        const err = new HttpError("Nothing has been found with the provided ID", 500);
        return next(err);
    }

    res.status(200).json({ message: "Ok", edited });
};

// exports.allProducts = async (req, res, next) => {
//     const skip = req.query.skip && /^\d+$/.test(req.query.skip) ? Number(req.query.skip) : 0;
//     // console.log("request", req.body);
//     const { query } = req.body;
//     const regex = new RegExp(escapeRegex(query ? query : ""), "gi");
//     let products;
//     try {
//         products = await Product.find({ product_name: regex }, undefined, {
//             skip,
//             limit: 10,
//         }).sort({ createdAt: -1 });
//     } catch (error) {
//         const err = new HttpError("Something went wrong", 500);
//         return next(err);
//     }
//     res.status(200).json({ message: "Ok", products });
// };

exports.allProducts = async (req, res, next) => {
    const skip = req.query.skip && /^\d+$/.test(req.query.skip) ? Number(req.query.skip) : 0;
    const { query, type } = req.body;
    // console.log("req.body", req.body);
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
    res.status(200).json({ message: "Ok", products });
};

exports.addProduct = async (req, res, next) => {
    let {
        name,
        pros,
        crafts,
        product,
        studies,
        product_type,
        hair_type,
        density,
        porosity,
        link1,
        link2,
        link3,
        product_company,
        processing,
        creator,
        length,
        desc,
    } = req.body;
    let fileURL, productToCreate;
    const fileContent = req.file && fs.readFileSync(req.file.path);
    const params = req.file && {
        Bucket: BUCKET_NAME_IMAGES,
        Key: req.userData.fileKey,
        Body: fileContent,
    };
    if (fileContent) {
        s3.upload(params, async (err, data) => {
            if (err) {
                throw err;
            } else if (data) {
                productToCreate = new Product({
                    name,
                    pros,
                    crafts,
                    product,
                    studies,
                    product_type,
                    hair_type,
                    density,
                    porosity,
                    link1,
                    link2,
                    link3,
                    product_company,
                    processing,
                    creator,
                    length,
                    picture: data.Location,
                    desc,
                });
                try {
                    const newProduct = await productToCreate.save();
                    res.status(200).json({ message: "Ok", newProduct });
                } catch (error) {
                    // console.log("error", error);
                    const err = new HttpError("Something went wrong", 500);
                    return next(err);
                }
                try {
                    if (req.file) {
                        fs.unlink(req.file.path, (err) => {});
                    }
                } catch (error) {
                    // console.log("error", error);
                    const err = new HttpError("Something went wrong", 500);
                    return next(err);
                }
            }
        });
    } else {
        productToCreate = new Product({
            name,
            pros,
            crafts,
            product,
            studies,
            product_type,
            hair_type,
            density,
            porosity,
            link1,
            link2,
            link3,
            product_company,
            processing,
            creator,
            length,
            desc,
        });
        try {
            const newProduct = await productToCreate.save();
            res.status(200).json({ message: "Ok", newProduct });
        } catch (error) {
            // console.log("error", error);
            const err = new HttpError("Something went wrong", 500);
            return next(err);
        }
    }
};
exports.editProduct = async (req, res, next) => {
    let productToFind;
    const {
        productId,
        name,
        pros,
        crafts,
        product,
        studies,
        product_type,
        hair_type,
        density,
        porosity,
        link1,
        link2,
        link3,
        product_company,
        processing,
        creator,
        length,
        desc,
    } = req.body;
    const fileContent = req.file && fs.readFileSync(req.file.path);
    const params = req.file && {
        Bucket: BUCKET_NAME_IMAGES,
        Key: req.userData.fileKey,
        Body: fileContent,
    };
    try {
        productToFind = await Product.findOne({ _id: productId });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    // console.log("product", productToFind);
    if (productToFind) {
        if (fileContent) {
            s3.upload(params, async (err, data) => {
                if (err) {
                    throw err;
                } else if (data) {
                    productToFind.name = name ? name : undefined;
                    productToFind.pros = pros ? pros : undefined;
                    productToFind.crafts = crafts ? crafts : undefined;
                    productToFind.product = product ? product : undefined;
                    productToFind.studies = studies ? studies : undefined;
                    productToFind.product_type = product_type ? product_type : undefined;
                    productToFind.hair_type = hair_type ? hair_type : undefined;
                    productToFind.density = density ? density : undefined;
                    productToFind.porosity = porosity ? porosity : undefined;
                    productToFind.link1 = link1 ? link1 : undefined;
                    productToFind.link2 = link2 ? link2 : undefined;
                    productToFind.link3 = link3 ? link3 : undefined;
                    productToFind.product_company = product_company ? product_company : undefined;
                    productToFind.processing = processing ? processing : undefined;
                    productToFind.creator = creator ? creator : undefined;
                    productToFind.length = length ? length : undefined;
                    productToFind.picture = data.Location;
                    productToFind.desc = desc ? desc : undefined;
                    const newProduct = await productToFind.save();
                    res.status(200).json({ message: "Ok", productEdited: newProduct });
                    try {
                        if (req.file) {
                            fs.unlink(req.file.path, (err) => {});
                        }
                    } catch (error) {
                        const err = new HttpError("Something went wrong", 500);
                        return next(err);
                    }
                }
            });
        } else {
            productToFind.name = name ? name : undefined;
            productToFind.pros = pros ? pros : undefined;
            productToFind.crafts = crafts ? crafts : undefined;
            productToFind.product = product ? product : undefined;
            productToFind.studies = studies ? studies : undefined;
            productToFind.product_type = product_type ? product_type : undefined;
            productToFind.hair_type = hair_type ? hair_type : undefined;
            productToFind.density = density ? density : undefined;
            productToFind.porosity = porosity ? porosity : undefined;
            productToFind.link1 = link1 ? link1 : undefined;
            productToFind.link2 = link2 ? link2 : undefined;
            productToFind.link3 = link3 ? link3 : undefined;
            productToFind.product_company = product_company ? product_company : undefined;
            productToFind.processing = processing ? processing : undefined;
            productToFind.creator = creator ? creator : undefined;
            productToFind.length = length ? length : undefined;
            const newProduct = await productToFind.save();
            res.status(200).json({ message: "Ok", productEdited: newProduct });
        }
    } else {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
};
exports.deleteProduct = async (req, res, next) => {
    const { productId } = req.body;
    // console.log("productId", productId);
    let product;
    try {
        product = await Product.findOne({ _id: productId });
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    if (product) {
        const newProduct = await Product.deleteOne({ _id: productId });
        res.status(200).json({ message: "Ok", productDeleted: newProduct.deletedCount ? true : false });
    } else {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
};

exports.getProductStuff = async (req, res, next) => {
    let productTypes, productBestHairTypes, productCompanies, productTags;
    try {
        productTypes = await ProductType.find();
        productBestHairTypes = await ProductBestHairType.find();
        productCompanies = await ProductCompany.find();
        productTags = await ProductTag.find();
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }
    res.status(200).json({ message: "Ok", productTypes, productBestHairTypes, productCompanies, productTags });
};
