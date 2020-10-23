const router = require("express").Router();
const { check } = require("express-validator");
const imageUpload = require("../middlewares/image-upload");

const adminControllers = require("../controllers/adminControllers");
const checkAuth = require("../middlewares/check-admin");

router.post(
    "/signup",
    [check("name").not().isEmpty(), check("password").isLength({ min: 6 }), check("email").normalizeEmail().isEmail()],
    adminControllers.signup,
);
router.post("/login", [check("password").isLength({ min: 6 }), check("email").normalizeEmail().isEmail()], adminControllers.login);
router.post("/reset", adminControllers.reset);
router.post("/reset-password/:token", [check("password").isLength({ min: 6 })], adminControllers.resetPassword);

router.use(checkAuth);

router.post("/all-users", adminControllers.allUsers);

router.post("/change-password", [check("password").isLength({ min: 6 })], adminControllers.changePassword);

router.post("/add-product-type", adminControllers.addProductType);
router.post("/add-product-tag", adminControllers.addProductTag);
router.post("/add-product-company", adminControllers.addProductCompany);
router.post("/add-product-best-hair-type", adminControllers.addProductBestHairType);

router.post("/edit-product-type", adminControllers.editProductType);
router.post("/edit-product-tag", adminControllers.editProductTag);
router.post("/edit-product-company", adminControllers.editProductCompany);
router.post("/edit-product-best-hair-type", adminControllers.editProductBestHairType);

router.post("/get-product-stuff", adminControllers.getProductStuff);

router.post("/all-products", adminControllers.allProducts);
router.post("/add-product", adminControllers.addProduct);
router.post("/delete-product", adminControllers.deleteProduct);
router.post("/edit-product", adminControllers.editProduct);

module.exports = router;
