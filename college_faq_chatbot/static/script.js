const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatContent = document.getElementById("chatContent");
const sendButton = document.getElementById("sendButton");
const typingIndicator = document.getElementById("typingIndicator");
const clearChatButton = document.getElementById("clearChat");

const welcomeMessage = `
  <div class="date-label"><span>YOUR CAMPUS HELP DESK</span></div>
  <article class="message-row bot-row">
    <div class="message-avatar">✦</div>
    <div class="message-stack">
      <div class="message-bubble bot-bubble">
        <p>Hey there! 👋 Welcome to CampusConnect.</p>
        <p>I'm your college FAQ assistant. I can help you find information about admissions, fees, examinations, attendance, library services, placements and more.</p>
        <p>What would you like to know today?</p>
      </div>
      <span class="message-time">Campus Assistant</span>
    </div>
  </article>`;

function getTime() {
  return new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function addMessage(text, sender, details = {}) {
  const row = document.createElement("article");
  row.className = `message-row ${sender === "user" ? "user-row" : "bot-row"}`;

  if (sender === "bot") {
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "✦";
    row.appendChild(avatar);
  }

  const stack = document.createElement("div");
  stack.className = "message-stack";

  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${sender === "user" ? "user-bubble" : "bot-bubble"}`;

  // textContent prevents user input from being interpreted as HTML.
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  bubble.appendChild(paragraph);

  if (sender === "bot" && details.matched && details.category) {
    const tag = document.createElement("span");
    tag.className = "match-tag";
    tag.textContent = `Matched FAQ · ${details.category}`;
    bubble.appendChild(tag);
  }

  stack.appendChild(bubble);
  const time = document.createElement("span");
  time.className = "message-time";
  time.textContent = sender === "user" ? `You · ${getTime()}` : `Campus Assistant · ${getTime()}`;
  stack.appendChild(time);
  row.appendChild(stack);
  chatContent.appendChild(row);
  chatContent.scrollTop = chatContent.scrollHeight;
}

async function sendMessage(message) {
  const question = message.trim();
  if (!question) return;

  addMessage(question, "user");
  messageInput.value = "";
  sendButton.disabled = true;
  typingIndicator.hidden = false;
  chatContent.scrollTop = chatContent.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.answer || "Something went wrong.");
    addMessage(data.answer, "bot", data);
  } catch (error) {
    addMessage(error.message || "I couldn't connect to the server. Please try again.", "bot");
  } finally {
    typingIndicator.hidden = true;
    sendButton.disabled = false;
    messageInput.focus();
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(messageInput.value);
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.dataset.question));
});

clearChatButton.addEventListener("click", () => {
  chatContent.innerHTML = welcomeMessage;
  messageInput.focus();
});

messageInput.focus();
