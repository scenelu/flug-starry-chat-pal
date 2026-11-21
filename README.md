# Flug Starry Chat Pal

Build a fully functional, pixel-art AI chatbot web application called FLUG AI, featuring an adorable pixel alien named Flug.

The entire application should look like a retro 2D pixelated space video game, with a nostalgic 8-bit/16-bit visual style.

1. GROQ API — STRICT REQUIREMENT

I already have my own Groq API key.

Use ONLY the Groq API to generate chatbot responses. Do not use Lovable AI, OpenAI's API, Anthropic, Gemini, or any other AI provider.

API configuration:

Provider: Groq

Endpoint: https://api.groq.com/openai/v1/chat/completions

Model: llama-3.3-70b-versatile

Method: POST

Authorization: Bearer token

Content-Type: application/json

Create a secure backend Edge Function that connects to Groq.

Ask me to provide my existing API key through Lovable's secure Secrets interface under the name GROQ_API_KEY.

Read that secret from the server environment and use it for every AI chat request.

Never expose the API key in frontend code or public requests.

Never replace Groq with another AI provider. If Groq fails, display a helpful error message instead of silently switching providers.

The chatbot must give real responses from Groq, not simulated or hardcoded answers.

2. PIXEL ART DESIGN AND COLOR PALETTE

Use this exact Color Hunt palette throughout the entire application:

https://colorhunt.co/palette/450c3fb9d175d9efbdf5fbda

Colors:

#450C3F — Deep purple, primary backgrounds and outlines.

#B9D175 — Sage green, buttons and interactive elements.

#D9EFBD — Light pastel green, message bubbles and secondary panels.

#F5FBDA — Light cream, text areas and highlights.

Do not introduce unrelated dominant colors.

The aesthetic must be:

Fully pixelated.

Retro arcade-inspired.

Cute extraterrestrial space theme.

Nostalgic 8-bit video game atmosphere.

Cohesive and visually polished.

Inspired by classic pixel-art games.

Use chunky pixel borders, pixel typography, retro UI panels, pixelated shadows, and blocky buttons.

Avoid modern glassmorphism, gradients, and overly rounded elements.

Use fonts such as Press Start 2P for headings and a highly readable pixel font for message text.

Keep the interface usable and easy to read.

3. FLUG — THE AI ALIEN AVATAR

Create an original pixel-art alien character named Flug.

Flug should:

Be an adorable, friendly, recognizable space alien.

Have a cute extraterrestrial appearance.

Have expressive pixelated eyes.

Use the specified green and purple palette.

Have a consistent character design throughout the website.

Appear beside every AI-generated message.

Appear prominently on the welcome screen.

Create pixel-art expressions for Flug:

Idle: Friendly and relaxed.

Thinking: Curious or concentrating.

Responding: Happy and energetic.

Error: Confused expression.

Flug should have a subtle animated idle effect, similar to a character in an old pixel video game.

Flug's dialogue should appear in retro game-style chat bubbles.

4. USER AVATAR — PIXEL SPACESHIP

Instead of a normal human profile icon, use a pixelated spaceship to represent the user.

The spaceship must:

Look like a small retro arcade spaceship.

Have a primarily deep-purple body with light-green accents.

Match the Flug art style.

Appear beside every user message.

Maintain the same appearance throughout the interface.

Every conversation should visually feel like a spaceship pilot communicating with an alien.

5. CHAT INTERFACE

Create a fully functional chat interface.

Layout:

A left sidebar containing saved conversations.

A main chat window.

A header displaying "FLUG AI" in pixel typography.

A pixel alien icon beside the title.

A bottom text-entry field with a pixelated Send button.

Messages:

User messages are aligned to the right with the spaceship avatar.

Flug's messages are aligned to the left with Flug's avatar.

Give each side distinct colors from the palette.

Use retro rectangular dialogue boxes with pixelated borders.

Support Markdown, code blocks, lists, and copy-to-clipboard.

Keep chat history and conversation context.

Automatically scroll to new messages.

Create functional buttons for:

New Chat

Delete Chat

Copy Message

Send Message

Toggle Sidebar

Support Enter to send and Shift+Enter for a new line.

6. WELCOME SCREEN

When the user opens the website, show a charming pixelated space-themed welcome screen.

Display a larger pixel-art Flug in the center.

Main heading:
"HELLO, EARTHLING!"

Subtitle:
"I'm Flug, your friendly alien assistant. What shall we explore today?"

Include several pixelated suggestion buttons:

"Tell me a space fact"

"Help me with homework"

"Let's write some code"

"Surprise me, Flug!"

Clicking a suggestion should start a real Groq-powered conversation.

Add a subtle pixel starfield in the background with gentle animated twinkling.

Keep animations lightweight and accessible.

7. FLUG'S PERSONALITY

Use this system prompt for all conversations:

"You are Flug, a friendly alien AI assistant from outer space. You are curious, clever, funny, and genuinely helpful.

Your personality is playful and slightly quirky, but you always prioritize giving accurate and useful answers.

You can occasionally make lighthearted space references, but never overdo them.

Explain difficult topics clearly, help users learn, and answer questions naturally.

You are an intelligent assistant, not just a character. You can help with programming, studying, creative writing, everyday questions, and general problem-solving.

Maintain conversation context and be transparent when you are uncertain."

8. INTERACTIVE PIXEL DETAILS

Add charming retro game elements:

A subtle pixel cursor effect when appropriate.

A three-dot pixel animation while Flug is thinking.

Hover animations on pixel buttons.

A small spaceship animation when sending a message.

A tiny Flug expression change while generating a response.

Optional muteable retro UI sound effects.

The interface should be visually interesting without interfering with usability.

9. BACKEND AND CHAT STORAGE

Use Lovable Cloud or Supabase for secure backend functionality and chat storage.

Groq must remain the ONLY AI inference provider.

Implement:

Server-side API integration.

Secure secret management.

Conversation context sent with API requests.

Conversation saving and retrieval.

Proper message ordering.

Error handling.

Rate limiting and safeguards against excessive API usage.

User-level access controls if accounts are enabled.

Never put the Groq API key in the client-side application.

10. FINAL REQUIREMENTS

This must be a REAL, working chatbot, not just a visual prototype.

Ensure that:

All AI responses come exclusively from my Groq API.

Flug is represented by an original pixel alien.

The user is represented by a pixel spaceship.

The entire application follows the exact four-color palette.

The design looks like a retro pixelated space video game.

The chatbot has functional multi-turn conversations.

Chat history, buttons, and UI interactions work correctly.

The API key is stored securely.

The website works on desktop and mobile.

No alternative AI provider is used.

After implementation, test the complete message flow from the frontend through the backend to Groq and back.

If I need to enter my API key, prompt me to add it as the secure GROQ_API_KEY secret.

Build the complete application with working functionality and a polished, memorable pixel-art identity.

use this api key "@secret:GROQ_API_KEY "

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://flug-starry-chat-pal.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/13d267f7-0bee-53d8-8d1d-e50d279dea91).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
