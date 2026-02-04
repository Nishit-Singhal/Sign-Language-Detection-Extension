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
    bottom: "200px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "20px 40px",
    background: "rgba(255, 0, 0, 0.9)",
    color: "white",
    fontSize: "32px",
    fontWeight: "bold",
    borderRadius: "15px",
    zIndex: "999999999",
    maxWidth: "90%",
    textAlign: "center",
    whiteSpace: "pre-line",
    display: "none",
    border: "3px solid yellow",
    boxShadow: "0 0 20px rgba(255, 255, 0, 0.8)"
  });

  document.body.appendChild(subtitleBox);
  console.log("✅ Subtitle box created and added to DOM");
}

// Debug panel for finger states and heartbeat
let debugBox = document.getElementById("sign-language-debug");
if (!debugBox) {
  debugBox = document.createElement("div");
  debugBox.id = "sign-language-debug";
  Object.assign(debugBox.style, {
    position: "fixed",
    bottom: "260px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "6px 10px",
    background: "rgba(0,0,0,0.75)",
    color: "#0f0",
    fontSize: "12px",
    fontFamily: "monospace",
    borderRadius: "8px",
    zIndex: "1000000000",
    maxWidth: "90%",
    textAlign: "left",
    whiteSpace: "pre",
    display: "none",
    border: "1px solid #0f0"
  });
  document.body.appendChild(debugBox);
  console.log("🔧 Debug box created and added to DOM");
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("🎯 onMessage listener triggered for:", msg.type);
  
  if (msg.type === "SIGN_DETECTED") {
    const receivedAt = Date.now();
    console.log("📩 Subtitle message received:", msg.text, "from sender:", sender, "frame:", msg.frame, "ts:", msg.ts, "perf:", msg.perf, "heartbeat:", msg.heartbeat);

    if (msg.ts) {
      console.log("Total latency offscreen->content:", receivedAt - msg.ts, "ms");
    }

    // Show finger debug info when available
    if (msg.fingers) {
      console.log("🟢 Fingers state:", msg.fingers);
      debugBox.innerText = JSON.stringify(msg.fingers, null, 2) + "\nheartbeat:" + !!msg.heartbeat + "\nframe:" + msg.frame;
      debugBox.style.display = "block";
    } else {
      console.log("⚪ No fingers data in message");
      debugBox.style.display = "none";
    }

    if (msg.text && msg.text.trim() !== "") {
      // Replace subtitle immediately instead of queuing
      const newText = msg.text.trim();
      subtitleBox.innerText = newText;
      subtitleBox.style.display = "block";
      console.log("✅ Subtitle updated to:", newText);
      console.log("📍 Subtitle box display:", subtitleBox.style.display);
      console.log("📍 Subtitle box innerHTML:", subtitleBox.innerHTML);
    } else {
      subtitleBox.innerText = "👋 Waiting for sign input...";
      subtitleBox.style.display = "none";
      console.log("❌ Subtitle cleared");
    }
    
    // Send response to confirm message was received
    sendResponse({ success: true, received: true, receivedAt });
    return true; // Keep the channel open for async response
  }
});
