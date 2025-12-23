import { MicIcon, MicOffIcon, VideoIcon, VideoOff } from "lucide-react"
import { Dispatch, RefObject, SetStateAction, useEffect, useRef } from "react"

export const VideoCall = ({ remoteVideoRef, localVideoRef, toggleVideo, toggleAudio, video, audio, statsUI}: { remoteVideoRef: RefObject<HTMLVideoElement | null>, localVideoRef: RefObject<HTMLVideoElement | null>, toggleVideo: () => void, toggleAudio: () => void, video : boolean, audio : boolean, statsUI: {
    fps: number;
    resolution: string;
    packetsLost: number;
    bitrate: number;
    rtt: number;}
}) => {
    return (
        <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
            <div className="w-full max-w-6xl flex-1 flex flex-col md:flex-row gap-4 justify-center items-start pt-10">
    
                {/* LEFT COLUMN: Remote Video (Big) */}
                <div className="relative w-full md:w-2/3 aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-sm font-medium backdrop-blur-sm border border-white/10">
                        Remote User
                    </div>
                </div>
    
                {/* RIGHT COLUMN: Local Video + Stats */}
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                    
                    {/* Local Video */}
                    <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-sm font-medium backdrop-blur-sm border border-white/10">
                            You
                        </div>
                    </div>
    
                    {/* STATS PANEL */}
                    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex-1 min-h-[200px]">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                            Connection Stats
                        </h3>
                        
                        <div className="space-y-3">
                            {/* Resolution */}
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Resolution</span>
                                <span className="font-mono text-sm font-semibold text-white">{statsUI.resolution || 'N/A'}</span>
                            </div>
    
                            {/* FPS */}
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">FPS</span>
                                <span className={`font-mono text-sm font-semibold ${statsUI.fps > 24 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                    {statsUI.fps}
                                </span>
                            </div>
    
                            {/* Bitrate */}
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Bitrate</span>
                                <span className="font-mono text-sm font-semibold text-blue-400">
                                    {(statsUI.bitrate / 1000000).toFixed(2)} Mbps
                                </span>
                            </div>
    
                            {/* RTT (Latency) */}
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Latency (RTT)</span>
                                <span className={`font-mono text-sm font-semibold ${statsUI.rtt < 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {statsUI.rtt * 1000} ms
                                </span>
                            </div>
    
                             {/* Packets Lost */}
                             <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Packets Lost</span>
                                <span className={`font-mono text-sm font-semibold ${statsUI.packetsLost === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {statsUI.packetsLost}
                                </span>
                            </div>
                        </div>
                    </div>
    
                </div>
            </div>
    
            {/* CONTROLS */}
            <div className="mt-6 flex gap-4 pb-4">
                <button
                    onClick={toggleAudio}
                    className={`p-4 rounded-full transition-all backdrop-blur-md hover:scale-105 active:scale-95 border ${audio ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700' : 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30'}`}
                    title="Toggle Audio"
                >
                    {audio ? <MicIcon /> : <MicOffIcon />}
                </button>
    
                <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-all backdrop-blur-md hover:scale-105 active:scale-95 border ${video ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700' : 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30'}`}
                    title="Toggle Video"
                >
                    {video ? <VideoIcon /> : <VideoOff />}
                </button>
            </div>
        </div>
    );
}
