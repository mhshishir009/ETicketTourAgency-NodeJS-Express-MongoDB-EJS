const crypto = require("crypto");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const TourPackage = require("../models/TourPackage");

const allowedPaymentStatuses = [
    "Pending",
    "Paid",
    "Refunded",
];

const generateTicketNumber = async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const datePart = new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");

        const randomPart = crypto
            .randomBytes(3)
            .toString("hex")
            .toUpperCase();

        const ticketNumber = `TQ-${datePart}-${randomPart}`;

        const existingTicket = await Booking.exists({
            ticketNumber,
        });

        if (!existingTicket) {
            return ticketNumber;
        }
    }

    throw new Error(
        "Unable to generate a unique ticket number."
    );
};

const getAvailableTourPackages = async () => {
    return TourPackage.find({
        status: "Active",
        availableSeats: {
            $gt: 0,
        },
    }).sort({
        journeyDate: 1,
        departureTime: 1,
    });
};

const renderCreatePage = async (
    res,
    error,
    formData = {},
    statusCode = 400
) => {
    const tourPackages =
        await getAvailableTourPackages();

    return res.status(statusCode).render(
        "bookings/create",
        {
            title: "Create Booking",
            tourPackages,
            error,
            formData,
        }
    );
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("tourPackage")
            .sort({
                createdAt: -1,
            });

        res.render("bookings/index", {
            title: "Bookings",
            bookings,
        });
    } catch (error) {
        console.error(
            "Booking list error:",
            error.message
        );

        res.status(500).send(
            "Unable to load bookings."
        );
    }
};

exports.getCreateBooking = async (req, res) => {
    try {
        const tourPackages =
            await getAvailableTourPackages();

        res.render("bookings/create", {
            title: "Create Booking",
            tourPackages,
            error: null,
            formData: {},
        });
    } catch (error) {
        console.error(
            "Booking create page error:",
            error.message
        );

        res.status(500).send(
            "Unable to load the booking form."
        );
    }
};

exports.createBooking = async (req, res) => {
    let reservedPackageId = null;
    let seatReserved = false;

    try {
        const {
            tourPackage,
            passengerName,
            phoneNumber,
            seatNumber,
            paymentStatus,
        } = req.body;

        if (
            !tourPackage ||
            !passengerName ||
            !phoneNumber ||
            !seatNumber
        ) {
            return renderCreatePage(
                res,
                "Please complete all required fields.",
                req.body
            );
        }

        if (
            !mongoose.isValidObjectId(tourPackage)
        ) {
            return renderCreatePage(
                res,
                "Invalid tour package selected.",
                req.body
            );
        }

        if (
            paymentStatus &&
            !allowedPaymentStatuses.includes(
                paymentStatus
            )
        ) {
            return renderCreatePage(
                res,
                "Invalid payment status selected.",
                req.body
            );
        }

        const normalizedSeatNumber = seatNumber
            .trim()
            .toUpperCase();

        const selectedPackage =
            await TourPackage.findOne({
                _id: tourPackage,
                status: "Active",
            });

        if (!selectedPackage) {
            return renderCreatePage(
                res,
                "The selected tour package is not available.",
                req.body
            );
        }

        if (selectedPackage.availableSeats <= 0) {
            return renderCreatePage(
                res,
                "No seats are available for this package.",
                req.body
            );
        }

        const existingSeatBooking =
            await Booking.findOne({
                tourPackage,
                seatNumber: normalizedSeatNumber,
                bookingStatus: "Confirmed",
            });

        if (existingSeatBooking) {
            return renderCreatePage(
                res,
                "This seat number is already booked.",
                req.body
            );
        }

        const updatedPackage =
            await TourPackage.findOneAndUpdate(
                {
                    _id: tourPackage,
                    status: "Active",
                    availableSeats: {
                        $gt: 0,
                    },
                },
                {
                    $inc: {
                        availableSeats: -1,
                    },
                },
                {
                    new: true,
                }
            );

        if (!updatedPackage) {
            return renderCreatePage(
                res,
                "The selected package has no available seats.",
                req.body
            );
        }

        reservedPackageId = tourPackage;
        seatReserved = true;

        const ticketNumber =
            await generateTicketNumber();

        const booking = await Booking.create({
            ticketNumber,
            tourPackage,
            passengerName:
                passengerName.trim(),
            phoneNumber: phoneNumber.trim(),
            seatNumber:
                normalizedSeatNumber,
            fare: selectedPackage.fare,
            paymentStatus:
                paymentStatus || "Pending",
            bookingStatus: "Confirmed",
        });

        seatReserved = false;

        res.redirect(
            `/bookings/ticket/${booking._id}`
        );
    } catch (error) {
        if (seatReserved && reservedPackageId) {
            await TourPackage.findByIdAndUpdate(
                reservedPackageId,
                {
                    $inc: {
                        availableSeats: 1,
                    },
                }
            );
        }

        console.error(
            "Booking creation error:",
            error.message
        );

        let errorMessage =
            "Unable to create the booking.";

        if (error.code === 11000) {
            errorMessage =
                "This seat number is already booked.";
        }

        await renderCreatePage(
            res,
            errorMessage,
            req.body
        );
    }
};

exports.getTicket = async (req, res) => {
    try {
        if (
            !mongoose.isValidObjectId(
                req.params.id
            )
        ) {
            return res.status(400).send(
                "Invalid booking ID."
            );
        }

        const booking = await Booking.findById(
            req.params.id
        ).populate("tourPackage");

        if (!booking) {
            return res.status(404).send(
                "Booking not found."
            );
        }

        res.render("bookings/ticket", {
            title: "E-Ticket",
            booking,
        });
    } catch (error) {
        console.error(
            "Ticket page error:",
            error.message
        );

        res.status(500).send(
            "Unable to load the ticket."
        );
    }
};

exports.updatePaymentStatus = async (
    req,
    res
) => {
    try {
        if (
            !mongoose.isValidObjectId(
                req.params.id
            )
        ) {
            return res.status(400).send(
                "Invalid booking ID."
            );
        }

        const { paymentStatus } = req.body;

        if (
            !allowedPaymentStatuses.includes(
                paymentStatus
            )
        ) {
            return res.status(400).send(
                "Invalid payment status."
            );
        }

        const booking =
            await Booking.findByIdAndUpdate(
                req.params.id,
                {
                    paymentStatus,
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!booking) {
            return res.status(404).send(
                "Booking not found."
            );
        }

        res.redirect("/bookings");
    } catch (error) {
        console.error(
            "Payment status update error:",
            error.message
        );

        res.status(500).send(
            "Unable to update payment status."
        );
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        if (
            !mongoose.isValidObjectId(
                req.params.id
            )
        ) {
            return res.status(400).send(
                "Invalid booking ID."
            );
        }

        const booking = await Booking.findById(
            req.params.id
        );

        if (!booking) {
            return res.status(404).send(
                "Booking not found."
            );
        }

        if (
            booking.bookingStatus ===
            "Confirmed"
        ) {
            booking.bookingStatus =
                "Cancelled";

            await booking.save();

            await TourPackage.findByIdAndUpdate(
                booking.tourPackage,
                {
                    $inc: {
                        availableSeats: 1,
                    },
                }
            );
        }

        res.redirect("/bookings");
    } catch (error) {
        console.error(
            "Booking cancellation error:",
            error.message
        );

        res.status(500).send(
            "Unable to cancel the booking."
        );
    }
};