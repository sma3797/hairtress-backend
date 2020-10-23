const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

const Schema = mongoose.Schema;

const productTagSchema = new Schema({
    type: {
        type: String,
        required: true,
    },
    pid: {
        type: Schema.Types.Number,
    },
});

autoIncrement.initialize(mongoose.connection);
productTagSchema.plugin(autoIncrement.plugin, { model: "ProductTag", field: "pid", startAt: 0 });

module.exports = mongoose.model("ProductTag", productTagSchema);
