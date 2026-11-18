import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Compass,
  Maximize2,
  Minimize2,
  Navigation,
  OctagonAlert,
  Plus,
} from 'lucide-react';
import { COMMUNITIES } from '../data/canoinhasData.ts';
import {
  CommunityInfo,
  RoadIncident,
  SeverityLevel,
} from '../types.ts';
import {
  formatRelativeTime,
  getCategoryLabel,
  getSeverityLabel,
} from '../utils/formatters.ts';

interface InteractiveRuralMapProps {
  selectedCommunity: CommunityInfo;
  showAllRegion: boolean;
  onToggleRegionScope: (showAll: boolean) => void;
  incidents: RoadIncident[];
  onSelectIncident: (incident: RoadIncident) => void;
  onOpenReportModal: () => void;
}

export const InteractiveRuralMap: React.FC<InteractiveRuralMapProps> = ({
  selectedCommunity,
  showAllRegion,
  onToggleRegionScope,
  incidents,
  onSelectIncident,
  onOpenReportModal,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'todos' | SeverityLevel>('todos');
  const [zoomedToCommunity, setZoomedToCommunity] = useState(false);

  const visibleIncidents = useMemo(() => {
    const byRegion = showAllRegion
      ? incidents
      : incidents.filter((inc) => inc.communityId === selectedCommunity.id);
    if (severityFilter === 'todos') return byRegion;
    return byRegion.filter((inc) => inc.severity === severityFilter);
  }, [incidents, selectedCommunity.id, severityFilter, showAllRegion]);

  const counts = useMemo(() => {
    const base = showAllRegion
      ? incidents
      : incidents.filter((inc) => inc.communityId === selectedCommunity.id);
    return {
      todos: base.length,
      bloqueado: base.filter((i) => i.severity === SeverityLevel.Blocked).length,
      atencao: base.filter((i) => i.severity === SeverityLevel.Caution).length,
      liberado: base.filter((i) => i.severity === SeverityLevel.Cleared).length,
    };
  }, [incidents, selectedCommunity.id, showAllRegion]);

  const viewBox = useMemo(() => {
    if (!zoomedToCommunity) return '0 0 1000 580';
    const w = 460;
    const h = 280;
    const x = Math.max(0, Math.min(1000 - w, selectedCommunity.mapX - w / 2));
    const y = Math.max(0, Math.min(580 - h, selectedCommunity.mapY - h / 2));
    return `${x} ${y} ${w} ${h}`;
  }, [selectedCommunity.mapX, selectedCommunity.mapY, zoomedToCommunity]);

  const renderSeverityIcon = (severity: SeverityLevel) => {
    if (severity === SeverityLevel.Blocked) return <OctagonAlert className="h-4 w-4 shrink-0" />;
    if (severity === SeverityLevel.Caution) return <AlertTriangle className="h-4 w-4 shrink-0" />;
    return <CheckCircle2 className="h-4 w-4 shrink-0" />;
  };

  return (
    <section id="mapa-vivo" aria-labelledby="mapa-vivo-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="mapa-vivo-heading" className="font-display text-2xl font-bold tracking-tight text-[#18241D] sm:text-3xl">
            Mapa Vivo das Estradas
          </h2>
          <p className="mt-1 text-sm text-[#4A5950]">
            {showAllRegion
              ? 'Exibindo ocorrências em toda a região rural de Canoinhas'
              : `Filtrado para ${selectedCommunity.name} e acessos próximos`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[#D9DFD4] bg-white p-1" role="group" aria-label="Filtro de gravidade">
            {(
              [
                { key: 'todos', label: `Todos (${counts.todos})` },
                { key: SeverityLevel.Blocked, label: `Bloqueios (${counts.bloqueado})` },
                { key: SeverityLevel.Caution, label: `Atenção (${counts.atencao})` },
                { key: SeverityLevel.Cleared, label: `Liberados (${counts.liberado})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSeverityFilter(tab.key)}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  severityFilter === tab.key
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#4A5950] hover:bg-[#F1F4EE] hover:text-[#18241D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Map Viewport (Left 7 cols on desktop) */}
        <div className="relative overflow-hidden rounded-2xl border border-[#D9DFD4] bg-[#EAF0E4] lg:col-span-7 flex flex-col">
          {/* Map Top Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9DFD4] bg-white/90 px-4 py-2.5 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-xs font-medium text-[#3F4D44]">
              <Compass className="h-4 w-4 text-[#14532D]" />
              <span>Interior de Canoinhas · Mapa Offline</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleRegionScope(!showAllRegion)}
                className="min-h-[36px] rounded-lg border border-[#D4DBD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#18241D] hover:bg-[#F1F4EE] whitespace-nowrap shrink-0"
              >
                {showAllRegion ? `Focar em ${selectedCommunity.name}` : 'Ver toda a região'}
              </button>
              <button
                type="button"
                onClick={() => setZoomedToCommunity((z) => !z)}
                aria-label={zoomedToCommunity ? 'Reduzir zoom do mapa' : 'Aproximar na comunidade'}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#D4DBD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#18241D] hover:bg-[#F1F4EE] whitespace-nowrap shrink-0"
              >
                {zoomedToCommunity ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                {zoomedToCommunity ? 'Visão Geral' : 'Aproximar'}
              </button>
            </div>
          </div>

          {/* Interactive Vector Topographic Map */}
          <div className="relative min-h-[340px] flex-1 sm:min-h-[420px]">
            <svg
              viewBox={viewBox}
              className="h-full w-full select-none bg-[#E7EDE1]"
              role="img"
              aria-label="Mapa das estradas rurais e rios de Canoinhas"
            >
              <defs>
                <pattern id="rural-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D5DEC9" strokeWidth="0.8" />
                </pattern>
              </defs>

              <rect x="0" y="0" width="1000" height="580" fill="url(#rural-grid)" />

              {/* Contour hills / forest patches */}
              <path
                d="M 40 120 Q 170 40, 290 120 T 520 140 T 760 80 T 960 150 L 960 0 L 40 0 Z"
                fill="#DCE6D3"
                opacity="0.7"
              />
              <path
                d="M 120 580 Q 280 480, 440 530 T 760 500 T 980 560 L 980 580 Z"
                fill="#DCE6D3"
                opacity="0.65"
              />

              {/* Rivers: Rio Iguaçu (north), Rio Canoinhas (center-west), Rio dos Poços (east) */}
              <path
                d="M 20 145 Q 190 95, 340 140 T 660 105 T 980 135"
                fill="none"
                stroke="#7CB3D9"
                strokeWidth="9"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 180 560 Q 250 430, 390 360 T 520 245 T 640 112"
                fill="none"
                stroke="#84B8DC"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 605 560 Q 625 445, 650 350 T 710 220 T 765 118"
                fill="none"
                stroke="#84B8DC"
                strokeWidth="6.5"
                strokeLinecap="round"
                opacity="0.75"
              />

              <text x="805" y="96" fontSize="11" fill="#3B6E8C" fontWeight="600">
                Rio Iguaçu
              </text>
              <text x="530" y="455" fontSize="11" fill="#3B6E8C" fontWeight="600">
                Rio dos Poços
              </text>

              {/* Main Highway BR-280 / SC-280 */}
              <path
                d="M 35 315 L 255 305 L 470 295 L 690 310 L 970 325"
                fill="none"
                stroke="#5A635D"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 35 315 L 255 305 L 470 295 L 690 310 L 970 325"
                fill="none"
                stroke="#FDE047"
                strokeWidth="1.5"
                strokeDasharray="10 8"
              />
              <rect x="445" y="280" width="66" height="22" rx="6" fill="#18241D" />
              <text x="478" y="295" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
                Canoinhas
              </text>

              {/* Rural Dirt Roads Network */}
              <g fill="none" stroke="#B69E78" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Marcílio Dias + Rio dos Poços */}
                <path d="M 555 298 L 648 348 L 610 420 L 520 495" />
                <path d="M 555 298 L 680 280 L 742 225 L 840 200" />
                <path d="M 680 280 L 815 445" />
                {/* Felipe Schmidt + Pinheiros */}
                <path d="M 255 305 L 215 430 L 245 465" />
                <path d="M 470 295 L 430 390 L 520 495" />
                {/* Paula Pereira */}
                <path d="M 470 295 L 350 195 L 320 165" />
                <path d="M 255 305 L 320 165" />
              </g>

              {/* Bridges markers */}
              <g>
                <rect x="640" y="340" width="16" height="16" rx="3" fill="#FFFFFF" stroke="#4A5950" strokeWidth="1.5" />
                <rect x="342" y="187" width="16" height="16" rx="3" fill="#FFFFFF" stroke="#4A5950" strokeWidth="1.5" />
              </g>

              {/* Community Nodes */}
              {COMMUNITIES.map((community) => {
                const isSelected = community.id === selectedCommunity.id;
                return (
                  <g key={community.id} transform={`translate(${community.mapX}, ${community.mapY})`}>
                    {isSelected && (
                      <circle
                        r="26"
                        fill="#14532D"
                        fillOpacity="0.12"
                        stroke="#14532D"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                      />
                    )}
                    <circle
                      r={isSelected ? 7 : 5}
                      fill={isSelected ? '#14532D' : '#4A5950'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      y={isSelected ? -14 : -11}
                      textAnchor="middle"
                      fontSize={isSelected ? '13' : '11'}
                      fontWeight={isSelected ? '700' : '600'}
                      fill={isSelected ? '#14532D' : '#2D3A32'}
                      style={{ paintOrder: 'stroke', stroke: '#F6F7F4', strokeWidth: '4px' }}
                    >
                      {community.name}
                    </text>
                  </g>
                );
              })}

              {/* Incident Pins */}
              {visibleIncidents.map((incident) => {
                const pinColor =
                  incident.severity === SeverityLevel.Blocked
                    ? '#B91C1C'
                    : incident.severity === SeverityLevel.Caution
                      ? '#B45309'
                      : '#15803D';
                const pinSymbol =
                  incident.severity === SeverityLevel.Blocked
                    ? '!'
                    : incident.severity === SeverityLevel.Caution
                      ? '▲'
                      : '✓';

                return (
                  <g
                    key={incident.id}
                    transform={`translate(${incident.mapX}, ${incident.mapY})`}
                    onClick={() => onSelectIncident(incident)}
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label={`${incident.title} em ${incident.roadName}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectIncident(incident);
                      }
                    }}
                  >
                    {incident.isOfflinePending && (
                      <circle
                        r="22"
                        fill="none"
                        stroke="#18241D"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    )}
                    <circle r="16" fill={pinColor} stroke="#FFFFFF" strokeWidth="3" />
                    <text
                      y="5"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill="#FFFFFF"
                    >
                      {pinSymbol}
                    </text>
                    <g transform="translate(0, 28)">
                      <rect
                        x="-76"
                        y="-10"
                        width="152"
                        height="20"
                        rx="6"
                        fill="#FFFFFF"
                        stroke="#D4DBD0"
                        strokeWidth="1"
                      />
                      <text
                        y="3"
                        textAnchor="middle"
                        fontSize="10.5"
                        fontWeight="600"
                        fill="#18241D"
                      >
                        {incident.title.length > 23
                          ? `${incident.title.slice(0, 22)}…`
                          : incident.title}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Floating Primary CTA Button on Map */}
            <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
              <div className="pointer-events-auto hidden rounded-xl border border-[#D4DBD0] bg-white/95 px-3 py-2 text-xs text-[#3F4D44] shadow-sm backdrop-blur-xs sm:flex sm:items-center sm:gap-4">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <OctagonAlert className="h-3.5 w-3.5 text-[#B91C1C]" />
                  Bloqueado
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#B45309]" />
                  Atenção / 4x4
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" />
                  Liberado
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenReportModal}
                className="pointer-events-auto ml-auto inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#14532D] px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:bg-[#166534] active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
              >
                <Plus className="h-5 w-5" />
                Avisar Problema na Estrada
              </button>
            </div>
          </div>
        </div>

        {/* Road Status Feed (Right 5 cols on desktop, stacked below map on mobile) */}
        <div className="flex flex-col rounded-2xl border border-[#D9DFD4] bg-white lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[#E7ECE2] px-5 py-3.5">
            <h3 className="font-display text-base font-bold text-[#18241D]">
              Situação das Estradas Agora
            </h3>
            <span className="text-xs font-medium text-[#55635A] tabular-nums">
              {visibleIncidents.length} {visibleIncidents.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {visibleIncidents.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <CheckCircle2 className="h-9 w-9 text-[#15803D]" />
              <p className="mt-3 text-sm font-semibold text-[#18241D]">
                Nenhum bloqueio registrado com este filtro
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#55635A]">
                Se encontrar água na pista, queda de árvore ou barreira no caminho, toque em Avisar Problema na Estrada.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#EEF2EA] overflow-y-auto lg:max-h-[420px]">
              {visibleIncidents.map((incident) => {
                const statusColors =
                  incident.severity === SeverityLevel.Blocked
                    ? 'text-[#B91C1C]'
                    : incident.severity === SeverityLevel.Caution
                      ? 'text-[#B45309]'
                      : 'text-[#15803D]';

                return (
                  <li key={incident.id}>
                    <button
                      type="button"
                      onClick={() => onSelectIncident(incident)}
                      className="flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-[#F7F9F5] focus-visible:bg-[#F7F9F5] focus-visible:outline-none"
                    >
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E2E6DC] bg-[#EAF0E4]">
                        {incident.photoUrl ? (
                          <img
                            src={incident.photoUrl}
                            alt={incident.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#55635A]">
                            <Navigation className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${statusColors}`}>
                          {renderSeverityIcon(incident.severity)}
                          <span className="truncate">{getSeverityLabel(incident.severity)}</span>
                        </div>

                        <p className="mt-1 truncate text-sm font-bold text-[#18241D]">
                          {incident.title}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#55635A] tabular-nums">
                          <span>{incident.roadName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{getCategoryLabel(incident.category)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatRelativeTime(incident.updatedAt)}</span>
                        </div>

                        {incident.isOfflinePending && (
                          <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#B45309]">
                            <CloudOff className="h-3.5 w-3.5" />
                            Salvo no celular · Envia ao encontrar sinal
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
