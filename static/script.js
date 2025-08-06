async function sendMessage() {
  const userInput = document.getElementById("user-input").value.trim();
  const language = document.getElementById("language").value;
  const chatBox = document.getElementById("chat-box");

  if (!userInput) return;

  // Display user message
  const userMsgDiv = document.createElement("div");
  userMsgDiv.classList.add("user-msg");
  userMsgDiv.textContent = userInput;
  chatBox.appendChild(userMsgDiv);

  // Clear input field
  document.getElementById("user-input").value = "";

  // Display loading bot message
  const botMsgDiv = document.createElement("div");
  botMsgDiv.classList.add("bot-msg");
  botMsgDiv.textContent = "🤖 Typing...";
  chatBox.appendChild(botMsgDiv);

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInput, language }),
    });

    const data = await response.json();
    botMsgDiv.textContent = data.response || "⚠️ No reply received from bot.";
  } catch (error) {
    botMsgDiv.textContent =
      "⚠️ An error occurred while processing your message.";
    console.error("Error:", error);
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}
