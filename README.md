# Cyber Kavach (साइबर कवच) 🛡️

**AI Scam-Protection Assistant for Senior Citizens & Rural Smartphone Users in India**

Cyber Kavach provides real-time, voice-first protection against phone call frauds, "digital arrest" schemes, fake bank KYC deactivations, UPI collect scams, lottery traps, and utility disconnection threats.

---

## 🌟 Key Features

1. **Voice-First & Icon-First Accessibility**:
   - Designed for senior citizens and low-literacy users.
   - Body text 20px+, headings 28px+, buttons 64px+ tall with 56px+ touch targets.
   - Every on-screen element has a speaker button that reads it aloud in the selected regional language.

2. **10 Indian Regional Languages Supported**:
   - Hindi (हिन्दी)
   - Tamil (தமிழ்)
   - Telugu (తెలుగు)
   - Bengali (বাংলা)
   - Marathi (मराठी)
   - Gujarati (ગુજરાતી)
   - Kannada (ಕನ್ನಡ)
   - Malayalam (മലയാളം)
   - Punjabi (ਪੰਜਾਬੀ)
   - English
   - **Auto-Match Mode**: Automatically replies in the detected language of the incoming call or message.

3. **Simulated Live Call Protection**:
   - 7 realistic scenarios:
     1. CBI / Police "Digital Arrest" Call
     2. Bank KYC / Account & Pension Blocked Call
     3. UPI "Mistaken Payment / Refund" Call
     4. Lottery / KBC ₹25 Lakh Prize Call
     5. Grandchild Accident / Hospital Emergency Call
     6. Electricity Disconnection / Remote App Threat Call
     7. Genuine Normal Family Call (verifies 0% false alarms)
   - Live transcript bubbles appear progressively every 2-3 seconds.
   - Dynamic real-time Risk Meter (Safe, Suspicious, Danger).
   - Full-screen red alert with AI-spoken regional warning when Danger threshold is crossed.

4. **Signature Voice-Note Generator**:
   - Structured 50-60 word warm advisory (under 25 seconds).
   - Powered by Gemini TTS (`gemini-3.8-flash-lite-tts`) with instant browser Web Speech API fallback.
   - Slower 0.8x speech toggle, replay, live waveform, sentence subtitle highlighting, and WhatsApp sharing.

5. **Multimodal Message & Screenshot Checker**:
   - Check messages via pasted text, camera/screenshot upload (Gemini Vision), or voice input (Speech-to-Text).
   - Real-time privacy guard: Automatically masks any typed OTPs, PINs, or Aadhaar numbers and warns the user.
   - One-tap quick sample tests for elderly users.

6. **Family Alert & Helpline 1930 Integration**:
   - Setup 1-2 trusted contacts (son, daughter, grandchild).
   - One-tap "Tell my family" alert dispatch with WhatsApp preview.
   - Direct dialing for National Cyber Crime Helpline **1930** and portal instructions for **cybercrime.gov.in**.

---

## 🔒 Security & API Key Setup Instructions

To protect your API credentials, **never expose `GEMINI_API_KEY` to the browser or client-side code**. This application uses a full-stack architecture where all Gemini API calls (`gemini-3.8-flash` and `gemini-3.8-flash-lite-tts`) are securely proxied through the server (`server.ts`).

### Local Development / Production Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Add your Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY="your-google-gemini-api-key-here"
   PORT=3000
   ```
3. In Google AI Studio:
   - Configure the secret `GEMINI_API_KEY` in the **Settings > Secrets** panel.
   - AI Studio injects this environment variable automatically into the backend runtime.
4. If no API key is provided, Cyber Kavach automatically enters **Demo Mode**:
   - High-fidelity pre-computed analyses and native script transcripts run smoothly.
   - Browser Web Speech synthesis speaks alerts in all regional locales (`hi-IN`, `ta-IN`, `te-IN`, etc.).
   - The user never experiences blank screens or raw technical errors.

---

## 🚀 Running the App

```bash
# Install dependencies
npm install

# Start the full-stack development server
npm run dev

# Build for production
npm run build
npm start
```
