import WebSocket from "ws";
import type { room_type } from "./room";

interface offer{
    type : string,
    sdp : string,
}

export class signalling{
    
    public sendOffer(offer : offer, ws : WebSocket, rm : room_type){
        try {
            const userId = (ws as any).userId
            rm.user.forEach(u => {
                if (u.id != userId){
                    u.socket.send(JSON.stringify({
                        event : "offer",
                        offer : offer
                    }))
                }
            })
        } catch (error) {
            console.log(error);
        }
    };

    public sendIceCandidate(candidate : string, ws : WebSocket, rm : room_type){
        const userId = (ws as any).userId
            rm.user.forEach(u => {
                if (u.id != userId){
                    u.socket.send(JSON.stringify({
                        event : "ice-candidate",
                        candidate : candidate,
                    }))
                }
        });
    };

    //Send answer after recieving offer.
    public sendAnswer(answer : string,  ws : WebSocket, rm : room_type){
        const userId = (ws as any).userId
        rm.user.forEach(u => {
            if (u.id != userId){
                u.socket.send(JSON.stringify({
                    event : "answer",
                    answer : answer,
                }))
            }
        })
    };
}