import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, ShieldCheck, AlertTriangle, ArrowLeft, Volume2, Trash2 } from 'lucide-react';
import { PastAlert, LanguageCode } from '../types';
import { getTranslation } from '../data/languages';
import { speechService } from '../services/speechService';
import { AudioSpeakButton } from './AudioSpeakButton';

interface PastAlertsProps {
  language: LanguageCode | string;
  onBack: () => void;
}

const STORAGE_KEY = 'cyberkavach_past_alerts';

export const PastAlerts: React.FC<PastAlertsProps> = ({ language, onBack }) => {
  const t = getTranslation(language);
  const [alerts, setAlerts] = useState<PastAlert[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAlerts(JSON.parse(saved));
      } else {
        const isEn = language === 'en';
        const sample: PastAlert[] = [
          {
            id: 'sample-1',
            timestamp: new Date(Date.now() - 3600000 * 2).toLocaleDateString(isEn ? 'en-IN' : 'hi-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
            type: 'call',
            source: isEn ? 'CBI Digital Arrest Call' : 'सीबीआई डिजिटल अरेस्ट कॉल',
            language: isEn ? 'en' : 'hi',
            result: isEn
              ? {
                  risk_level: 'scam',
                  risk_score: 98,
                  scam_type: 'digital_arrest',
                  red_flags: ['No legal procedure called Digital Arrest', 'Demand for fund transfer'],
                  explanation: 'Fraudsters impersonating CBI officers attempting extortion.',
                  recommended_actions: ['Hang up immediately', 'Do not send money', 'Report to 1930'],
                  voice_script:
                    'Please stop. This looks like a scam call. Real police or CBI never make digital arrests on phone calls or demand money transfers. Hang up immediately and call helpline 1930.',
                }
              : {
                  risk_level: 'scam',
                  risk_score: 98,
                  scam_type: 'digital_arrest',
                  red_flags: ['कानून में डिजिटल अरेस्ट नहीं होता', 'पैसे ट्रांसफर की मांग'],
                  explanation: 'सीबीआई अधिकारी बनकर पैसे ऐंठने का प्रयास।',
                  recommended_actions: ['फोन काटें', 'पैसे न भेजें', '1930 पर बताएं'],
                  voice_script:
                    'कृपया रुकें। यह एक खतरनाक फर्जी कॉल है। असली पुलिस या सीबीआई कभी भी फोन पर डिजिटल अरेस्ट नहीं करती और न ही पैसे मांगती है। किसी को पैसे या ओटीपी न भेजें। तुरंत फोन काट दें। मदद के लिए राष्ट्रीय साइबर हेल्पलाइन 1930 पर कॉल करें।',
                },
          },
        ];
        setAlerts(sample);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
      }
    } catch (e) {
      console.warn('Failed to load past alerts:', e);
    }
  }, [language]);

  const handlePlayVoice = (alert: PastAlert) => {
    if (playingId === alert.id) {
      speechService.stop();
      setPlayingId(null);
    } else {
      setPlayingId(alert.id);
      speechService.playVoiceNote(alert.result.voice_script, alert.language || language);
    }
  };

  const handleClearAll = () => {
    speechService.stop();
    setAlerts([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const backLabel = language === 'en' ? 'Back' : 'पीछे';
  const subTitle =
    language === 'en'
      ? 'Your past security checks and voice warning history'
      : 'आपकी पूर्व सुरक्षा जाँचें और आवाज रिकॉर्ड';
  const clearLabel = language === 'en' ? 'Clear History' : 'साफ करें';
  const speakHeader =
    language === 'en'
      ? `${t.pastAlerts}. Here are all your previous scam verification checks and audio notes.`
      : `${t.pastAlerts}। यहाँ आपकी पिछली सभी सुरक्षा जाँचें और आवाज संदेश सुरक्षित हैं।`;

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[56px] min-w-[56px] px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-[18px] flex items-center gap-2 border border-slate-200 shadow-xs active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>{backLabel}</span>
        </button>

        <AudioSpeakButton
          textToSpeak={speakHeader}
          language={language}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight">
            {t.pastAlerts}
          </h2>
          <p className="text-[18px] text-slate-600">
            {subTitle}
          </p>
        </div>

        {alerts.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3.5 py-2 rounded-xl bg-white text-slate-600 hover:text-red-700 text-[15px] font-bold border border-slate-200 shadow-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
            <span>{clearLabel}</span>
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-500 space-y-3">
          <History className="w-12 h-12 mx-auto text-slate-400" />
          <p className="text-[19px]">{t.noAlertsYet}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((item) => {
            const isScam = item.result.risk_level === 'scam';
            const isSuspicious = item.result.risk_level === 'suspicious';
            const isPlaying = playingId === item.id;
            const typeLabel =
              item.type === 'call'
                ? language === 'en'
                  ? 'Phone Call'
                  : 'फोन कॉल'
                : language === 'en'
                ? 'Message'
                : 'संदेश';

            const playLabel = isPlaying
              ? language === 'en'
                ? 'Stop Voice'
                : 'आवाज रोकें'
              : language === 'en'
              ? 'Listen Voice Alert'
              : 'चेतावनी सुनें';

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-slate-200 rounded-3xl p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                        isScam
                          ? 'bg-red-600 text-white'
                          : isSuspicious
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isScam ? (
                        <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
                      ) : isSuspicious ? (
                        <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                      ) : (
                        <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                      )}
                    </div>
                    <div>
                      <div className="text-[19px] font-extrabold text-slate-900 leading-tight">
                        {item.source}
                      </div>
                      <div className="text-[14px] text-slate-500 font-semibold mt-0.5">
                        {item.timestamp} · {typeLabel}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[14px] font-extrabold border ${
                      isScam
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : isSuspicious
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {isScam
                      ? t.riskScam
                      : isSuspicious
                      ? t.riskSuspicious
                      : t.riskSafe}
                  </span>
                </div>

                <p className="text-[16px] text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 leading-relaxed font-medium">
                  {item.result.explanation}
                </p>

                {item.result.voice_script && (
                  <button
                    type="button"
                    onClick={() => handlePlayVoice(item)}
                    className={`w-full min-h-[48px] px-4 rounded-xl text-[16px] font-extrabold flex items-center justify-center gap-2 border shadow-xs transition-colors ${
                      isPlaying
                        ? 'bg-amber-500 text-slate-950 border-amber-600 animate-pulse'
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200'
                    }`}
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>{playLabel}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
