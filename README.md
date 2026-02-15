<p align="center">
  <img src="icons/icon128.png" alt="ChatGPT Navigator Logo" width="120" />
</p>

<h1 align="center">ChatGPT Navigator</h1>

<p align="center">
  Sidebar Minimap for fast and smooth ChatGPT conversation navigation.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-v3-blue" />
  <img src="https://img.shields.io/badge/Chrome-Extension-green" />
  <img src="https://img.shields.io/badge/Status-Active-success" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" />
</p>

---

## 🚀 Overview

**ChatGPT Navigator** adds a smart sidebar minimap to ChatGPT, allowing you to quickly navigate long conversations.

Instead of endless scrolling, you get a visual overview of all messages and can jump instantly to any part of the discussion.

Perfect for power users, developers, researchers, and anyone working with long AI conversations.

---

## ✨ Features

- 📌 Visual sidebar minimap
- ⚡ Instant smooth scrolling to messages
- 🎯 Hover preview tooltips
- 🎨 User vs Assistant color distinction
- 🧠 Smart DOM observer (auto updates on new messages)
- 🪶 Lightweight & fast
- 🔒 No data collection

---

## 🖼 How It Works

- The extension detects all `article` elements in the conversation.
- A floating minimap is generated on the right side.
- Each bar represents one message.
- Hover to preview.
- Click to scroll smoothly to that message.

Clean. Simple. Efficient.

---

## 📦 Installation (Manual)

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/chatgpt-navigator.git
   ```

2. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

3. Enable **Developer Mode**

4. Click **Load unpacked**

5. Select the project folder

Done ✅

---

## 🛠 Tech Stack

- Vanilla JavaScript
- Manifest V3
- MutationObserver API
- Zero dependencies

---

## 🔐 Privacy

This extension:

- ❌ Does NOT collect data  
- ❌ Does NOT send data anywhere  
- ❌ Does NOT track users  
- ✅ Works entirely locally in your browser  

---

## 📄 Manifest

Built using Chrome Extension **Manifest V3**.

---

## ⚠ Disclaimer

This project is not affiliated with or endorsed by OpenAI.  
ChatGPT is a product of OpenAI.

---

## 💡 Roadmap Ideas

- Search within conversation
- Collapsible minimap
- Dark/Light theme toggle
- Custom width setting
- Keyboard navigation

---

## ⭐ Contributing

Pull requests are welcome.

If you like this project, consider giving it a star.

---

## 📜 License

MIT License
