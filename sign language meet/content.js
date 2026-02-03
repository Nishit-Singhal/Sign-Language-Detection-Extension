console.log("Content script loaded");

let subtitleBox = document.getElementById("sign-language-subtitle");

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
    display: "none"
  });

  document.body.appendChild(subtitleBox);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SIGN_DETECTED") {
    console.log("Subtitle received:", msg.text);

    if (msg.text && msg.text.trim() !== "") {
      subtitleBox.innerText = msg.text;
      subtitleBox.style.display = "block";
    } else {
      subtitleBox.style.display = "none";
    }
  }
});
