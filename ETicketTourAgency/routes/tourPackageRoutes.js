const express = require("express");
const router = express.Router();

const upload = require("../middleware/tourPackageUpload");

const {
    getAllTourPackages,
    getCreateTourPackage,
    createTourPackage,
    getEditTourPackage,
    updateTourPackage,
    deleteTourPackage,
} = require("../controllers/tourPackageController");

router.get("/", getAllTourPackages);

router.get("/create", getCreateTourPackage);

router.post(
    "/create",
    upload.single("image"),
    createTourPackage
);

router.get("/edit/:id", getEditTourPackage);

router.post(
    "/edit/:id",
    upload.single("image"),
    updateTourPackage
);

router.post("/delete/:id", deleteTourPackage);

module.exports = router;