let currentSessionId = null; // For storing the session

/**
 * Sets the user input field with the text from a suggestion card.
 * @param {string} text - The suggested text to use.
 */
function setIssue(text) {
  document.getElementById("userInput").value = text;
}

/**
 * Formats a bot's plain text response into structured HTML.
 * Handles paragraphs, bold text (**text**), and numbered lists.
 * @param {string} text - The plain text response from the bot.
 * @returns {string} - An HTML formatted string.
 */
function formatBotResponse(text) {
  // Split the response into paragraphs based on newlines.
  const paragraphs = text.split("\n").filter((p) => p.trim() !== "");
  let html = "";
  let inList = false;

  paragraphs.forEach((paragraph) => {
    // Handle bold text using a regular expression
    let formattedParagraph = paragraph.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );

    // Check if the line is a numbered list item (e.g., "1. some text")
    if (/^\d+\.\s/.test(formattedParagraph)) {
      if (!inList) {
        // Start of a new ordered list
        html += "<ol>";
        inList = true;
      }
      // Add the list item, removing the number prefix (e.g., "1. ")
      html += `<li>${formattedParagraph.replace(/^\d+\.\s/, "")}</li>`;
    } else {
      if (inList) {
        // End of the previous list
        html += "</ol>";
        inList = false;
      }
      // Add a regular paragraph
      html += `<p>${formattedParagraph}</p>`;
    }
  });

  // If the text ends with a list, close the tag
  if (inList) {
    html += "</ol>";
  }

  return html;
}

/**
 * Sends the user's message to the backend and displays the response.
 */

async function welcome() {
  try {
    const response = await fetch("/welcome", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(),
    });

    const data = await response.json();

    if (response.ok && data.response) {
      const formattedBotHtml = formatBotResponse(data.response);
      chatbox.innerHTML += `
        <div class="bot-msg">
          <strong>🤖 Bot</strong>
          <div class="bot-response-content">${formattedBotHtml}</div>
        </div>`;
    } else {
      chatbox.innerHTML += `<div class="bot-msg error"><strong>Error:</strong><p>${
        data.error || "Something went wrong!"
      }</p></div>`;
    }
  } catch (error) {
    chatbox.innerHTML += `<div class="bot-msg error"><strong>Error:</strong><p>Could not connect to the server. Please check your network.</p></div>`;
  }
}

async function sendMessage() {
  const userInputField = document.getElementById("userInput");
  const userMessage = userInputField.value.trim();

  if (!userMessage) {
    alert("Please describe your issue or ask a question.");
    return;
  }

  // Prepare the request body
  let requestBody = {
    message: userMessage,
    session_id: currentSessionId,
  };

  // If this is the first message, gather user details
  if (!currentSessionId) {
    const name = document.getElementById("name").value;
    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;

    if (!name || !age || !gender) {
      alert("Please enter your name, age, and gender to start the chat.");
      return;
    }

    requestBody.name = name;
    requestBody.age = age;
    requestBody.gender = gender;
  }

  const chatbox = document.getElementById("chatbox");

  // Display user's message immediately
  chatbox.innerHTML += `
    <div class="user-msg">
      <strong>👨 You</strong>
      <p>${userMessage}</p>
    </div>`;

  // Clear the input field and scroll to the bottom
  userInputField.value = "";
  chatbox.scrollTop = chatbox.scrollHeight;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok && data.response) {
      if (data.session_id) {
        currentSessionId = data.session_id; // Store the new session ID
      }
      // Format the bot's response before displaying it
      const formattedHtml = formatBotResponse(data.response);
      chatbox.innerHTML += `
        <div class="bot-msg">
          <strong>🤖 Bot</strong>
          <div class="bot-response-content">${formattedHtml}</div>
        </div>`;
    } else {
      chatbox.innerHTML += `<div class="bot-msg error"><strong>Error:</strong><p>${
        data.error || "Something went wrong!"
      }</p></div>`;
    }
  } catch (error) {
    chatbox.innerHTML += `<div class="bot-msg error"><strong>Error:</strong><p>Could not connect to the server. Please check your network.</p></div>`;
  }

  // Scroll to the bottom again to show the new message
  chatbox.scrollTop = chatbox.scrollHeight;
}

window.onload = welcome();
