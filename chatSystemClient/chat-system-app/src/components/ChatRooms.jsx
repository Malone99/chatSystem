import { React, useState } from "react";
import {over}from 'stompjs';
import {Sockjs} from 'sockjs-client';
import { tab } from "@testing-library/user-event/dist/tab";

var stompClient=null;

const ChatRoom = () => {
    const [publicChats,setPublicChats]=useState([]);
    const [privateChats,setPrivateChats]=useState(new Map());
    const [tab,setTab]=useState("CHATROOM");
  const [userData, setUserData] = useState({
    userName: "",
    receiverName: "",
    connected: false,
    message: "",
  });

  const handleValue=(e)=>{
     const {value,name}=e.target;
     setUserData({...userData,name:value});
  }
  const handleMessage=(e)=>{
    const value=e.target;
    setUserData({...userData,"message":value});
 }
  const register =()=>{
    let Sock= new Sockjs("http://localhost:8080/ws");
    stompClient=over(Sock);
    stompClient.connect({},onConnected,onError);

  }

  const onConnected=()=>{
    setUserData({...userData,"connected":true});
    stompClient.subscribe('/chatroom/public',onPublicMessageReceived);
    stompClient.subscribe('user/'+userData.userName+'/private', onPrivateMessageReceived);
    userJoin();
  }

  const userJoin=()=>{
    
        let chatMessage ={
            senderName: userData.userName,
            status: 'JOIN '
        };
        stompClient.send('app/message',{},JSON.stringify(chatMessage));
        

}

  const onPublicMessageReceived =(payload)=>{
        let payloadData=JSON.parse(payload.body);
        switch(payloadData.status){
            case "JOIN":
                if(privateChats.get(payloadData.senderName)){
                   privateChats.set(payloadData.senderName,[]);
                   setPrivateChats(new Map(privateChats));
                }
                break;
                case "MESSAGE":
                    publicChats.push(payloadData);
                    setPublicChats([...publicChats]);
                    break;
                  
        }
  }
  const onPrivateMessageReceived=(payload)=>{
        let payloadData=JSON.parse(payload.body);
        if(privateChats.get(payloadData.senderName)){
            privateChats.get(payload.senderName).push(payloadData);
            setPrivateChats( new Map(privateChats));
        }else {
            let list=[];
            list.push(payloadData);
            privateChats.set(payloadData.senderName,list);
            setPrivateChats(new Map(privateChats));
        }
           
  }


  const onError =(err)=>{
    console.log(err);  
  }
  const sendPublicMessage=()=>{
        if(stompClient){
            let chatMessage={
                senderName: userData.userName,
                message: userData.message,
                status: 'MESSAGE '
            };
            stompClient.send('app/message',{},JSON.stringify(chatMessage))
            setUserData({...userData, "message":""})
        }
  }
  const sendPrivateMessage=()=>{
    if(stompClient){
        let chatMessage={
            senderName: userData.userName,
            receiverName:tab,
            message: userData.message,
            status: 'MESSAGE '
        };
        if(userData.userName!==tab){
            privateChats.set(tab).push(chatMessage);
            setPrivateChats(new Map(privateChats));
        }
        stompClient.send('app/private-message',{},JSON.stringify(chatMessage))
        setUserData({...userData, "message":""})
    }
}


  return (
    <div className="container ">
      {userData.connected ? 
      <div className="chat-box">
        <div className="member-list">
            <ul>
                <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM" && "active"}`}>
                    Chatroom
                </li>
                {[...privateChats.keys()].map((name,index)=>(
                    <li onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>
                        {name}
                    </li>
                ))}
            </ul>

        </div>

           {tab==="CHATROOM" &&<div className="chat-content">
           <ul className="chat-messages ">
            {[publicChats.keys()].map((chat,index)=>(
           
                    <li className="message" key={index}>
                        {chat.senderName!==userData.userName && <div className="avatar">{chat.senderName}</div>}
                        <div className="message-data">{chat.message}</div>
                        {chat.senderName===userData.userName && <div className="avatar self">{chat.senderName}</div>}
                    </li>
                ))}
                </ul>
                <div className="send-message">
                    <input type="text" name="message" className="input-message" placeholder="type your message to everyone" value={userData.message}
                    onCanPlay={handleValue}/>
                    <button type="button" className="send-button" onClick={sendPublicMessage}>
                        send
                    </button>
                </div>

            </div>}
            {tab!=="CHATROOM" &&<div className="chat-content">
                <ul className="chat-messages ">
            {[...privateChats.get(tab)].map((chat,index)=>(
                    <li className="message" key={index}>
                        {chat.senderName!==userData.userName && <div className="avatar">{chat.senderName}</div>}
                        <div className="message-data">{chat.message}</div>
                        {chat.senderName===userData.userName && <div className="avatar self">{chat.senderName}</div>}
                    </li>
                ))}
                </ul>
                <div className="send-message">
                    <input type="text" name="message" className="input-message" placeholder={`type your message for ${tab}`} value={userData.message}
                    onCanPlay={handleValue}/>
                    <button type="button" className="send-button" onClick={sendPrivateMessage}>
                        send
                    </button> 
                </div>
            </div>}
      </div> : 
        <div className="register">
            <input type="text"
            name="username"
            placeholder="Enter Name"
            id="user-name"
            value={userData.userName}
            onChange={handleValue}
            />
            <button type="button" onClick={register}>
            connect
            </button>
        </div>}
    </div>
  );
};

export default ChatRoom;
