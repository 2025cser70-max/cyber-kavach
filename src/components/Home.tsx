import React from 'react';
import {
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  Users,
  History,
  Languages,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { LanguageCode } from '../types';
import { getTranslation, getLanguageInfo } from '../data/languages';
import { AudioSpeakButton } from './AudioSpeakButton';

interface HomeProps {
  language: LanguageCode | string;
  onOpenCallSimulator: () => void;
  onOpenMessageChecker: () => void;
  onOpenFamilyAlerts: () => void;
  onOpenPastAlerts: () => void;
  onOpenLanguagePicker: () => void;
  isAiLive: boolean;
}

export const Home: React.FC<HomeProps> = ({
  language,
  onOpenCallSimulator,
  onOpenMessageChecker,
  onOpenFamilyAlerts,
  onOpenPastAlerts,
  onOpenLanguagePicker,
  isAiLive,
}) => {
  const t = getTranslation(language);
  const langInfo = getLanguageInfo(language);

  const greetingSentence =
    langInfo?.greetingText ||
    (language === 'en'
      ? 'Welcome to Cyber Kavach. We keep you safe from scam calls and fraudulent messages.'
      : 'साइबर कवच में आपका स्वागत है। हम आपको फोन और मैसेज के धोखों से सुरक्षित रखेंगे।');

  const changeText = language === 'en' ? 'Change' : 'बदलें';
  const aiStatusText = isAiLive
    ? language === 'en'
      ? 'AI Active'
      : 'AI सक्रिय'
    : t.demoBadge;

  const helplineCallText = language === 'en' ? 'Call 1930' : 'कॉल करें';

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Top Bar with Language Selector and Status */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onOpenLanguagePicker}
          className="min-h-[56px] px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-[18px] flex items-center gap-2.5 shadow-sm active:scale-95 transition-all"
        >
          <Languages className="w-6 h-6 text-teal-700" />
          <span className="font-extrabold">{langInfo.nativeName}</span>
          <span className="text-[14px] text-slate-500 font-normal">
            · {changeText}
          </span>
        </button>

        {/* AI status badge and voice assist */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-full text-[14px] font-bold border flex items-center gap-1.5 shadow-xs ${
              isAiLive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isAiLive ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
            />
            <span>{aiStatusText}</span>
          </span>

          <AudioSpeakButton
            textToSpeak={`${t.appTitle}. ${greetingSentence}`}
            language={language}
          />
        </div>
      </div>

      {/* Main Shield Hero Card (Apple Health / NHS High-End Aesthetic) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 text-center space-y-3.5 shadow-sm shadow-slate-900/5 relative overflow-hidden">
        {/* Soft Background Accent Ring */}
        <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-50 border-2 border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-sm">
          <ShieldCheck className="w-16 h-16 text-emerald-600 stroke-[2.2]" />
        </div>

        <div>
          <h1 className="text-[34px] sm:text-[38px] font-extrabold text-slate-900 tracking-tight leading-tight">
            {t.appTitle}
          </h1>
          <p className="text-[19px] text-slate-600 font-medium mt-1 leading-snug">
            {t.appSubtitle}
          </p>
        </div>

        {/* Persistent "You are protected" status chip */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[17px] font-bold shadow-xs">
          <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
          <span>{t.youAreProtected}</span>
        </div>
      </div>

      {/* Two Huge Primary Action Buttons (At least 64px tall, 20px+ font) */}
      <div className="space-y-3.5 pt-1">
        {/* 1. Live Call Protection (Executive Deep Teal) */}
        <button
          type="button"
          onClick={onOpenCallSimulator}
          className="w-full min-h-[96px] rounded-3xl p-5 bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-900 hover:to-teal-800 text-white shadow-lg shadow-teal-900/10 active:scale-98 transition-all flex items-center justify-between border border-teal-700 group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0 shadow-inner">
              <PhoneCall className="w-9 h-9 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[24px] font-extrabold leading-tight tracking-tight">
                {t.liveCallProtection}
              </div>
              <div className="text-[17px] font-medium text-teal-100/90 mt-0.5 leading-snug">
                {t.liveCallSubtitle}
              </div>
            </div>
          </div>
          <ArrowRight className="w-7 h-7 text-teal-200 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </button>

        {/* 2. Check a Message (Crisp White with Royal Navy Accent) */}
        <button
          type="button"
          onClick={onOpenMessageChecker}
          className="w-full min-h-[96px] rounded-3xl p-5 bg-white hover:bg-slate-50/80 text-slate-900 shadow-sm border-2 border-slate-200/90 hover:border-teal-600 active:scale-98 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 shadow-xs">
              <MessageSquare className="w-9 h-9 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[24px] font-extrabold text-slate-900 leading-tight tracking-tight">
                {t.checkMessage}
              </div>
              <div className="text-[17px] font-medium text-slate-600 mt-0.5 leading-snug">
                {t.checkMessageSubtitle}
              </div>
            </div>
          </div>
          <ArrowRight className="w-7 h-7 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
        </button>
      </div>

      {/* Two Secondary Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={onOpenFamilyAlerts}
          className="min-h-[64px] h-16 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-[18px] flex items-center justify-center gap-2.5 border border-slate-200 shadow-xs active:scale-95 transition-all"
        >
          <Users className="w-6 h-6 text-teal-700" />
          <span>{t.familyAlerts}</span>
        </button>

        <button
          type="button"
          onClick={onOpenPastAlerts}
          className="min-h-[64px] h-16 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-[18px] flex items-center justify-center gap-2.5 border border-slate-200 shadow-xs active:scale-95 transition-all"
        >
          <History className="w-6 h-6 text-amber-700" />
          <span>{t.pastAlerts}</span>
        </button>
      </div>

      {/* National Emergency Cyber Crime Helpline 1930 Direct Card */}
      <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
            <Phone className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="text-[19px] font-extrabold text-slate-900">
              {t.emergencyHelpline}
            </div>
            <div className="text-[15px] text-amber-900/90 font-medium">
              {t.helplineCallNow}
            </div>
          </div>
        </div>

        <a
          href="tel:1930"
          className="min-h-[48px] px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[16px] flex items-center justify-center shadow-xs active:scale-95 shrink-0"
        >
          {helplineCallText}
        </a>
      </div>
    </div>
  );
};
