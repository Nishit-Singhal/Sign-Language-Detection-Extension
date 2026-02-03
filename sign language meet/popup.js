document.getElementById("start").onclick = () => {
  chrome.runtime.sendMessage({ type: "START_DETECTION" });
};

document.getElementById("stop").onclick = () => {
  chrome.runtime.sendMessage({ type: "STOP_DETECTION" });
};

