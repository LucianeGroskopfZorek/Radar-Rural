import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Bus,
  Check,
  QrCode,
  Recycle,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  CommunityInfo,
  HealthCardProfile,
  TransportConfirmation,
  UtilitySchedule,
} from '../types.ts';

interface WeeklyUtilitiesSectionProps {
  community: CommunityInfo;
  schedule: UtilitySchedule;
  myConfirmations: TransportConfirmation[];
  healthCard: HealthCardProfile;
  isOnline: boolean;
  onConfirmTransport: (patientName: string, destination: string, appointmentDate: string) => Promise<void>;
  onOpenHealthCard: () => void;
}

const REMINDER_KEY = 'radar_rural_collection_reminder_v1';

export const WeeklyUtilitiesSection: React.FC<WeeklyUtilitiesSectionProps> = ({
  community,
  schedule,
  myConfirmations,
  healthCard,
  isOnline,
  onConfirmTransport,
  onOpenHealthCard,
}) => {
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(REMINDER_KEY) !== 'off';
    } catch {
      return true;
    }
  });
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [patientName, setPatientName] = useState(healthCard.fullName || '');
  const [destination, setDestination] = useState('Hospital Santa Cruz / UPA Canoinhas');
  const [appointmentDate, setAppointmentDate] = useState('Quinta-feira · 7h30');
  const [submitting, setSubmitting] = useState(false);
  const [transportMessage, setTransportMessage] = useState('');

  const toggleReminder = () => {
    const next = !reminderEnabled;
    setReminderEnabled(next);
    try {
      localStorage.setItem(REMINDER_KEY, next ? 'on' : 'off');
    } catch {
      // ignore storage errors
    }
  };

  const handleSubmitTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !destination.trim() || submitting) return;
    setSubmitting(true);
    setTransportMessage('');
    try {
      await onConfirmTransport(patientName.trim(), destination.trim(), appointmentDate.trim());
      setShowTransportForm(false);
      setTransportMessage('Vaga no transporte sanitário confirmada.');
      setTimeout(() => setTransportMessage(''), 4000);
    } catch {
      setTransportMessage('Sem sinal no momento. Tente novamente ao conectar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="utilidades" aria-labelledby="utilidades-heading" className="space-y-5">
      <div>
        <h2 id="utilidades-heading" className="font-display text-2xl font-bold tracking-tight text-[#141A16] sm:text-3xl">
          Utilidades da Semana
        </h2>
        <p className="mt-1 text-sm text-[#525C54]">
          Agenda de coleta, saúde itinerante e ficha médica offline em {community.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card 1: Coleta & Descarte */}
        <article className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(20,26,22,0.04),0_8px_24px_rgba(20,26,22,0.03)]">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#525C54]">Agenda de coleta</p>
                <h3 className="mt-0.5 font-display text-lg font-bold text-[#141A16]">
                  Coleta & Descarte
                </h3>
              </div>
              <Recycle className="h-5 w-5 text-[#14532D]" />
            </div>

            <div className="space-y-4 border-t border-black/6 pt-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-[#14532D]">
                  Coleta Seletiva · {schedule.selectiveCollection.dayOfWeek}
                </p>
                <p className="mt-1 font-semibold text-[#141A16]">
                  {schedule.selectiveCollection.nextDateLabel}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#525C54]">
                  {schedule.selectiveCollection.routeDescription}
                </p>
              </div>

              <div className="border-t border-black/6 pt-3.5">
                <p className="text-xs font-semibold text-[#141A16]">
                  Agrotóxicos e Eletrônicos
                </p>
                <p className="mt-1 text-xs font-medium text-[#343E37] tabular-nums">
                  {schedule.pesticideAndElectronics.nextDate} · {schedule.pesticideAndElectronics.location}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#525C54]">
                  {schedule.pesticideAndElectronics.itemsAccepted}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-2">
            <button
              type="button"
              onClick={toggleReminder}
              className={`flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                reminderEnabled
                  ? 'bg-[#EAF1E8] text-[#14532D]'
                  : 'bg-black/[0.04] text-[#343E37] hover:bg-black/[0.08]'
              }`}
            >
              {reminderEnabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {reminderEnabled
                ? 'Aviso na véspera ativado'
                : 'Ativar lembrete na véspera'}
            </button>
          </div>
        </article>

        {/* Card 2: Saúde no Interior */}
        <article className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(20,26,22,0.04),0_8px_24px_rgba(20,26,22,0.03)]">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#525C54]">{schedule.ruralHealth.location}</p>
                <h3 className="mt-0.5 font-display text-lg font-bold text-[#141A16]">
                  Saúde no Interior
                </h3>
              </div>
              <Stethoscope className="h-5 w-5 text-[#14532D]" />
            </div>

            <div className="space-y-4 border-t border-black/6 pt-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-[#14532D]">
                  {schedule.ruralHealth.serviceTitle}
                </p>
                <p className="mt-1 font-semibold text-[#141A16] tabular-nums">
                  {schedule.ruralHealth.scheduleLabel}
                </p>
              </div>

              <div className="border-t border-black/6 pt-3.5">
                <p className="text-xs font-semibold text-[#141A16]">
                  Transporte Saúde para Canoinhas
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#525C54]">
                  {schedule.ruralHealth.transportDeadline}
                </p>
                <p className="mt-1.5 text-xs font-medium text-[#14532D] tabular-nums">
                  {schedule.ruralHealth.confirmedSeatsCount} moradores confirmados nesta semana
                </p>
              </div>

              {myConfirmations.length > 0 && (
                <p className="text-xs font-medium text-[#14532D]">
                  Última confirmação: <strong>{myConfirmations[0].patientName}</strong> ({myConfirmations[0].appointmentDate})
                </p>
              )}

              {transportMessage && (
                <p className="text-xs font-semibold text-[#15803D]">{transportMessage}</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-2">
            {!showTransportForm ? (
              <button
                type="button"
                onClick={() => setShowTransportForm(true)}
                className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full bg-[#14532D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#166534]"
              >
                <Bus className="h-4 w-4" />
                Confirmar Vaga no Transporte
              </button>
            ) : (
              <form onSubmit={handleSubmitTransport} className="space-y-2.5 rounded-2xl bg-[#F7F6F2] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#141A16]">Confirmar transporte</span>
                  <button
                    type="button"
                    onClick={() => setShowTransportForm(false)}
                    aria-label="Cancelar confirmação"
                    className="rounded p-1 text-[#525C54] hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome completo do paciente"
                  className="min-h-[40px] w-full rounded-xl border border-black/10 bg-white px-3 text-xs text-[#141A16] focus:border-[#14532D] focus:outline-none"
                />
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Posto / Hospital / Exame"
                  className="min-h-[40px] w-full rounded-xl border border-black/10 bg-white px-3 text-xs text-[#141A16] focus:border-[#14532D] focus:outline-none"
                />
                <input
                  type="text"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  placeholder="Dia e horário da consulta"
                  className="min-h-[40px] w-full rounded-xl border border-black/10 bg-white px-3 text-xs text-[#141A16] focus:border-[#14532D] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!isOnline || submitting}
                  className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full bg-[#14532D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {submitting ? 'Confirmando...' : isOnline ? 'Enviar Confirmação' : 'Necessita sinal'}
                </button>
              </form>
            )}
          </div>
        </article>

        {/* Card 3: Meu Cartão de Saúde (QR Code Offline) */}
        <article className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(20,26,22,0.04),0_8px_24px_rgba(20,26,22,0.03)]">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#525C54]">Disponível sem sinal</p>
                <h3 className="mt-0.5 font-display text-lg font-bold text-[#141A16]">
                  Meu Cartão de Saúde
                </h3>
              </div>
              <QrCode className="h-5 w-5 text-[#14532D]" />
            </div>

            <dl className="divide-y divide-black/6 border-t border-black/6 text-xs">
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-[#525C54]">Morador</dt>
                <dd className="font-semibold text-[#141A16] truncate">{healthCard.fullName}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-[#525C54]">Tipo sanguíneo</dt>
                <dd className="font-mono font-bold text-[#B91C1C] tabular-nums">{healthCard.bloodType}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-[#525C54]">Alergias</dt>
                <dd className="font-medium text-[#141A16] truncate max-w-[190px]">{healthCard.allergies}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-[#525C54]">Uso contínuo</dt>
                <dd className="font-medium text-[#141A16] truncate max-w-[190px]">{healthCard.continuousMedications}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <dt className="text-[#525C54]">Emergência</dt>
                <dd className="font-mono font-medium text-[#141A16] tabular-nums">{healthCard.emergencyContactPhone}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 pt-2">
            <button
              type="button"
              onClick={onOpenHealthCard}
              className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full bg-black/[0.04] px-4 py-2 text-xs font-semibold text-[#141A16] transition-colors hover:bg-black/[0.08]"
            >
              <QrCode className="h-4 w-4 text-[#14532D]" />
              Abrir QR Code e Editar Ficha
            </button>
          </div>
        </article>
      </div>
    </section>
  );
};
