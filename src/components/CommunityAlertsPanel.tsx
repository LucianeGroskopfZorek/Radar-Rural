import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  MessageCircle,
  OctagonAlert,
  ShieldCheck,
} from 'lucide-react';
import { CommunityAlert, CommunityInfo, RoadIncident } from '../types.ts';
import { formatRelativeTime } from '../utils/formatters.ts';
import { CredibilityStars } from './CredibilityStars.tsx';

interface CommunityAlertsPanelProps {
  community: CommunityInfo;
  showAllRegion: boolean;
  alerts: CommunityAlert[];
  incidents: RoadIncident[];
  isOnline: boolean;
  onSelectIncident: (incident: RoadIncident) => void;
  onValidateAlert: (alertId: string) => Promise<void>;
}

export const CommunityAlertsPanel: React.FC<CommunityAlertsPanelProps> = ({
  community,
  showAllRegion,
  alerts,
  incidents,
  isOnline,
  onSelectIncident,
  onValidateAlert,
}) => {
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const visibleAlerts = showAllRegion
    ? alerts
    : alerts.filter((a) => a.communityId === community.id);

  const renderKindMeta = (kind: CommunityAlert['kind']) => {
    switch (kind) {
      case 'bloqueio':
        return {
          icon: OctagonAlert,
          label: 'Aviso de bloqueio',
          color: 'text-[#B91C1C]',
        };
      case 'atencao':
        return {
          icon: AlertTriangle,
          label: 'Atenção na via',
          color: 'text-[#B45309]',
        };
      case 'retorno_liberado':
        return {
          icon: CheckCircle2,
          label: 'Retorno da solução',
          color: 'text-[#15803D]',
        };
      case 'utilidade':
        return {
          icon: Bell,
          label: 'Lembrete semanal',
          color: 'text-[#14532D]',
        };
    }
  };

  const handleValidate = async (alertId: string) => {
    if (!isOnline || validatingId) return;
    setValidatingId(alertId);
    try {
      await onValidateAlert(alertId);
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <section id="comunidade" aria-labelledby="comunidade-heading" className="space-y-5">
      <div>
        <h2 id="comunidade-heading" className="font-display text-2xl font-bold tracking-tight text-[#141A16] sm:text-3xl">
          Alertas aos Vizinhos e Retornos
        </h2>
        <p className="mt-1 text-sm text-[#525C54]">
          Valide alertas confirmados na estrada para aumentar a credibilidade do autor e somar pontos no ranking
        </p>
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-[0_1px_2px_rgba(20,26,22,0.04)]">
          <p className="text-sm font-semibold text-[#141A16]">
            Nenhum alerta recente em {community.name}
          </p>
          <p className="mt-1 text-xs text-[#525C54]">
            Quando um vizinho registrar um bloqueio ou uma estrada for liberada, o aviso aparece aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {visibleAlerts.slice(0, 8).map((alert) => {
            const meta = renderKindMeta(alert.kind);
            const Icon = meta.icon;
            const linkedIncident = alert.incidentId
              ? incidents.find((i) => i.id === alert.incidentId)
              : undefined;
            const shareText = `*Radar Rural · ${alert.communityName}*\n${alert.title}\n${alert.message}`;
            const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

            return (
              <article
                key={alert.id}
                className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(20,26,22,0.04),0_8px_24px_rgba(20,26,22,0.03)]"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${meta.color}`}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {meta.label}
                    </span>
                    <span className="text-[#525C54] tabular-nums">
                      {alert.communityName} · {formatRelativeTime(alert.createdAt)}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-lg font-bold leading-snug text-[#141A16]">
                    {alert.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#3B453E]">{alert.message}</p>

                  <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-[#525C54] tabular-nums">
                    {alert.authorName && (
                      <>
                        <span className="font-semibold text-[#141A16]">{alert.authorName}</span>
                        <CredibilityStars stars={alert.authorStars || 4} compact />
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="font-medium text-[#14532D]">
                      {alert.validationsCount || 1} validações de vizinhos
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/6 pt-4">
                  <span className="text-xs text-[#525C54]">{alert.audience}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!isOnline || validatingId === alert.id}
                      onClick={() => void handleValidate(alert.id)}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#EAF1E8] px-3.5 py-1.5 text-xs font-semibold text-[#14532D] transition-colors hover:bg-[#DCE7D9] disabled:opacity-50"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {validatingId === alert.id ? 'Validando...' : 'Validar (+5 pts)'}
                    </button>

                    {linkedIncident && (
                      <button
                        type="button"
                        onClick={() => onSelectIncident(linkedIncident)}
                        className="min-h-[36px] rounded-full bg-black/[0.04] px-3.5 py-1.5 text-xs font-semibold text-[#141A16] transition-colors hover:bg-black/[0.08]"
                      >
                        Ver ponto
                      </button>
                    )}

                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-black/[0.04] px-3.5 py-1.5 text-xs font-semibold text-[#141A16] transition-colors hover:bg-black/[0.08]"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-[#15803D]" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
