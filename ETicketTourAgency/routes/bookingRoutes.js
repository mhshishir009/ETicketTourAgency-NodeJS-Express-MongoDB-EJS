const express = require("express");

const {
    getAllBookings,
    getCreateBooking,
    createBooking,
    getTicket,
    updatePaymentStatus,
    cancelBooking,
} = require("../controllers/bookingController");

const router = express.Router();

router.get("/", getAllBookings);
router.get("/create", getCreateBooking);
router.post("/create", createBooking);
router.get("/ticket/:id", getTicket);
router.post(
    "/payment-status/:id",
    updatePaymentStatus
);
router.post("/cancel/:id", cancelBooking);

module.exports = router;