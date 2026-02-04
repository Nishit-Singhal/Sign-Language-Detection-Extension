const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");

startBtn.addEventListener("click", () => {
  console.log("popup: start clicked");
  chrome.runtime.sendMessage({ type: "START_DETECTION", fromPopup: true, manual: true });
});

stopBtn.addEventListener("click", () => {
  console.log("popup: stop clicked");
  chrome.runtime.sendMessage({ type: "STOP_DETECTION", fromPopup: true, manual: true });
});

// Log unload and visibility changes for debugging
window.addEventListener("unload", () => console.log("popup: unload"));
document.addEventListener("visibilitychange", () => console.log("popup: visibilitychange", document.visibilityState));

