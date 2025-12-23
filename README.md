# 🎥 Real-Time Video Calling App (WebRTC + Raw WebSockets)

A real-time **peer-to-peer video calling application** built using **WebRTC** with **manual signaling implemented over raw WebSockets**.

This project demonstrates a deep understanding of **WebRTC internals** by handling **offer/answer negotiation**, **ICE candidate exchange**, and **media stream management** **without using high-level signaling libraries** like Socket.IO or Firebase.

---

## 🚀 Tech Stack

### Frontend
- **Next.js** (App Router)
- **React** (Context API)
- **TypeScript**
- **WebRTC** (`RTCPeerConnection`, `MediaStreams`)
- **Native WebSocket API**

### Backend
- **Node.js**
- **ws** (WebSocket Server)

---

## 🧠 Key Features

- Manual WebRTC signaling using **raw WebSockets**
- Peer-to-peer **video & audio streaming**
- ICE candidate discovery and exchange
- Offer / Answer SDP negotiation
- WebRTC **Data Channel** support
- Context-based global state management
- Connection state and ICE state monitoring

---

## 🧬 Application Architecture

### 1️⃣ Room Context

Handles room-level metadata and user identity across the application.

**Responsibilities**
- Store and update `roomId`
- Store and update `userId`
- Share room state globally without prop drilling

---

### 2️⃣ Socket Context

Manages a single persistent WebSocket connection for the entire app.

**Responsibilities**
- Initialize WebSocket connection on app load
- Handle socket lifecycle (open, close, error)
- Provide socket instance to all components

---

## 🔌 WebSocket Signaling Protocol

The signaling layer is implemented manually using structured **JSON messages** over WebSockets.

### Supported Events

| Event Name      | Description                         |
|-----------------|-------------------------------------|
| `send-offer`    | Sends SDP offer to peer             |
| `send-answer`  | Sends SDP answer to peer            |
| `ice-candidate`| Exchanges ICE candidates            |

---

## 🔁 WebRTC Signaling & Connection Flow

1. WebSocket connection is established  
2. Caller creates an SDP offer  
3. Offer is sent via WebSocket  
4. Callee receives offer and creates SDP answer  
5. Answer is sent back to caller  
6. ICE candidates are exchanged  
7. Peer-to-peer connection is established  
8. Media streams are exchanged directly between peers  

---

## 🎥 Media Stream Handling

- Local media tracks are manually attached using `addTrack`
- Remote streams are received via `ontrack`
- Remote stream is exposed through a callback for UI rendering

---

## 📡 Data Channel

- A WebRTC **Data Channel** is created between peers
- Enables peer-to-peer messaging without server involvement
- Can be extended for:
  - Chat
  - Reactions
  - Sync events

---

## 🧪 Debugging & Observability

- WebRTC connection state logging
- ICE connection state logging
- ICE candidate flow logging
- WebRTC statistics via `getStats()`

---

## ⚠️ Why This Project Stands Out

Most WebRTC projects rely on libraries like **Socket.IO** or **Firebase** for signaling.

This project intentionally avoids those abstractions and instead implements:

- Manual signaling logic
- Explicit SDP handling
- Direct ICE candidate management

This demonstrates **low-level networking** and **real-time communication expertise**.

---

## 🔮 Future Improvements

- Authentication for signaling server
- TURN server integration
- Multi-user (group) calls
- Screen sharing
- Call recording
- Production-ready signaling server

---

## 📜 License

MIT License

