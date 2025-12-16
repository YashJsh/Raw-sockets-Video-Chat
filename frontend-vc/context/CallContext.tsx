"use client"

import { createContext, useEffect, useRef, useState } from "react"

interface callContext{
    socket : WebSocket | null,
}

const SOCKET_URL = "ws://localhost:3001";

export const SocketContext = createContext<callContext| null>(null);


const ProvideContext = ({children} : {children : React.ReactNode})=>{
    const [socket, setSocket] = useState<WebSocket | null>(null);
    
    useEffect(()=>{
        const ws = new WebSocket(SOCKET_URL);
        setSocket(ws);
        ws.onopen = ()=>{
            console.log("Websocket connected");
        };
        ws.onclose = ()=>{
            console.log("Connection Closed");
        },
        ws.onerror = ()=>{
            console.log("Error is there");
        }
        return () => {
            ws.close();
        };
    }, []);

    return <SocketContext.Provider value={{socket}}>
        {children}
    </SocketContext.Provider>
}
export default ProvideContext;