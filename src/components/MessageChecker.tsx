import React, { useState, useRef } from 'react';
import {
  FileText,
  Camera,
  Mic,
  Search,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  Lock,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { LanguageCode, AnalysisResult } from '../types';
import { getTranslation, getLanguageInfo } from '../data/languages';
import { VoicePlayer } from './VoicePlayer';
import { AudioSpeakButton } from './AudioSpeakButton';
import { analyzeContent, generateSpeechAudio } from '../services/geminiService';
import { speechService } from '../services/speechService';

interface MessageCheckerProps {
  language: LanguageCode | string;
  onBack: () => void;
  onSavePastAlert: (source: string, result: AnalysisResult) => void;
  onOpenReportModal: () => void;
}

type InputMode = 'paste' | 'upload' | 'speak';

export const MessageChecker: React.FC<MessageCheckerProps> = ({
  language,
  onBack,
  onSavePastAlert,
  onOpenReportModal,
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<InputMode>('paste');
  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [base64Audio, setBase64Audio] = useState<string | null>(null);
  const [maskedWarning, setMaskedWarning] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const isEn = language === 'en';

  const quickTestSamples =
    !isEn && language === 'hi'
      ? [
          {
            title: 'बिजली बिल कटने का SMS',
            text: 'Dear Consumer, Your electricity power will be disconnected tonight 9:30 PM from power office because your previous month bill was not updated. Please immediately call 8820155432 to update.',
          },
          {
            title: 'पेंशन / बैंक KYC ब्लॉक मैसेज',
            text: 'SBI ALERT: Dear customer, your pension account has been suspended due to pending PAN/Aadhaar KYC. Update immediately by clicking http://sbi-kyc-update.xyz to prevent card freeze.',
          },
          {
            title: 'लॉटरी / ₹25 लाख इनाम WhatsApp',
            text: 'CONGRATULATIONS! Your mobile number won 25 Lakh INR in KBC All India Lucky Draw. Contact KBC manager Vijay Kumar on WhatsApp 7001988320 to receive your check.',
          },
          {
            title: 'सुरक्षित सामान्य मैसेज',
            text: 'नमस्ते दादाजी, मैं शाम को 5 बजे घर आ रहा हूँ। क्या आपको डॉक्टर की कोई दवाई लानी है?',
          },
        ]
      : [
          {
            title: 'Electricity Disconnection SMS',
            text: 'Dear Consumer, Your electricity power will be disconnected tonight 9:30 PM from power office because your previous month bill was not updated. Please immediately call 8820155432 to update.',
          },
          {
            title: 'Bank KYC Suspended',
            text: 'SBI ALERT: Dear customer, your pension account has been suspended due to pending PAN/Aadhaar KYC. Update immediately by clicking http://sbi-kyc-update.xyz to prevent card freeze.',
          },
          {
            title: 'KBC ₹25 Lakh Lottery',
            text: 'CONGRATULATIONS! Your mobile number won 25 Lakh INR in KBC All India Lucky Draw. Contact KBC manager Vijay Kumar on WhatsApp 7001988320 to receive your check.',
          },
          {
            title: 'Safe Family Message',
            text: 'Hello Grandpa, I am coming home by 5 PM. Do you need me to pick up any medicines from the doctor?',
          },
        ];

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let raw = e.target.value;
    const aadhaarPattern = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;

    let hasSensitive = false;
    if (aadhaarPattern.test(raw)) {
      hasSensitive = true;
      raw = raw.replace(aadhaarPattern, 'XXXX-XXXX-XXXX');
    }

    if (hasSensitive) {
      setMaskedWarning(t.maskWarning);
    } else {
      setMaskedWarning(null);
    }

    setInputText(raw);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Your browser does not support voice input. Please paste or type your message.');
      return;
    }

    const langInfo = getLanguageInfo(language);
    const recognition = new SpeechRecognition();
    recognition.lang = langInfo.speechLocale;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setInputText(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !imagePreview) return;

    setIsAnalyzing(true);
    speechService.speakPrompt(
      isEn ? 'Analyzing message, please wait...' : 'जाँच की जा रही है, कृपया प्रतीक्षा करें...',
      language
    );

    try {
      const analysis = await analyzeContent({
        content: inputText,
        type: 'message',
        language,
        imageBase64: imagePreview || undefined,
        imageMimeType: imageMime,
      });

      setResult(analysis);
      onSavePastAlert(
        inputText.slice(0, 30) || (imagePreview ? (isEn ? 'Message Screenshot' : 'मैसेज स्क्रीनशॉट') : (isEn ? 'Suspicious Message' : 'संदिग्ध संदेश')),
        analysis
      );

      const tts = await generateSpeechAudio(analysis.voice_script, language);
      if (tts.audioBase64) {
        setBase64Audio(tts.audioBase64);
      }
    } catch (err) {
      console.error('Error during message check:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    speechService.stop();
    setResult(null);
    setInputText('');
    setImagePreview(null);
    setMaskedWarning(null);
    setBase64Audio(null);
  };

  const backOrResetLabel = result
    ? isEn
      ? 'New Check'
      : 'नई जाँच'
    : isEn
    ? 'Back'
    : 'पीछे';

  const photoTabLabel = isEn ? 'Photo / Image' : 'फोटो / स्क्रीनशॉट';
  const quickSamplesPrompt = isEn ? 'Or select a quick test sample:' : 'या तैयार उदाहरण छूकर देखें:';
  const changeImgLabel = isEn ? 'Change' : 'बदलें';
  const uploadHint = isEn ? 'Select screenshot from gallery or camera' : 'गैलरी या कैमरे से स्क्रीनशॉट चुनें';
  const analyzingBtnText = isEn ? 'Analyzing...' : 'जाँच हो रही है...';

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={result ? handleReset : onBack}
          className="min-h-[56px] min-w-[56px] px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-[18px] flex items-center gap-2 border border-slate-200 shadow-xs active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>{backOrResetLabel}</span>
        </button>

        <AudioSpeakButton
          textToSpeak={`${t.checkMessage}। ${t.checkMessageSubtitle}`}
          language={language}
        />
      </div>

      {!result ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight">
              {t.checkMessage}
            </h2>
            <p className="text-[19px] text-slate-600 mt-1">
              {t.checkMessageSubtitle}
            </p>
          </div>

          {/* Three Input Mode Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`min-h-[60px] py-2 px-1 rounded-xl text-[16px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'paste'
                  ? 'bg-white text-teal-800 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-6 h-6" />
              <span>{t.pasteMessageTab.split(' ')[0]}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`min-h-[60px] py-2 px-1 rounded-xl text-[16px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-teal-800 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-6 h-6" />
              <span>{photoTabLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('speak')}
              className={`min-h-[60px] py-2 px-1 rounded-xl text-[16px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === 'speak'
                  ? 'bg-white text-teal-800 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="w-6 h-6" />
              <span>{t.speakMessageTab.split(' ')[0]}</span>
            </button>
          </div>

          {/* Tab 1: Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={handleTextChange}
                  rows={4}
                  placeholder={t.pastePlaceholder}
                  className="w-full rounded-2xl bg-white border-2 border-slate-300 focus:border-teal-600 p-4 text-[20px] text-slate-900 placeholder-slate-400 focus:outline-none resize-none shadow-xs"
                />
              </div>

              {/* Quick sample chips */}
              <div className="space-y-1.5">
                <span className="text-[15px] font-bold text-slate-600">
                  {quickSamplesPrompt}
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickTestSamples.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(sample.text)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-teal-800 text-[15px] font-bold border border-slate-200 shadow-xs active:scale-95"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Upload Screenshot */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-teal-600 bg-white max-h-64 flex items-center justify-center shadow-xs">
                  <img
                    src={imagePreview}
                    alt="Uploaded message"
                    className="max-h-64 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 px-3 py-2 rounded-xl bg-slate-900/90 text-white text-[15px] font-bold shadow"
                  >
                    {changeImgLabel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[160px] rounded-3xl border-3 border-dashed border-slate-300 hover:border-teal-600 bg-white hover:bg-slate-50 flex flex-col items-center justify-center p-6 gap-3 transition-colors text-slate-600 shadow-xs"
                >
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="text-[20px] font-bold text-slate-900 text-center">
                    {t.uploadPrompt}
                  </div>
                  <div className="text-[16px] text-slate-500 text-center">
                    {uploadHint}
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Tab 3: Speak Message */}
          {activeTab === 'speak' && (
            <div className="space-y-4 text-center py-4 bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs">
              <button
                type="button"
                onClick={handleToggleRecord}
                className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95 ${
                  isRecording
                    ? 'bg-red-600 ring-8 ring-red-100 animate-pulse'
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                <Mic className="w-14 h-14" />
              </button>

              <div className="text-[20px] font-bold text-slate-800">
                {isRecording ? t.listeningMicrophone : t.tapToSpeak}
              </div>

              {inputText && (
                <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 text-[18px] text-slate-800 font-medium">
                  "{inputText}"
                </div>
              )}
            </div>
          )}

          {/* Privacy Safeguard notice */}
          {maskedWarning && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-center gap-3 text-amber-950 font-medium text-[16px] shadow-xs">
              <Lock className="w-5 h-5 text-amber-700 shrink-0" />
              <span>{maskedWarning}</span>
            </div>
          )}

          {/* Big Check Now Button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={(!inputText.trim() && !imagePreview) || isAnalyzing}
            className={`w-full min-h-[64px] h-18 rounded-2xl font-extrabold text-[22px] flex items-center justify-center gap-3 shadow-sm active:scale-98 transition-all ${
              !inputText.trim() && !imagePreview
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-900/10'
            }`}
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>{analyzingBtnText}</span>
              </div>
            ) : (
              <>
                <Search className="w-7 h-7" />
                <span>{t.checkNowBtn}</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Result Screen */
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Giant Verdict Badge */}
          <div
            className={`rounded-3xl p-6 border-2 shadow-xs text-center space-y-3 ${
              result.risk_level === 'scam'
                ? 'bg-red-50 border-red-300 text-red-950'
                : result.risk_level === 'suspicious'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
          >
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center border shadow-xs ${
                result.risk_level === 'scam'
                  ? 'bg-red-600 text-white border-red-400'
                  : result.risk_level === 'suspicious'
                  ? 'bg-amber-500 text-white border-amber-400'
                  : 'bg-emerald-600 text-white border-emerald-400'
              }`}
            >
              {result.risk_level === 'scam' ? (
                <ShieldAlert className="w-12 h-12 stroke-[2.2] animate-pulse" />
              ) : result.risk_level === 'suspicious' ? (
                <AlertTriangle className="w-12 h-12 stroke-[2.2]" />
              ) : (
                <ShieldCheck className="w-12 h-12 stroke-[2.2]" />
              )}
            </div>

            <div>
              <div className="text-[17px] font-bold uppercase tracking-wider text-slate-600">
                {t.verdictTitle}
              </div>
              <h3 className="text-[32px] font-extrabold text-slate-900 mt-1">
                {result.risk_level === 'scam'
                  ? t.riskScam
                  : result.risk_level === 'suspicious'
                  ? t.riskSuspicious
                  : t.riskSafe}
              </h3>
            </div>

            <p className="text-[20px] font-semibold leading-relaxed max-w-sm mx-auto text-slate-800">
              {result.explanation}
            </p>
          </div>

          {/* Voice Player with Spoken Result */}
          <VoicePlayer
            voiceScript={result.voice_script}
            language={language}
            base64WavAudio={base64Audio}
            autoPlay={true}
          />

          {/* "Why we think so" (Red flags) */}
          {result.red_flags && result.red_flags.length > 0 && (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <h4 className="text-[22px] font-extrabold text-slate-900 flex items-center gap-2">
                <span>⚠️ {t.whyWeThinkSo}</span>
              </h4>
              <ul className="space-y-2.5">
                {result.red_flags.slice(0, 3).map((flag, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[19px] text-slate-700 leading-snug"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-2" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* "What to do now" (3 simple actions) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <h4 className="text-[22px] font-extrabold text-slate-900 flex items-center gap-2">
              <span>✅ {t.whatToDoNow}</span>
            </h4>
            <div className="space-y-2.5">
              {result.recommended_actions.slice(0, 3).map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-[19px] text-emerald-950 font-bold leading-snug"
                >
                  <span className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-[16px] flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Report to 1930 / cybercrime.gov.in Guide Button */}
          <button
            type="button"
            onClick={onOpenReportModal}
            className="w-full min-h-[64px] h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[20px] flex items-center justify-center gap-3 shadow-sm active:scale-98 transition-transform"
          >
            <ExternalLink className="w-6 h-6" />
            <span>{t.reportTo1930Btn}</span>
          </button>
        </div>
      )}
    </div>
  );
};
