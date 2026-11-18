import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CloudOff,
  Copy,
  MapPin,
  MessageCircle,
  OctagonAlert,
  ThumbsUp,
  X,
} from 'lucide-react';
import { RoadIncident, SeverityLevel, SolutionStage } from '../types.ts';
import {
  buildWhatsAppAlertText,
  formatRelativeTime,
  getCategoryLabel,
  getSeverityLabel,
  getSolutionStageLabel,
} from '../utils/formatters.ts';

interface IncidentDetailModalProps {
  incident: RoadIncident | null;
  onClose: () => void;
  isOnline: boolean;
  onConfirmIncident: (incidentId: string) => Promise<void>;
  onMarkResolved: (incidentId: string, note: string) => Promise<void>;
}

const SOLUTION_STEPS: { stage: SolutionStage; label: string }[] = [
  { stage: SolutionStage.Reported, label: 'Reportado' },
  { stage: SolutionStage.NeighborsNotified, label: 'Vizinhos avisados' },
  { stage: SolutionStage.CrewDispatched, label: 'Obras acionada' },
  { stage: SolutionStage.Resolved, label: 'Trecho liberado' },
];

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  isOnline,
  onConfirmIncident,
  onMarkResolved,
}) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [busyAction, setBusyAction] = useState<'confirm' | 'resolve' | null>(null);

  if (!incident) return null;

  const currentStageIdx = SOLUTION_STEPS.findIndex((s) => s.stage === incident.solutionStage);
  const whatsappText = buildWhatsAppAlertText(incident);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const handleCopyAlert = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  const handleConfirm = async () => {
    setBusyAction('confirm');
    try {
      await onConfirmIncident(incident.id);
    } finally {
      setBusyAction(null);
    }
  };

  const handleResolve = async () => {
    setBusyAction('resolve');
    try {
      await onMarkResolved(
        incident.id,
        resolutionNote.trim() || 'Trecho desobstruído e liberado para tráfego.'
      );
      setResolutionNote('');
    } finally {
      setBusyAction(null);
    }
  };

  const severityColor =
    incident.severity === SeverityLevel.Blocked
      ? 'text-[#B91C1C]'
      : incident.severity === SeverityLevel.Caution
        ? 'text-[#B45309]'
        : 'text-[#15803D]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-detail-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[#D9DFD4] bg-white shadow-2xl sm:rounded-2xl">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#D4DBD0] sm:hidden" />

        <div className="flex items-start justify-between gap-4 border-b border-[#E7ECE2] px-5 py-4">
          <div className="min-w-0">
            <div className={`flex items-center gap-1.5 text-xs font-bold ${severityColor}`}>
              {incident.severity === SeverityLevel.Blocked ? (
                <OctagonAlert className="h-4 w-4 shrink-0" />
              ) : incident.severity === SeverityLevel.Caution ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              <span>{getSeverityLabel(incident.severity)}</span>
            </div>

            <h2 id="incident-detail-title" className="mt-1 font-display text-xl font-bold text-[#18241D]">
              {incident.title}
            </h2>

            <p className="mt-1 text-xs text-[#55635A] tabular-nums">
              {incident.communityName} · {incident.roadName} · {formatRelativeTime(incident.updatedAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes da ocorrência"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-[#4A5950] hover:bg-[#F1F4EE]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Photo Proof */}
          <div className="relative overflow-hidden rounded-2xl border border-[#E2E6DC] bg-[#EAF0E4]">
            {incident.photoUrl ? (
              <img
                src={incident.photoUrl}
                alt={`Foto da ocorrência em ${incident.roadName}`}
                referrerPolicy="no-referrer"
                className="h-56 w-full object-cover sm:h-64"
              />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-[#55635A]">
                Sem foto anexada
              </div>
            )}
            <div className="bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 py-3 text-white absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>Enviado por {incident.authorName}</span>
              <span className="font-mono tabular-nums">
                GPS {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Description & Metadata */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#55635A] tabular-nums">
              <span>Tipo: {getCategoryLabel(incident.category)}</span>
              <span aria-hidden="true">·</span>
              <span>{incident.confirmations} confirmações de moradores</span>
              {incident.isOfflinePending && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#B45309]">
                    <CloudOff className="h-3.5 w-3.5" />
                    Aguardando sinal para sincronizar
                  </span>
                </>
              )}
            </div>
            <p className="text-sm leading-relaxed text-[#24322A]">{incident.description}</p>
          </div>

          {/* Canal Direto de Retorno (Solution Timeline) */}
          <div className="rounded-2xl border border-[#E2E6DC] bg-[#F8FAF6] p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#18241D]">
                Retorno da Solução
              </h3>
              <span className="text-xs font-semibold text-[#14532D]">
                {getSolutionStageLabel(incident.solutionStage)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {SOLUTION_STEPS.map((step, idx) => {
                const completed = idx <= currentStageIdx;
                return (
                  <div key={step.stage} className="space-y-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        completed ? 'bg-[#14532D]' : 'bg-[#D9DFD4]'
                      }`}
                    />
                    <p
                      className={`text-[11px] leading-tight ${
                        completed ? 'font-semibold text-[#18241D]' : 'text-[#6A786E]'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {incident.resolutionNote && (
              <p className="mt-3 border-t border-[#E2E6DC] pt-2.5 text-xs leading-relaxed text-[#3F4D44]">
                {incident.resolutionNote}
              </p>
            )}
          </div>

          {/* Community Actions: WhatsApp Share & Confirmations */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#15803D]/30 bg-[#15803D]/10 px-4 py-2.5 text-xs font-bold text-[#14532D] hover:bg-[#15803D]/15"
            >
              <MessageCircle className="h-4 w-4" />
              Avisar no WhatsApp da Região
            </a>

            <button
              type="button"
              onClick={() => void handleCopyAlert()}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#D4DBD0] bg-white px-4 py-2.5 text-xs font-semibold text-[#18241D] hover:bg-[#F1F4EE]"
            >
              {copied ? <Check className="h-4 w-4 text-[#15803D]" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Texto copiado!' : 'Copiar aviso com GPS'}
            </button>
          </div>

          {/* Interactive Feedback & Mark Resolved */}
          {!incident.isOfflinePending && (
            <div className="space-y-3 border-t border-[#E7ECE2] pt-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={!isOnline || busyAction !== null}
                  onClick={() => void handleConfirm()}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#D4DBD0] bg-white px-4 py-2.5 text-xs font-bold text-[#18241D] hover:bg-[#F1F4EE] disabled:opacity-50"
                >
                  <ThumbsUp className="h-4 w-4 text-[#14532D]" />
                  {busyAction === 'confirm' ? 'Confirmando...' : 'Ainda está assim'}
                </button>

                {incident.severity !== SeverityLevel.Cleared && (
                  <button
                    type="button"
                    disabled={!isOnline || busyAction !== null}
                    onClick={() => void handleResolve()}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#14532D] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#166534] disabled:opacity-50"
                  >
                    <MapPin className="h-4 w-4" />
                    {busyAction === 'resolve' ? 'Atualizando...' : 'Confirmar Trecho Liberado'}
                  </button>
                )}
              </div>

              {incident.severity !== SeverityLevel.Cleared && (
                <input
                  type="text"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Nota opcional ao liberar (ex: Patrola passou às 14h)"
                  className="min-h-[40px] w-full rounded-xl border border-[#D4DBD0] bg-[#F8FAF6] px-3 text-xs text-[#18241D] placeholder:text-[#7B8A80] focus:border-[#14532D] focus:outline-none"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
