console.log("Background loaded");

let meetTabId = null;

// -------- STORE MEET TAB --------
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("meet.google.com") && meetTabId !== tabId) {
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
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {

  // START DETECTION (only honor if from popup and manual)
  if (msg.type === "START_DETECTION") {
    console.log("START_DETECTION received, sender.id:", sender && sender.id, "sender.url:", sender && sender.url, "sender.tab:", sender && sender.tab && sender.tab.id, "msg:", msg);
    if (!msg.fromPopup || !msg.manual) {
      console.warn("Ignoring START_DETECTION because it was not a manual popup action");
    } else {
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
  }

  // STOP DETECTION
  if (msg.type === "STOP_DETECTION") {
    console.log("STOP_DETECTION received, sender.id:", sender && sender.id, "sender.url:", sender && sender.url, "sender.tab:", sender && sender.tab && sender.tab.id, "msg:", msg);

    // Only honor STOP_DETECTION if it came from the popup (explicit user action)
    if (msg.fromPopup && msg.manual) {
      // Disable detection in offscreen
      chrome.runtime.sendMessage({ type: "DISABLE_DETECTION" });
    } else {
      console.warn("Ignoring STOP_DETECTION because it was not a manual popup action");
    }
  }

  // FORWARD SUBTITLES TO MEET
  if (msg.type === "SIGN_DETECTED") {
    console.log("Forwarding to Meet:", msg.text, "frame:", msg.frame, "ts:", msg.ts);

    // measure offscreen -> background latency
    const receivedAt = Date.now();
    if (msg.ts) {
      console.log("Latency offscreen->background:", receivedAt - msg.ts, "ms");
    }

    if (meetTabId) {
      // Forward full message and add forwardedAt
      const forwarded = Object.assign({}, msg, { forwardedAt: Date.now() });
      chrome.tabs.sendMessage(meetTabId, forwarded).then((response) => {
        console.log("✅ Message sent to Meet tab successfully, response:", response);
      }).catch((err) => {
        console.error("❌ Failed to send message to Meet tab:", err);
        console.log("Current meetTabId:", meetTabId);
        // Try to find active Meet tab again
        chrome.tabs.query({ url: "https://meet.google.com/*" }, (tabs) => {
          if (tabs.length > 0) {
            meetTabId = tabs[0].id;
            console.log("🔄 Found Meet tab, updating ID:", meetTabId);
            // Retry sending message
            chrome.tabs.sendMessage(meetTabId, forwarded).catch(err => console.error("Retry failed:", err));
          } else {
            console.warn("⚠️ No active Meet tab found");
            meetTabId = null;
          }
        });
      });
    } else {
      console.warn("⚠️ No meetTabId stored. Meet tab not detected.");
    }
  }
});
