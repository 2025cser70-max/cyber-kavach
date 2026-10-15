import React from 'react';
import { Phone, Globe, Shield, X } from 'lucide-react';
import { LanguageCode } from '../types';
import { getTranslation } from '../data/languages';
import { AudioSpeakButton } from './AudioSpeakButton';

interface ReportModalProps {
  language: LanguageCode | string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ language, onClose }) => {
  const t = getTranslation(language);

  const steps =
    language === 'en'
      ? [
          {
            num: '1',
            title: 'Call Helpline 1930 Immediately',
            desc: 'This is the official National Cyber Crime Helpline of India. Calling within 2 hours of financial fraud enables authorities to freeze stolen funds quickly.',
          },
          {
            num: '2',
            title: 'File a Complaint at cybercrime.gov.in',
            desc: 'Log on to cybercrime.gov.in and upload incident details, suspect phone numbers, and transaction screenshots.',
          },
          {
            num: '3',
            title: 'Notify Your Bank Branch',
            desc: 'Contact your bank customer support immediately to temporarily freeze your ATM card and online banking.',
          },
        ]
      : [
          {
            num: '1',
            title: 'तुरंत 1930 पर फोन करें',
            desc: 'यह भारत सरकार की राष्ट्रीय साइबर हेल्पलाइन है। किसी भी वित्तीय धोखाधड़ी के 2 घंटे के भीतर कॉल करने पर पैसा तुरंत फ्रीज कराया जा सकता है।',
          },
          {
            num: '2',
            title: 'साइबर क्राइम पोर्टल पर शिकायत दर्ज करें',
            desc: 'वेबसाइट cybercrime.gov.in पर जाकर घटना का विवरण, फ्रॉड कॉलर का नंबर और लेन-देन का स्क्रीनशॉट अपलोड करें।',
          },
          {
            num: '3',
            title: 'अपनी बैंक शाखा में सूचित करें',
            desc: 'अपने बैंक को तुरंत सूचित करके अपना एटीएम कार्ड और नेट बैंकिंग तुरंत ब्लॉक करवाएं।',
          },
        ];

  const modalHeading =
    language === 'en' ? 'How to Report Cyber Fraud' : 'धोखाधड़ी की रिपोर्ट कैसे करें';

  const speakText =
    language === 'en'
      ? 'In case of fraud, call the National Cyber Helpline 1930 immediately or file a report at cybercrime.gov.in.'
      : 'धोखाधड़ी होने पर तुरंत राष्ट्रीय साइबर हेल्पलाइन 1930 पर कॉल करें या cybercrime.gov.in पर शिकायत दर्ज करें।';

  const callBtnText =
    language === 'en' ? 'Call Helpline 1930' : 'हेल्पलाइन 1930 पर कॉल करें';

  const portalBtnText =
    language === 'en' ? 'Open cybercrime.gov.in Portal' : 'cybercrime.gov.in पोर्टल खोलें';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
      <div className="w-full max-w-md bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-slate-900">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-[22px] font-extrabold text-slate-900">
              {modalHeading}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <AudioSpeakButton
              textToSpeak={speakText}
              language={language}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={language === 'en' ? 'Close' : 'बंद करें'}
              className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Big Dial 1930 Callout */}
        <a
          href="tel:1930"
          className="w-full min-h-[64px] h-18 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[22px] flex items-center justify-center gap-3 shadow-sm active:scale-98 transition-transform"
        >
          <Phone className="w-7 h-7 fill-current" />
          <span>{callBtnText}</span>
        </a>

        {/* 3 Clear Steps */}
        <div className="space-y-3">
          {steps.map((st) => (
            <div
              key={st.num}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-[18px] flex items-center justify-center shrink-0">
                  {st.num}
                </span>
                <h4 className="text-[20px] font-bold text-slate-900">
                  {st.title}
                </h4>
              </div>
              <p className="text-[17px] text-slate-700 pl-11 leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Official Web Link */}
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[56px] h-14 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-[18px] flex items-center justify-center gap-2 border border-teal-200 shadow-xs"
        >
          <Globe className="w-5 h-5 text-teal-700" />
          <span>{portalBtnText}</span>
        </a>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[56px] h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[18px]"
        >
          {t.closeBtn}
        </button>
      </div>
    </div>
  );
};
