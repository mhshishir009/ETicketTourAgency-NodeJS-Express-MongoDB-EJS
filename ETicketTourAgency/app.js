const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const tourPackageRoutes = require("./routes/tourPackageRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

app.get("/", (req, res) => {
    res.redirect("/tour-packages");
});

app.use("/tour-packages", tourPackageRoutes);
app.use("/bookings", bookingRoutes);

app.use((req, res) => {
    res.status(404).send("Page not found.");
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully.");

        app.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "MongoDB connection error:",
            error.message
        );

        process.exit(1);
    }
};

startServer();