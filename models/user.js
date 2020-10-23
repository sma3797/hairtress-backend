const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        fname: {
            type: String,
            required: true,
        },
        lname: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        picture: {
            type: String,
        },
        phone_number: {
            type: String,
        },
        address: {
            type: String,
        },
        hair_data: {},
        hair_type: {},
        quiz: {
            ref: "Quiz",
            type: Schema.Types.ObjectId,
        },
        block: {
            type: Boolean,
        },
        verified: {
            type: Boolean,
        },
        resetToken: String,
        resetTokenExpirationTime: Date,
    },
    { timestamps: true },
);

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
