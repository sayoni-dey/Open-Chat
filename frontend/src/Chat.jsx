import "./Chat.css";
import { useContext } from "react";
import { MyContext } from "./MyContext";

function Chat() {
    const {newChat, prevChats} = useContext(MyContext);
    return (
        <>
        {newChat && <h1>Start A New Chat!</h1>}
        <div className="chats">
            <div className="userDiv">
                <p className="userMessage">User Message</p>
            </div>
            <div className="gptdiv">
                <p className="gptMessage">GPT generated message</p>
            </div>
        </div>
        </>
    )
}

export default Chat; 