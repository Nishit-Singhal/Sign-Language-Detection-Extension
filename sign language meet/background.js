console.log("Background loaded");

let meetTabId = null;

// -------- STORE MEET TAB --------
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("meet.google.com")) {
    meetTabId = tabId;
    console.log("Meet tab stored:", meetTabId);
  }
});

// -------- CLEAR MEET TAB ON CLOSE --------
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === meetTabId) {
    console.log("Meet tab closed, clearing meetTabId");
    meetTabId = null;
  }
});

// -------- MESSAGE ROUTING --------
chrome.runtime.onMessage.addListener(async (msg) => {

  // START DETECTION
  if (msg.type === "START_DETECTION") {
    console.log("START_DETECTION received");

    if (!(await chrome.offscreen.hasDocument())) {
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["USER_MEDIA"],
        justification: "Hand gesture recognition"
      });
      console.log("Offscreen document created");
    }

    // 🔑 enable detection in offscreen
    chrome.runtime.sendMessage({ type: "ENABLE_DETECTION" });
  }

  // STOP DETECTION
  if (msg.type === "STOP_DETECTION") {
    console.log("STOP_DETECTION received");
    
    // Disable detection in offscreen
    chrome.runtime.sendMessage({ type: "DISABLE_DETECTION" });
  }

  // FORWARD SUBTITLES TO MEET
  if (msg.type === "SIGN_DETECTED") {
    console.log("Forwarding to Meet:", msg.text);

    if (meetTabId) {
      chrome.tabs.sendMessage(meetTabId, {
        type: "SIGN_DETECTED",
        text: msg.text
      });
    }
  }
});
