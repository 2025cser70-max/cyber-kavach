import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Share2, Download, Gauge, Volume2 } from 'lucide-react';
import { speechService, SpeechPlaybackState } from '../services/speechService';
import { LanguageCode } from '../types';
import { getTranslation } from '../data/languages';

interface VoicePlayerProps {
  voiceScript: string;
  language: LanguageCode | string;
  base64WavAudio?: string | null;
  autoPlay?: boolean;
  title?: string;
  onEnded?: () => void;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  voiceScript,
  language,
  base64WavAudio,
  autoPlay = false,
  title,
}) => {
  const [playbackState, setPlaybackState] = useState<SpeechPlaybackState>(speechService.getState());
  const [sentences, setSentences] = useState<string[]>([]);
  const t = getTranslation(language);

  useEffect(() => {
    const parsed = speechService.parseSentences(voiceScript);
    setSentences(parsed);
  }, [voiceScript]);

  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (autoPlay && voiceScript) {
      const timer = setTimeout(() => {
        speechService.playVoiceNote(voiceScript, language, base64WavAudio);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, voiceScript, language, base64WavAudio]);

  const handlePlayPause = () => {
    if (playbackState.isPlaying) {
      speechService.pause();
    } else if (playbackState.isPaused) {
      speechService.resume();
    } else {
      speechService.playVoiceNote(voiceScript, language, base64WavAudio);
    }
  };

  const handleReplay = () => {
    speechService.playVoiceNote(voiceScript, language, base64WavAudio);
  };

  const handleToggleSpeed = () => {
    const newRate = playbackState.rate === 1.0 ? 0.8 : 1.0;
    speechService.setRate(newRate);
  };

  const handleShareWhatsApp = () => {
    const isEn = language === 'en';
    const text = encodeURIComponent(
      isEn
        ? `⚠️ *Cyber Kavach Scam Warning* ⚠️\n\n${voiceScript}\n\n📞 National Cyber Crime Helpline: 1930\n🌐 Report at: https://cybercrime.gov.in`
        : `⚠️ *Cyber Kavach Alert (साइबर सुरक्षा चेतावनी)* ⚠️\n\n${voiceScript}\n\n📞 राष्ट्रीय साइबर अपराध हेल्पलाइन: 1930\n🌐 पोर्टल: https://cybercrime.gov.in`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDownload = () => {
    if (base64WavAudio) {
      const link = document.createElement('a');
      link.href = `data:audio/wav;base64,${base64WavAudio}`;
      link.download = `CyberKavach-Alert-${Date.now()}.wav`;
      link.click();
    } else {
      const blob = new Blob([voiceScript], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CyberKavach-Notice-${Date.now()}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="w-full bg-white border-2 border-teal-200/80 rounded-3xl p-5 shadow-sm shadow-slate-900/5 text-slate-900">
      {/* Header with Title and Mode Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
            <Volume2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-[22px] font-extrabold text-slate-900 tracking-tight">
              {title || t.voiceNoteTitle}
            </h4>
            <p className="text-[17px] text-teal-800 font-semibold">
              {playbackState.isPlaying ? t.spokenAudioPlaying : t.tapToSpeak}
            </p>
          </div>
        </div>

        {/* Speed toggle chip */}
        <button
          type="button"
          onClick={handleToggleSpeed}
          className={`px-3 py-2 rounded-xl text-[16px] font-bold flex items-center gap-2 border transition-colors shadow-xs active:scale-95 ${
            playbackState.rate === 0.8
              ? 'bg-amber-100 text-amber-950 border-amber-300'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="आवाज की गति बदलें"
        >
          <Gauge className="w-5 h-5 text-amber-700" />
          <span>{playbackState.rate === 0.8 ? t.slowerSpeed : t.normalSpeed}</span>
        </button>
      </div>

      {/* Animated Waveform Visualizer */}
      <div className="flex items-center justify-center gap-1.5 h-14 bg-slate-50 rounded-2xl px-4 my-4 border border-slate-200/80">
        {[24, 42, 65, 30, 80, 50, 95, 45, 75, 35, 90, 60, 40, 85, 30, 70, 50, 88, 32, 60].map(
          (h, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-150 ${
                playbackState.isPlaying
                  ? 'bg-gradient-to-t from-teal-700 to-emerald-500 animate-pulse'
                  : 'bg-slate-300'
              }`}
              style={{
                height: playbackState.isPlaying
                  ? `${Math.max(12, ((h * (i % 3 + 1)) % 44) + 10)}px`
                  : '8px',
                animationDelay: `${(i % 5) * 120}ms`,
              }}
            />
          )
        )}
      </div>

      {/* Subtitles Box with highlighted current sentence */}
      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 my-4 max-h-48 overflow-y-auto">
        <div className="space-y-2">
          {sentences.map((sent, idx) => {
            const isCurrent =
              playbackState.isPlaying && playbackState.currentSentenceIndex === idx;
            return (
              <p
                key={idx}
                className={`text-[20px] leading-relaxed transition-all duration-200 rounded-lg p-2 ${
                  isCurrent
                    ? 'bg-amber-100 text-amber-950 font-bold border-l-4 border-amber-500 pl-3 shadow-xs'
                    : 'text-slate-700'
                }`}
              >
                {sent}
              </p>
            );
          })}
        </div>
      </div>

      {/* Main Playback Controls: Huge Play/Pause, Replay, Share, Download */}
      <div className="grid grid-cols-4 gap-3 pt-2">
        {/* Huge Play/Pause Button (Spans 2 columns) */}
        <button
          type="button"
          onClick={handlePlayPause}
          className="col-span-2 min-h-[64px] h-16 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-[20px] flex items-center justify-center gap-3 shadow-sm active:scale-98 transition-transform"
          aria-label={playbackState.isPlaying ? 'आवाज रोकें' : 'आवाज सुनें'}
        >
          {playbackState.isPlaying ? (
            <>
              <Pause className="w-8 h-8 fill-current" />
              <span>रोकें (Pause)</span>
            </>
          ) : (
            <>
              <Play className="w-8 h-8 fill-current ml-1" />
              <span>सुनें (Play)</span>
            </>
          )}
        </button>

        {/* Replay Button */}
        <button
          type="button"
          onClick={handleReplay}
          className="min-h-[64px] h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[18px] flex flex-col items-center justify-center gap-1 border border-slate-200 shadow-xs active:scale-98"
          title="दोबारा सुनें"
        >
          <RotateCcw className="w-6 h-6 text-teal-700" />
          <span className="text-[14px]">दोबारा</span>
        </button>

        {/* Share to WhatsApp Button */}
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="min-h-[64px] h-16 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[18px] flex flex-col items-center justify-center gap-1 border border-emerald-600 shadow-xs active:scale-98"
          title="व्हाट्सएप पर परिवार को भेजें"
        >
          <Share2 className="w-6 h-6 text-emerald-100" />
          <span className="text-[14px]">भेजें</span>
        </button>
      </div>

      {/* Audio Download Helper */}
      {base64WavAudio && (
        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={handleDownload}
            className="text-[16px] text-teal-800 hover:text-teal-900 font-bold underline inline-flex items-center gap-1.5 py-1"
          >
            <Download className="w-4 h-4" />
            {t.downloadAudio} (.wav)
          </button>
        </div>
      )}
    </div>
  );
};
