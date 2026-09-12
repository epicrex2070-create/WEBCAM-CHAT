// FULLSCREEN BUTTON
document.getElementById("fsBtn").onclick = () => {
  document.documentElement.requestFullscreen();
};

// CHAT ELEMENTS
const chatInput = document.getElementById("chatInput");
const messages = document.getElementById("messages");

// MAIN ELEMENTS
const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peer;
let ws;

// JOIN ROOM
joinBtn.onclick = async () => {
  messages.innerHTML = ""; // clear chat on new room

  const room = roomInput.value.trim();
  if (!room) return alert("Enter a room code");

  document.getElementById("videos").style.display = "flex";

  // Start webcam
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  // Connect to signaling server
  ws = new WebSocket("wss://webcam-signal.repl.co
");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", room }));
  };

  ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);

    // CHAT RECEIVING
    if (data.type === "chat") {
      addMessage("guest", data.text);
    }

    // WEBRTC SIGNALING
    if (data.type === "offer") {
      await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      // ANSWER SENDING (THIS GOES HERE)
      ws.send(JSON.stringify({
        type: "answer",
        answer,
        room
      }));
    }

    if (data.type === "answer") {
      await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    if (data.type === "ice") {
      try {
        await peer.addIceCandidate(data.ice);
      } catch (e) {}
    }
  };

  // Create WebRTC peer
  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  // ICE SENDING (THIS GOES HERE)
  peer.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({
        type: "ice",
        ice: event.candidate,
        room
      }));
    }
  };

  // Remote video
  peer.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // Add local stream
  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  // Create offer
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  // OFFER SENDING (THIS GOES HERE)
  ws.send(JSON.stringify({
    type: "offer",
    offer,
    room
  }));
};

// CHAT SENDING
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    const msg = chatInput.value.trim();

    addMessage("you", msg);

    ws.send(JSON.stringify({
      type: "chat",
      text: msg,
      room: roomInput.value.trim()
    }));

    chatInput.value = "";
  }
});

// CHAT DISPLAY FUNCTION
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.textContent = sender + ": " + text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}
