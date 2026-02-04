const DEFAULT_SETTINGS = {
  apiUrl: "http://api.gptnix.online",
  apiKey:
    "sk-av-v1-rmgmnI6lgWGTiBqIOkX7v8Ysuz6bOMBzW9UHw8ZYmfxdMHEnFimp3YgoGrqSJ_5buQsGOCLjIc5UKlv987jUs9fJJGlYC77HI1p59AnRD4IxGqsf2TvDYAX",
  model: "openai/gpt-5-mini",
};

const messagesEl = document.getElementById("messages");
const composer = document.getElementById("composer");
const promptEl = document.getElementById("prompt");
const statusEl = document.getElementById("status");
const clearChat = document.getElementById("clearChat");
const settingsForm = document.getElementById("settingsForm");
const apiUrlInput = document.getElementById("apiUrl");
const apiKeyInput = document.getElementById("apiKey");
const modelInput = document.getElementById("model");
const modelName = document.getElementById("modelName");

const loadSettings = () => {
  const stored = localStorage.getItem("chatSettings");
  if (!stored) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (error) {
    console.warn("تعذر قراءة الإعدادات المحفوظة", error);
    return { ...DEFAULT_SETTINGS };
  }
};

const saveSettings = (settings) => {
  localStorage.setItem("chatSettings", JSON.stringify(settings));
};

let settings = loadSettings();

apiUrlInput.value = settings.apiUrl;
apiKeyInput.value = settings.apiKey;
modelInput.value = settings.model;
modelName.textContent = settings.model;

let conversation = [
  {
    role: "assistant",
    content: "مرحبًا! أنا مساعدك الذكي. كيف أقدر أساعدك اليوم؟",
  },
];

const appendMessage = (role, content) => {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "أنت" : "AI";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  wrapper.append(avatar, bubble);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
};

const setStatus = (message = "") => {
  statusEl.textContent = message;
};

const buildApiUrl = () => {
  const base = settings.apiUrl.replace(/\/$/, "");
  return `${base}/v1/chat/completions`;
};

const sendMessage = async (message) => {
  if (!settings.apiKey) {
    setStatus("يرجى إدخال مفتاح API في الإعدادات أولًا.");
    return;
  }

  setStatus("جارٍ الكتابة...");
  const body = {
    model: settings.model,
    messages: conversation.concat({ role: "user", content: message }),
  };

  try {
    const response = await fetch(buildApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`فشل الطلب: ${response.status}`);
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "لم يتم استلام رد، حاول مرة أخرى.";

    conversation.push({ role: "user", content: message });
    conversation.push({ role: "assistant", content: reply });

    appendMessage("assistant", reply);
    setStatus("");
  } catch (error) {
    console.error(error);
    setStatus("حدث خطأ أثناء الاتصال، حاول مرة أخرى لاحقًا.");
  }
};

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = promptEl.value.trim();
  if (!message) return;

  appendMessage("user", message);
  promptEl.value = "";
  promptEl.style.height = "auto";
  sendMessage(message);
});

promptEl.addEventListener("input", () => {
  promptEl.style.height = "auto";
  promptEl.style.height = `${promptEl.scrollHeight}px`;
});

promptEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    composer.requestSubmit();
  }
});

clearChat.addEventListener("click", () => {
  conversation = [conversation[0]];
  messagesEl.innerHTML = "";
  appendMessage("assistant", conversation[0].content);
  setStatus("");
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  settings = {
    apiUrl: apiUrlInput.value.trim() || DEFAULT_SETTINGS.apiUrl,
    apiKey: apiKeyInput.value.trim(),
    model: modelInput.value.trim() || DEFAULT_SETTINGS.model,
  };

  saveSettings(settings);
  modelName.textContent = settings.model;
  setStatus("تم حفظ الإعدادات.");
});
