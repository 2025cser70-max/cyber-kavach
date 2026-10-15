import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, ArrowLeft, Share2, CheckCircle2 } from 'lucide-react';
import { FamilyContact, LanguageCode } from '../types';
import { getTranslation } from '../data/languages';
import { AudioSpeakButton } from './AudioSpeakButton';

interface FamilyAlertsProps {
  language: LanguageCode | string;
  onBack: () => void;
  initialAlertMessage?: string;
}

const STORAGE_KEY = 'cyberkavach_family_contacts';

export const FamilyAlerts: React.FC<FamilyAlertsProps> = ({
  language,
  onBack,
  initialAlertMessage,
}) => {
  const t = getTranslation(language);
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [alertSentTo, setAlertSentTo] = useState<string | null>(null);

  const isEn = language === 'en';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setContacts(JSON.parse(saved));
      } else {
        const defaultContacts: FamilyContact[] = [
          {
            id: '1',
            name: isEn ? 'Rahul (Son)' : 'रमेश (बेटा)',
            relation: isEn ? 'Son' : 'बेटा',
            phone: '+91 98765 43210',
          },
        ];
        setContacts(defaultContacts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultContacts));
      }
    } catch (e) {
      console.warn('Failed to load family contacts:', e);
    }
  }, [isEn]);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newContact: FamilyContact = {
      id: Date.now().toString(),
      name: name.trim(),
      relation: relation.trim() || (isEn ? 'Family Member' : 'परिजन'),
      phone: phone.trim(),
    };

    const updated = [...contacts.slice(0, 4), newContact];
    setContacts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setName('');
    setRelation('');
    setPhone('');
  };

  const handleDelete = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSimulateAlert = (contact: FamilyContact) => {
    setAlertSentTo(contact.name);
  };

  const samplePreviewMessage =
    initialAlertMessage ||
    (isEn
      ? `⚠️ [Cyber Kavach Alert]: Your family member (+91 98XXX XXX01) just received a high-risk scam call/message. Cyber Kavach flagged this incident. Please reach out to them immediately to assist.`
      : `⚠️ [साइबर कवच अलर्ट]: आपके बुजुर्ग परिजन (+91 98XXX XXX01) को अभी एक संदिग्ध धोखाधड़ी वाली कॉल प्राप्त हुई है। साइबर कवच ने इसे संभावित स्कैम बताया है। कृपया उनसे तुरंत संपर्क करके सहायता करें।`);

  const handleRealWhatsApp = (contact: FamilyContact) => {
    const text = encodeURIComponent(samplePreviewMessage);
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  const backLabel = isEn ? 'Back' : 'पीछे';
  const subtitleText = isEn
    ? 'Automatic instant alerts will be sent to your trusted family members when fraud is detected.'
    : 'धोखाधड़ी होने पर आपके परिजन को तुरंत संदेश भेजा जाएगा।';

  const speakHeader = isEn
    ? `${t.familyAlerts}. Whenever a dangerous scam call comes in, your son or daughter will receive an immediate alert.`
    : `${t.familyAlerts}। जब भी कोई धोखाधड़ी कॉल आएगी, आपके बेटे या बेटी को तुरंत सूचना जाएगी।`;

  const trustedContactsTitle = isEn ? 'Your Trusted Contacts' : 'आपके विश्वसनीय परिजन';
  const deleteTitle = isEn ? 'Delete' : 'हटाएं';
  const sendDemoAlertBtn = isEn ? 'Send Demo Alert' : 'डेमो अलर्ट भेजें';
  const whatsAppBtn = isEn ? 'WhatsApp Alert' : 'व्हाट्सएप संदेश';
  const successTitle = isEn ? `Alert sent to ${alertSentTo}` : `${alertSentTo} को खबर कर दी गई है`;
  const successDesc = isEn ? '(Simulated demo notification dispatched)' : '(सिम्युलेटेड डेमो संदेश भेजा गया)';

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
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
          textToSpeak={speakHeader}
          language={language}
        />
      </div>

      <div>
        <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight">
          {t.familyAlerts}
        </h2>
        <p className="text-[19px] text-slate-600 mt-1 leading-relaxed">
          {subtitleText}
        </p>
      </div>

      {/* Simulated Dispatch Modal/Notification */}
      {alertSentTo && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-5 shadow-sm space-y-3 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-700 shrink-0" />
            <div>
              <h3 className="text-[22px] font-bold text-slate-900">
                {successTitle}
              </h3>
              <p className="text-[16px] text-emerald-800 font-medium">
                {successDesc}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-emerald-200 text-[17px] text-slate-800 leading-relaxed font-mono">
            {samplePreviewMessage}
          </div>

          <button
            type="button"
            onClick={() => setAlertSentTo(null)}
            className="w-full min-h-[56px] h-14 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[18px] shadow-xs active:scale-98"
          >
            {t.closeBtn}
          </button>
        </div>
      )}

      {/* Trusted Contacts List */}
      <div className="space-y-3">
        <h3 className="text-[20px] font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-700" />
          <span>{trustedContactsTitle}</span>
        </h3>

        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[20px] font-bold text-slate-900">
                  {contact.name}
                </div>
                <div className="text-[16px] text-slate-500 font-medium">
                  {contact.relation} · {contact.phone}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(contact.id)}
                className="w-11 h-11 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center border border-slate-200"
                title={deleteTitle}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleSimulateAlert(contact)}
                className="min-h-[48px] px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-[15px] font-extrabold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>{sendDemoAlertBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRealWhatsApp(contact)}
                className="min-h-[48px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-extrabold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>{whatsAppBtn}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Contact Form */}
      <form
        onSubmit={handleSaveContact}
        className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs"
      >
        <h4 className="text-[20px] font-extrabold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-teal-700" />
          <span>{t.addFamilyMember}</span>
        </h4>

        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.familyNamePlaceholder}
            className="w-full min-h-[56px] px-4 rounded-2xl border-2 border-slate-200 text-[18px] focus:border-teal-600 focus:outline-none bg-slate-50 font-medium"
            required
          />

          <input
            type="text"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder={t.familyRelationPlaceholder}
            className="w-full min-h-[56px] px-4 rounded-2xl border-2 border-slate-200 text-[18px] focus:border-teal-600 focus:outline-none bg-slate-50 font-medium"
          />

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.familyPhonePlaceholder}
            className="w-full min-h-[56px] px-4 rounded-2xl border-2 border-slate-200 text-[18px] focus:border-teal-600 focus:outline-none bg-slate-50 font-medium"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full min-h-[56px] h-14 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-[19px] shadow-sm active:scale-98"
        >
          {t.saveContact}
        </button>
      </form>
    </div>
  );
};
