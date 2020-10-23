const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

const Schema = mongoose.Schema;

const productCompanySchema = new Schema({
    type: {
        type: String,
        required: true,
    },
    cid: {
        type: Schema.Types.Number,
    },
});

autoIncrement.initialize(mongoose.connection);
productCompanySchema.plugin(autoIncrement.plugin, { model: "ProductCompany", field: "cid", startAt: 0 });

module.exports = mongoose.model("ProductCompany", productCompanySchema);
