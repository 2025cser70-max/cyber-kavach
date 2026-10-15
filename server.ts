import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  let isGeminiAvailable = Boolean(apiKey && apiKey.length > 5);

  const ai = isGeminiAvailable
    ? new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // Lightweight probe to verify project access without generating unhandled errors
  if (ai) {
    try {
      await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'ping',
      });
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      if (
        errMsg.includes('403') ||
        errMsg.includes('PERMISSION_DENIED') ||
        errMsg.includes('denied access')
      ) {
        isGeminiAvailable = false;
        console.log(
          '[Cyber Kavach] Project API access restricted. Seamlessly activating built-in Fallback / Demo Mode.'
        );
      }
    }
  }

  // Status check endpoint
  app.get('/api/status', (_req, res) => {
    res.json({
      hasApiKey: Boolean(apiKey && apiKey.length > 5 && isGeminiAvailable),
      mode: isGeminiAvailable ? 'live' : 'demo',
    });
  });

  // Scam Analysis Endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const {
        content,
        type = 'call',
        language = 'hi',
        imageBase64,
        imageMimeType = 'image/jpeg',
      } = req.body;

      if (!content && !imageBase64) {
        res.status(400).json({ error: 'Content or image is required for analysis' });
        return;
      }

      // If Gemini is not accessible or in Demo Mode, trigger client's high-fidelity local engine
      if (!ai || !isGeminiAvailable) {
        res.json({ fallback: true, mode: 'demo' });
        return;
      }

      const promptInstructions = `
You are "Cyber Kavach" (साइबर कवच), an empathetic, highly vigilant scam-protection assistant designed specifically for senior citizens and low-literacy users in India.
Analyze the provided phone call transcript or incoming text message/screenshot.
Detect Indian cyber frauds, including:
- "Digital Arrest" scams (fake CBI, Mumbai Police, ED, TRAI, Customs demanding video calls or money)
- Bank account / Debit card block or fake KYC expiration threats
- UPI refund, mistaken payment sent, or UPI PIN collect request fraud
- Lottery, lottery winnings, lucky prize, KBC schemes
- Relative/grandchild in emergency or hospital accident needing immediate money
- Electricity, water, or gas disconnection threats within 1-2 hours
- Fake job offers, APK installations (AnyDesk, TeamViewer, QuickSupport)

Rules:
1. Target Language: Respond in ${language === 'auto' ? 'the same language as the scam content' : language}. Write all text (red_flags, explanation, recommended_actions, voice_script) in native script (e.g. Devanagari for Hindi/Marathi, Tamil script for Tamil, etc.), never in Latin transliteration.
2. Voice Script: Must be 50-60 words (spoken in under 25 seconds). Calm, respectful, grandchild-like tone:
   - Step 1: Calm opening: "Please stop. This looks like a scam." (translated)
   - Step 2: One-sentence specific reason (e.g., "Real police officers never arrest people over phone calls or demand money.")
   - Step 3: Exactly three simple actions: Do not share OTP or PIN; Do not send money; Hang up the call / Delete message.
   - Step 4: Where to get help: National Cyber Crime Helpline 1930 and cybercrime.gov.in, and talk to your family.
3. Be respectful and protect the elderly. If normal family call or genuine notification with no fraud signals, risk_level is "safe".
`;

      const contentsPayload: any[] = [];

      if (imageBase64) {
        contentsPayload.push({
          inlineData: {
            mimeType: imageMimeType,
            data: imageBase64.replace(/^data:[a-zA-Z0-9/]+;base64,/, ''),
          },
        });
      }

      contentsPayload.push({
        text: `Input type: ${type}\nTarget language code: ${language}\nContent to evaluate:\n${content || '[Screenshot provided]'}\n\n${promptInstructions}`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              risk_level: {
                type: Type.STRING,
                description: "Must be 'safe', 'suspicious', or 'scam'",
              },
              risk_score: {
                type: Type.NUMBER,
                description: 'Risk score from 0 to 100',
              },
              scam_type: {
                type: Type.STRING,
                description:
                  'e.g. digital_arrest, kyc_fraud, upi_fraud, lottery, family_emergency, utility_threat, phishing_link, remote_access, none',
              },
              red_flags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Maximum 3 red flags in the chosen language and native script',
              },
              explanation: {
                type: Type.STRING,
                description: 'Maximum 2 simple sentences in chosen language',
              },
              recommended_actions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 3 simple action steps in chosen language',
              },
              voice_script: {
                type: Type.STRING,
                description:
                  'Spoken warning in native script, 50-60 words, warm caring tone, mentions 1930 and cybercrime.gov.in',
              },
              detected_language: {
                type: Type.STRING,
                description: 'Detected language name or code',
              },
            },
            required: [
              'risk_level',
              'risk_score',
              'scam_type',
              'red_flags',
              'explanation',
              'recommended_actions',
              'voice_script',
              'detected_language',
            ],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from model');
      }

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      if (
        errMsg.includes('403') ||
        errMsg.includes('PERMISSION_DENIED') ||
        errMsg.includes('denied access')
      ) {
        isGeminiAvailable = false;
        console.log(
          '[Cyber Kavach] Project API access restricted. Activating Fallback / Demo Mode.'
        );
      } else {
        console.log('[Cyber Kavach] Analysis falling back to local database:', errMsg);
      }
      res.json({ fallback: true, mode: 'demo' });
    }
  });

  // Text-To-Speech Endpoint
  app.post('/api/tts', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        res.status(400).json({ error: 'Text is required for TTS' });
        return;
      }

      if (!ai || !isGeminiAvailable) {
        res.json({ fallback: true, mode: 'demo' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style: 'Warm, calm, protective, respectful speaking voice for an elderly relative in India',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({
          audioBase64: base64Audio,
          mimeType: 'audio/wav',
        });
      } else {
        res.json({ fallback: true, reason: 'NO_AUDIO_RETURNED' });
      }
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      if (
        errMsg.includes('403') ||
        errMsg.includes('PERMISSION_DENIED') ||
        errMsg.includes('denied access')
      ) {
        isGeminiAvailable = false;
        console.log(
          '[Cyber Kavach] TTS API restricted. Activating browser Web Speech fallback.'
        );
      } else {
        console.log('[Cyber Kavach] TTS using browser Web Speech fallback.');
      }
      res.json({ fallback: true, mode: 'demo' });
    }
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cyber Kavach] Server listening on port ${PORT}`);
  });
}

startServer();
