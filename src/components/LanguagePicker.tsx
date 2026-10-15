import React, { useState } from 'react';
import { Check, Volume2, Sparkles, ArrowRight } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguageInfo, getTranslation } from '../data/languages';
import { LanguageCode } from '../types';
import { speechService } from '../services/speechService';

interface LanguagePickerProps {
  currentLanguage: LanguageCode | string;
  onSelectLanguage: (code: LanguageCode) => void;
  onClose?: () => void;
  isInitialSetup?: boolean;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({
  currentLanguage,
  onSelectLanguage,
  onClose,
  isInitialSetup = false,
}) => {
  const [selected, setSelected] = useState<LanguageCode | string>(
    currentLanguage === 'auto' ? 'en' : currentLanguage
  );
  const [autoMatch, setAutoMatch] = useState<boolean>(currentLanguage === 'auto');
  const t = getTranslation(currentLanguage);

  const isEn = currentLanguage === 'en';

  const handleTileClick = (langCode: LanguageCode) => {
    setSelected(langCode);
    setAutoMatch(false);

    const langInfo = getLanguageInfo(langCode);
    if (langInfo?.greetingText) {
      speechService.stop();
      speechService.speakPrompt(langInfo.greetingText, langCode);
    }
  };

  const handleToggleAutoMatch = () => {
    const nextVal = !autoMatch;
    setAutoMatch(nextVal);
    if (nextVal) {
      setSelected('auto');
      speechService.speakPrompt(
        isEn
          ? 'Auto-match is active. Language will automatically adjust to scam calls and messages.'
          : 'ऑटो-मैच चालू है। आने वाले संदेश की भाषा में उत्तर दिया जाएगा।',
        isEn ? 'en' : 'hi'
      );
    } else {
      setSelected(currentLanguage === 'auto' ? 'en' : (currentLanguage as LanguageCode));
    }
  };

  const handleConfirm = () => {
    const finalLang = autoMatch ? 'auto' : (selected as LanguageCode);
    onSelectLanguage(finalLang);
    if (onClose) onClose();
  };

  const titleText = isEn ? 'Choose Your Language' : t.selectLanguageTitle;
  const subtitleText = isEn ? 'Tap any language to hear voice preview' : t.selectLanguageSubtitle;
  const autoMatchTitle = isEn ? 'Auto-Match Language' : t.autoMatchOption;
  const autoMatchDesc = isEn ? 'Automatically match incoming call or message language' : t.autoMatchDesc;
  const continueBtnText = isEn ? 'Continue' : t.continueBtn;

  return (
    <div className="w-full max-w-md mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Title & Guidance */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 mb-1 shadow-xs">
          <Volume2 className="w-8 h-8" />
        </div>
        <h2 className="text-[30px] font-extrabold text-slate-900 tracking-tight">
          {titleText}
        </h2>
        <p className="text-[19px] text-teal-800 font-semibold">
          {subtitleText}
        </p>
      </div>

      {/* Auto-Match Option Card */}
      <button
        type="button"
        onClick={handleToggleAutoMatch}
        className={`w-full min-h-[72px] rounded-3xl p-4 border-2 transition-all flex items-center justify-between shadow-xs active:scale-98 ${
          autoMatch
            ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300'
            : 'bg-white border-slate-200 text-slate-800 hover:border-teal-600'
        }`}
      >
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[20px] font-extrabold text-slate-900 flex items-center gap-2">
              <span>{autoMatchTitle}</span>
            </div>
            <div className="text-[15px] text-slate-600 font-medium">
              {autoMatchDesc}
            </div>
          </div>
        </div>

        <div
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            autoMatch
              ? 'bg-amber-500 border-amber-400 text-slate-950'
              : 'border-slate-300'
          }`}
        >
          {autoMatch && <Check className="w-5 h-5 stroke-[3]" />}
        </div>
      </button>

      {/* Grid of Large Regional Language Tiles */}
      <div className="grid grid-cols-2 gap-3.5">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = !autoMatch && selected === lang.code;

          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleTileClick(lang.code)}
              className={`min-h-[92px] rounded-3xl p-4 border-2 transition-all text-left flex flex-col justify-between shadow-xs active:scale-95 ${
                isSelected
                  ? 'bg-teal-800 border-teal-700 text-white shadow-sm ring-4 ring-teal-200/60'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                {/* Native Script Name - Very Large & High Contrast */}
                <span className="text-[26px] font-extrabold tracking-tight">
                  {lang.nativeName}
                </span>
                {isSelected ? (
                  <div className="w-7 h-7 rounded-full bg-white text-teal-800 flex items-center justify-center shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <Volume2 className="w-5 h-5 text-slate-400" />
                )}
              </div>

              <div
                className={`flex items-center justify-between text-[15px] font-semibold mt-1.5 ${
                  isSelected ? 'text-teal-100' : 'text-slate-500'
                }`}
              >
                <span>{lang.englishName}</span>
                <span className="text-[13px] truncate max-w-[80px]">
                  {lang.region.split('&')[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Huge Continue / Confirm Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full min-h-[64px] h-18 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-[22px] flex items-center justify-center gap-3 shadow-md active:scale-98 transition-transform"
        >
          <span>{continueBtnText}</span>
          <ArrowRight className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
