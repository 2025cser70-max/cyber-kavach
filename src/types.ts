export type LanguageCode =
  | 'hi' // Hindi
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'pa' // Punjabi
  | 'en' // English
  | 'auto'; // Auto-match

export interface LanguageInfo {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  greetingText: string;
  speechLocale: string;
  region: string;
}

export type RiskLevel = 'safe' | 'suspicious' | 'scam';

export type ScamCategory =
  | 'digital_arrest'
  | 'kyc_fraud'
  | 'upi_fraud'
  | 'lottery'
  | 'family_emergency'
  | 'utility_threat'
  | 'phishing_link'
  | 'remote_access'
  | 'safe_family';

export interface AnalysisResult {
  risk_level: RiskLevel;
  risk_score: number; // 0 to 100
  scam_type: string;
  red_flags: string[];
  explanation: string;
  recommended_actions: string[];
  voice_script: string;
  detected_language?: string;
  isFallback?: boolean;
}

export interface TranscriptUtterance {
  id: string;
  speaker: 'caller' | 'user';
  text: string;
  timestampSeconds: number;
}

export interface Scenario {
  id: string;
  scamCategory: ScamCategory;
  isSafe: boolean;
  callerName: Record<string, string>;
  callerNumber: string;
  callerSubtitle: Record<string, string>;
  title: Record<string, string>;
  description: Record<string, string>;
  iconName: string;
  transcripts: Record<string, TranscriptUtterance[]>;
  dangerTriggerIndex: number; // index of transcript utterance where danger threshold is reached
  fallbackAnalysis: Record<string, AnalysisResult>;
}

export interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface PastAlert {
  id: string;
  timestamp: string;
  type: 'call' | 'message';
  source: string; // e.g. "Fake CBI Digital Arrest" or "+91 98765 43210"
  result: AnalysisResult;
  language: string;
}
