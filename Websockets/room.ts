import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

interface User{
    id : string,
    socket : WebSocket
};

export interface room_type {
    id : string, //extra not needed
    user : User[],
    ready : boolean,
}

export class Room{
    public rooms : Map<string, room_type> = new Map();
    public userCount : number = 0;
    
    public createRoom(ws : WebSocket){
        const userId = uuidv4();
        const roomId = uuidv4();
        const user : User = {
            id : userId,
            socket : ws
        }
        const room : room_type = {
            id : roomId,
            user : [user],
            ready : false,
        }

        this.rooms.set(roomId, room);
        (ws as any).roomId = roomId;
        (ws as any).userId = userId;

        console.log(room.ready);
        ws.send(JSON.stringify({
            event: "room-created",
            data: {
                event : "room-created",
                roomId : roomId,
                userId : userId,
                ready : room.ready
            }
        }));
    };

    public JoinRoom(roomId : string, ws : WebSocket){
        try {
            const room = this.rooms.get(roomId);
            if (!room){
                console.log("Room doesn't exist");
            }
   
            const userId = uuidv4();
            const user: User = { id: userId, socket: ws };
            room?.user.push(user);
            
            //notifying others
            room?.user.forEach(p=>{
                if (p.id !== userId){
                    p.socket.send(JSON.stringify({
                        event : "player-joined",
                        userId : userId,
                        roomID : room.id
                    }))
                }   
            });

            (ws as any).roomId = roomId;
            (ws as any).userId = userId;
            
            
            if (room?.user.length === 2){
                room.ready = true;
                room?.user.forEach(p=>{
                    if (p.id === userId){
                        p.socket.send(JSON.stringify({
                            event : "room-ready",
                            role : "offerer",
                            
                        }));
                    }else{
                    p.socket.send(JSON.stringify({
                            event : "room-ready",
                            role : "answerer"
                        }));
                    }  
                });
            };
            ws.send(JSON.stringify({
                event: "room-joined",
                data: {
                    message : "Joined Room Successfully",
                    roomId : roomId,
                    userId : userId,
                    ready : room?.ready
                }
            }));
            
        } catch (error) {
            console.log(error);
        }
    }
}