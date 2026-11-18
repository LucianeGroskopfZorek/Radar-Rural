import React from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  MessageCircle,
  OctagonAlert,
} from 'lucide-react';
import { CommunityAlert, CommunityInfo, RoadIncident } from '../types.ts';
import { formatRelativeTime } from '../utils/formatters.ts';

interface CommunityAlertsPanelProps {
  community: CommunityInfo;
  showAllRegion: boolean;
  alerts: CommunityAlert[];
  incidents: RoadIncident[];
  onSelectIncident: (incident: RoadIncident) => void;
}

export const CommunityAlertsPanel: React.FC<CommunityAlertsPanelProps> = ({
  community,
  showAllRegion,
  alerts,
  incidents,
  onSelectIncident,
}) => {
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

  return (
    <section id="comunidade" aria-labelledby="comunidade-heading" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="comunidade-heading" className="font-display text-2xl font-bold tracking-tight text-[#18241D] sm:text-3xl">
            Alertas aos Vizinhos e Retornos
          </h2>
          <p className="mt-1 text-sm text-[#4A5950]">
            Avisos instantâneos para moradores, transporte escolar, caminhão do leite e confirmação de estrada liberada
          </p>
        </div>
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="rounded-2xl border border-[#D9DFD4] bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#18241D]">
            Nenhum alerta recente em {community.name}
          </p>
          <p className="mt-1 text-xs text-[#55635A]">
            Quando um vizinho registrar um bloqueio ou uma estrada for liberada, o aviso aparece aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleAlerts.slice(0, 6).map((alert) => {
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
                className="flex flex-col justify-between rounded-2xl border border-[#D9DFD4] bg-white p-5"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1.5 font-bold ${meta.color}`}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {meta.label}
                    </span>
                    <span className="text-[#55635A] tabular-nums">
                      {alert.communityName} · {formatRelativeTime(alert.createdAt)}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-base font-bold text-[#18241D]">
                    {alert.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#3F4D44]">{alert.message}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF2EA] pt-3">
                  <span className="text-xs text-[#55635A]">{alert.audience}</span>
                  <div className="flex items-center gap-2">
                    {linkedIncident && (
                      <button
                        type="button"
                        onClick={() => onSelectIncident(linkedIncident)}
                        className="min-h-[36px] rounded-lg border border-[#D4DBD0] px-3 py-1.5 text-xs font-semibold text-[#18241D] hover:bg-[#F1F4EE]"
                      >
                        Ver ponto no mapa
                      </button>
                    )}
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#EAF0E4] px-3 py-1.5 text-xs font-bold text-[#14532D] hover:bg-[#DCE7D2]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
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
