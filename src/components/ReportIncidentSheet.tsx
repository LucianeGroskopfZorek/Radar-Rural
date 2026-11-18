import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CloudOff,
  Droplets,
  MapPin,
  Mountain,
  OctagonAlert,
  Send,
  Trees,
  X,
} from 'lucide-react';
import { COMMUNITIES } from '../data/canoinhasData.ts';
import {
  CommunityInfo,
  IncidentCategory,
  RoadIncident,
  SeverityLevel,
  SolutionStage,
} from '../types.ts';
import { compressImageFile } from '../utils/formatters.ts';

interface ReportIncidentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCommunity: CommunityInfo;
  isOnline: boolean;
  onSubmitIncident: (incident: RoadIncident) => Promise<void>;
}

const AUTHOR_STORAGE_KEY = 'radar_rural_author_name';

export const ReportIncidentSheet: React.FC<ReportIncidentSheetProps> = ({
  isOpen,
  onClose,
  selectedCommunity,
  isOnline,
  onSubmitIncident,
}) => {
  const [communityId, setCommunityId] = useState(selectedCommunity.id);
  const [category, setCategory] = useState<IncidentCategory>(IncidentCategory.Flood);
  const [severity, setSeverity] = useState<SeverityLevel>(SeverityLevel.Blocked);
  const [roadName, setRoadName] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState(() => {
    try {
      return localStorage.getItem(AUTHOR_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [notifyNeighbors, setNotifyNeighbors] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number; source: 'gps' | 'comunidade' }>({
    lat: selectedCommunity.centerLat,
    lng: selectedCommunity.centerLng,
    source: 'comunidade',
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setCommunityId(selectedCommunity.id);
    setCoords({
      lat: selectedCommunity.centerLat,
      lng: selectedCommunity.centerLng,
      source: 'comunidade',
    });

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: Number(position.coords.latitude.toFixed(5)),
            lng: Number(position.coords.longitude.toFixed(5)),
            source: 'gps',
          });
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 4500, maximumAge: 60000 }
      );
    }
  }, [isOpen, selectedCommunity]);

  if (!isOpen) return null;

  const activeCommunity = COMMUNITIES.find((c) => c.id === communityId) || selectedCommunity;

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    try {
      const compressed = await compressImageFile(file);
      setPhotoPreview(compressed);
    } catch {
      setPhotoError('Não foi possível processar a foto selecionada.');
    }
  };

  const handleUseDemoPhoto = () => {
    if (category === IncidentCategory.Flood) {
      setPhotoPreview('/src/assets/images/road_flood_bridge_1795044560692.jpg');
    } else {
      setPhotoPreview('/src/assets/images/road_fallen_tree_1795044560805.jpg');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const cleanAuthor = authorName.trim() || 'Morador da comunidade';
    try {
      localStorage.setItem(AUTHOR_STORAGE_KEY, cleanAuthor);
    } catch {
      // ignore storage errors
    }

    const defaultTitle =
      category === IncidentCategory.Flood
        ? severity === SeverityLevel.Blocked
          ? 'Ponte ou trecho alagado'
          : 'Água cobrindo parte da pista'
        : category === IncidentCategory.Tree
          ? severity === SeverityLevel.Blocked
            ? 'Árvore fechando toda a estrada'
            : 'Queda de árvore em meia pista'
          : severity === SeverityLevel.Blocked
            ? 'Barreira / buraco interditando passagem'
            : 'Lama pesada · só 4x4 ou trator';

    const newIncident: RoadIncident = {
      id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      communityId: activeCommunity.id,
      communityName: activeCommunity.name,
      roadName: roadName.trim() || `Estrada Geral de ${activeCommunity.name}`,
      title: defaultTitle,
      description:
        description.trim() ||
        `${defaultTitle} registrado próximo a ${activeCommunity.name}. Atenção aos motoristas e transporte escolar.`,
      category,
      severity,
      solutionStage: notifyNeighbors ? SolutionStage.NeighborsNotified : SolutionStage.Reported,
      photoUrl:
        photoPreview ||
        (category === IncidentCategory.Flood
          ? '/src/assets/images/road_flood_bridge_1795044560692.jpg'
          : '/src/assets/images/road_fallen_tree_1795044560805.jpg'),
      lat: coords.lat,
      lng: coords.lng,
      mapX: activeCommunity.mapX,
      mapY: activeCommunity.mapY,
      authorName: cleanAuthor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmations: 1,
      notifyNeighbors,
      isOfflinePending: !isOnline,
    };

    try {
      await onSubmitIncident(newIncident);
      setRoadName('');
      setDescription('');
      setPhotoPreview('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-incident-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#D9DFD4] bg-white shadow-2xl sm:rounded-2xl">
        {/* Grab handle on mobile */}
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#D4DBD0] sm:hidden" />

        <div className="flex items-center justify-between border-b border-[#E7ECE2] px-5 py-4">
          <div>
            <h2 id="report-incident-title" className="font-display text-lg font-bold text-[#18241D]">
              Avisar Problema na Estrada
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#55635A] tabular-nums">
              <MapPin className="h-3.5 w-3.5 text-[#14532D]" />
              {isLocating
                ? 'Obtendo ponto GPS...'
                : `GPS ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} (${coords.source === 'gps' ? 'satélite ativo' : `referência ${activeCommunity.name}`})`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de registro"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#4A5950] hover:bg-[#F1F4EE]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {!isOnline && (
            <div className="flex items-start gap-3 rounded-xl border border-[#B45309]/30 bg-[#FEF3C7]/60 p-3.5 text-xs leading-relaxed text-[#78350F]">
              <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]" />
              <div>
                <p className="font-bold">Sem sinal de internet agora</p>
                <p className="mt-0.5">
                  A foto e o ponto GPS serão salvos no seu aparelho e enviados automaticamente assim que encostar em Wi-Fi ou sinal de torre.
                </p>
              </div>
            </div>
          )}

          {/* 3-tap Problem Category */}
          <div>
            <label className="block text-xs font-bold text-[#18241D]">
              1. O que aconteceu na estrada?
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2.5">
              {(
                [
                  { id: IncidentCategory.Flood, label: 'Alagamento', icon: Droplets },
                  { id: IncidentCategory.Tree, label: 'Queda de Árvore', icon: Trees },
                  { id: IncidentCategory.Landslide, label: 'Buraco / Barreira', icon: Mountain },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center text-xs font-bold transition-colors ${
                      active
                        ? 'border-[#14532D] bg-[#14532D] text-white'
                        : 'border-[#D9DFD4] bg-[#F8FAF6] text-[#18241D] hover:bg-[#EEF3EA]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-bold text-[#18241D]">
              2. Dá para passar?
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSeverity(SeverityLevel.Blocked)}
                className={`flex min-h-[52px] items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold transition-colors ${
                  severity === SeverityLevel.Blocked
                    ? 'border-[#B91C1C] bg-[#B91C1C] text-white'
                    : 'border-[#D9DFD4] bg-white text-[#18241D] hover:bg-[#FEF2F2]'
                }`}
              >
                <OctagonAlert className="h-5 w-5 shrink-0" />
                <span>Totalmente bloqueado (sem passagem)</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity(SeverityLevel.Caution)}
                className={`flex min-h-[52px] items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold transition-colors ${
                  severity === SeverityLevel.Caution
                    ? 'border-[#B45309] bg-[#B45309] text-white'
                    : 'border-[#D9DFD4] bg-white text-[#18241D] hover:bg-[#FFFBEB]'
                }`}
              >
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Atenção (passa só trator ou 4x4)</span>
              </button>
            </div>
          </div>

          {/* Photo Proof */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#18241D]">
                3. Prova visual (foto rápida)
              </label>
              <button
                type="button"
                onClick={handleUseDemoPhoto}
                className="text-xs font-semibold text-[#14532D] underline-offset-2 hover:underline"
              >
                Usar foto de campo exemplo
              </button>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <label className="flex min-h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#9AA89B] bg-[#F8FAF6] px-4 py-3 text-xs font-semibold text-[#18241D] hover:bg-[#EEF3EA]">
                <Camera className="h-4 w-4 text-[#14532D]" />
                <span>{photoPreview ? 'Trocar foto tirada' : 'Abrir câmera ou galeria'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
              </label>

              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Prévia da ocorrência"
                  referrerPolicy="no-referrer"
                  className="h-14 w-20 rounded-xl border border-[#D9DFD4] object-cover"
                />
              )}
            </div>
            {photoError && <p className="mt-1 text-xs text-[#B91C1C]">{photoError}</p>}
          </div>

          {/* Community & Road Details */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="report-community" className="block text-xs font-bold text-[#18241D]">
                Comunidade
              </label>
              <select
                id="report-community"
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] bg-white px-3 text-sm text-[#18241D] focus:border-[#14532D] focus:outline-none"
              >
                {COMMUNITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report-road" className="block text-xs font-bold text-[#18241D]">
                Estrada ou ponto de referência
              </label>
              <input
                id="report-road"
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="Ex: Ponte do Rio, km 4..."
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] bg-white px-3 text-sm text-[#18241D] placeholder:text-[#7B8A80] focus:border-[#14532D] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="report-desc" className="block text-xs font-bold text-[#18241D]">
                Observação curta (opcional)
              </label>
              <input
                id="report-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Árvore bloqueando ônibus escolar"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] bg-white px-3 text-sm text-[#18241D] placeholder:text-[#7B8A80] focus:border-[#14532D] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="report-author" className="block text-xs font-bold text-[#18241D]">
                Seu nome ou propriedade
              </label>
              <input
                id="report-author"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Pedro · Sítio São João"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D4DBD0] bg-white px-3 text-sm text-[#18241D] placeholder:text-[#7B8A80] focus:border-[#14532D] focus:outline-none"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E2E6DC] bg-[#F8FAF6] p-3.5">
            <input
              type="checkbox"
              checked={notifyNeighbors}
              onChange={(e) => setNotifyNeighbors(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-[#9AA89B] text-[#14532D] focus:ring-[#14532D]"
            />
            <span className="text-xs leading-relaxed text-[#2D3A32]">
              <strong className="block text-[#18241D]">Disparar alerta instantâneo aos vizinhos</strong>
              Avisa moradores da comunidade, transporte escolar e ambulância imediatamente.
            </span>
          </label>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#14532D] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#166534] disabled:opacity-60"
            >
              {isOnline ? <Send className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
              {isSubmitting
                ? 'Registrando...'
                : isOnline
                  ? 'Registrar e Avisar Vizinhos'
                  : 'Salvar Offline no Celular (Envia com Sinal)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
