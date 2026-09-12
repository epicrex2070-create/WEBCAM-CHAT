document.getElementById("fsBtn").onclick = () => {
  document.documentElement.requestFullscreen();
};

<script>
  const chatInput = document.getElementById("chatInput");
const messages = document.getElementById("messages");
</script>

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    const msg = chatInput.value.trim();

    // show your own message
    addMessage("you", msg);

    // send to other person
    ws.send(JSON.stringify({
      chat: msg,
      room: roomInput.value.trim()
    }));

    chatInput.value = "";
  }
});
