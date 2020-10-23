const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

const Schema = mongoose.Schema;

const productBestHairType = new Schema({
    type: {
        type: String,
        required: true,
    },
    bid: {
        type: Schema.Types.Number,
    },
});

autoIncrement.initialize(mongoose.connection);
productBestHairType.plugin(autoIncrement.plugin, { model: "ProductBestHairType", field: "bid", startAt: 0 });

module.exports = mongoose.model("ProductBestHairType", productBestHairType);
