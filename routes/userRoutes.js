const router = require("express").Router();
const { check } = require("express-validator");
const imageUpload = require("../middlewares/image-upload");

const userControllers = require("../controllers/userControllers");
const checkAuth = require("../middlewares/check-auth");

router.post(
    "/signup",
    [
        check("fname").not().isEmpty(),
        check("lname").not().isEmpty(),
        check("password").isLength({ min: 6 }),
        check("email").normalizeEmail().isEmail(),
    ],
    userControllers.signup,
);
router.post("/login", [check("password").isLength({ min: 6 }), check("email").isEmail()], userControllers.login);
router.post("/reset", userControllers.reset);
router.post("/reset-password/:token", [check("password").isLength({ min: 6 })], userControllers.resetPassword);
router.post("/change-password", [check("password").isLength({ min: 6 })], userControllers.changePassword);

router.get("/all-product", userControllers.allProducts); // Checking route
router.post("/all-products", userControllers.allProducts);

router.post("/email", [check("email").isEmail()], userControllers.email);

// router.use(checkAuth);
router.post("/recommended-products", userControllers.recommendedProducts);

router.post("/get-user", userControllers.getUser);
router.post(
    "/change-information",
    imageUpload.single("picture"),
    [
        check("fname").not().isEmpty(),
        check("lname").not().isEmpty(),
        // check("address").isLength({ min: 6 }),
        // check("phone_number").isMobilePhone("any"),
    ],
    userControllers.changeInformation,
);

router.post("/quiz-submit", userControllers.quizSubmit);

module.exports = router;
