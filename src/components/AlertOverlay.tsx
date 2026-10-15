import React from 'react';
import { ShieldAlert, PhoneOff, Users, RotateCcw } from 'lucide-react';
import { LanguageCode } from '../types';
import { getTranslation } from '../data/languages';
import { VoicePlayer } from './VoicePlayer';
import { AudioSpeakButton } from './AudioSpeakButton';

interface AlertOverlayProps {
  voiceScript: string;
  language: LanguageCode | string;
  base64WavAudio?: string | null;
  onEndCall: () => void;
  onTellFamily: () => void;
  onReplay: () => void;
}

export const AlertOverlay: React.FC<AlertOverlayProps> = ({
  voiceScript,
  language,
  base64WavAudio,
  onEndCall,
  onTellFamily,
  onReplay,
}) => {
  const t = getTranslation(language);

  return (
    <div className="fixed inset-0 z-50 bg-red-900/95 backdrop-blur-md flex flex-col justify-between p-4 overflow-y-auto animate-in fade-in duration-300">
      {/* Top Banner with pulsing warning */}
      <div className="max-w-md mx-auto w-full pt-4 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-600 border-4 border-white text-white shadow-2xl mb-4 animate-bounce">
          <ShieldAlert className="w-14 h-14" />
        </div>

        <div className="flex items-center justify-center gap-3">
          <h2 className="text-[32px] sm:text-[36px] font-extrabold text-white tracking-tight leading-tight">
            {t.dangerAlertTitle}
          </h2>
          <AudioSpeakButton
            textToSpeak={`${t.dangerAlertTitle}। ${t.dangerAlertSubtitle}`}
            language={language}
            size="large"
            className="bg-white text-red-700 border-2 border-red-200"
          />
        </div>

        <p className="text-[20px] text-red-100 font-semibold mt-2 px-2">
          {t.dangerAlertSubtitle}
        </p>
      </div>

      {/* Embedded Voice Warning Player */}
      <div className="max-w-md mx-auto w-full my-4">
        <VoicePlayer
          voiceScript={voiceScript}
          language={language}
          base64WavAudio={base64WavAudio}
          autoPlay={true}
          title={t.voiceNoteTitle}
        />
      </div>

      {/* Three Giant Action Buttons */}
      <div className="max-w-md mx-auto w-full space-y-3 pb-6">
        {/* 1. End Call Button (Primary Action - huge red button) */}
        <button
          type="button"
          onClick={onEndCall}
          className="w-full min-h-[64px] h-18 rounded-2xl bg-white hover:bg-red-50 text-red-700 font-extrabold text-[22px] flex items-center justify-center gap-3 shadow-2xl border-4 border-red-500 active:scale-98 transition-transform"
        >
          <PhoneOff className="w-8 h-8 fill-current" />
          <span>{t.endCallBtn}</span>
        </button>

        {/* 2. Tell My Family Button */}
        <button
          type="button"
          onClick={onTellFamily}
          className="w-full min-h-[64px] h-16 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[20px] flex items-center justify-center gap-3 shadow-xl active:scale-98 transition-transform"
        >
          <Users className="w-7 h-7" />
          <span>{t.tellFamilyBtn}</span>
        </button>

        {/* 3. Listen Again Button */}
        <button
          type="button"
          onClick={onReplay}
          className="w-full min-h-[56px] h-14 rounded-2xl bg-slate-950/80 hover:bg-slate-950 text-white font-bold text-[18px] flex items-center justify-center gap-2 border border-slate-700 active:scale-98"
        >
          <RotateCcw className="w-6 h-6 text-teal-300" />
          <span>{t.listenAgainBtn}</span>
        </button>
      </div>
    </div>
  );
};
