console.log("Background loaded");

let meetTabId = null;
let cameraWindowId = null;

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

// -------- CLEAR CAMERA WINDOW ON CLOSE --------
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === cameraWindowId) {
    console.log("Camera window closed");
    cameraWindowId = null;
  }
});

// -------- MESSAGE ROUTING --------
chrome.runtime.onMessage.addListener(async (msg) => {

  // START DETECTION - open camera window
  if (msg.type === "START_DETECTION") {
    console.log("START_DETECTION received");

    // If window already exists, focus it
    if (cameraWindowId) {
      try {
        await chrome.windows.update(cameraWindowId, { focused: true });
        return;
      } catch (e) {
        // Window doesn't exist anymore
        cameraWindowId = null;
      }
    }

    // Open camera window
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL("camera.html"),
      type: "popup",
      width: 360,
      height: 320,
      focused: true
    });
    cameraWindowId = win.id;
    console.log("Camera window created:", cameraWindowId);
  }

  // STOP DETECTION - close camera window
  if (msg.type === "STOP_DETECTION") {
    console.log("STOP_DETECTION received");
    
    if (cameraWindowId) {
      try {
        await chrome.windows.remove(cameraWindowId);
      } catch (e) {
        console.log("Window already closed");
      }
      cameraWindowId = null;
    }
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
