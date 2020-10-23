const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
    product_name: {
        type: String,
        required: true,
    },
    product_company: {
        ref: "ProductCompany",
        type: Schema.Types.ObjectId,
        // required: true,
    },
    product_price: {
        type: Number,
        required: true,
    },
    product_type: {
        ref: "ProductType",
        type: Schema.Types.ObjectId,
        // required: true,
    },
    pros: {
        type: Boolean,
    },
    crafts: {
        type: Boolean,
    },
    product_tag: {
        ref: "ProductTag",
        type: Schema.Types.ObjectId,
        // required: true,
    },
    product_best_hair_type: {
        ref: "ProductBestHairType",
        type: Schema.Types.ObjectId,
        // required: true,
    },
    misc_product_data: {
        type: Number,
    },
});

module.exports = mongoose.model("Product", productSchema);
