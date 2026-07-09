import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from  "mongoose";

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());

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
