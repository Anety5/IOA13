# IOAI Studio

**IOAI Studio** is a powerful, all-in-one web application that leverages the full suite of Google's Gemini AI models to provide a seamless and intuitive creative experience. As a fully client-side application with **no build process**, it runs directly in any modern web browser and can be deployed to any static hosting service in seconds.

This application serves as a powerful productivity tool and a live, interactive reference implementation for the Gemini API.

## Features

-   **✍️ Content Optimizer**: A versatile workspace for all text-based projects. Input your content, then **Summarize**, provide a custom instruction to **Modify**, or use fine-grained controls to **Optimize** it for a specific audience, goal, and tone. Supports text and image attachments for richer context.
-   **🌐 AI Translator**: Translate text between **over 70 languages** with auto-detection and text-to-speech capabilities to hear the translated content.
-   **🖼️ Image Studio**: Generate high-quality images from text prompts using Imagen 4, or upload your own image and use AI to edit it. Apply artistic style presets like "Photorealistic," "Anime," and "3D" to enhance your creations.
-   **💬 AI Assistant**: Engage with an intelligent AI assistant that provides dynamic, context-aware suggestions based on the content you are currently working on.
-   **📁 My Projects**: Save and organize all your work—optimized text, translations, and images—directly in your browser's local storage.
-   **✨ Coming Soon**: We are actively working on integrating **Video Generation** capabilities to bring your stories and ideas to life in a new dimension.

## Technology Stack

-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS
-   **AI**: Google Gemini API (`@google/genai` SDK)
-   **Rendering**: Marked (for Markdown), KaTeX (for LaTeX math formulas)

---

## Gemini API Showcase

This application demonstrates a wide range of Gemini API capabilities:

-   **Advanced Text Generation (`gemini-2.5-pro`)**: Used in the **Content Optimizer** for high-quality text manipulation that requires following complex instructions.
-   **Fast Text Generation (`gemini-2.5-flash`)**: Powers the **AI Translator**, the **Content Optimizer's** "Summarize" action, and the **AI Assistant** for quick and efficient responses.
-   **Image Generation (`imagen-4.0-generate-001`)**: The core of the **Image Studio**, creating high-quality images from text prompts.
-   **Image Editing (`gemini-2.5-flash-image`)**: Used in the **Image Studio** to edit user-uploaded images based on text prompts.
-   **Text-to-Speech (`gemini-2.5-flash-preview-tts`)**: Powers the "Read Aloud" feature in the Translator view, converting text into natural-sounding audio.

---

## Development Journey & Current Challenges

Building a cutting-edge AI application comes with unique challenges. Here are some we are actively addressing:

1.  **Visual Consistency in Image Generation**: While the Image Studio is powerful for single generations and edits, ensuring perfect visual consistency of a character or style across *multiple, separate* generations remains a frontier challenge in AI image creation.

2.  **Browser Storage Limitations**: The "My Projects" feature relies on the browser's `localStorage`. While convenient for a client-side app, it has size limitations (typically 5-10MB). Storing numerous high-resolution images can quickly exhaust this space, leading to save errors. Future versions may explore more robust storage solutions.

3.  **Real-time Information Access**: The AI models do not have live access to the internet for information like today's weather or breaking news. Their knowledge is based on the data they were trained on, which has a cutoff date. Future integrations may use Gemini's tool-use capabilities to access real-time data.

4.  **Future API Requirements (Video)**: As we plan to integrate video generation (e.g., using Google's Veo model), users should be aware that these advanced models often have specific API key requirements, such as needing a Google Cloud project with billing enabled, which is a different setup from the standard Gemini API key used for text and image generation.

---

## Getting Started (Local Development)

### Prerequisites
-   [Node.js](https://nodejs.org/) (for the `npx` command)
-   **Recommended Browser**: A modern, up-to-date browser like Chrome, Firefox, or Edge.

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