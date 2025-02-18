const chatBody = document.querySelector(".chat-body");

const messageInput = document.querySelector(".message-input");

const sentMessageButton = document.querySelector("#send-message");

const fileInput = document.querySelector("#file-input");

const fileUploadWrapper = document.querySelector(".file-upload-wrapper");

const fileCancelButton = document.querySelector("#cancel-file");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null
  }
};
const initialInputHeight = messageInput.scrollHeight;
//API setup
const API_KEY = "AIzaSyBoOwVXb_7GmaaeDsIeWacR7EPZ1FV1BI8";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};
//genertate bot response using AI
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  // API request optins
  const requestOptions = {
    method: "POST",
    Headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: userData.message },
            ...(userData.file.data ? [{ inline_data: userData.file }] : [])
          ]
        }
      ]
    })
  }
  try {
    // fetcj bot response from API
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    //extract and display bot's response text
    const apiResponseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();
    messageElement.innerText = apiResponseText;
  } catch (error) {
    console.log(error);
    messageElement.innerText = error.message;
    messageElement.style.color = "#ff0000";
  } finally {
    //reset user's file data, removing thinking indicator and scroll chat to button
    userData.file = {};
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

// handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  messageInput.value = " ";
  fileUploadWrapper.classList.remove("file-uploaded");
  messageInput.dispatchEvent(new Event("input"));
  // create and display user message
  const messageContent = `<div class="message-text"></div> ${
    userData.file.data
      ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment"/>`
      : " "
  }`;
  const outgoinMessageDiv = createMessageElement(
    messageContent,
    "user-message"
  );
  outgoinMessageDiv.querySelector(".message-text").textContent =
    userData.message;
  chatBody.appendChild(outgoinMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  //simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `<i class="fa-solid fa-robot bot-avtar"></i>
        <div class="message-text">
          <div class="thinking-indicator">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>`;
    const incomingMessageDiv = createMessageElement(
      messageContent,
      "bot-message",
      "thinking"
    );
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

//handle enter key press for sending messages
//here e is an object 
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && userMessage && !e.shiftKey && window.innerWidth >768) {
    handleOutgoingMessage(e);
  }
});
//adjust input field height dynmaically
messageInput.addEventListener("input",() =>{
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" :"32px"
})

//handle file input change
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileUploadWrapper.querySelector("img").src=e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    const base64String = e.target.result.split(",")[1];
    //store file data in userdata
    userData.file = {
      data: base64String,
      mime_type: file.type
    };
    fileInput.value = "";
  };
  reader.readAsDataURL(file);
});
//cancel fileupload
fileCancelButton.addEventListener("click",() =>{
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});
//initialize emoji picker and hadle emoji selsetion
const picker = new EmojiMart.Picker({
  theme:"light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect:(emoji) =>{
    const {selectionStart:start , selectionEnd: end}=messageInput;
    messageInput.setRangeText(emoji.native, start , end ,"end");
    messageInput.focus();
  },
  onClickOutside: (e) =>{
    if(e.target.id ==="emoji-picker"){
       document.body.classList.toggle("show-emoji-picker");
    }
    else{
      document.body.classList.remove("show-emoji-picker");
    }
  }
});
document.querySelector(".chat-form").appendChild(picker);

sentMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));

document.querySelector("#file-upload")
  .addEventListener("click", () => fileInput.click());
  chatbotToggler.addEventListener("click",() => document.body.classList.toggle("show-chatbot"));
  closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot")
);