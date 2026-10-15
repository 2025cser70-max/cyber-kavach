import React, { useState, useEffect } from 'react';
import { LanguageCode, AnalysisResult, PastAlert } from './types';
import { Home } from './components/Home';
import { CallSimulator } from './components/CallSimulator';
import { MessageChecker } from './components/MessageChecker';
import { FamilyAlerts } from './components/FamilyAlerts';
import { PastAlerts } from './components/PastAlerts';
import { LanguagePicker } from './components/LanguagePicker';
import { ReportModal } from './components/ReportModal';
import { checkServerStatus } from './services/geminiService';

type CurrentView = 'home' | 'call' | 'message' | 'family' | 'past' | 'language';

const LANG_STORAGE_KEY = 'cyberkavach_language';
const ALERTS_STORAGE_KEY = 'cyberkavach_past_alerts';

export default function App() {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(false);
  const [view, setView] = useState<CurrentView>('home');
  const [isAiLive, setIsAiLive] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [familyAlertMessage, setFamilyAlertMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as LanguageCode | null;
      if (savedLang) {
        setLanguage(savedLang);
      } else {
        setLanguage('en');
      }
    } catch (e) {
      console.warn('Failed to access localStorage:', e);
    }

    checkServerStatus().then((status) => {
      setIsAiLive(status.hasApiKey);
    });
  }, []);

  const handleSelectLanguage = (langCode: LanguageCode) => {
    setLanguage(langCode);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, langCode);
    } catch (e) {
      console.warn('Could not save language:', e);
    }
    setIsFirstLaunch(false);
    setView('home');
  };

  const handleSavePastAlert = (source: string, result: AnalysisResult) => {
    try {
      const now = new Date();
      const newAlert: PastAlert = {
        id: Date.now().toString(),
        timestamp: now.toLocaleDateString(language === 'en' ? 'en-IN' : `${language}-IN`, {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'call',
        source,
        result,
        language,
      };

      const existingRaw = localStorage.getItem(ALERTS_STORAGE_KEY);
      const list: PastAlert[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [newAlert, ...list.slice(0, 20)];
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save alert in localStorage:', e);
    }
  };

  const handleTriggerFamilyAlert = (messageText?: string) => {
    setFamilyAlertMessage(messageText);
    setView('family');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Centered Mobile-First Container (Max 480px, responsive down to 360px) */}
      <main className="w-full max-w-[480px] mx-auto p-4 sm:p-5 flex-1 flex flex-col justify-start">
        {view === 'language' && (
          <LanguagePicker
            currentLanguage={language}
            onSelectLanguage={handleSelectLanguage}
            isInitialSetup={isFirstLaunch}
            onClose={() => setView('home')}
          />
        )}

        {view === 'home' && (
          <Home
            language={language}
            isAiLive={isAiLive}
            onOpenCallSimulator={() => setView('call')}
            onOpenMessageChecker={() => setView('message')}
            onOpenFamilyAlerts={() => {
              setFamilyAlertMessage(undefined);
              setView('family');
            }}
            onOpenPastAlerts={() => setView('past')}
            onOpenLanguagePicker={() => setView('language')}
          />
        )}

        {view === 'call' && (
          <CallSimulator
            language={language}
            onBack={() => setView('home')}
            onSavePastAlert={handleSavePastAlert}
            onOpenFamilyAlert={handleTriggerFamilyAlert}
          />
        )}

        {view === 'message' && (
          <MessageChecker
            language={language}
            onBack={() => setView('home')}
            onSavePastAlert={handleSavePastAlert}
            onOpenReportModal={() => setShowReportModal(true)}
          />
        )}

        {view === 'family' && (
          <FamilyAlerts
            language={language}
            onBack={() => setView('home')}
            initialAlertMessage={familyAlertMessage}
          />
        )}

        {view === 'past' && (
          <PastAlerts
            language={language}
            onBack={() => setView('home')}
          />
        )}
      </main>

      {/* Persistent High-End Safety Footer */}
      <footer className="w-full max-w-[480px] mx-auto px-4 py-4 text-center border-t border-slate-200/80 text-[14px] text-slate-500 font-medium">
        <p className="text-slate-700 font-bold">
          {language === 'en'
            ? 'Cyber Kavach · National Cyber Crime Protection Initiative'
            : 'साइबर कवच · राष्ट्रीय साइबर अपराध सुरक्षा पहल'}
        </p>
        <p className="text-[13px] text-slate-500 mt-1">
          {language === 'en' ? 'Helpline:' : 'हेल्पलाइन:'}{' '}
          <span className="text-amber-800 font-extrabold text-[15px]">1930</span> ·{' '}
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 underline font-bold hover:text-teal-800"
          >
            cybercrime.gov.in
          </a>
        </p>
      </footer>

      {/* Reporting Guide Modal */}
      {showReportModal && (
        <ReportModal
          language={language}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
