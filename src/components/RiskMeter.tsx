import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { RiskLevel, LanguageCode } from '../types';
import { getTranslation } from '../data/languages';
import { AudioSpeakButton } from './AudioSpeakButton';

interface RiskMeterProps {
  level: RiskLevel;
  score: number; // 0 to 100
  language: LanguageCode | string;
  className?: string;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  level,
  score,
  language,
  className = '',
}) => {
  const t = getTranslation(language);

  // Configuration based on risk
  let colorBg = 'bg-emerald-50/90 border-emerald-300';
  let badgeColor = 'bg-emerald-700 text-white';
  let progressColor = 'bg-emerald-600';
  let label = t.riskSafe;
  let Icon = ShieldCheck;

  if (level === 'suspicious') {
    colorBg = 'bg-amber-50/95 border-amber-300';
    badgeColor = 'bg-amber-600 text-white';
    progressColor = 'bg-amber-500';
    label = t.riskSuspicious;
    Icon = AlertTriangle;
  } else if (level === 'scam') {
    colorBg = 'bg-red-50 border-red-400';
    badgeColor = 'bg-red-700 text-white animate-pulse';
    progressColor = 'bg-red-600';
    label = t.riskScam;
    Icon = ShieldAlert;
  }

  const meterTitle =
    language === 'en'
      ? 'Live Risk Meter'
      : language === 'hi'
      ? 'सुरक्षा स्थिति'
      : t.riskSafe ? `${t.riskSafe} / ${t.riskScam}` : 'Risk Meter';

  const speechText =
    language === 'en'
      ? `Live Risk Assessment: ${label}. Threat level is ${score} percent.`
      : `सुरक्षा स्थिति: ${label}, खतरा स्तर ${score} प्रतिशत है।`;

  return (
    <div
      className={`rounded-3xl p-5 border-2 ${colorBg} shadow-sm shadow-slate-900/5 text-slate-900 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs ${badgeColor}`}
          >
            <Icon className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[17px] text-slate-600 font-semibold">
              {meterTitle}
            </div>
            <div className="text-[26px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{label}</span>
              <span className="text-[20px] font-mono text-slate-600">({score}%)</span>
            </div>
          </div>
        </div>

        <AudioSpeakButton
          textToSpeak={speechText}
          language={language}
          ariaLabel={language === 'en' ? 'Listen to risk status' : 'सुरक्षा स्थिति को आवाज में सुनें'}
        />
      </div>

      {/* Segmented Meter Bar with labels */}
      <div className="w-full bg-slate-200/90 h-5 rounded-full overflow-hidden p-0.5 border border-slate-300">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${Math.min(100, Math.max(8, score))}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[15px] font-bold text-slate-600 mt-2 px-1">
        <span className="text-emerald-800">0% {t.riskSafe}</span>
        <span className="text-amber-800">50% {t.riskSuspicious}</span>
        <span className="text-red-800">100% {t.riskScam}</span>
      </div>
    </div>
  );
};
