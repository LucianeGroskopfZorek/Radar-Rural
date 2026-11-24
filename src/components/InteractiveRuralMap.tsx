import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  APIProvider,
  Circle,
  InfoWindow,
  Map as GoogleMapView,
  MapCameraChangedEvent,
  MapCameraProps,
  Pin,
  Polyline,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CloudOff,
  CloudRain,
  Compass,
  Crosshair,
  Eye,
  HeartPulse,
  Layers,
  MapPin,
  Minus,
  Navigation,
  OctagonAlert,
  PackageCheck,
  Plus,
  RotateCcw,
  Route,
  Waves,
  X,
} from 'lucide-react';
import {
  COMMUNITIES,
  THEMATIC_CORRIDORS,
  THEMATIC_RISK_ZONES,
  THEMATIC_SUPPORT_POINTS,
} from '../data/canoinhasData.ts';
import {
  CommunityInfo,
  MapThemeMode,
  RoadIncident,
  SeverityLevel,
  ThematicCorridor,
  ThematicLayerKey,
  ThematicRiskZone,
  ThematicSupportPoint,
} from '../types.ts';
import {
  formatRelativeTime,
  getCategoryLabel,
  getSeverityLabel,
} from '../utils/formatters.ts';
import { AchievementSymbols, CredibilityStars } from './CredibilityStars.tsx';

interface InteractiveRuralMapProps {
  selectedCommunity: CommunityInfo;
  onSelectCommunity?: (communityId: string) => void;
  showAllRegion: boolean;
  onToggleRegionScope: (showAll: boolean) => void;
  incidents: RoadIncident[];
  onSelectIncident: (incident: RoadIncident) => void;
  onOpenReportModal: () => void;
  isOnline: boolean;
  mapsApiKey: string;
  mapsQuotaExceeded: boolean;
}

type InspectedFeature =
  | { type: 'incident'; item: RoadIncident }
  | { type: 'corridor'; item: ThematicCorridor }
  | { type: 'risk'; item: ThematicRiskZone }
  | { type: 'support'; item: ThematicSupportPoint }
  | { type: 'community'; item: CommunityInfo };

const DEFAULT_SVG_BOX = { x: 0, y: 0, w: 1000, h: 580 };

interface GoogleIncidentMarkerProps {
  incident: RoadIncident;
  isActive: boolean;
  onFocus: (incident: RoadIncident | null) => void;
  onOpenDetail: (incident: RoadIncident) => void;
}

