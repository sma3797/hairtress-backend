const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

const Schema = mongoose.Schema;

const productTypeSchema = new Schema({
    type: {
        type: String,
        required: true,
    },
    tid: {
        type: Schema.Types.Number,
    },
});

autoIncrement.initialize(mongoose.connection);
productTypeSchema.plugin(autoIncrement.plugin, { model: "ProductType", field: "tid", startAt: 0 });

module.exports = mongoose.model("ProductType", productTypeSchema);
