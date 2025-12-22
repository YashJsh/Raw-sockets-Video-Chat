export class signalling{
    private connection : RTCPeerConnection;
    private socket : WebSocket;

    public onRemoteStream: ((stream: MediaStream) => void) | null = null;

    constructor(socket : WebSocket){
        this.connection = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });
        this.socket = socket;

        // 1. Listen for remote tracks (Video/Audio from the other person)
        this.connection.ontrack = (event) => {
            console.log("REMOTE TRACK RECEIVED", event.streams);
            if (event.streams && event.streams[0]) {
                if (this.onRemoteStream) {
                    this.onRemoteStream(event.streams[0]);
                }
            }
        };
        
        this.connection.onicecandidate = (event) => {
            if (event.candidate) {
              this.socket.send(
                JSON.stringify({
                  event: "ice-candidate",
                  candidate: event.candidate,
                })
              );
            }else{
                console.log("Ice candidate not sent");
            }
        };

        const channel = this.connection.createDataChannel("data");
        channel.onopen = () => console.log("Data channel open");
        channel.onmessage = (e) => console.log("Message:", e.data);

        this.connection.onconnectionstatechange = () => {
            console.log("Connection:", this.connection.connectionState);
          };
      
        this.connection.oniceconnectionstatechange = () => {
            console.log("ICE:", this.connection.iceConnectionState);
        };
    };

    public addLocalStream = (stream: MediaStream) => {
        console.log("Adding local tracks to connection");
        stream.getTracks().forEach(track => {
            this.connection.addTrack(track, stream);
        });
    }

    //CreateOFfer
    public createOffer = async ()=>{
        console.log("Creating offer ....")
        this.connection.createDataChannel("data");
        const offer = await this.connection.createOffer();
        console.log("Offer : " , offer);
        this.connection.setLocalDescription(offer);
        console.log("Sending-offer");
        this.socket.send(JSON.stringify({
            event : "send-offer",
            offer : offer
        }));
    };

    public recieveOffer = async ({offer} : {offer : RTCSessionDescriptionInit})=>{
        console.log("Offer-recieved");
        console.log("offer type ", offer.type);
        console.log("offer.sdp" , offer.sdp);
        await this.connection.setRemoteDescription(new RTCSessionDescription(offer));

        console.log("Creating-answer");
        const answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(answer);
        console.log(answer);
        console.log("Sending ANswer");
        this.socket.send(JSON.stringify({
            event : "send-answer",
            answer : answer
        }));
    };

    public recieveAnswer = async ({answer} : {answer : RTCSessionDescriptionInit}) =>{
        console.log("Answer Recieved");
        await this.connection.setRemoteDescription(answer); 
    }

    public iceCandidate = async ({candidate} : {candidate : RTCIceCandidateInit})=>{
        try {
            console.log("Ice-candiate recieved");
            await this.connection.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (error) {
            console.log("Ice Candidate Error : ", error);
        }   
    }
}