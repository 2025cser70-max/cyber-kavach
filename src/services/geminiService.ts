import { AnalysisResult, LanguageCode } from '../types';
import { SCENARIOS } from '../data/scenarios';

export interface AnalyzePayload {
  content?: string;
  type?: 'call' | 'message';
  language?: LanguageCode | string;
  imageBase64?: string;
  imageMimeType?: string;
  scenarioId?: string;
}

export interface TtsResponse {
  audioBase64?: string;
  mimeType?: string;
  fallback?: boolean;
}

export async function checkServerStatus(): Promise<{ hasApiKey: boolean; mode: 'live' | 'demo' }> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status failed');
    return await res.json();
  } catch (err) {
    return { hasApiKey: false, mode: 'demo' };
  }
}

export async function analyzeContent(payload: AnalyzePayload): Promise<AnalysisResult> {
  const targetLang = (payload.language === 'auto' ? 'hi' : payload.language) || 'hi';

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.fallback && data.risk_level) {
        return {
          ...data,
          isFallback: false,
        };
      }
    }
  } catch (err) {
    // Graceful fallback without raising unhandled errors
  }

  // 1. Direct Scenario Lookup if scenarioId provided
  if (payload.scenarioId) {
    const scenario = SCENARIOS.find((s) => s.id === payload.scenarioId);
    if (scenario) {
      const fallback =
        scenario.fallbackAnalysis[targetLang] ||
        scenario.fallbackAnalysis.en ||
        scenario.fallbackAnalysis.hi;
      if (fallback) {
        return {
          ...fallback,
          isFallback: true,
        };
      }
    }
  }

  // 2. Intelligent Content Matcher to Curated Scenarios
  const lower = (payload.content || '').toLowerCase();

  // Electricity / Utility Threat
  if (
    lower.includes('electricity') ||
    lower.includes('power') ||
    lower.includes('बिजली') ||
    lower.includes('विद्युत') ||
    lower.includes('quicksupport') ||
    lower.includes('anydesk') ||
    lower.includes('disconnect') ||
    lower.includes('கரண்ட்') ||
    lower.includes('மின்சாரம்') ||
    lower.includes('విద్యుత్') ||
    lower.includes('కరెంట్')
  ) {
    const s = SCENARIOS.find((item) => item.id === 'utility_threat');
    if (s) {
      const f = s.fallbackAnalysis[targetLang] || s.fallbackAnalysis.en || s.fallbackAnalysis.hi;
      if (f) return { ...f, isFallback: true };
    }
  }

  // Bank KYC / Account Blocked
  if (
    lower.includes('kyc') ||
    lower.includes('bank') ||
    lower.includes('sbi') ||
    lower.includes('खाता') ||
    lower.includes('पेंशन') ||
    lower.includes('कार्ड') ||
    lower.includes('debit') ||
    lower.includes('block') ||
    lower.includes('வங்கிக் கணக்கு') ||
    lower.includes('బ్యాంక్')
  ) {
    const s = SCENARIOS.find((item) => item.id === 'kyc_fraud');
    if (s) {
      const f = s.fallbackAnalysis[targetLang] || s.fallbackAnalysis.en || s.fallbackAnalysis.hi;
      if (f) return { ...f, isFallback: true };
    }
  }

  // Lottery / Prize / Gift
  if (
    lower.includes('lottery') ||
    lower.includes('kbc') ||
    lower.includes('prize') ||
    lower.includes('winner') ||
    lower.includes('इनाम') ||
    lower.includes('लॉटरी') ||
    lower.includes('25 lakh') ||
    lower.includes('लाख') ||
    lower.includes('பரிசு') ||
    lower.includes('లాటరీ')
  ) {
    const s = SCENARIOS.find((item) => item.id === 'lottery');
    if (s) {
      const f = s.fallbackAnalysis[targetLang] || s.fallbackAnalysis.en || s.fallbackAnalysis.hi;
      if (f) return { ...f, isFallback: true };
    }
  }

  // Digital Arrest / Police / CBI
  if (
    lower.includes('cbi') ||
    lower.includes('police') ||
    lower.includes('arrest') ||
    lower.includes('customs') ||
    lower.includes('पार्सल') ||
    lower.includes('सीबीआई') ||
    lower.includes('पुलिस') ||
    lower.includes('वारंट') ||
    lower.includes('போலீஸ்') ||
    lower.includes('సిబిఐ')
  ) {
    const s = SCENARIOS.find((item) => item.id === 'digital_arrest');
    if (s) {
      const f = s.fallbackAnalysis[targetLang] || s.fallbackAnalysis.en || s.fallbackAnalysis.hi;
      if (f) return { ...f, isFallback: true };
    }
  }

  // UPI / Mistaken Payment Fraud
  if (
    lower.includes('upi') ||
    lower.includes('phonepe') ||
    lower.includes('gpay') ||
    lower.includes('refund') ||
    lower.includes('गलती से') ||
    lower.includes('पिन') ||
    lower.includes('रिवर्स')
  ) {
    const s = SCENARIOS.find((item) => item.id === 'upi_fraud');
    if (s) {
      const f = s.fallbackAnalysis[targetLang] || s.fallbackAnalysis.en || s.fallbackAnalysis.hi;
      if (f) return { ...f, isFallback: true };
    }
  }

  // Family Accident / Emergency
  if (
    lower.includes('accident') ||
    lower.includes('hospital') ||
    lower.includes('doctor') ||
    lower.includes('एक्सीडेंट') ||
    lower.includes('अस्पताल') ||
    lower.includes('पोता') ||
    lower.includes('दादाजी') ||
    lower.includes('ऑपरेशन')
  ) {
    const s = SCENARIOS.find((item) => item.id === 'family_emergency');
    if (s) {
      const f = s.fallbackAnalysis[targetLang] || s.fallbackAnalysis.en || s.fallbackAnalysis.hi;
      if (f) return { ...f, isFallback: true };
    }
  }

  // Safe Family Message
  if (
    lower.includes('दवाई') ||
    lower.includes('medicine') ||
    lower.includes('घर आ रहा') ||
    lower.includes('hello') ||
    lower.includes('प्रणाम') ||
    lower.includes('तबीयत') ||
    lower.includes('breakfast') ||
    lower.includes('doctor prescription')
  ) {
    const s = SCENARIOS.find((item) => item.id === 'safe_family');
    if (s) {
      const f = s.fallbackAnalysis[targetLang] || s.fallbackAnalysis.en || s.fallbackAnalysis.hi;
      if (f) return { ...f, isFallback: true };
    }
  }

  // 3. General Fraud Heuristic Fallback
  const isSuspicious =
    lower.includes('otp') ||
    lower.includes('pin') ||
    lower.includes('urgent') ||
    lower.includes('click') ||
    lower.includes('http') ||
    lower.includes('link') ||
    lower.includes('ओटीपी') ||
    lower.includes('रुपये') ||
    lower.includes('₹');

  if (isSuspicious) {
    return {
      risk_level: 'scam',
      risk_score: 95,
      scam_type: 'digital_fraud',
      red_flags: [
        targetLang === 'en'
          ? 'Urgent demand for OTP, PIN, or money transfer'
          : 'ओटीपी, पिन या तुरंत पैसे भेजने की मांग की जा रही है',
        targetLang === 'en'
          ? 'Threat of urgent suspension or legal action'
          : 'खाता बंद होने या कानूनी कार्रवाई की झूठी धमकी',
        targetLang === 'en'
          ? 'Suspicious link or unknown contact number'
          : 'संदिग्ध लिंक या अनजान नंबर से संपर्क का प्रयास',
      ],
      explanation:
        targetLang === 'en'
          ? 'This message shows clear fraud patterns aiming to steal financial credentials.'
          : 'यह संदेश अत्यंत संदिग्ध है और वित्तीय धोखाधड़ी के स्पष्ट संकेत देता है।',
      recommended_actions: [
        targetLang === 'en'
          ? 'Do not click links and never send money'
          : 'किसी लिंक पर क्लिक न करें और पैसे न भेजें',
        targetLang === 'en'
          ? 'Delete the message and block the sender'
          : 'मैसेज तुरंत डिलीट करें और नंबर ब्लॉक करें',
        targetLang === 'en'
          ? 'Call 1930 Cyber Crime Helpline for help'
          : 'संदेह होने पर साइबर हेल्पलाइन 1930 पर संपर्क करें',
      ],
      voice_script:
        targetLang === 'en'
          ? 'Please stop. This looks like a scam message. Never share your OTP, PIN, or send money to unknown numbers. Delete the message. Call the National Cyber Helpline 1930 or visit cybercrime.gov.in, and talk to your family.'
          : 'कृपया रुकें। यह संदेश एक धोखा प्रतीत होता है। कभी भी अपना ओटीपी, पिन न दें और पैसे न भेजें। संदेश को तुरंत डिलीट करें। मदद के लिए राष्ट्रीय साइबर हेल्पलाइन 1930 पर संपर्क करें।',
      isFallback: true,
    };
  }

  // Safe Default
  return {
    risk_level: 'safe',
    risk_score: 5,
    scam_type: 'none',
    red_flags: [],
    explanation:
      targetLang === 'en'
        ? 'No fraudulent patterns or threats were found in this message.'
        : 'इस संदेश में धोखाधड़ी या किसी खतरे का कोई संकेत नहीं मिला है।',
    recommended_actions: [
      targetLang === 'en' ? 'Normal message, safe to proceed' : 'यह सामान्य संदेश है, कोई खतरा नहीं है',
      targetLang === 'en' ? 'No security action required' : 'किसी अतिरिक्त कार्रवाई की आवश्यकता नहीं है',
      targetLang === 'en' ? 'Stay alert for unexpected OTP requests' : 'हमेशा अनजान ओटीपी साझा करने से बचें',
    ],
    voice_script:
      targetLang === 'en'
        ? 'This message looks completely safe. No threats or scam indicators were detected.'
        : 'यह संदेश पूरी तरह सुरक्षित प्रतीत होता है। इसमें कोई खतरा नहीं मिला।',
    isFallback: true,
  };
}

export async function generateSpeechAudio(
  text: string,
  language: LanguageCode | string
): Promise<TtsResponse> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.fallback && data.audioBase64) {
        return {
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || 'audio/wav',
          fallback: false,
        };
      }
    }
  } catch (err) {
    // Seamless fallback to browser speech synthesis
  }

  return { fallback: true };
}
