import "./ChatWindow.css";
import Chat from './Chat.jsx'
import { MyContext } from "./MyContext.jsx";
import { useContext, useEffect, useState } from "react";
import {RingLoader} from "react-spinners";

function ChatWindow() {
    const {prompt, setPrompt, reply, setReply, currThreadId,prevChats,setPrevChats} = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const getReply = async() => {
        setLoading(true);
        console.log("prompt", prompt, "threadId", currThreadId);
        const options = {
            method: "POST",
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify ({
                prompt: prompt,
                threadId: currThreadId
            })
        };

        try {
            const response = await fetch ("http://localhost:8080/api/test", options);
            const res = await response.json();
            console.log(res);
            setReply(res.reply);
        }catch(err) {
            console.log(err);
        }
        setLoading(false);
    }

    useEffect(() =>{
        if(prompt && reply){
            setPrevChats(prevChats =>(
                [...prevChats, {
                    role: "user",
                    content: prompt
                },{
                    role:"assistant",
                    content: reply
                }]
            ));
        }
        setPrompt("");
    }, [reply])
    return (
        <div className="chatwindow">
            <div className="navbar">
                <span>ChatGPT <i className="fa-solid fa-chevron-down"></i></span>
                <div className="userIconDiv">
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            <Chat></Chat>

            <RingLoader color="#fff" loading={loading}>
            </RingLoader>

            <div className="chatInput">
                <div className="inputBox">
                    <input placeholder = "Ask Anything"
                        value = {prompt}
                        onChange = {(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter'? getReply():''}>
                    </input>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    ChatGPT can make mistakes. Check important info. See cookies Prefernces.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow; 