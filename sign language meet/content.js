console.log("Content script loaded");

let subtitleBox = document.getElementById("sign-language-subtitle");
const subtitleQueue = [];
const MAX_SUBTITLE_LINES = 3;

if (!subtitleBox) {
  subtitleBox = document.createElement("div");
  subtitleBox.id = "sign-language-subtitle";
  subtitleBox.innerText = "👋 Waiting for sign input...";

  Object.assign(subtitleBox.style, {
    position: "fixed",
    bottom: "120px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 24px",
    background: "rgba(0,0,0,0.85)",
    color: "white",
    fontSize: "20px",
    borderRadius: "10px",
    zIndex: "999999",
    maxWidth: "80%",
    textAlign: "center",
    whiteSpace: "pre-line",
    display: "none"
  });

  document.body.appendChild(subtitleBox);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SIGN_DETECTED") {
    console.log("Subtitle received:", msg.text);

    if (msg.text && msg.text.trim() !== "") {
      subtitleQueue.push(msg.text.trim());
      while (subtitleQueue.length > MAX_SUBTITLE_LINES) {
        subtitleQueue.shift();
      }
      subtitleBox.innerText = subtitleQueue.join("\n");
      subtitleBox.style.display = "block";
    } else {
      subtitleQueue.length = 0;
      subtitleBox.style.display = "none";
    }
  }
});
