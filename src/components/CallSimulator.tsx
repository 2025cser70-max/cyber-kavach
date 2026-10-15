import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  User,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  IndianRupee,
  Gift,
  AlertTriangle,
  Zap,
  HeartHandshake,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { Scenario, LanguageCode, AnalysisResult, RiskLevel } from '../types';
import { SCENARIOS, getScenarioTranscript, getScenarioAnalysis } from '../data/scenarios';
import { getTranslation } from '../data/languages';
import { RiskMeter } from './RiskMeter';
import { AlertOverlay } from './AlertOverlay';
import { AudioSpeakButton } from './AudioSpeakButton';
import { analyzeContent, generateSpeechAudio } from '../services/geminiService';
import { speechService } from '../services/speechService';

interface CallSimulatorProps {
  language: LanguageCode | string;
  onBack: () => void;
  onSavePastAlert: (source: string, result: AnalysisResult) => void;
  onOpenFamilyAlert: (messageText?: string) => void;
}

type CallStage = 'picker' | 'incoming' | 'active' | 'ended';

export const CallSimulator: React.FC<CallSimulatorProps> = ({
  language,
  onBack,
  onSavePastAlert,
  onOpenFamilyAlert,
}) => {
  const t = getTranslation(language);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [stage, setStage] = useState<CallStage>('picker');
  const [callSeconds, setCallSeconds] = useState(0);
  const [visibleTranscriptCount, setVisibleTranscriptCount] = useState(0);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('safe');
  const [riskScore, setRiskScore] = useState(10);
  const [showDangerAlert, setShowDangerAlert] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [base64Audio, setBase64Audio] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const transcriptTimerRef = useRef<any>(null);

  const isEn = language === 'en';

  const getCallerName = (s: Scenario) => {
    return s.callerName[language] || s.callerName.en || s.callerName.hi;
  };

  const getCallerSubtitle = (s: Scenario) => {
    return s.callerSubtitle[language] || s.callerSubtitle.en || s.callerSubtitle.hi;
  };

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setCallSeconds(0);
    setVisibleTranscriptCount(0);
    setRiskLevel('safe');
    setRiskScore(scenario.isSafe ? 5 : 20);
    setShowDangerAlert(false);
    setAnalysisResult(null);
    setBase64Audio(null);
    setStage('incoming');

    const callerName = getCallerName(scenario);
    speechService.speakPrompt(`${t.incomingCall} ${callerName}`, language);
  };

  const handleDecline = () => {
    speechService.stop();
    setStage('picker');
  };

  const handleAccept = () => {
    speechService.stop();
    setStage('active');
    setCallSeconds(1);
    setVisibleTranscriptCount(1);

    const fallback = getScenarioAnalysis(selectedScenario, language);
    setAnalysisResult(fallback);

    timerRef.current = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);

    const transcript = getScenarioTranscript(selectedScenario, language);
    transcriptTimerRef.current = setInterval(() => {
      setVisibleTranscriptCount((prev) => {
        const next = prev + 1;
        if (next > transcript.length) {
          clearInterval(transcriptTimerRef.current);
          return prev;
        }
        return next;
      });
    }, 2800);
  };

  useEffect(() => {
    if (stage !== 'active') return;

    const transcript = getScenarioTranscript(selectedScenario, language);
    const currentLines = transcript.slice(0, visibleTranscriptCount);

    if (currentLines.length === 0) return;

    if (!selectedScenario.isSafe && visibleTranscriptCount >= selectedScenario.dangerTriggerIndex) {
      setRiskLevel('scam');
      setRiskScore(95);

      const fullTextSoFar = currentLines
        .map((l) => `${l.speaker === 'caller' ? (isEn ? 'Caller' : 'कॉलर') : (isEn ? 'You' : 'आप')}: ${l.text}`)
        .join('\n');

      analyzeContent({
        content: fullTextSoFar,
        type: 'call',
        language,
        scenarioId: selectedScenario.id,
      }).then(async (result) => {
        setAnalysisResult(result);
        onSavePastAlert(getCallerName(selectedScenario), result);

        const tts = await generateSpeechAudio(result.voice_script, language);
        if (tts.audioBase64) {
          setBase64Audio(tts.audioBase64);
        }

        setShowDangerAlert(true);
      });
    } else if (!selectedScenario.isSafe && visibleTranscriptCount === 1) {
      setRiskLevel('suspicious');
      setRiskScore(45);
    } else if (selectedScenario.isSafe) {
      setRiskLevel('safe');
      setRiskScore(5);
    }
  }, [visibleTranscriptCount, stage, selectedScenario, language, onSavePastAlert, isEn]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
    };
  }, []);

  const handleEndCall = () => {
    speechService.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
    setShowDangerAlert(false);
    setStage('ended');
  };

  const handleTellFamily = () => {
    const caller = getCallerName(selectedScenario);
    const msg = isEn
      ? `⚠️ Alert: I just received a suspicious call from ${caller} (${selectedScenario.callerNumber}). Cyber Kavach flagged it as a potential scam. Please stay vigilant.`
      : `⚠️ चेतावनी: मुझे अभी ${caller} (${selectedScenario.callerNumber}) से एक संदिग्ध कॉल आई। साइबर कवच ने इसे धोखा बताया है। कृपया सतर्क रहें।`;
    onOpenFamilyAlert(msg);
  };

  const getScenarioIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert':
        return <ShieldAlert className="w-8 h-8 text-red-600 stroke-[2.2]" />;
      case 'CreditCard':
        return <CreditCard className="w-8 h-8 text-amber-600 stroke-[2.2]" />;
      case 'IndianRupee':
        return <IndianRupee className="w-8 h-8 text-amber-700 stroke-[2.2]" />;
      case 'Gift':
        return <Gift className="w-8 h-8 text-pink-600 stroke-[2.2]" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-8 h-8 text-orange-600 stroke-[2.2]" />;
      case 'Zap':
        return <Zap className="w-8 h-8 text-amber-600 stroke-[2.2]" />;
      case 'HeartHandshake':
      default:
        return <HeartHandshake className="w-8 h-8 text-emerald-700 stroke-[2.2]" />;
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const backLabel = isEn ? 'Back' : 'पीछे';
  const startCallLabel = isEn ? 'Start Call Test' : 'कॉल टेस्ट शुरू करें';
  const callInProgressLabel = isEn ? 'Call in progress' : 'कॉल चालू है';
  const hangUpLabel = isEn ? 'Hang Up' : 'काटें';
  const callEndedTitle = isEn ? 'Call Ended' : 'कॉल समाप्त हो गई';
  const callEndedSubtitle = isEn ? 'Cyber Kavach protection is active' : 'साइबर कवच सुरक्षा सक्रिय है।';
  const testAnotherCallLabel = isEn ? 'Test Another Call' : 'दूसरा कॉल टेस्ट करें';

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Stage 1: Scenario Picker */}
      {stage === 'picker' && (
        <div className="space-y-4">
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
              textToSpeak={`${t.selectScenario}। ${t.selectScenarioSubtitle}`}
              language={language}
            />
          </div>

          {/* Plain Disclaimer */}
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <Info className="w-6 h-6 text-teal-700 shrink-0 mt-0.5" />
            <p className="text-[17px] text-teal-900 font-medium leading-relaxed">
              {t.demoDisclaimer}
            </p>
          </div>

          <div>
            <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight">
              {t.selectScenario}
            </h2>
            <p className="text-[19px] text-slate-600 mt-1">
              {t.selectScenarioSubtitle}
            </p>
          </div>

          {/* Scenario Cards (High-End White Cards) */}
          <div className="space-y-3 pt-1">
            {SCENARIOS.map((scenario) => {
              const title = scenario.title[language] || scenario.title.en || scenario.title.hi;
              const desc = scenario.description[language] || scenario.description.en || scenario.description.hi;

              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleSelectScenario(scenario)}
                  className={`w-full text-left rounded-3xl p-5 border-2 transition-all shadow-xs active:scale-98 flex items-start gap-4 min-h-[96px] ${
                    scenario.isSafe
                      ? 'bg-emerald-50/90 hover:bg-emerald-100/80 border-emerald-300'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-teal-600'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    {getScenarioIcon(scenario.iconName)}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-[21px] font-extrabold text-slate-900 leading-snug">
                      {title}
                    </h3>
                    <p className="text-[17px] text-slate-600 mt-1 leading-normal">
                      {desc}
                    </p>
                    <div className="mt-2 text-[15px] font-bold text-teal-800 flex items-center gap-1.5">
                      <PhoneCall className="w-4 h-4" />
                      <span>{startCallLabel}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage 2: Incoming Call Screen */}
      {stage === 'incoming' && (
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 text-center space-y-6 shadow-sm shadow-slate-900/5 animate-in zoom-in-95 duration-200">
          <div className="inline-block bg-teal-50 text-teal-800 font-bold px-4 py-1.5 rounded-full text-[16px] border border-teal-200">
            {t.incomingCall}
          </div>

          {/* Caller Avatar */}
          <div className="w-28 h-28 mx-auto rounded-full bg-slate-100 border-4 border-teal-600 flex items-center justify-center text-teal-700 shadow-sm animate-pulse">
            <User className="w-16 h-16" />
          </div>

          <div>
            <h3 className="text-[28px] font-extrabold text-slate-900 leading-tight">
              {getCallerName(selectedScenario)}
            </h3>
            <p className="text-[20px] text-teal-800 font-mono font-bold mt-1">
              {selectedScenario.callerNumber}
            </p>
            <p className="text-[17px] text-slate-600 mt-2">
              {getCallerSubtitle(selectedScenario)}
            </p>
          </div>

          {/* Big Accept & Decline Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={handleDecline}
              className="min-h-[64px] h-18 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-[20px] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
            >
              <PhoneOff className="w-7 h-7" />
              <span>{t.declineCall}</span>
            </button>

            <button
              type="button"
              onClick={handleAccept}
              className="min-h-[64px] h-18 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[20px] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform animate-bounce"
            >
              <Phone className="w-7 h-7 fill-current" />
              <span>{t.acceptCall}</span>
            </button>
          </div>
        </div>
      )}

      {/* Stage 3: Active Call Screen with live transcript & risk meter */}
      {stage === 'active' && (
        <div className="space-y-4">
          {/* Active Call Header Card */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 animate-pulse">
                <PhoneCall className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-[21px] font-extrabold text-slate-900">
                  {getCallerName(selectedScenario)}
                </h3>
                <div className="flex items-center gap-2 text-[17px] text-emerald-800 font-mono font-bold">
                  <span>{callInProgressLabel}</span>
                  <span>·</span>
                  <span>{formatTimer(callSeconds)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEndCall}
              className="min-h-[56px] min-w-[56px] px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-[17px] flex items-center gap-2 shadow-sm active:scale-95"
            >
              <PhoneOff className="w-6 h-6" />
              <span>{hangUpLabel}</span>
            </button>
          </div>

          {/* Live Risk Meter */}
          <RiskMeter
            level={riskLevel}
            score={riskScore}
            language={language}
          />

          {/* Safe Call Indicator if Scenario is Safe */}
          {selectedScenario.isSafe && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
              <ShieldCheck className="w-9 h-9 text-emerald-700 shrink-0" />
              <p className="text-[19px] text-emerald-950 font-bold">
                {t.safeCallNotice}
              </p>
            </div>
          )}

          {/* Live Transcript Conversation Bubbles */}
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-[19px] font-extrabold text-slate-900">
                {t.liveTranscript}
              </h4>
              <span className="text-[15px] text-teal-800 font-bold">
                {t.analyzingLive}
              </span>
            </div>

            <div className="space-y-3 min-h-[220px] max-h-[340px] overflow-y-auto pr-1">
              {getScenarioTranscript(selectedScenario, language)
                .slice(0, visibleTranscriptCount)
                .map((utterance) => {
                  const isCaller = utterance.speaker === 'caller';
                  return (
                    <div
                      key={utterance.id}
                      className={`flex flex-col ${isCaller ? 'items-start' : 'items-end'} animate-in fade-in duration-300`}
                    >
                      <span className="text-[14px] text-slate-500 font-semibold mb-1 px-2">
                        {isCaller
                          ? getCallerName(selectedScenario)
                          : isEn
                          ? 'You'
                          : 'आप'}
                      </span>
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-[19px] leading-relaxed shadow-xs ${
                          isCaller
                            ? 'bg-slate-100 text-slate-900 border border-slate-200'
                            : 'bg-teal-700 text-white font-medium'
                        }`}
                      >
                        {utterance.text}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Stage 4: Call Ended Summary */}
      {stage === 'ended' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 text-center space-y-5 shadow-sm">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700">
            <PhoneOff className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-[26px] font-extrabold text-slate-900">
              {callEndedTitle}
            </h3>
            <p className="text-[18px] text-slate-600 mt-1">
              {callEndedSubtitle}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setStage('picker')}
              className="w-full min-h-[64px] h-16 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-[20px] shadow-sm active:scale-98"
            >
              {testAnotherCallLabel}
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Red Danger Alert Overlay */}
      {showDangerAlert && analysisResult && (
        <AlertOverlay
          voiceScript={analysisResult.voice_script}
          language={language}
          base64WavAudio={base64Audio}
          onEndCall={handleEndCall}
          onTellFamily={handleTellFamily}
          onReplay={() => {
            speechService.playVoiceNote(
              analysisResult.voice_script,
              language,
              base64Audio
            );
          }}
        />
      )}
    </div>
  );
};
