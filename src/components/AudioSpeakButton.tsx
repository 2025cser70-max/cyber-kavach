import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speechService } from '../services/speechService';
import { LanguageCode } from '../types';

interface AudioSpeakButtonProps {
  textToSpeak: string;
  language: LanguageCode | string;
  size?: 'normal' | 'large';
  ariaLabel?: string;
  className?: string;
}

export const AudioSpeakButton: React.FC<AudioSpeakButtonProps> = ({
  textToSpeak,
  language,
  size = 'normal',
  ariaLabel,
  className = '',
}) => {
  const [isSpeakingThis, setIsSpeakingThis] = useState(false);

  const defaultAria = language === 'en' ? 'Listen aloud' : 'आवाज में सुनें';
  const tooltipText = language === 'en' ? 'Tap to listen' : 'आवाज सुनें (Tap to listen)';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeakingThis) {
      speechService.stop();
      setIsSpeakingThis(false);
    } else {
      setIsSpeakingThis(true);
      speechService.speakPrompt(textToSpeak, language);
      const duration = Math.min(12000, Math.max(2000, textToSpeak.length * 80));
      setTimeout(() => {
        setIsSpeakingThis(false);
      }, duration);
    }
  };

  const dimensions =
    size === 'large'
      ? 'w-16 h-16 min-w-[64px] min-h-[64px]'
      : 'w-14 h-14 min-w-[56px] min-h-[56px]';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel || defaultAria}
      className={`rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 focus:outline-none focus:ring-4 focus:ring-teal-500 ${
        isSpeakingThis
          ? 'bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse'
          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300 hover:border-emerald-400'
      } ${dimensions} ${className}`}
      title={tooltipText}
    >
      {isSpeakingThis ? (
        <VolumeX className={size === 'large' ? 'w-8 h-8' : 'w-7 h-7'} />
      ) : (
        <Volume2 className={size === 'large' ? 'w-8 h-8' : 'w-7 h-7'} />
      )}
    </button>
  );
};
