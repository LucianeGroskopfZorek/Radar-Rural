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
    <section id="utilidades" aria-labelledby="utilidades-heading" className="space-y-4">
      <div>
        <h2 id="utilidades-heading" className="font-display text-2xl font-bold tracking-tight text-[#18241D] sm:text-3xl">
          Utilidades da Semana
        </h2>
        <p className="mt-1 text-sm text-[#4A5950]">
          Serviços rotineiros em {community.name} para você não perder viagem nem prazo
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Card 1: Coleta & Descarte */}
        <article className="flex flex-col justify-between rounded-2xl border border-[#D9DFD4] bg-white p-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0E4] text-[#14532D]">
                  <Recycle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#18241D]">
                    Coleta & Descarte
                  </h3>
                  <p className="text-xs text-[#55635A]">{community.name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-[#EEF2EA] pt-4 text-sm">
              <div>
                <p className="text-xs font-bold text-[#14532D]">
                  Coleta Seletiva · {schedule.selectiveCollection.dayOfWeek}
                </p>
                <p className="mt-1 font-semibold text-[#18241D]">
                  {schedule.selectiveCollection.nextDateLabel}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#55635A]">
                  {schedule.selectiveCollection.routeDescription}
                </p>
              </div>

              <div className="border-t border-[#EEF2EA] pt-3">
                <p className="text-xs font-bold text-[#18241D]">
                  Agrotóxicos e Eletrônicos
                </p>
                <p className="mt-1 text-xs font-semibold text-[#3F4D44] tabular-nums">
                  {schedule.pesticideAndElectronics.nextDate} · {schedule.pesticideAndElectronics.location}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#55635A]">
                  {schedule.pesticideAndElectronics.itemsAccepted}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-[#EEF2EA] pt-4">
            <button
              type="button"
              onClick={toggleReminder}
              className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${
                reminderEnabled
                  ? 'border-[#14532D]/30 bg-[#EAF0E4] text-[#14532D]'
                  : 'border-[#D4DBD0] bg-white text-[#3F4D44] hover:bg-[#F7F9F5]'
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
        <article className="flex flex-col justify-between rounded-2xl border border-[#D9DFD4] bg-white p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0E4] text-[#14532D]">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#18241D]">
                  Saúde no Interior
                </h3>
                <p className="text-xs text-[#55635A]">{schedule.ruralHealth.location}</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-[#EEF2EA] pt-4 text-sm">
              <div>
                <p className="text-xs font-bold text-[#14532D]">
                  {schedule.ruralHealth.serviceTitle}
                </p>
                <p className="mt-1 font-semibold text-[#18241D] tabular-nums">
                  {schedule.ruralHealth.scheduleLabel}
                </p>
              </div>

              <div className="border-t border-[#EEF2EA] pt-3">
                <p className="text-xs font-bold text-[#18241D]">
                  Transporte Saúde para Canoinhas
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#3F4D44]">
                  {schedule.ruralHealth.transportDeadline}
                </p>
                <p className="mt-1 text-xs font-medium text-[#55635A] tabular-nums">
                  {schedule.ruralHealth.confirmedSeatsCount} moradores confirmados nesta semana
                </p>
              </div>

              {myConfirmations.length > 0 && (
                <div className="rounded-xl border border-[#15803D]/25 bg-[#EAF0E4]/65 px-3 py-2 text-xs text-[#14532D]">
                  Última confirmação: <strong>{myConfirmations[0].patientName}</strong> ({myConfirmations[0].appointmentDate})
                </div>
              )}

              {transportMessage && (
                <p className="text-xs font-semibold text-[#15803D]">{transportMessage}</p>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-[#EEF2EA] pt-4">
            {!showTransportForm ? (
              <button
                type="button"
                onClick={() => setShowTransportForm(true)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#14532D] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#166534]"
              >
                <Bus className="h-4 w-4" />
                Confirmar Vaga no Transporte
              </button>
            ) : (
              <form onSubmit={handleSubmitTransport} className="space-y-2.5 rounded-xl border border-[#D4DBD0] bg-[#F8FAF6] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#18241D]">Confirmar transporte</span>
                  <button
                    type="button"
                    onClick={() => setShowTransportForm(false)}
                    aria-label="Cancelar confirmação"
                    className="rounded p-1 text-[#55635A] hover:bg-white"
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
                  className="min-h-[40px] w-full rounded-lg border border-[#D4DBD0] bg-white px-3 text-xs text-[#18241D] focus:border-[#14532D] focus:outline-none"
                />
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Posto / Hospital / Exame"
                  className="min-h-[40px] w-full rounded-lg border border-[#D4DBD0] bg-white px-3 text-xs text-[#18241D] focus:border-[#14532D] focus:outline-none"
                />
                <input
                  type="text"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  placeholder="Dia e horário da consulta"
                  className="min-h-[40px] w-full rounded-lg border border-[#D4DBD0] bg-white px-3 text-xs text-[#18241D] focus:border-[#14532D] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!isOnline || submitting}
                  className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-2 text-xs font-bold text-white hover:bg-[#166534] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {submitting ? 'Confirmando...' : isOnline ? 'Enviar Confirmação' : 'Necessita sinal'}
                </button>
              </form>
            )}
          </div>
        </article>

        {/* Card 3: Meu Cartão de Saúde (QR Code Offline) */}
        <article className="flex flex-col justify-between rounded-2xl border border-[#D9DFD4] bg-white p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0E4] text-[#14532D]">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#18241D]">
                  Meu Cartão de Saúde
                </h3>
                <p className="text-xs text-[#55635A]">Funciona no posto mesmo sem sinal</p>
              </div>
            </div>

            <div className="space-y-2.5 border-t border-[#EEF2EA] pt-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#55635A]">Morador</span>
                <span className="font-bold text-[#18241D] truncate">{healthCard.fullName}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#55635A]">Tipo sanguíneo</span>
                <span className="font-mono font-bold text-[#B91C1C] tabular-nums">{healthCard.bloodType}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#55635A]">Alergias</span>
                <span className="font-semibold text-[#18241D] truncate max-w-[190px]">{healthCard.allergies}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#55635A]">Uso contínuo</span>
                <span className="font-semibold text-[#18241D] truncate max-w-[190px]">{healthCard.continuousMedications}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#55635A]">Contato emergência</span>
                <span className="font-mono font-medium text-[#18241D] tabular-nums">{healthCard.emergencyContactPhone}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-[#EEF2EA] pt-4">
            <button
              type="button"
              onClick={onOpenHealthCard}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#14532D] bg-white px-4 py-2 text-xs font-bold text-[#14532D] transition-colors hover:bg-[#EAF0E4]"
            >
              <QrCode className="h-4 w-4" />
              Abrir QR Code e Editar Ficha
            </button>
          </div>
        </article>
      </div>
    </section>
  );
};
