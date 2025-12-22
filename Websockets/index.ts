import express from "express";
import http from "node:http";
import { WebSocketServer } from "ws";
import { Room } from "./room";

import { signalling } from "./socket";

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({server});

const room = new Room();
const signal = new signalling();

wss.on("connection", (ws)=>{
    console.log("Websocket connected");
    ws.on("message", (data : Buffer)=>{
        const dataToString = data.toString();
        const parse = JSON.parse(dataToString);
        console.log(parse);
        
        if(parse.event === "create-room"){
            room.createRoom(ws);
        };
        if (parse.event === "join-room"){
            room.JoinRoom(parse.roomId, ws);
        };
        if (parse.event === "send-offer"){
            
            const rm = room.rooms.get((ws as any).roomId);
            if (!rm || !rm.ready){
                console.log("Room Doesn't exist");
                return;
            }
            signal.sendOffer(parse.offer, ws, rm);
        };
        if (parse.event === "ice-candidate"){
            console.log("Ice-candidate recieved");
            const rm = room.rooms.get((ws as any).roomId);
            if (!rm || !rm.ready){
                console.log("Room Doesn't exist");
                return;
            }
            signal.sendIceCandidate(parse.candidate, ws, rm)
        };
        if (parse.event === "send-answer"){
            console.log("Sending answer recieved");
            const rm = room.rooms.get((ws as any).roomId);
            if (!rm || !rm.ready){
                console.log("Room Doesn't exist");
                return;
            }
            signal.sendAnswer(parse.answer, ws, rm)
        };
    });
})


server.listen(3001);
