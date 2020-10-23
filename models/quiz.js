const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const quizSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        question_1: { type: Number },
        question_2: { type: Number },
        question_3: { type: Number },
        question_4: { type: Number },
        question_5: { type: Number },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Quiz", quizSchema);
