import { useState } from 'react'
import './App.css'
import Sidebar from "./Sidebar";
import ChatWindow from './ChatWindow.jsx';
import Chat from './Chat';
import { MyContext } from './MyContext.jsx';
import {v1 as uuidv1} from "uuid";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState(""); //stores all chats of current thread
  const[newChat, setNewChat] = useState(true);
  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    prevChats, setPrevChats,
    newChat, setNewChat
  };

  return (
    <div className="app">
      
      <MyContext.Provider value= {providerValues}>
        <Sidebar></Sidebar>
        <ChatWindow></ChatWindow>
      </MyContext.Provider>
    </div>
  )
}

export default App
