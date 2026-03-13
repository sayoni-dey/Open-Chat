import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from  "mongoose";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = 8080;
// const mongoose = require("mongoose");

app.use(express.json());
app.use(cors());
app.use ("/api", chatRoutes);

const connectDb = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Connected to Database")
    }catch(err){
        console.log( "Failed to connect ", err)
    }
}

app.listen(PORT, () => {
    console.log(`app is listening on port ${PORT}`);
    connectDb();
});


// app.post ("/test", async (req, res) => {
//     const {prompt} = req.body;
//     try {
//         const reply = await hybridChat(prompt);
//         res.json({reply});
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({error: "Something went wrong"});
//     }
// })