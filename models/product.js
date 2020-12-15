const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema(
    {
        name: {
            type: String,
            // required: true,
        },
        pros: {
            type: Boolean,
        },
        crafts: {
            type: Boolean,
        },
        product: {
            type: Boolean,
        },
        studies: {
            type: Boolean,
        },
        picture: {
            type: String,
        },
        // product_price: {
        //     type: Number,
        //     // required: true,
        // },
        product_type: {
            type: String,
            // required: true,
        },
        // product_tag: {
        //     ref: "ProductTag",
        //     type: Schema.Types.ObjectId,
        //     // required: true,
        // },
        hair_type: {
            type: String,
            // required: true,
        },
        density: {
            type: String,
            // required: true,
        },
        porosity: {
            type: String,
            // required: true,
        },
        // misc_product_data: {
        //     type: Number,
        // },
        link1: {
            type: String,
        },
        link2: {
            type: String,
        },
        link3: {
            type: String,
        },
        product_company: {
            // ref: "ProductCompany",
            // type: Schema.Types.ObjectId,
            type: String,
        },
        processing: {
            type: String,
        },
        creator: {
            type: String,
        },
        length: {
            type: String,
        },
        desc: {
            type: String,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