const GoogleIncidentMarker: React.FC<GoogleIncidentMarkerProps> = ({
  incident,
  isActive,
  onFocus,
  onOpenDetail,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const pinColors =
    incident.severity === SeverityLevel.Blocked
      ? { background: '#B91C1C', borderColor: '#7F1D1D', glyphText: '!' }
      : incident.severity === SeverityLevel.Caution
        ? { background: '#B45309', borderColor: '#78350F', glyphText: '▲' }
        : { background: '#15803D', borderColor: '#14532D', glyphText: '✓' };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: incident.lat, lng: incident.lng }}
        title={`${incident.title} — ${incident.roadName}`}
        zIndex={isActive ? 900 : 300}
        onClick={() => onFocus(isActive ? null : incident)}
      >
        <Pin
          background={pinColors.background}
          borderColor={pinColors.borderColor}
          glyphColor="#FFFFFF"
          glyphText={pinColors.glyphText}
          scale={isActive ? 1.28 : 1.08}
        />
      </AdvancedMarker>

      {isActive && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={275}
          onCloseClick={() => onFocus(null)}
        >
          <div className="space-y-1.5 p-1 text-[#141A16]">
            <p className="text-xs font-bold leading-snug">{incident.title}</p>
            <p className="text-[11px] text-[#525C54]">
              {incident.roadName} · {formatRelativeTime(incident.updatedAt)}
            </p>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold">{incident.authorName}</span>
              <CredibilityStars stars={incident.authorStars || 3} compact />
            </div>
            <p className="text-[11px] font-medium text-[#14532D] tabular-nums">
              {incident.confirmations} confirmações de moradores
            </p>
            <button
              type="button"
              onClick={() => onOpenDetail(incident)}
              className="mt-1 w-full rounded-full bg-[#14532D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#166534]"
            >
              Ver foto e validar aviso
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

interface GoogleSupportMarkerProps {
  point: ThematicSupportPoint;
  isActive: boolean;
  onFocus: (point: ThematicSupportPoint) => void;
}

const GoogleSupportMarker: React.FC<GoogleSupportMarkerProps> = ({
  point,
  isActive,
  onFocus,
}) => {
  return (
    <AdvancedMarker
      position={{ lat: point.lat, lng: point.lng }}
      title={point.name}
      zIndex={isActive ? 800 : 200}
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
      onClick={() => onFocus(point)}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-md transition-transform ${
          point.kind === 'saude' ? 'bg-[#0F766E]' : 'bg-[#4338CA]'
        } ${isActive ? 'scale-125 ring-2 ring-[#141A16]/40' : ''}`}
      >
        {point.kind === 'saude' ? '+' : 'C'}
      </div>
    </AdvancedMarker>
  );
};

function getCorridorStroke(kind: ThematicCorridor['kind'], theme: MapThemeMode): {
  color: string;
  weight: number;
  dashed: boolean;
} {
  if (kind === 'rodovia') {
    return {
      color: theme === 'rotas_essenciais' ? '#374151' : '#4B554E',
      weight: 6.5,
      dashed: false,
    };
  }
  if (kind === 'desvio_seguro') {
    return {
      color: '#15803D',
      weight: theme === 'trafego' || theme === 'rotas_essenciais' ? 5.5 : 4,
      dashed: true,
    };
  }
  if (kind === 'estrada_critica') {
    return {
      color: '#B91C1C',
      weight: theme === 'trafego' || theme === 'risco_chuva' ? 5.5 : 4,
      dashed: false,
    };
  }
  if (kind === 'linha_escolar') {
    return {
      color: theme === 'rotas_essenciais' ? '#0369A1' : '#B45309',
      weight: theme === 'rotas_essenciais' ? 5 : 4,
      dashed: theme === 'rotas_essenciais',
    };
  }
  return {
    color: theme === 'risco_chuva' ? '#92400E' : '#B45309',
    weight: 4,
    dashed: false,
  };
}

export const InteractiveRuralMap: React.FC<InteractiveRuralMapProps> = ({
  selectedCommunity,
  onSelectCommunity,
  showAllRegion,
  onToggleRegionScope,
  incidents,
  onSelectIncident,
  onOpenReportModal,
  isOnline,
  mapsApiKey,
  mapsQuotaExceeded,
}) => {
  const [themeMode, setThemeMode] = useState<MapThemeMode>('trafego');
  const [activeLayers, setActiveLayers] = useState<Record<ThematicLayerKey, boolean>>({
    ocorrencias: true,
    risco_alagamento: true,
    rotas_desvios: true,
    pontos_apoio: false,
  });
  const [severityFilter, setSeverityFilter] = useState<'todos' | SeverityLevel>('todos');
  const [directoryTab, setDirectoryTab] = useState<'ocorrencias' | 'rotas_apoio'>('ocorrencias');
  const [mapViewMode, setMapViewMode] = useState<'roadmap' | 'hybrid' | 'offline'>('roadmap');

  const [inspected, setInspected] = useState<InspectedFeature | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const mapViewportRef = useRef<HTMLDivElement | null>(null);

  // Offline SVG pan & zoom state
  const [svgBox, setSvgBox] = useState(DEFAULT_SVG_BOX);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startClientX: number;
    startClientY: number;
    startBox: typeof DEFAULT_SVG_BOX;
  }>({
    active: false,
    startClientX: 0,
    startClientY: 0,
    startBox: DEFAULT_SVG_BOX,
  });

  const canUseGoogleMaps = isOnline && Boolean(mapsApiKey) && !mapsQuotaExceeded;
  const activeGoogleMap = canUseGoogleMaps && mapViewMode !== 'offline';

  const [cameraProps, setCameraProps] = useState<MapCameraProps>({
    center: { lat: selectedCommunity.centerLat, lng: selectedCommunity.centerLng },
    zoom: 12,
  });

  const focusSvgCoordinates = useCallback((mapX: number, mapY: number, targetW = 460) => {
    const aspect = 580 / 1000;
    const w = Math.max(280, Math.min(1000, targetW));
    const h = w * aspect;
    const x = Math.max(0, Math.min(1000 - w, mapX - w / 2));
    const y = Math.max(0, Math.min(580 - h, mapY - h / 2));
    setSvgBox({ x, y, w, h });
  }, []);

  const resetMapViewport = useCallback(
    (forceOverview = false) => {
      if (showAllRegion || forceOverview) {
        setCameraProps({ center: { lat: -26.195, lng: -50.375 }, zoom: 11 });
        setSvgBox(DEFAULT_SVG_BOX);
      } else {
        setCameraProps({
          center: { lat: selectedCommunity.centerLat, lng: selectedCommunity.centerLng },
          zoom: 12,
        });
        focusSvgCoordinates(selectedCommunity.mapX, selectedCommunity.mapY, 560);
      }
    },
    [
      focusSvgCoordinates,
      selectedCommunity.centerLat,
      selectedCommunity.centerLng,
      selectedCommunity.mapX,
      selectedCommunity.mapY,
      showAllRegion,
    ]
  );

  useEffect(() => {
    resetMapViewport();
  }, [resetMapViewport]);

  const handleCameraChange = useCallback((ev: MapCameraChangedEvent) => {
    setCameraProps(ev.detail);
  }, []);

  const handleSelectTheme = (nextTheme: MapThemeMode) => {
    setThemeMode(nextTheme);
    if (nextTheme === 'trafego') {
      setActiveLayers({
        ocorrencias: true,
        risco_alagamento: false,
        rotas_desvios: true,
        pontos_apoio: false,
      });
    } else if (nextTheme === 'risco_chuva') {
      setActiveLayers({
        ocorrencias: true,
        risco_alagamento: true,
        rotas_desvios: false,
        pontos_apoio: false,
      });
    } else {
      setActiveLayers({
        ocorrencias: true,
        risco_alagamento: false,
        rotas_desvios: true,
        pontos_apoio: true,
      });
      setDirectoryTab('rotas_apoio');
    }
  };

  const toggleLayer = (layer: ThematicLayerKey) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const visibleIncidents = useMemo(() => {
    const byRegion = showAllRegion
      ? incidents
      : incidents.filter((inc) => inc.communityId === selectedCommunity.id);
    if (severityFilter === 'todos') return byRegion;
    return byRegion.filter((inc) => inc.severity === severityFilter);
  }, [incidents, selectedCommunity.id, severityFilter, showAllRegion]);

  const visibleCorridors = useMemo(() => {
    if (showAllRegion) return THEMATIC_CORRIDORS;
    return THEMATIC_CORRIDORS.filter(
      (c) => c.kind === 'rodovia' || c.communityIds.includes(selectedCommunity.id)
    );
  }, [selectedCommunity.id, showAllRegion]);

  const visibleRiskZones = useMemo(() => {
    if (showAllRegion) return THEMATIC_RISK_ZONES;
    return THEMATIC_RISK_ZONES.filter((z) => z.communityId === selectedCommunity.id);
  }, [selectedCommunity.id, showAllRegion]);

  const visibleSupportPoints = useMemo(() => {
    if (showAllRegion) return THEMATIC_SUPPORT_POINTS;
    return THEMATIC_SUPPORT_POINTS.filter((p) => p.communityId === selectedCommunity.id);
  }, [selectedCommunity.id, showAllRegion]);

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

  const flyToFeature = useCallback(
    (feature: InspectedFeature, scrollMapIntoView = false) => {
      setInspected(feature);
      if (feature.type === 'incident') {
        setCameraProps({ center: { lat: feature.item.lat, lng: feature.item.lng }, zoom: 14 });
        focusSvgCoordinates(feature.item.mapX, feature.item.mapY, 400);
      } else if (feature.type === 'corridor') {
        setCameraProps({
          center: { lat: feature.item.center.lat, lng: feature.item.center.lng },
          zoom: 13,
        });
        focusSvgCoordinates(feature.item.center.mapX, feature.item.center.mapY, 480);
      } else if (feature.type === 'risk') {
        setCameraProps({ center: { lat: feature.item.lat, lng: feature.item.lng }, zoom: 13 });
        focusSvgCoordinates(feature.item.mapX, feature.item.mapY, 440);
      } else if (feature.type === 'support') {
        setCameraProps({ center: { lat: feature.item.lat, lng: feature.item.lng }, zoom: 14 });
        focusSvgCoordinates(feature.item.mapX, feature.item.mapY, 400);
      } else {
        setCameraProps({
          center: { lat: feature.item.centerLat, lng: feature.item.centerLng },
          zoom: 13,
        });
        focusSvgCoordinates(feature.item.mapX, feature.item.mapY, 480);
      }

      if (scrollMapIntoView && mapViewportRef.current) {
        mapViewportRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [focusSvgCoordinates]
  );

  const handleZoomStep = (direction: 'in' | 'out') => {
    if (activeGoogleMap) {
      setCameraProps((prev) => ({
        ...prev,
        zoom: Math.max(9, Math.min(16, (prev.zoom ?? 12) + (direction === 'in' ? 1 : -1))),
      }));
    } else {
      setSvgBox((prev) => {
        const factor = direction === 'in' ? 0.75 : 1.32;
        const nextW = Math.max(260, Math.min(1000, prev.w * factor));
        const nextH = nextW * 0.58;
        const cx = prev.x + prev.w / 2;
        const cy = prev.y + prev.h / 2;
        return {
          x: Math.max(0, Math.min(1000 - nextW, cx - nextW / 2)),
          y: Math.max(0, Math.min(580 - nextH, cy - nextH / 2)),
          w: nextW,
          h: nextH,
        };
      });
    }
  };

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).closest('[data-map-interactive="true"]')) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startBox: svgBox,
    };
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStateRef.current.active || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dxPx = e.clientX - dragStateRef.current.startClientX;
    const dyPx = e.clientY - dragStateRef.current.startClientY;
    const scale = Math.max(
      dragStateRef.current.startBox.w / rect.width,
      dragStateRef.current.startBox.h / rect.height
    );
    const nextX = Math.max(
      0,
      Math.min(1000 - dragStateRef.current.startBox.w, dragStateRef.current.startBox.x - dxPx * scale)
    );
    const nextY = Math.max(
      0,
      Math.min(580 - dragStateRef.current.startBox.h, dragStateRef.current.startBox.y - dyPx * scale)
    );
    setSvgBox({ ...dragStateRef.current.startBox, x: nextX, y: nextY });
  };

  const handleSvgPointerUp = () => {
    dragStateRef.current.active = false;
  };

  const zoomPercent = Math.round((1000 / svgBox.w) * 100);

  const renderSeverityIcon = (severity: SeverityLevel) => {
    if (severity === SeverityLevel.Blocked) return <OctagonAlert className="h-3.5 w-3.5 shrink-0" />;
    if (severity === SeverityLevel.Caution) return <AlertTriangle className="h-3.5 w-3.5 shrink-0" />;
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
  };

  const activeIncidentFocusId = inspected?.type === 'incident' ? inspected.item.id : null;

  return (
    <section id="mapa-vivo" aria-labelledby="mapa-vivo-heading" className="space-y-5">
      {/* Spotlight Header + 3 Thematic Lens Modes */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2
            id="mapa-vivo-heading"
            className="font-display text-2xl font-bold tracking-tight text-[#141A16] sm:text-3xl"
          >
            Mapa Vivo Temático das Estradas
          </h2>
          <p className="mt-1 text-xs text-[#525C54] sm:text-sm">
            {showAllRegion
              ? 'Toda a região rural de Canoinhas · consulte bloqueios, alagamentos e desvios antes de sair'
              : `${selectedCommunity.name} · ${counts.bloqueado} bloqueio(s), ${counts.atencao} atenção e ${counts.liberado} liberado(s)`}
          </p>
        </div>

        <div
          className="inline-flex flex-wrap gap-1 rounded-2xl bg-black/[0.045] p-1"
          role="group"
          aria-label="Tema do mapa"
        >
          {(
            [
              { key: 'trafego', label: 'Condição das Estradas', icon: Route },
              { key: 'risco_chuva', label: 'Risco de Chuva e Rios', icon: CloudRain },
              { key: 'rotas_essenciais', label: 'Escolar, Saúde e Coleta', icon: HeartPulse },
            ] as const
          ).map((mode) => {
            const Icon = mode.icon;
            const active = themeMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => handleSelectTheme(mode.key)}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-[#525C54] hover:bg-white/80 hover:text-[#141A16]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* HERO PANORAMIC MAP STAGE (Full Width Spotlight) */}
      <div
        ref={mapViewportRef}
        className="relative flex flex-col overflow-hidden rounded-3xl bg-[#ECEEE8] shadow-[0_2px_6px_rgba(20,26,22,0.06),0_20px_50px_rgba(20,26,22,0.09)]"
      >
        {/* Top Unified Map & Layer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-black/8 bg-white/95 px-4 py-2.5 backdrop-blur-md sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 pr-1 text-xs font-semibold text-[#525C54]">
              <Layers className="h-3.5 w-3.5 text-[#14532D]" />
              <span className="hidden sm:inline">Camadas:</span>
            </span>

            {(
              [
                { key: 'ocorrencias', label: `Ocorrências (${counts.todos})` },
                { key: 'risco_alagamento', label: `Áreas de Risco (${visibleRiskZones.length})` },
                { key: 'rotas_desvios', label: `Rotas e Desvios (${visibleCorridors.length})` },
                { key: 'pontos_apoio', label: `Saúde e Coleta (${visibleSupportPoints.length})` },
              ] as const
            ).map((layer) => {
              const enabled = activeLayers[layer.key];
              return (
                <button
                  key={layer.key}
                  type="button"
                  onClick={() => toggleLayer(layer.key)}
                  aria-pressed={enabled}
                  className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                    enabled
                      ? 'border-[#14532D]/30 bg-[#14532D]/10 text-[#14532D]'
                      : 'border-black/10 bg-white text-[#525C54] hover:bg-black/[0.03]'
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                      enabled ? 'bg-[#14532D] text-white' : 'bg-black/10 text-transparent'
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {layer.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleRegionScope(!showAllRegion)}
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#141A16] transition-colors hover:bg-black/[0.03] whitespace-nowrap shrink-0"
            >
              <Eye className="h-3.5 w-3.5 text-[#14532D]" />
              {showAllRegion ? `Focar ${selectedCommunity.name}` : 'Toda Canoinhas'}
            </button>

            {canUseGoogleMaps && (
              <div className="inline-flex rounded-full bg-black/[0.05] p-0.5">
                <button
                  type="button"
                  onClick={() => setMapViewMode('roadmap')}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                    mapViewMode === 'roadmap'
                      ? 'bg-white text-[#14532D] shadow-xs'
                      : 'text-[#525C54] hover:text-[#141A16]'
                  }`}
                >
                  Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setMapViewMode('hybrid')}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                    mapViewMode === 'hybrid'
                      ? 'bg-white text-[#14532D] shadow-xs'
                      : 'text-[#525C54] hover:text-[#141A16]'
                  }`}
                >
                  Satélite
                </button>
                <button
                  type="button"
                  onClick={() => setMapViewMode('offline')}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                    mapViewMode === 'offline'
                      ? 'bg-white text-[#14532D] shadow-xs'
                      : 'text-[#525C54] hover:text-[#141A16]'
                  }`}
                >
                  Temático
                </button>
              </div>
            )}

            <div className="inline-flex items-center rounded-full bg-black/[0.05] p-0.5">
              <button
                type="button"
                onClick={() => handleZoomStep('in')}
                aria-label="Aumentar zoom"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#141A16] hover:bg-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleZoomStep('out')}
                aria-label="Diminuir zoom"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#141A16] hover:bg-white"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setInspected(null);
                  resetMapViewport(true);
                }}
                aria-label="Resetar visão do mapa"
                title="Visão completa da região"
                className="flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-[#141A16] hover:bg-white"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Geral</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panoramic Interactive Map Viewport */}
        <div className="relative h-[430px] w-full sm:h-[520px] lg:h-[600px]">
          {activeGoogleMap ? (
            <APIProvider
              apiKey={mapsApiKey}
              language="pt-BR"
              region="BR"
              libraries={['marker']}
            >
              <GoogleMapView
                {...cameraProps}
                mapId="DEMO_MAP_ID"
                mapTypeId={mapViewMode === 'hybrid' ? 'hybrid' : 'roadmap'}
                onCameraChanged={handleCameraChange}
                gestureHandling="greedy"
                disableDefaultUI={false}
                streetViewControl={false}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {/* Thematic Risk Zones */}
                {activeLayers.risco_alagamento &&
                  visibleRiskZones.map((zone) => {
                    const isHigh = zone.riskLevel === 'alto';
                    return (
                      <Circle
                        key={zone.id}
                        center={{ lat: zone.lat, lng: zone.lng }}
                        radius={zone.radiusMeters}
                        strokeColor={isHigh ? '#B91C1C' : '#B45309'}
                        strokeOpacity={0.75}
                        strokeWeight={inspected?.type === 'risk' && inspected.item.id === zone.id ? 3 : 1.5}
                        fillColor={isHigh ? '#EF4444' : '#F59E0B'}
                        fillOpacity={themeMode === 'risco_chuva' ? 0.24 : 0.14}
                        onClick={() => flyToFeature({ type: 'risk', item: zone })}
                      />
                    );
                  })}

                {/* Thematic Corridors */}
                {activeLayers.rotas_desvios &&
                  visibleCorridors.map((corridor) => {
                    const style = getCorridorStroke(corridor.kind, themeMode);
                    const isSelected =
                      inspected?.type === 'corridor' && inspected.item.id === corridor.id;
                    return (
                      <Polyline
                        key={corridor.id}
                        path={corridor.pathLatLng}
                        strokeColor={style.color}
                        strokeOpacity={isSelected ? 1 : 0.84}
                        strokeWeight={isSelected ? style.weight + 3 : style.weight}
                        onClick={() => flyToFeature({ type: 'corridor', item: corridor })}
                      />
                    );
                  })}

                {/* Community Hubs */}
                {(showAllRegion || themeMode === 'risco_chuva') &&
                  COMMUNITIES.map((community) => {
                    const isSelected = community.id === selectedCommunity.id;
                    return (
                      <AdvancedMarker
                        key={community.id}
                        position={{ lat: community.centerLat, lng: community.centerLng }}
                        title={`${community.name} (${community.weatherAlert.rainLast3hMm} mm)`}
                        anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
                        zIndex={isSelected ? 450 : 180}
                        onClick={() => flyToFeature({ type: 'community', item: community })}
                      >
                        <div
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-sm transition-transform ${
                            isSelected
                              ? 'border-white bg-[#14532D] text-white'
                              : 'border-black/15 bg-white/95 text-[#141A16]'
                          }`}
                        >
                          {community.name}
                          {themeMode === 'risco_chuva'
                            ? ` · ${community.weatherAlert.rainLast3hMm}mm`
                            : ''}
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                {/* Support Points */}
                {activeLayers.pontos_apoio &&
                  visibleSupportPoints.map((point) => (
                    <GoogleSupportMarker
                      key={point.id}
                      point={point}
                      isActive={inspected?.type === 'support' && inspected.item.id === point.id}
                      onFocus={(p) => flyToFeature({ type: 'support', item: p })}
                    />
                  ))}

                {/* Road Incidents */}
                {activeLayers.ocorrencias &&
                  visibleIncidents.map((incident) => (
                    <GoogleIncidentMarker
                      key={incident.id}
                      incident={incident}
                      isActive={activeIncidentFocusId === incident.id}
                      onFocus={(inc) =>
                        inc
                          ? flyToFeature({ type: 'incident', item: inc })
                          : setInspected(null)
                      }
                      onOpenDetail={onSelectIncident}
                    />
                  ))}
              </GoogleMapView>
            </APIProvider>
          ) : (
            /* Panoramic Interactive Thematic SVG Cartography */
            <svg
              ref={svgRef}
              viewBox={`${svgBox.x} ${svgBox.y} ${svgBox.w} ${svgBox.h}`}
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
              onPointerCancel={handleSvgPointerUp}
              className="h-full w-full cursor-grab select-none bg-[#ECEFE8] active:cursor-grabbing touch-none"
              role="img"
              aria-label="Mapa temático interativo em destaque das estradas rurais e rios de Canoinhas"
            >
              <defs>
                <filter id="pin-shadow" x="-35%" y="-35%" width="170%" height="170%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#141A16" floodOpacity="0.22" />
                </filter>
                <pattern id="carto-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path
                    d="M 100 0 L 0 0 0 100"
                    fill="none"
                    stroke="#DCE2D5"
                    strokeWidth="0.8"
                  />
                </pattern>
              </defs>

              {/* Edge-to-edge extended Cartographic Coordinate Grid */}
              <rect x="-600" y="-400" width="2200" height="1400" fill="url(#carto-grid)" />

              {/* Topographic Elevations */}
              <path
                d="M -300 135 Q 190 50, 350 125 T 680 110 T 1300 165 L 1300 -300 L -300 -300 Z"
                fill="#E1E6DA"
                fillOpacity="0.7"
              />
              <path
                d="M -200 580 Q 280 475, 470 520 T 800 490 T 1300 545 L 1300 900 L -200 900 Z"
                fill="#E1E6DA"
                fillOpacity="0.7"
              />
              <path
                d="M -200 245 Q 240 205, 420 260 T 810 235 T 1200 280"
                fill="none"
                stroke="#D3DBCA"
                strokeWidth="1.2"
              />
              <path
                d="M -200 420 Q 220 385, 460 440 T 920 390 T 1200 420"
                fill="none"
                stroke="#D3DBCA"
                strokeWidth="1.2"
              />

              {/* Rivers */}
              <g
                fill="none"
                stroke={themeMode === 'risco_chuva' ? '#3B82F6' : '#9AC4E0'}
                strokeLinecap="round"
                opacity={themeMode === 'risco_chuva' ? 0.85 : 0.9}
              >
                <path
                  d="M -100 145 Q 190 95, 340 140 T 660 105 T 1120 135"
                  strokeWidth={themeMode === 'risco_chuva' ? 11 : 8}
                />
                <path
                  d="M 180 620 Q 250 430, 390 360 T 520 245 T 640 112"
                  strokeWidth={themeMode === 'risco_chuva' ? 9 : 6}
                />
                <path
                  d="M 605 620 Q 625 445, 650 350 T 710 220 T 765 118"
                  strokeWidth={themeMode === 'risco_chuva' ? 8 : 5.5}
                />
              </g>

              <text x="805" y="96" fontSize="10.5" fill="#3B6B8C" fontWeight="600">
                Rio Iguaçu
              </text>
              <text x="530" y="458" fontSize="10.5" fill="#3B6B8C" fontWeight="600">
                Rio dos Poços
              </text>

              {/* Layer 1: Hydrological Risk Zones */}
              {activeLayers.risco_alagamento &&
                visibleRiskZones.map((zone) => {
                  const isHigh = zone.riskLevel === 'alto';
                  const isSelected = inspected?.type === 'risk' && inspected.item.id === zone.id;
                  const isHovered = hoveredId === zone.id;
                  return (
                    <g
                      key={zone.id}
                      data-map-interactive="true"
                      onClick={() => flyToFeature({ type: 'risk', item: zone })}
                      onMouseEnter={() => setHoveredId(zone.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`Área de risco ${zone.name}, ${zone.rain3hMm} mm`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          flyToFeature({ type: 'risk', item: zone });
                        }
                      }}
                    >
                      <circle
                        cx={zone.mapX}
                        cy={zone.mapY}
                        r={isSelected || isHovered ? zone.svgRadius + 4 : zone.svgRadius}
                        fill={isHigh ? '#EF4444' : '#F59E0B'}
                        fillOpacity={themeMode === 'risco_chuva' ? 0.22 : 0.12}
                        stroke={isHigh ? '#B91C1C' : '#B45309'}
                        strokeWidth={isSelected ? 2.4 : 1.4}
                        strokeDasharray="5 4"
                      />
                      {themeMode === 'risco_chuva' && (
                        <g transform={`translate(${zone.mapX}, ${zone.mapY - zone.svgRadius + 10})`}>
                          <rect
                            x="-24"
                            y="-9"
                            width="48"
                            height="18"
                            rx="9"
                            fill={isHigh ? '#991B1B' : '#92400E'}
                          />
                          <text
                            y="3"
                            textAnchor="middle"
                            fontSize="9.5"
                            fontWeight="700"
                            fill="#FFFFFF"
                          >
                            {zone.rain3hMm} mm
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

              {/* Layer 2: Thematic Road Corridors & Detours */}
              {activeLayers.rotas_desvios &&
                visibleCorridors.map((corridor) => {
                  const style = getCorridorStroke(corridor.kind, themeMode);
                  const isSelected =
                    inspected?.type === 'corridor' && inspected.item.id === corridor.id;
                  const isHovered = hoveredId === corridor.id;
                  return (
                    <g
                      key={corridor.id}
                      data-map-interactive="true"
                      onClick={() => flyToFeature({ type: 'corridor', item: corridor })}
                      onMouseEnter={() => setHoveredId(corridor.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`Corredor ${corridor.name}: ${corridor.statusLabel}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          flyToFeature({ type: 'corridor', item: corridor });
                        }
                      }}
                    >
                      <path
                        d={corridor.svgPath}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="18"
                        strokeLinecap="round"
                      />
                      {(isSelected || isHovered) && (
                        <path
                          d={corridor.svgPath}
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth={style.weight + 5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={0.9}
                        />
                      )}
                      <path
                        d={corridor.svgPath}
                        fill="none"
                        stroke={style.color}
                        strokeWidth={isSelected || isHovered ? style.weight + 2 : style.weight}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={style.dashed ? '9 7' : undefined}
                      />
                      {corridor.kind === 'rodovia' && (
                        <path
                          d={corridor.svgPath}
                          fill="none"
                          stroke="#F7F6F2"
                          strokeWidth="1.2"
                          strokeDasharray="10 8"
                        />
                      )}
                    </g>
                  );
                })}

              {/* Canoinhas City Hub */}
              <g transform="translate(478, 290)">
                <rect x="-36" y="-12" width="72" height="22" rx="11" fill="#141A16" />
                <text y="3" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FFFFFF">
                  Canoinhas
                </text>
              </g>

              {/* Community Hubs */}
              {COMMUNITIES.map((community) => {
                const isSelected = community.id === selectedCommunity.id;
                const isInspected =
                  inspected?.type === 'community' && inspected.item.id === community.id;
                return (
                  <g
                    key={community.id}
                    data-map-interactive="true"
                    transform={`translate(${community.mapX}, ${community.mapY})`}
                    onClick={() => flyToFeature({ type: 'community', item: community })}
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label={`Comunidade ${community.name}, chuva ${community.weatherAlert.rainLast3hMm} mm`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        flyToFeature({ type: 'community', item: community });
                      }
                    }}
                  >
                    {(isSelected || isInspected) && (
                      <circle
                        r="22"
                        fill="#14532D"
                        fillOpacity="0.1"
                        stroke="#14532D"
                        strokeWidth="1.4"
                        strokeDasharray="4 3"
                      />
                    )}
                    <circle
                      r={isSelected ? 6.5 : 5}
                      fill={isSelected ? '#14532D' : '#4E5951'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      y={isSelected ? -14 : -11}
                      textAnchor="middle"
                      fontSize={isSelected ? '12.5' : '10.5'}
                      fontWeight={isSelected ? '700' : '600'}
                      fill={isSelected ? '#14532D' : '#2D3730'}
                      style={{ paintOrder: 'stroke', stroke: '#ECEFE8', strokeWidth: '4.5px' }}
                    >
                      {community.name}
                      {themeMode === 'risco_chuva' ? ` (${community.weatherAlert.rainLast3hMm}mm)` : ''}
                    </text>
                  </g>
                );
              })}

              {/* Layer 3: Rural Support Points */}
              {activeLayers.pontos_apoio &&
                visibleSupportPoints.map((point) => {
                  const isSelected =
                    inspected?.type === 'support' && inspected.item.id === point.id;
                  const bgColor = point.kind === 'saude' ? '#0F766E' : '#4338CA';
                  return (
                    <g
                      key={point.id}
                      data-map-interactive="true"
                      transform={`translate(${point.mapX}, ${point.mapY})`}
                      onClick={() => flyToFeature({ type: 'support', item: point })}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`${point.name}: ${point.scheduleSummary}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          flyToFeature({ type: 'support', item: point });
                        }
                      }}
                    >
                      {isSelected && (
                        <circle r="17" fill={bgColor} fillOpacity="0.2" stroke={bgColor} strokeWidth="1.5" />
                      )}
                      <rect
                        x="-10"
                        y="-10"
                        width="20"
                        height="20"
                        rx="6"
                        fill={bgColor}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        filter="url(#pin-shadow)"
                      />
                      <text
                        y="4"
                        textAnchor="middle"
                        fontSize="11.5"
                        fontWeight="800"
                        fill="#FFFFFF"
                      >
                        {point.kind === 'saude' ? '+' : 'C'}
                      </text>
                    </g>
                  );
                })}

              {/* Layer 4: Road Incident Pins */}
              {activeLayers.ocorrencias &&
                visibleIncidents.map((incident) => {
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
                  const isFocused = activeIncidentFocusId === incident.id;
                  const isHovered = hoveredId === incident.id;

                  return (
                    <g
                      key={incident.id}
                      data-map-interactive="true"
                      transform={`translate(${incident.mapX}, ${incident.mapY})`}
                      onClick={() => flyToFeature({ type: 'incident', item: incident })}
                      onMouseEnter={() => setHoveredId(incident.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`${incident.title} em ${incident.roadName}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          flyToFeature({ type: 'incident', item: incident });
                        }
                      }}
                    >
                      {isFocused && (
                        <circle
                          r="23"
                          fill={pinColor}
                          fillOpacity="0.18"
                          stroke={pinColor}
                          strokeWidth="2"
                        />
                      )}
                      {incident.isOfflinePending && (
                        <circle
                          r="20"
                          fill="none"
                          stroke="#141A16"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                      )}
                      <circle
                        r={isFocused || isHovered ? 17 : 14.5}
                        fill={pinColor}
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        filter="url(#pin-shadow)"
                      />
                      <text
                        y="4.5"
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="700"
                        fill="#FFFFFF"
                      >
                        {pinSymbol}
                      </text>
                      <text
                        y="29"
                        textAnchor="middle"
                        fontSize="10.5"
                        fontWeight="700"
                        fill="#141A16"
                        style={{ paintOrder: 'stroke', stroke: '#FFFFFF', strokeWidth: '4px' }}
                      >
                        {incident.roadName.length > 22
                          ? `${incident.roadName.slice(0, 21)}…`
                          : incident.roadName}
                      </text>
                    </g>
                  );
                })}
            </svg>
          )}

          {/* Subtle Top-Right Mode Status Pill in Offline Cartography */}
          {!activeGoogleMap && (
            <div className="pointer-events-none absolute top-3 right-3 hidden items-center gap-1.5 rounded-full border border-black/8 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#525C54] shadow-xs backdrop-blur-md sm:inline-flex">
              <Compass className="h-3.5 w-3.5 text-[#14532D]" />
              <span>Cartografia Offline · {zoomPercent}% · arraste para explorar</span>
            </div>
          )}

          {/* Floating Thematic Inspector Overlay */}
          {inspected && (
            <div className="pointer-events-auto absolute top-3 left-3 right-3 z-20 max-w-sm rounded-2xl border border-black/10 bg-white/95 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {inspected.type === 'incident' && (
                    <>
                      <p className="text-[11px] font-semibold text-[#525C54]">
                        {getSeverityLabel(inspected.item.severity)} · {inspected.item.communityName}
                      </p>
                      <h4 className="mt-0.5 font-display text-sm font-bold text-[#141A16]">
                        {inspected.item.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-[#465249] line-clamp-2">
                        {inspected.item.description}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectIncident(inspected.item)}
                          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#14532D] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#166534]"
                        >
                          Ver foto e validar (+5 pts)
                        </button>
                        <span className="text-[11px] font-medium text-[#525C54] tabular-nums">
                          {inspected.item.confirmations} validações
                        </span>
                      </div>
                    </>
                  )}

                  {inspected.type === 'corridor' && (
                    <>
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#14532D]">
                        <Route className="h-3.5 w-3.5" />
                        Corredor viário · {inspected.item.statusLabel}
                      </p>
                      <h4 className="mt-0.5 font-display text-sm font-bold text-[#141A16]">
                        {inspected.item.name}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-[#465249]">
                        {inspected.item.guidance}
                      </p>
                    </>
                  )}

                  {inspected.type === 'risk' && (
                    <>
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#B91C1C] tabular-nums">
                        <Waves className="h-3.5 w-3.5" />
                        Risco {inspected.item.riskLevel} · Chuva 3h: {inspected.item.rain3hMm} mm
                      </p>
                      <h4 className="mt-0.5 font-display text-sm font-bold text-[#141A16]">
                        {inspected.item.name} ({inspected.item.communityName})
                      </h4>
                      <p className="mt-1 text-xs font-medium text-[#141A16]">
                        {inspected.item.riverNote}
                      </p>
                      <p className="mt-0.5 text-xs text-[#525C54]">{inspected.item.guidance}</p>
                    </>
                  )}

                  {inspected.type === 'support' && (
                    <>
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F766E]">
                        {inspected.item.kind === 'saude' ? (
                          <HeartPulse className="h-3.5 w-3.5" />
                        ) : (
                          <PackageCheck className="h-3.5 w-3.5" />
                        )}
                        {inspected.item.kind === 'saude' ? 'Ponto de Saúde Rural' : 'Ponto de Coleta e Apoio'} ·{' '}
                        {inspected.item.communityName}
                      </p>
                      <h4 className="mt-0.5 font-display text-sm font-bold text-[#141A16]">
                        {inspected.item.name}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-[#465249]">
                        {inspected.item.scheduleSummary}
                      </p>
                    </>
                  )}

                  {inspected.type === 'community' && (
                    <>
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#14532D] tabular-nums">
                        <MapPin className="h-3.5 w-3.5" />
                        {inspected.item.distanceFromCenterKm} km de Canoinhas · Chuva 3h:{' '}
                        {inspected.item.weatherAlert.rainLast3hMm} mm
                      </p>
                      <h4 className="mt-0.5 font-display text-sm font-bold text-[#141A16]">
                        {inspected.item.name}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-[#465249]">
                        {inspected.item.weatherAlert.riverStatus}
                      </p>
                      {onSelectCommunity && inspected.item.id !== selectedCommunity.id && (
                        <button
                          type="button"
                          onClick={() => onSelectCommunity(inspected.item.id)}
                          className="mt-2.5 inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#14532D] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#166534]"
                        >
                          Selecionar {inspected.item.name}
                        </button>
                      )}
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setInspected(null)}
                  aria-label="Fechar inspetor do mapa"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#525C54] hover:bg-black/[0.05]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Floating Legend & Primary Map CTA */}
          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-3">
            <div className="pointer-events-auto hidden rounded-full border border-black/8 bg-white/94 px-4 py-2 text-xs text-[#3F4A42] shadow-sm backdrop-blur-md sm:flex sm:items-center sm:gap-4">
              {themeMode === 'trafego' && (
                <>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <OctagonAlert className="h-3.5 w-3.5 text-[#B91C1C]" />
                    Bloqueio
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#B45309]" />
                    Atenção
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" />
                    Desvio / Livre
                  </span>
                </>
              )}

              {themeMode === 'risco_chuva' && (
                <>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="h-3 w-3 rounded-full border border-[#B91C1C] bg-[#EF4444]/35" />
                    Várzea / Risco alto
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="h-3 w-3 rounded-full border border-[#B45309] bg-[#F59E0B]/35" />
                    Alagamento moderado
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Waves className="h-3.5 w-3.5 text-[#2563EB]" />
                    Rios e córregos
                  </span>
                </>
              )}

              {themeMode === 'rotas_essenciais' && (
                <>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-4 rounded-full bg-[#0369A1]" />
                    Linha escolar
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#0F766E] text-[10px] font-bold text-white">
                      +
                    </span>
                    Saúde
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#4338CA] text-[10px] font-bold text-white">
                      C
                    </span>
                    Coleta / Apoio
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenReportModal}
              className="pointer-events-auto ml-auto inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform duration-150 hover:bg-[#166534] active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
            >
              <Plus className="h-4 w-4" />
              Avisar Problema na Estrada
            </button>
          </div>
        </div>
      </div>

      {/* Synchronized Horizontal Directory Strip Below the Spotlight Map */}
      <div className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(20,26,22,0.04),0_8px_24px_rgba(20,26,22,0.03)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 pb-4">
          <div className="inline-flex rounded-xl bg-black/[0.04] p-1">
            <button
              type="button"
              onClick={() => setDirectoryTab('ocorrencias')}
              className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap tabular-nums ${
                directoryTab === 'ocorrencias'
                  ? 'bg-white text-[#141A16] shadow-xs'
                  : 'text-[#525C54] hover:text-[#141A16]'
              }`}
            >
              Ocorrências na Estrada ({visibleIncidents.length})
            </button>
            <button
              type="button"
              onClick={() => setDirectoryTab('rotas_apoio')}
              className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap tabular-nums ${
                directoryTab === 'rotas_apoio'
                  ? 'bg-white text-[#141A16] shadow-xs'
                  : 'text-[#525C54] hover:text-[#141A16]'
              }`}
            >
              Rotas, Riscos e Pontos ({visibleCorridors.length + visibleRiskZones.length})
            </button>
          </div>

          {directoryTab === 'ocorrencias' && (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtro de gravidade">
              {(
                [
                  { key: 'todos', label: `Todos (${counts.todos})` },
                  { key: SeverityLevel.Blocked, label: `Bloqueios (${counts.bloqueado})` },
                  { key: SeverityLevel.Caution, label: `Atenção (${counts.atencao})` },
                  { key: SeverityLevel.Cleared, label: `Livres (${counts.liberado})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSeverityFilter(tab.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                    severityFilter === tab.key
                      ? 'bg-[#14532D]/12 text-[#14532D]'
                      : 'text-[#525C54] hover:bg-black/[0.04]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {directoryTab === 'ocorrencias' ? (
          visibleIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-[#15803D]" />
              <p className="mt-3 text-sm font-semibold text-[#141A16]">
                Nenhum bloqueio com este filtro
              </p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#525C54]">
                Se encontrar água na pista, queda de árvore ou barreira, toque em Avisar Problema na Estrada.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleIncidents.map((incident) => {
                const statusColors =
                  incident.severity === SeverityLevel.Blocked
                    ? 'text-[#B91C1C]'
                    : incident.severity === SeverityLevel.Caution
                      ? 'text-[#B45309]'
                      : 'text-[#15803D]';
                const isFocused = activeIncidentFocusId === incident.id;

                return (
                  <article
                    key={incident.id}
                    className={`flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
                      isFocused
                        ? 'border-[#14532D]/35 bg-[#14532D]/[0.03]'
                        : 'border-black/6 bg-[#F7F6F2]/70 hover:bg-[#F7F6F2]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => flyToFeature({ type: 'incident', item: incident }, true)}
                        className="group relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[#ECEEE8] focus-visible:outline-2 focus-visible:outline-[#14532D]"
                        title="Focar no mapa"
                      >
                        {incident.photoUrl ? (
                          <img
                            src={incident.photoUrl}
                            alt={incident.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#525C54]">
                            <Navigation className="h-5 w-5" />
                          </div>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${statusColors}`}>
                          {renderSeverityIcon(incident.severity)}
                          <span className="truncate">{getSeverityLabel(incident.severity)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => flyToFeature({ type: 'incident', item: incident }, true)}
                          className="mt-0.5 block w-full truncate text-left text-sm font-bold text-[#141A16] hover:text-[#14532D]"
                        >
                          {incident.title}
                        </button>

                        <p className="mt-1 truncate text-xs text-[#525C54] tabular-nums">
                          {incident.roadName} · {getCategoryLabel(incident.category)} ·{' '}
                          {formatRelativeTime(incident.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/6 pt-3 text-xs text-[#525C54] tabular-nums">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-[#141A16]">{incident.authorName}</span>
                        <CredibilityStars stars={incident.authorStars || 3} compact />
                        <AchievementSymbols achievements={incident.authorAchievements} />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => flyToFeature({ type: 'incident', item: incident }, true)}
                          className="inline-flex min-h-[30px] items-center gap-1 text-[11px] font-semibold text-[#525C54] hover:text-[#141A16]"
                        >
                          <Crosshair className="h-3 w-3" />
                          Focar
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectIncident(incident)}
                          className="min-h-[30px] rounded-full bg-[#14532D]/10 px-3 py-1 text-[11px] font-semibold text-[#14532D] hover:bg-[#14532D]/16"
                        >
                          Validar ({incident.confirmations})
                        </button>
                      </div>
                    </div>

                    {incident.isOfflinePending && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#B45309]">
                        <CloudOff className="h-3.5 w-3.5" />
                        Salvo no celular · Envia ao encontrar sinal
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Corridors */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-[#525C54]">
                Corredores e Desvios ({visibleCorridors.length})
              </p>
              <div className="space-y-2">
                {visibleCorridors.map((corridor) => {
                  const isSelected =
                    inspected?.type === 'corridor' && inspected.item.id === corridor.id;
                  return (
                    <button
                      key={corridor.id}
                      type="button"
                      onClick={() => {
                        setActiveLayers((prev) => ({ ...prev, rotas_desvios: true }));
                        flyToFeature({ type: 'corridor', item: corridor }, true);
                      }}
                      className={`flex w-full items-start justify-between gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-[#14532D]/10 text-[#141A16]'
                          : 'bg-[#F7F6F2] hover:bg-[#EFECE4]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#141A16]">{corridor.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#525C54]">{corridor.statusLabel}</p>
                      </div>
                      <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#14532D]" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Risk Zones */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-[#525C54]">
                Zonas Hidrológicas e Chuva ({visibleRiskZones.length})
              </p>
              <div className="space-y-2">
                {visibleRiskZones.map((zone) => {
                  const isSelected = inspected?.type === 'risk' && inspected.item.id === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => {
                        setActiveLayers((prev) => ({ ...prev, risco_alagamento: true }));
                        flyToFeature({ type: 'risk', item: zone }, true);
                      }}
                      className={`flex w-full items-start justify-between gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-[#B91C1C]/10 text-[#141A16]'
                          : 'bg-[#F7F6F2] hover:bg-[#EFECE4]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#141A16]">
                          {zone.name} · {zone.rain3hMm} mm
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#525C54]">{zone.riverNote}</p>
                      </div>
                      <Waves className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B91C1C]" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Support Points */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-[#525C54]">
                Pontos de Saúde e Coleta ({visibleSupportPoints.length})
              </p>
              <div className="space-y-2">
                {visibleSupportPoints.map((point) => {
                  const isSelected =
                    inspected?.type === 'support' && inspected.item.id === point.id;
                  return (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => {
                        setActiveLayers((prev) => ({ ...prev, pontos_apoio: true }));
                        flyToFeature({ type: 'support', item: point }, true);
                      }}
                      className={`flex w-full items-start justify-between gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-[#0F766E]/10 text-[#141A16]'
                          : 'bg-[#F7F6F2] hover:bg-[#EFECE4]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#141A16]">{point.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#525C54]">{point.scheduleSummary}</p>
                      </div>
                      {point.kind === 'saude' ? (
                        <HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
                      ) : (
                        <PackageCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4338CA]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
