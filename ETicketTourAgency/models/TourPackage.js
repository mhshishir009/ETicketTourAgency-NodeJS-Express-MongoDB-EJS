const mongoose = require("mongoose");

const tourPackageSchema = new mongoose.Schema(
    {
        packageCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },

        operatorName: {
            type: String,
            required: true,
            trim: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        transportType: {
            type: String,
            required: true,
            enum: [
                "Bus",
                "Train",
                "Launch",
                "Flight",
                "Tour Package",
            ],
        },

        fromLocation: {
            type: String,
            required: true,
            trim: true,
        },

        toLocation: {
            type: String,
            required: true,
            trim: true,
        },

        journeyDate: {
            type: Date,
            required: true,
        },

        departureTime: {
            type: String,
            required: true,
        },

        arrivalTime: {
            type: String,
            default: "",
        },

        fare: {
            type: Number,
            required: true,
            min: 0,
        },

        totalSeats: {
            type: Number,
            required: true,
            min: 1,
        },

        availableSeats: {
            type: Number,
            required: true,
            min: 0,
        },

        image: {
            type: String,
            default: "",
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        status: {
            type: String,
            enum: [
                "Active",
                "Inactive",
                "Completed",
                "Cancelled",
            ],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "TourPackage",
    tourPackageSchema
);