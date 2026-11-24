import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Edit3, ShieldAlert, X } from 'lucide-react';
import { COMMUNITIES } from '../data/canoinhasData.ts';
import { HealthCardProfile } from '../types.ts';

interface HealthCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HealthCardProfile;
  onSaveProfile: (next: HealthCardProfile) => void;
}

export const HealthCardModal: React.FC<HealthCardModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [draft, setDraft] = useState<HealthCardProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  useEffect(() => {
    if (!isOpen) return;
    const communityName =
      COMMUNITIES.find((c) => c.id === profile.communityId)?.name || 'Canoinhas';
    const payload = [
      'RADAR RURAL - CARTAO DE SAUDE',
      `Nome: ${profile.fullName}`,
      `Localidade: ${communityName} / Canoinhas-SC`,
      `Sangue: ${profile.bloodType}`,
      `CNS/SUS: ${profile.susNumber}`,
      `Alergias: ${profile.allergies}`,
      `Medicamentos: ${profile.continuousMedications}`,
      `Contato: ${profile.emergencyContactName} (${profile.emergencyContactPhone})`,
    ].join('\n');

    QRCode.toString(payload, {
      type: 'svg',
      margin: 1,
      width: 200,
      color: {
        dark: '#14532D',
        light: '#FFFFFF',
      },
    })
      .then((svg) => setQrSvg(svg))
      .catch(() => setQrSvg(''));
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const communityName =
    COMMUNITIES.find((c) => c.id === profile.communityId)?.name || 'Canoinhas';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...draft,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="health-card-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-black/8 bg-white shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-black/15 sm:hidden" />

        <div className="flex items-center justify-between border-b border-black/8 px-6 py-4">
          <div>
            <h2 id="health-card-title" className="font-display text-lg font-bold text-[#141A16]">
              Cartão de Saúde Offline
            </h2>
            <p className="text-xs text-[#57645C]">
              Salvo no aparelho para apresentar no posto rural ou hospital sem internet
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar cartão de saúde"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#57645C] hover:bg-[#F7F6F2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {!isEditing ? (
            <>
              <div className="flex flex-col items-center rounded-2xl border border-[#D9DFD4] bg-[#F8FAF6] p-5 text-center sm:flex-row sm:items-center sm:text-left sm:gap-5">
                <div
                  className="h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-[#D4DBD0] bg-white p-2"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  aria-label="QR Code com dados de saúde do morador"
                />
                <div className="mt-4 min-w-0 flex-1 space-y-1.5 sm:mt-0">
                  <p className="text-xs font-bold text-[#14532D]">{communityName} · Canoinhas</p>
                  <p className="font-display text-xl font-bold text-[#18241D]">{profile.fullName}</p>
                  <p className="font-mono text-xs text-[#55635A] tabular-nums">
                    Cartão SUS: {profile.susNumber}
                  </p>
                  <p className="pt-1 text-sm font-bold text-[#B91C1C]">
                    Tipo sanguíneo: {profile.bloodType}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#EEF2EA] rounded-2xl border border-[#D9DFD4] bg-white px-4">
                <div className="py-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#B91C1C]">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Alergias declaradas
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#18241D]">{profile.allergies}</p>
                </div>
                <div className="py-3">
                  <p className="text-xs font-bold text-[#55635A]">Medicamentos de uso contínuo</p>
                  <p className="mt-1 text-sm font-medium text-[#18241D]">
                    {profile.continuousMedications}
                  </p>
                </div>
                <div className="py-3">
                  <p className="text-xs font-bold text-[#55635A]">Contato de emergência</p>
                  <p className="mt-1 text-sm font-medium text-[#18241D] tabular-nums">
                    {profile.emergencyContactName} · {profile.emergencyContactPhone}
                  </p>
                </div>
              </div>

              {savedFeedback && (
                <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#15803D]">
                  <Check className="h-4 w-4" />
                  Ficha salva no aparelho para acesso offline.
                </p>
              )}

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-[#F7F6F2] px-4 py-2.5 text-xs font-bold text-[#141A16] hover:bg-[#EFECE4]"
              >
                <Edit3 className="h-4 w-4" />
                Atualizar Meus Dados de Saúde
              </button>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label htmlFor="hc-name" className="block text-xs font-bold text-[#18241D]">
                  Nome completo
                </label>
                <input
                  id="hc-name"
                  type="text"
                  required
                  value={draft.fullName}
                  onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] px-3 text-sm text-[#18241D] focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="hc-blood" className="block text-xs font-bold text-[#18241D]">
                    Tipo sanguíneo
                  </label>
                  <select
                    id="hc-blood"
                    value={draft.bloodType}
                    onChange={(e) => setDraft({ ...draft, bloodType: e.target.value })}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] bg-white px-3 text-sm text-[#18241D] focus:border-[#14532D] focus:outline-none"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="hc-sus" className="block text-xs font-bold text-[#18241D]">
                    Cartão SUS (CNS)
                  </label>
                  <input
                    id="hc-sus"
                    type="text"
                    value={draft.susNumber}
                    onChange={(e) => setDraft({ ...draft, susNumber: e.target.value })}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] px-3 font-mono text-sm text-[#18241D] focus:border-[#14532D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hc-allergies" className="block text-xs font-bold text-[#18241D]">
                  Alergias (remédios, picadas, alimentos)
                </label>
                <input
                  id="hc-allergies"
                  type="text"
                  value={draft.allergies}
                  onChange={(e) => setDraft({ ...draft, allergies: e.target.value })}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] px-3 text-sm text-[#18241D] focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="hc-meds" className="block text-xs font-bold text-[#18241D]">
                  Medicamentos de uso contínuo
                </label>
                <input
                  id="hc-meds"
                  type="text"
                  value={draft.continuousMedications}
                  onChange={(e) => setDraft({ ...draft, continuousMedications: e.target.value })}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] px-3 text-sm text-[#18241D] focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="hc-contact-name" className="block text-xs font-bold text-[#18241D]">
                    Familiar / Contato
                  </label>
                  <input
                    id="hc-contact-name"
                    type="text"
                    value={draft.emergencyContactName}
                    onChange={(e) => setDraft({ ...draft, emergencyContactName: e.target.value })}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] px-3 text-sm text-[#18241D] focus:border-[#14532D] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="hc-contact-phone" className="block text-xs font-bold text-[#18241D]">
                    Telefone de emergência
                  </label>
                  <input
                    id="hc-contact-phone"
                    type="tel"
                    value={draft.emergencyContactPhone}
                    onChange={(e) => setDraft({ ...draft, emergencyContactPhone: e.target.value })}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] px-3 font-mono text-sm text-[#18241D] focus:border-[#14532D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="min-h-[44px] flex-1 rounded-full border border-black/10 bg-[#F7F6F2] px-4 text-xs font-bold text-[#141A16] hover:bg-[#EFECE4]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] flex-1 rounded-full bg-[#14532D] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#166534]"
                >
                  Salvar Ficha Offline
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
