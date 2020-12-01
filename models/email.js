const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const emailSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("Email", emailSchema);
