# IOAI Studio

**IOAI Studio** is a powerful, all-in-one web application that leverages the full suite of Google's Gemini AI models to provide a seamless and intuitive creative experience. As a fully client-side application with **no build process**, it runs directly in any modern web browser and can be deployed to any static hosting service in seconds.

This application serves not only as a powerful productivity tool but also as a live, interactive reference implementation for the Gemini API.

## Features

-   **✍️ Optimizer**: Optimize, summarize, and proofread text with fine-grained controls for creativity and complexity.
-   **💡 Project Studio**: A flexible workspace to upload documents and images, then summarize, modify, or brainstorm with AI assistance.
-   **🌐 AI Translator**: Translate text between numerous languages with auto-detection and text-to-speech capabilities.
-   **💬 AI Chat**: Engage in advanced conversations with options for deep reasoning ("Thinking Mode") and up-to-date information via Google Search grounding.
-   **🖼️ Image Studio**: Generate, edit, and analyze images using powerful text prompts and artistic style presets.
-   **🎙️ Live Conversation**: Have a natural, real-time voice chat with the AI, including the ability to discuss uploaded images.
-   **📁 My Projects**: Save and organize all your work—text, chats, images, and translations—directly in your browser's local storage.
-   **👨‍💻 Live API Reference**: A unique educational feature. Click the **</>** icon in any view to see the exact, dynamic Gemini API code used for that specific task. This turns the app into a hybrid tool and a live learning resource.

## Technology Stack

-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS
-   **AI**: Google Gemini API (`@google/genai` SDK)
-   **Rendering**: Marked (for Markdown), KaTeX (for LaTeX math formulas)

---

## Gemini API Showcase

This application demonstrates a wide range of Gemini API capabilities:

-   **Advanced Text Generation (`gemini-2.5-pro`)**: Used in the **Optimizer** for high-quality text manipulation with complex system instructions.
-   **Fast Text Generation (`gemini-2.5-flash`)**: Powers the **AI Translator**, **Project Studio**, and standard **AI Chat** for quick and efficient responses.
-   **Function Calling (Tools)**: The **AI Chat**'s "Search" feature uses `googleSearch` as a tool to ground responses in real-time information from the web.
-   **Image Generation (`imagen-4.0-generate-001`)**: The core of the **Image Studio**'s generation capability, creating high-quality images from text prompts.
-   **Multi-modality (Image + Text)**: Used in the **Image Studio** to edit (`gemini-2.5-flash-image`) and analyze (`gemini-2.5-flash`) user-uploaded images.
-   **Text-to-Speech (`gemini-2.5-flash-preview-tts`)**: Powers the "Read Aloud" feature in the Optimizer and Translator views.
-   **Live Audio Streaming (`gemini-2.5-flash-native-audio-preview-09-2025`)**: The foundation of the **Live Conversation** view, enabling real-time, low-latency voice interaction and transcription.

---

## Development Journey & Challenges

Building a cutting-edge AI application comes with unique challenges. Here are some we tackled:
1.  **Robust Math Rendering**: The Gemini models can output complex LaTeX formulas. To render them correctly without conflicting with Markdown parsing, we implemented a placeholder strategy. The app first isolates all LaTeX expressions, processes the remaining Markdown, and then renders the math formulas using KaTeX.
2.  **Real-time Audio Processing**: The Live Conversation feature requires processing raw PCM audio streams from the browser. We wrote custom encoder/decoder functions to handle this data format, as standard browser APIs are designed for file-based audio, not raw streams.
3.  **Browser Compatibility**: To take full advantage of the latest web standards and experimental AI features, **it is highly recommended to run this application in a bleeding-edge browser like Chrome Canary**. This ensures the best performance and access to all functionalities, especially for features like the Web Speech API and real-time audio contexts.

---

## Getting Started (Local Development)

### Prerequisites
-   [Node.js](https://nodejs.org/) (for the `npx` command)
-   **Recommended Browser**: [Google Chrome Canary](https://www.google.com/chrome/canary/)

### Setup Instructions
1.  **Clone the Repository**
    ```sh
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Set Up Your Gemini API Key**
    -   Get your API key from [Google AI Studio](https://aistudio.google.com/).
    -   In the root of the project, create a new file named `.env`.
    -   Add your API key to this file:
        ```
        API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE
        ```

3.  **Run the Local Server**
    -   This is a static site and must be served by an HTTP server. The easiest way is with the `serve` package.
        ```sh
        npx serve
        ```
    -   Open the URL from your terminal (e.g., `http://localhost:3000`) in your browser.

> **Important:** Do not open the `index.html` file directly. It must be served over HTTP to function correctly.

## Deployment

This is a **zero-build, static web application**. Deploy the entire folder to any static hosting service like Netlify, Vercel, or GitHub Pages.

**To deploy on Netlify:**
1.  Connect your repository to Netlify.
2.  **No build settings are required**. Leave the build command and publish directory fields blank (or set the publish directory to `/`).
3.  Set your Gemini API key as an **environment variable** in the Netlify dashboard:
    -   **Key**: `API_KEY`
    -   **Value**: `PASTE_YOUR_GEMINI_API_KEY_HERE`
4.  Deploy!