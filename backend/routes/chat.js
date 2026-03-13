import express from "express";
import Threads from "../models/threads.js";
import { hybridChat } from "./router.js";

const router = express.Router();

//test
// router.post("/test", async(req,res) => {
//     try {
//         const thread = new Threads ({
//             threadId: "xyz",
//             title: "Testing New Thread"
//         });

//         const response = await thread.save();
//         res.send(response);
        
//     } catch(err) {
//         console.log(err);
//         res.status (500).json ({error : "Failed to save in DB"});
//     }
// });

router.post ("/test", async (req, res) => {
    const {threadId, prompt} = req.body;
    try {
        const reply = await hybridChat(prompt);
        res.json({reply});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"});
    }
});

// router.post ("/test", async (req, res) => {
//     const {prompt} = req.body;
//     try {
//         const thread = new Threads ({
//             threadId: "xyz",
//             title: "Testing New Thread"
//         });
//         const reply = await hybridChat(prompt);
//         res.json({reply});
//         const response = await thread.save();
//         res.send(response);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({error: "Something went wrong"});
//     }
// })

// get all threads, used to show the history of threads part
router.get("./threads", async(req,res) => {
    try{
        //Finds all the chats and sorts them in descending order...newest chat at top
        const threads = (await Threads.find({})).sort({updatedAt:-1});
        res.json(threads);
    } catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to fetch threads"});
    }
});

//to display all the chats of one thread (through ID)
router.get("/thread/:threadId", async(req, res) => {
    const {threadId} = req.params;

    try {
        
        let thread = await Threads.findOne({threadId});

        if(!thread){
            res.status(404).json({error: "Chat not found"});
        }

        res.json(thread.messages);

    }catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.delete("./thread/:threadId", async(req, res) => {
    const {threadId} = req.params;
    try{
        const deletedThread = await Threads.findOneAndDelete({threadId});

        if(!deletedThread){
            res.status(404).json({error: "Chat not found"});
        }

        res.status(200).json({success: "Thread deleted successfully"});
    } catch(err){
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
})

export default router;