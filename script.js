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
  ws = new WebSocket("wss://ws.postman-echo.com/raw");

  ws.onopen = () => {
    ws.send(JSON.stringify({ join: room }));
  };

  ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);

    // CHAT RECEIVING
    if (data.chat) {
      addMessage("guest", data.chat);
    }

    if (data.offer) {
      await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      ws.send(JSON.stringify({ answer, room }));
    }

    if (data.answer) {
      await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
    }

    if (data.ice) {
      try {
        await peer.addIceCandidate(data.ice);
      } catch (e) {}
    }
  };

  // Create WebRTC peer
  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({ ice: event.candidate, room }));
    }
  };

  peer.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  ws.send(JSON.stringify({ offer, room }));
};

// CHAT SENDING
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    const msg = chatInput.value.trim();

    addMessage("you", msg);

    ws.send(JSON.stringify({
      chat: msg,
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

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}
