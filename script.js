// Set this to your deployed Cloudflare Worker URL.
// Never put an API key in this file.
const WORKER_URL = "https://loreal-worker.cruzcarcg.workers.dev/";

// Get the HTML elements used by the chatbot.
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");
const status = document.getElementById("status");
const latestPanel = document.getElementById("latestPanel");
const latestQuestion = document.getElementById("latestQuestion");
const starters = document.querySelectorAll("[data-prompt]");

// Store completed conversation turns for the current session.
// This allows the chatbot to remember names and earlier questions.
let messages = [];

// Prevent another submission while a response is loading.
let busy = false;

// Limit conversation size instead of silently deleting older messages.
const MAX_TURNS = 25;
const MAX_HISTORY_CHARS = 40000;

/* Add a user or assistant message to the conversation. */
function addMessage(role, text) {
  const bubble = document.createElement("div");

  // Use different CSS classes for the user and assistant.
  bubble.className = "msg " + (role === "user" ? "user" : "ai");

  const label = document.createElement("span");
  label.className = "sender";
  label.textContent = role === "user" ? "YOU" : "BEAUTY ADVISOR";

  const content = document.createElement("p");

  // Display text safely instead of interpreting it as HTML.
  content.textContent = text;

  bubble.append(label, content);
  chatWindow.append(bubble);

  // Scroll to the newest message.
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Clear the current conversation and show the welcome message. */
function newChat() {
  messages = [];

  chatWindow.replaceChildren();

  latestPanel.hidden = true;
  latestQuestion.textContent = "";

  status.textContent = "";
  userInput.value = "";

  addMessage(
    "assistant",
    "Hello, beautiful possibilities. I’m your AI beauty advisor. " +
      "Tell me your name and what you’d like help with: makeup, " +
      "skincare, haircare, or fragrance."
  );
}

/* Disable controls while the chatbot is responding. */
function setBusy(value) {
  busy = value;

  sendBtn.disabled = value;
  resetBtn.disabled = value;
  userInput.disabled = value;

  starters.forEach((button) => {
    button.disabled = value;
  });
}

/* Send the user's message to the Cloudflare Worker. */
chatForm.addEventListener("submit", async (event) => {
  // Prevent the form from refreshing the page.
  event.preventDefault();

  // Remove unnecessary spaces from the beginning and end.
  const question = userInput.value.trim();

  // Ignore empty messages or duplicate submissions.
  if (!question || busy) {
    return;
  }

  // Explain what is missing if the Worker URL has not been added.
  if (!WORKER_URL) {
    status.textContent =
      "Setup needed: add your Cloudflare Worker URL in script.js.";

    return;
  }

  // Include earlier conversation turns with the latest question.
  const nextMessages = [
    ...messages,
    {
      role: "user",
      content: question
    }
  ];

  // Calculate the total number of characters in this conversation.
  const historyLength = nextMessages.reduce((sum, message) => {
    return sum + message.content.length;
  }, 0);

  // Ask for a new chat once the conversation reaches its limit.
  if (
    messages.length / 2 >= MAX_TURNS ||
    historyLength > MAX_HISTORY_CHARS
  ) {
    status.textContent =
      "This conversation has reached its limit. Choose New chat to continue.";

    return;
  }

  // Replace the previous question in the Latest Question panel.
  latestQuestion.textContent = question;
  latestPanel.hidden = false;

  // Show the user's message before requesting the assistant's response.
  addMessage("user", question);

  // Clear the input and show a loading message.
  userInput.value = "";
  setBusy(true);

  status.textContent = "Your beauty advisor is thinking…";

  // Cancel a request if it takes longer than 45 seconds.
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 45000);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      // The Worker expects a messages array.
      body: JSON.stringify({
        messages: nextMessages
      }),

      signal: controller.signal
    });

    const data = await response.json();

    // Handle errors returned by the Worker.
    if (!response.ok) {
      throw new Error(
        data.error || "Unable to get a response. Please try again."
      );
    }

    // Extract the response using the required API response format.
    const answer = data.choices?.[0]?.message?.content;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("No reply was received. Please try again.");
    }

    // Save only successfully completed turns in the API history.
    messages = [
      ...nextMessages,
      {
        role: "assistant",
        content: answer
      }
    ];

    // Display the assistant's response.
    addMessage("assistant", answer);

    // Let the user know if the response reached the token limit.
    if (data.choices[0].finish_reason === "length") {
      status.textContent =
        "Response limit reached. Ask me to continue for more detail.";
    } else {
      status.textContent = "";
    }
  } catch (error) {
    // Explain whether the request timed out or failed for another reason.
    if (error.name === "AbortError") {
      status.textContent = "The request timed out. Please try again.";
    } else {
      status.textContent = error.message;
    }

    addMessage(
      "assistant",
      "I couldn’t complete that request. Your question is back in the " +
        "input so you can try again."
    );

    // Restore the user's question so they do not have to type it again.
    userInput.value = question;
  } finally {
    // Always restore the controls after the request finishes.
    clearTimeout(timeout);
    setBusy(false);
    userInput.focus();
  }
});

/* Fill the input when a conversation starter is selected. */
starters.forEach((button) => {
  button.addEventListener("click", () => {
    userInput.value = button.dataset.prompt;
    userInput.focus();
  });
});

/* Start a fresh conversation when New chat is clicked. */
resetBtn.addEventListener("click", () => {
  newChat();
  userInput.focus();
});

// Show the initial welcome message.
newChat();