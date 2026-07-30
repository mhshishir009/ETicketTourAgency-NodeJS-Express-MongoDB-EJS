const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const TourPackage = require("../models/TourPackage");

const getUploadedImagePath = (req) => {
    return req.file
        ? `/uploads/tour-packages/${req.file.filename}`
        : "";
};

const deleteImageFile = async (imagePath) => {
    if (!imagePath) {
        return;
    }

    const relativePath = imagePath.replace(/^\/+/, "");
    const fullPath = path.join(process.cwd(), relativePath);

    try {
        await fs.promises.unlink(fullPath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Image deletion error:", error.message);
        }
    }
};

const hasValidId = (id) => {
    return mongoose.isValidObjectId(id);
};

exports.getAllTourPackages = async (req, res) => {
    try {
        const tourPackages = await TourPackage.find().sort({
            createdAt: -1,
        });

        res.render("tour-packages/index", {
            title: "Tour Packages",
            tourPackages,
        });
    } catch (error) {
        console.error("Tour package list error:", error.message);

        res.status(500).send(
            "Unable to load tour packages."
        );
    }
};

exports.getCreateTourPackage = (req, res) => {
    res.render("tour-packages/create", {
        title: "Add Tour Package",
        error: null,
    });
};

exports.createTourPackage = async (req, res) => {
    const uploadedImage = getUploadedImagePath(req);

    try {
        const {
            packageCode,
            operatorName,
            title,
            transportType,
            fromLocation,
            toLocation,
            journeyDate,
            departureTime,
            arrivalTime,
            fare,
            totalSeats,
            availableSeats,
            description,
            status,
        } = req.body;

        if (Number(availableSeats) > Number(totalSeats)) {
            await deleteImageFile(uploadedImage);

            return res.status(400).render(
                "tour-packages/create",
                {
                    title: "Add Tour Package",
                    error:
                        "Available seats cannot exceed total seats.",
                }
            );
        }

        await TourPackage.create({
            packageCode,
            operatorName,
            title,
            transportType,
            fromLocation,
            toLocation,
            journeyDate,
            departureTime,
            arrivalTime,
            fare,
            totalSeats,
            availableSeats,
            image: uploadedImage,
            description,
            status,
        });

        res.redirect("/tour-packages");
    } catch (error) {
        await deleteImageFile(uploadedImage);

        console.error(
            "Tour package creation error:",
            error.message
        );

        let errorMessage =
            "Unable to create the tour package.";

        if (error.code === 11000) {
            errorMessage =
                "This package code is already in use.";
        }

        res.status(400).render(
            "tour-packages/create",
            {
                title: "Add Tour Package",
                error: errorMessage,
            }
        );
    }
};

exports.getEditTourPackage = async (req, res) => {
    try {
        if (!hasValidId(req.params.id)) {
            return res.status(400).send(
                "Invalid tour package ID."
            );
        }

        const tourPackage = await TourPackage.findById(
            req.params.id
        );

        if (!tourPackage) {
            return res.status(404).send(
                "Tour package not found."
            );
        }

        res.render("tour-packages/edit", {
            title: "Edit Tour Package",
            tourPackage,
            error: null,
        });
    } catch (error) {
        console.error(
            "Tour package edit page error:",
            error.message
        );

        res.status(500).send(
            "Unable to load the edit page."
        );
    }
};

exports.updateTourPackage = async (req, res) => {
    const uploadedImage = getUploadedImagePath(req);
    let existingTourPackage = null;

    try {
        if (!hasValidId(req.params.id)) {
            await deleteImageFile(uploadedImage);

            return res.status(400).send(
                "Invalid tour package ID."
            );
        }

        existingTourPackage = await TourPackage.findById(
            req.params.id
        );

        if (!existingTourPackage) {
            await deleteImageFile(uploadedImage);

            return res.status(404).send(
                "Tour package not found."
            );
        }

        const {
            packageCode,
            operatorName,
            title,
            transportType,
            fromLocation,
            toLocation,
            journeyDate,
            departureTime,
            arrivalTime,
            fare,
            totalSeats,
            availableSeats,
            description,
            status,
        } = req.body;

        if (Number(availableSeats) > Number(totalSeats)) {
            await deleteImageFile(uploadedImage);

            return res.status(400).render(
                "tour-packages/edit",
                {
                    title: "Edit Tour Package",
                    tourPackage: {
                        _id: req.params.id,
                        ...req.body,
                        image: existingTourPackage.image,
                    },
                    error:
                        "Available seats cannot exceed total seats.",
                }
            );
        }

        const image =
            uploadedImage || existingTourPackage.image;

        const updatedTourPackage =
            await TourPackage.findByIdAndUpdate(
                req.params.id,
                {
                    packageCode,
                    operatorName,
                    title,
                    transportType,
                    fromLocation,
                    toLocation,
                    journeyDate,
                    departureTime,
                    arrivalTime,
                    fare,
                    totalSeats,
                    availableSeats,
                    image,
                    description,
                    status,
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!updatedTourPackage) {
            await deleteImageFile(uploadedImage);

            return res.status(404).send(
                "Tour package not found."
            );
        }

        if (
            uploadedImage &&
            existingTourPackage.image &&
            existingTourPackage.image !== uploadedImage
        ) {
            await deleteImageFile(
                existingTourPackage.image
            );
        }

        res.redirect("/tour-packages");
    } catch (error) {
        await deleteImageFile(uploadedImage);

        console.error(
            "Tour package update error:",
            error.message
        );

        let errorMessage =
            "Unable to update the tour package.";

        if (error.code === 11000) {
            errorMessage =
                "This package code is already in use.";
        }

        res.status(400).render(
            "tour-packages/edit",
            {
                title: "Edit Tour Package",
                tourPackage: {
                    _id: req.params.id,
                    ...req.body,
                    image: existingTourPackage
                        ? existingTourPackage.image
                        : "",
                },
                error: errorMessage,
            }
        );
    }
};

exports.deleteTourPackage = async (req, res) => {
    try {
        if (!hasValidId(req.params.id)) {
            return res.status(400).send(
                "Invalid tour package ID."
            );
        }

        const deletedTourPackage =
            await TourPackage.findByIdAndDelete(
                req.params.id
            );

        if (!deletedTourPackage) {
            return res.status(404).send(
                "Tour package not found."
            );
        }

        await deleteImageFile(
            deletedTourPackage.image
        );

        res.redirect("/tour-packages");
    } catch (error) {
        console.error(
            "Tour package deletion error:",
            error.message
        );

        res.status(500).send(
            "Unable to delete the tour package."
        );
    }
};