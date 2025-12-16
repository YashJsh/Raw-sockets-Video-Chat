"use client"

import { roomContext } from '@/context/roomContext';
import { useSocket } from '@/hooks/useSocket'
import { signalling } from '@/signalling/singalling'; // Ensure spelling matches your file
import { RoomCreatedandJoined } from '@/types/roomTypes';
import { useContext, useEffect, useRef, useState } from 'react'

export const StartCall = () => {
    const ws = useSocket();
    const room = useContext(roomContext);

    const [joinRoomId, setJoinRoomId] = useState("");
    const [role, setRole] = useState("Idle");
    const [status, setStatus] = useState("Connecting to server...");

    const signallingRef = useRef<signalling | null>(null);

    // Initialize Signalling Class
    useEffect(() => {
        if (!ws || signallingRef.current) return;
        signallingRef.current = new signalling(ws);
        setStatus("Connected to Server");
    }, [ws]);

    // WebSocket Event Listeners
    useEffect(() => {
        if (!ws) return;

        ws.onmessage = (event: MessageEvent) => {
            const parse = JSON.parse(event.data);
            console.log("Parse EVENT HERE IS : ", parse);

            if (parse.event === "room-created" || parse.event === "room-joined") {
                const data: RoomCreatedandJoined = parse.data;
                room?.setUserId(data.userId);
                room?.setRoomId(data.roomId);
                setStatus("Joined Room");
            };

            if (parse.event === "room-ready") {
                setRole(parse.role);
                setStatus(`Room Ready (Role: ${parse.role})`);
                
                // Auto-start if offerer, otherwise wait or use manual button
                if (parse.role === "offerer") {
                    console.log("Auto-starting signalling...");
                    signallingRef.current?.createOffer();
                }
            };

            if (parse.event === "offer") {
                console.log("Parse Event" , parse);
                setStatus("Received Offer");
                if (!parse.offer.type && !parse.offer.sdp){
                    console.log("Incorrect offer");
                    return;
                }
                const of : RTCSessionDescriptionInit = {
                    type : parse.offer.type,
                    sdp : parse.offer.sdp
                };
                console.log("OF is : ", of);
                signallingRef.current?.recieveOffer({offer : of});
            };

            if (parse.event === "answer") {
                setStatus("Received Answer");
                const ans : RTCSessionDescriptionInit = {
                    type : parse.answer.type,
                    sdp : parse.answer.sdp
                };
                console.log("ans is :", ans);
                signallingRef.current?.recieveAnswer({answer : ans});
            }

            if (parse.event === "ice-candidate") {
                if (!parse.candidate.candidate || !parse.candidate.sdpMLineIndex || !parse.candidate.sdpMid || !parse.candidate.usernameFragment){
                    console.log("Return");
                }
                const can : RTCIceCandidateInit = {
                    candidate : parse.candidate.candidate,
                    sdpMLineIndex : parse.candidate.sdpMLineIndex,
                    sdpMid : parse.candidate.sdpMid,
                    usernameFragment : parse.candidate.usernameFragment
                }
                signallingRef.current?.iceCandidate({candidate : can})
            }
        }
    }, [ws, room]);

    const createRoom = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert("WebSocket not connected");
            return;
        }
        ws.send(JSON.stringify({ event: "create-room" }));
    };

    const joinRoom = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN || !joinRoomId) {
            alert("Cannot join: Check connection or Room ID");
            return;
        }
        ws.send(JSON.stringify({ event: "join-room", roomId: joinRoomId }));
    };

    const handleManualSignal = () => {
        if (signallingRef.current) {
            console.log("Manual Signalling Triggered");
            signallingRef.current.createOffer();
        }
    };

    const copyRoomId = () => {
        if (room?.roomId) {
            navigator.clipboard.writeText(room.roomId);
            alert("Room ID copied to clipboard!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                
                {/* Header Section */}
                <div className="bg-slate-800 p-6 border-b border-slate-700">
                    <h1 className="text-2xl font-bold text-center text-sky-400">Video Call Setup</h1>
                    <div className="mt-2 flex justify-between items-center text-xs text-slate-400 font-mono">
                        <span>Status: <span className="text-emerald-400">{status}</span></span>
                        <span>User: {room?.userId ? room.userId.slice(0, 5) + "..." : "..."}</span>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    
                    {/* Display Room ID if exists */}
                    {room?.roomId && (
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Current Room ID</span>
                                <span className="text-lg font-mono text-white tracking-wide">{room.roomId}</span>
                            </div>
                            <button 
                                onClick={copyRoomId}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 px-3 py-1 rounded transition"
                            >
                                Copy
                            </button>
                        </div>
                    )}

                    {/* Room Actions */}
                    {!room?.roomId && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2  ">
                            {/* Create Section */}
                            <div className="flex flex-col space-y-3">
                                <button 
                                    onClick={createRoom} 
                                    className="w-full py-3 from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02]"
                                >
                                    Create New Room
                                </button>
                                <p className="text-center text-xs text-slate-500">Start a fresh session</p>
                            </div>

                            {/* Divider for mobile */}
                            <div className="md:hidden flex items-center justify-center">
                                <span className="text-slate-600 text-sm">or</span>
                            </div>

                            {/* Join Section */}
                            <div className="flex flex-col space-y-3">
                                <div className="flex space-x-2">
                                    <input 
                                        type="text" 
                                        placeholder="Enter Room ID" 
                                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500"
                                        onChange={(e) => setJoinRoomId(e.target.value)}
                                        value={joinRoomId}
                                    />
                                    <button 
                                        onClick={joinRoom}
                                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-xl font-medium transition-colors"
                                    >
                                        Join
                                    </button>
                                </div>
                                <p className="text-center text-xs text-slate-500">Connect to existing</p>
                            </div>
                        </div>
                    )}

                    {/* Signalling Controls */}
                    {room?.roomId && (
                        <div className="pt-6 border-t border-slate-800">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-slate-400">Current Role</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${role === 'offerer' ? 'bg-amber-500/10 text-amber-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                    {role}
                                </span>
                            </div>
                            
                            <button 
                                onClick={handleManualSignal} 
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center space-x-2 group"
                            >
                                <span className="group-hover:animate-pulse">⚡</span>
                                <span>Start Signalling (Manual)</span>
                            </button>
                            <p className="mt-2 text-center text-xs text-slate-500">
                                Usually starts automatically. Click if connection hangs.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}