const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const readXlsxFile = require("read-excel-file/node");

const Product = require("./models/product");

const fs = require("fs");
const path = require("path");

const HttpError = require("./models/http-error").HttpError;

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { assert } = require("console");

const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use(express.static(path.join("public")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    next();
});

app.use("/user", userRoutes);
app.use("/admin", adminRoutes);

app.use((req, res, next) => {
    // res.sendFile(path.resolve(__dirname, "public", "index.html"));
    res.json({ message: "" });
});

app.use((req, res, next) => {
    const error = new HttpError("Route couldn't found", 404);
    throw error;
});

app.use((error, req, res, next) => {
    // if (req.file) {
    //     fs.unlink(req.file.path, (err) => {
    //         console.log(err);
    //     });
    // }
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

mongoose.set("useCreateIndex", true);
const mongooseOptions = {
    useNewUrlParser: true,
    // autoReconnect: true,
    // poolSize: 25,
    // connectTimeoutMS: 30000,
    // socketTimeoutMS: 30000,
    useUnifiedTopology: true,
};

mongoose
    .connect(
        `mongodb://root:${process.env.DB_PWD}@cluster0-shard-00-00-n7ejg.mongodb.net:27017,cluster0-shard-00-01-n7ejg.mongodb.net:27017,cluster0-shard-00-02-n7ejg.mongodb.net:27017/${process.env.DB_NAME}?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority`,
        mongooseOptions,
    )
    .then(async (result) => {
        console.log("Yo");
        app.listen(process.env.PORT || 5000);
        // const products = await Product.find({ product: true }).sort({ createdAt: 1 });
        // const products = await Product.find({ crafts: true }).sort({ createdAt: 1 });
        // const products = await Product.find({ pros: true }).sort({ createdAt: 1 });
        const products = await Product.find({ studies: true }).sort({ createdAt: 1 });
        products.map((i) => console.log(i._id, i.name));
        // readXlsxFile("./product.xlsx").then((rows) => {
        //     // console.log("rows", rows);
        //     rows.map(async (i) => {
        //         let productToCreate = new Product({
        //             name: i[0],
        //             product: true,
        //             product_type: i[1],
        //             hair_type: i[2],
        //             density: i[3],
        //             porosity: i[4],
        //             link1: i[7],
        //             link2: i[8],
        //             link3: i[9],
        //         });
        //         console.log(productToCreate);
        //         try {
        //             // const newProduct = await productToCreate.save();
        //         } catch (error) {
        //             console.log("error", error);
        //         }
        //     });
        // });
        // readXlsxFile("./crafts.xlsx").then((rows) => {
        //     // console.log("rows", rows);
        //     rows.map(async (i) => {
        //         let productToCreate = new Product({
        //             name: i[0],
        //             crafts: true,
        //             hair_type: i[2],
        //             density: i[4],
        //             link1: i[1],
        //             processing: i[5],
        //             length: i[3],
        //             creator: i[8],
        //         });
        //         console.log(productToCreate);
        //         try {
        //             // const newProduct = await productToCreate.save();
        //         } catch (error) {
        //             console.log("error", error);
        //         }
        //     });
        // });
        // readXlsxFile("./pros.xlsx").then((rows) => {
        //     rows.map(async (i) => {
        //         let productToCreate = new Product({
        //             name: i[0],
        //             pros: true,
        //             // studies,
        //             hair_type: i[2],
        //             density: i[4],
        //             link1: i[1],
        //             length: i[3],
        //         });
        //         console.log(productToCreate);
        //         try {
        //             // const newProduct = await productToCreate.save();
        //         } catch (error) {
        //             console.log("error", error);
        //         }
        //     });
        // });
        // readXlsxFile("./studeis.xlsx").then((rows) => {
        //     rows.map(async (i) => {
        //         let productToCreate = new Product({
        //             name: i[0],
        //             studies: true,
        //             hair_type: i[2],
        //             processing: i[4],
        //             link1: i[1],
        //             length: i[3],
        //         });
        //         console.log(productToCreate);
        //         try {
        //             // const newProduct = await productToCreate.save();
        //         } catch (error) {
        //             console.log("error", error);
        //         }
        //     });
        // });
    })
    .catch((err) => {
        console.log("Error", err);
    });
