"use client"

import { roomContext } from '@/context/roomContext';
import { useSocket } from '@/hooks/useSocket'
import { signalling } from '@/signalling/singalling';
import { RoomCreatedandJoined } from '@/types/roomTypes';
import { useContext, useEffect, useRef, useState } from 'react'
import { VideoCall } from './videoCall';

export const StartCall = () => {
    const ws = useSocket();
    const room = useContext(roomContext);

    const [joinRoomId, setJoinRoomId] = useState("");
    const [role, setRole] = useState("Idle");
    const [status, setStatus] = useState("Connecting to server...");
    const [isInCall, setIsInCall] = useState(false);

    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);

    const [statsUI, setStatsUI] = useState({
        fps: 0,
        resolution: "0x0",
        packetsLost: 0,
        bitrate: 0,
        rtt: 0,
    });

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const signallingRef = useRef<signalling | null>(null);

    const toggleVideo = () => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (!videoTrack) return;

        setVideo(prev => {
            const newState = !prev;
            videoTrack.enabled = newState;
            return newState;
        });
    };

    const toggleAudio = () => {
        const audio = localStreamRef.current?.getAudioTracks()[0];
        if (!audio) return;

        setAudio(prev => {
            const newState = !prev;
            audio.enabled = newState;
            return newState
        });
    }

    const stopStream = () => {
        const stream = localStreamRef.current;
        const tracks = stream?.getTracks();
        tracks?.forEach(track => {
            track.stop();
        })
        localStreamRef.current = null;

    };

    // Initialize Signalling Class
    useEffect(() => {
        if (!ws || signallingRef.current) return;
        signallingRef.current = new signalling(ws);
        setStatus("Connected to Server");
        signallingRef.current.onRemoteStream = (stream) => {
            console.log("Setting Remote Stream in UI");
            remoteStreamRef.current = stream;

            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
                remoteVideoRef.current.play().catch(() => { });
            }
        };
    }, [ws]);


    //Getting localStream
    useEffect(() => {
        if (!localStreamRef.current || !localVideoRef.current) return;

        localVideoRef.current.srcObject = localStreamRef.current;

        // Important for Safari & Chrome
        localVideoRef.current.play().catch(() => { });
    }, [localStreamRef.current, isInCall,]);


    //Getting remote stream from the ref
    useEffect(() => {
        if (remoteStreamRef.current && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
    }, [remoteStreamRef])

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

                if (localStreamRef.current && signallingRef.current) {
                    signallingRef.current.addLocalStream(localStreamRef.current);
                }

                // Auto-start if offerer, otherwise wait or use manual button
                if (parse.role === "offerer") {
                    console.log("Auto-starting signalling...");
                    signallingRef.current?.createOffer();
                }
                setIsInCall(true);
            };

            if (parse.event === "offer") {
                console.log("Parse Event", parse);
                setStatus("Received Offer");
                if (!parse.offer.type && !parse.offer.sdp) {
                    console.log("Incorrect offer");
                    return;
                }
                const of: RTCSessionDescriptionInit = {
                    type: parse.offer.type,
                    sdp: parse.offer.sdp
                };
                console.log("OF is : ", of);
                signallingRef.current?.recieveOffer({ offer: of });
            };

            if (parse.event === "answer") {
                setStatus("Received Answer");
                const ans: RTCSessionDescriptionInit = {
                    type: parse.answer.type,
                    sdp: parse.answer.sdp
                };
                console.log("ans is :", ans);
                signallingRef.current?.recieveAnswer({ answer: ans });
            }

            if (parse.event === "ice-candidate") {
                if (!parse.candidate.candidate || !parse.candidate.sdpMLineIndex || !parse.candidate.sdpMid || !parse.candidate.usernameFragment) {
                    console.log("Return");
                }
                const can: RTCIceCandidateInit = {
                    candidate: parse.candidate.candidate,
                    sdpMLineIndex: parse.candidate.sdpMLineIndex,
                    sdpMid: parse.candidate.sdpMid,
                    usernameFragment: parse.candidate.usernameFragment
                }
                signallingRef.current?.iceCandidate({ candidate: can })
            }
        }
    }, [ws, room, localStreamRef.current]);

    //Function for creating room;
    const createRoom = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert("WebSocket not connected");
            return;
        }
        ws.send(JSON.stringify({ event: "create-room" }));
    };

    //Getting user media
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setStatus("Camera Error: Check permissions");
            }
        };
        startCamera();
    }, []);

    const joinRoom = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN || !joinRoomId) {
            alert("Cannot join: Check connection or Room ID");
            return;
        }
        ws.send(JSON.stringify({ event: "join-room", roomId: joinRoomId }));
    };

    const copyRoomId = () => {
        if (room?.roomId) {
            navigator.clipboard.writeText(room.roomId);
        }
    };

    useEffect(() => {
        if (!isInCall) return;

        const interval = setInterval(async () => {
            if (!signallingRef.current) return;

            const stats = await signallingRef.current.dataStats();
            parseStats(stats);
        }, 1000);

        return () => clearInterval(interval);
    }, [isInCall]);

    const parseStats = (stats: RTCStatsReport) => {
        let inboundVideo: RTCInboundRtpStreamStats | null = null;
        let outboundVideo: RTCOutboundRtpStreamStats | null = null;
        let candidatePair: RTCIceCandidatePairStats | null = null;


        stats.forEach(report => {
            if (report.type === "inbound-rtp" && report.kind === "video") {
                inboundVideo = report as RTCInboundRtpStreamStats;
            }

            if (report.type === "outbound-rtp" && report.kind === "video") {
                outboundVideo = report as RTCOutboundRtpStreamStats;
            }

            if (report.type === "candidate-pair" && report.nominated) {
                candidatePair = report as RTCIceCandidatePairStats;
            }
        });

        if (!inboundVideo || !outboundVideo || !candidatePair) return;

        setStatsUI({
            fps: (inboundVideo as any).framesPerSecond ?? 0,
            resolution: `${(inboundVideo as any).frameWidth ?? 0}x${(inboundVideo as any).frameHeight ?? 0}`,
            packetsLost: (inboundVideo as any).packetsLost ?? 0,
            bitrate: (outboundVideo as any).bytesSent ?? 0,
            rtt: (candidatePair as any).currentRoundTripTime ?? 0,
          });
          
    };



    if (isInCall) {
        return <VideoCall
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            toggleVideo={toggleVideo}
            toggleAudio={toggleAudio}
            video={video}
            audio={audio}
            statsUI = {statsUI}
        />
    }


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

                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}