const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },

        tourPackage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TourPackage",
            required: true,
        },

        passengerName: {
            type: String,
            required: true,
            trim: true,
        },

        phoneNumber: {
            type: String,
            required: true,
            trim: true,
        },

        seatNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        fare: {
            type: Number,
            required: true,
            min: 0,
        },

        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Paid",
                "Refunded",
            ],
            default: "Pending",
        },

        bookingStatus: {
            type: String,
            enum: [
                "Confirmed",
                "Cancelled",
            ],
            default: "Confirmed",
        },

        bookedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

bookingSchema.index(
    {
        tourPackage: 1,
        seatNumber: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            bookingStatus: "Confirmed",
        },
    }
);

module.exports = mongoose.model(
    "Booking",
    bookingSchema
);