"use client"

import { createContext, useState } from "react"

interface RoomContext{
    roomId : string | null,
    setRoomId: React.Dispatch<React.SetStateAction<string | null>>;
    setUserId: React.Dispatch<React.SetStateAction<string | null>>;
    userId : string | null;
}

export const roomContext = createContext<RoomContext | null>(null);

const CreateRoomContext = ({children} : {children : React.ReactNode})=>{ 
    const [roomId, setRoomId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    return <roomContext.Provider value={{roomId, setRoomId, userId, setUserId}}>
        {children}
    </roomContext.Provider>
}

export default CreateRoomContext;