require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const expenseModel = require("./models/expense.model");

async function runTest() {

    try {

        await connectDB();

        const testDoc = new expenseModel({
            title: "Dinner at Restaurant",
            amount: 850,
            category: "Food",
            description: "Dinner with friends"
        });

        const savedDoc = await testDoc.save();

        console.log("Document saved:", savedDoc);

    } catch (err) {

        console.log("Error:", err);

    } finally {

        await mongoose.connection.close();

        console.log("Database connection closed");

    }
}

runTest();