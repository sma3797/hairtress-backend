const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
    {
        name: {
            type: Schema.Types.String,
        },
        oid: {
            type: String,
        },
        oidn: {
            type: Schema.Types.Number,
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true },
);

autoIncrement.initialize(mongoose.connection);
orderSchema.plugin(autoIncrement.plugin, { model: "Order", field: "oidn", startAt: 11000 });

module.exports = mongoose.model("Order", orderSchema);
