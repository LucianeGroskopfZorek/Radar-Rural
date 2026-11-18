import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CloudOff,
  CloudRain,
  MapPin,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { CommunityAlertsPanel } from './components/CommunityAlertsPanel.tsx';
import { EmergencyFooter } from './components/EmergencyFooter.tsx';
import { HealthCardModal } from './components/HealthCardModal.tsx';
import { IncidentDetailModal } from './components/IncidentDetailModal.tsx';
import { InteractiveRuralMap } from './components/InteractiveRuralMap.tsx';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';
import { ReportIncidentSheet } from './components/ReportIncidentSheet.tsx';
import { WeeklyUtilitiesSection } from './components/WeeklyUtilitiesSection.tsx';
import {
  COMMUNITIES,
  COMMUNITY_UTILITIES,
  INITIAL_ALERTS,
  INITIAL_INCIDENTS,
} from './data/canoinhasData.ts';
import { useOfflineQueue } from './hooks/useOfflineQueue.ts';
import { useOnlineStatus } from './hooks/useOnlineStatus.ts';
import {
  CommunityAlert,
  HealthCardProfile,
  RoadIncident,
  SolutionStage,
  TransportConfirmation,
  UtilitySchedule,
} from './types.ts';

const COMMUNITY_STORAGE_KEY = 'radar_rural_community_id_v1';
const INCIDENTS_CACHE_KEY = 'radar_rural_incidents_cache_v1';
const ALERTS_CACHE_KEY = 'radar_rural_alerts_cache_v1';
const HEALTH_CARD_STORAGE_KEY = 'radar_rural_health_card_v1';

const DEFAULT_HEALTH_CARD: HealthCardProfile = {
  fullName: 'Maria Aparecida de Souza',
  communityId: 'marcilio-dias',
  bloodType: 'O+',
  susNumber: '704 0019 3842 1190',
  allergies: 'Dipirona sódica e picada de abelha',
  continuousMedications: 'Losartana 50 mg (manhã)',
  emergencyContactName: 'José de Souza (Esposo)',
  emergencyContactPhone: '(47) 99912-4408',
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(COMMUNITY_STORAGE_KEY);
      if (saved && COMMUNITIES.some((c) => c.id === saved)) return saved;
    } catch {
      // ignore storage errors
    }
    return 'marcilio-dias';
  });

  const [showAllRegion, setShowAllRegion] = useState(false);

  const [incidents, setIncidents] = useState<RoadIncident[]>(() => {
    try {
      const cached = localStorage.getItem(INCIDENTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as RoadIncident[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore cache errors
    }
    return INITIAL_INCIDENTS;
  });

  const [alerts, setAlerts] = useState<CommunityAlert[]>(() => {
    try {
      const cached = localStorage.getItem(ALERTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as CommunityAlert[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore cache errors
    }
    return INITIAL_ALERTS;
  });

  const [utilitySchedule, setUtilitySchedule] = useState<UtilitySchedule>(
    COMMUNITY_UTILITIES[selectedCommunityId] || COMMUNITY_UTILITIES['marcilio-dias']
  );
  const [transportConfirmations, setTransportConfirmations] = useState<TransportConfirmation[]>([]);

  const [healthCard, setHealthCard] = useState<HealthCardProfile>(() => {
    try {
      const saved = localStorage.getItem(HEALTH_CARD_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as HealthCardProfile;
    } catch {
      // ignore storage errors
    }
    return DEFAULT_HEALTH_CARD;
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { isOnline, simulateOffline, setSimulateOffline } = useOnlineStatus();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  const refreshServerData = useCallback(async () => {
    if (!isOnline) return;
    try {
      const [incRes, altRes, utilRes] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/alerts'),
        fetch(`/api/utilities?community=${encodeURIComponent(selectedCommunityId)}`),
      ]);
      if (incRes.ok) {
        const incData = (await incRes.json()) as RoadIncident[];
        setIncidents(incData);
        try {
          localStorage.setItem(INCIDENTS_CACHE_KEY, JSON.stringify(incData));
        } catch {
          // ignore
        }
      }
      if (altRes.ok) {
        const altData = (await altRes.json()) as CommunityAlert[];
        setAlerts(altData);
        try {
          localStorage.setItem(ALERTS_CACHE_KEY, JSON.stringify(altData));
        } catch {
          // ignore
        }
      }
      if (utilRes.ok) {
        const utilData = (await utilRes.json()) as {
          schedule: UtilitySchedule;
          myConfirmations: TransportConfirmation[];
        };
        setUtilitySchedule(utilData.schedule);
        setTransportConfirmations(utilData.myConfirmations || []);
      }
    } catch {
      // Keep cached offline data seamlessly
    }
  }, [isOnline, selectedCommunityId]);

  const handleQueueSynced = useCallback(
    (syncedItems: RoadIncident[]) => {
      if (syncedItems.length > 0) {
        showToast(
          `${syncedItems.length} ${
            syncedItems.length === 1 ? 'ocorrência salva offline foi enviada' : 'ocorrências salvas offline foram enviadas'
          } com GPS.`
        );
        void refreshServerData();
      }
    },
    [refreshServerData, showToast]
  );

  const { queuedIncidents, isSyncing, enqueueIncident, syncNow } = useOfflineQueue(
    isOnline,
    handleQueueSynced
  );

  useEffect(() => {
    setUtilitySchedule(
      COMMUNITY_UTILITIES[selectedCommunityId] || COMMUNITY_UTILITIES['marcilio-dias']
    );
    try {
      localStorage.setItem(COMMUNITY_STORAGE_KEY, selectedCommunityId);
    } catch {
      // ignore
    }
    void refreshServerData();
  }, [refreshServerData, selectedCommunityId]);

  const selectedCommunity = useMemo(
    () => COMMUNITIES.find((c) => c.id === selectedCommunityId) || COMMUNITIES[0],
    [selectedCommunityId]
  );

  const combinedIncidents = useMemo(() => {
    const serverIds = new Set(incidents.map((i) => i.id));
    const pendingOnly = queuedIncidents.filter((q) => !serverIds.has(q.id));
    return [...pendingOnly, ...incidents];
  }, [incidents, queuedIncidents]);

  const activeIncident = useMemo(
    () => combinedIncidents.find((i) => i.id === activeIncidentId) || null,
    [activeIncidentId, combinedIncidents]
  );

  const handleReportSubmit = async (newIncident: RoadIncident) => {
    if (!isOnline) {
      enqueueIncident(newIncident);
      showToast('Salvo no celular com GPS. Será enviado automaticamente ao encontrar sinal.');
      return;
    }

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident),
      });
      if (!response.ok) throw new Error('Falha no envio');
      const data = (await response.json()) as {
        incident: RoadIncident;
        alerts: CommunityAlert[];
      };
      setIncidents((prev) => [data.incident, ...prev]);
      if (Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
      }
      showToast(
        newIncident.notifyNeighbors
          ? `Ocorrência registrada e vizinhos de ${newIncident.communityName} avisados.`
          : 'Ocorrência registrada no mapa.'
      );
    } catch {
      enqueueIncident(newIncident);
      showToast('Sem resposta da rede. Ocorrência guardada no aparelho para envio automático.');
    }
  };

  const handleConfirmIncident = async (incidentId: string) => {
    const res = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}/confirm`, {
      method: 'POST',
    });
    if (res.ok) {
      const updated = (await res.json()) as RoadIncident;
      setIncidents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast('Confirmação registrada para ajudar os próximos motoristas.');
    }
  };

  const handleMarkResolved = async (incidentId: string, resolutionNote: string) => {
    const res = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solutionStage: SolutionStage.Resolved,
        resolutionNote,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        incident: RoadIncident;
        alerts: CommunityAlert[];
      };
      setIncidents((prev) =>
        prev.map((item) => (item.id === data.incident.id ? data.incident : item))
      );
      if (Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
      }
      showToast('Trecho marcado como liberado e comunidade notificada.');
    }
  };

  const handleConfirmTransport = async (
    patientName: string,
    destination: string,
    appointmentDate: string
  ) => {
    const res = await fetch('/api/utilities/transport-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communityId: selectedCommunity.id,
        patientName,
        destination,
        appointmentDate,
      }),
    });
    if (!res.ok) throw new Error('Erro ao confirmar transporte');
    const created = (await res.json()) as TransportConfirmation;
    setTransportConfirmations((prev) => [created, ...prev]);
    setUtilitySchedule((prev) => ({
      ...prev,
      ruralHealth: {
        ...prev.ruralHealth,
        confirmedSeatsCount: prev.ruralHealth.confirmedSeatsCount + 1,
      },
    }));
  };

  const handleSaveHealthCard = (next: HealthCardProfile) => {
    setHealthCard(next);
    try {
      localStorage.setItem(HEALTH_CARD_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F4] pb-24 text-[#18241D]">
      {/* 3-Zone Top Bar Contract */}
      <header className="border-b border-[#D9DFD4] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Single-line Wordmark */}
          <a
            href="#mapa-vivo"
            className="font-display text-xl font-bold tracking-tight text-[#14532D] whitespace-nowrap shrink-0"
          >
            Radar Rural
          </a>

          {/* Zone 2: 4 concise single-line text nav links */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#4A5950] md:flex">
            <a
              href="#mapa-vivo"
              className="transition-colors hover:text-[#14532D] whitespace-nowrap shrink-0"
            >
              Mapa Vivo
            </a>
            <a
              href="#utilidades"
              className="transition-colors hover:text-[#14532D] whitespace-nowrap shrink-0"
            >
              Utilidades
            </a>
            <a
              href="#comunidade"
              className="transition-colors hover:text-[#14532D] whitespace-nowrap shrink-0"
            >
              Avisos
            </a>
            <button
              type="button"
              onClick={() => setIsHealthModalOpen(true)}
              className="transition-colors hover:text-[#14532D] whitespace-nowrap shrink-0"
            >
              Cartão Saúde
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="min-h-[40px] rounded-xl bg-[#14532D] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#166534] whitespace-nowrap shrink-0"
            >
              Avisar Estrada
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        {/* Bloco 1: Localidade, Clima & Modo Offline */}
        <section
          aria-label="Sua localidade e condições climáticas"
          className="rounded-2xl border border-[#D9DFD4] bg-white p-5 sm:p-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="community-selector"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A5950]"
                >
                  <MapPin className="h-4 w-4 text-[#14532D]" />
                  Sua localidade:
                </label>

                <select
                  id="community-selector"
                  value={selectedCommunity.id}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                  className="min-h-[40px] rounded-xl border border-[#D4DBD0] bg-[#F8FAF6] px-3 text-sm font-bold text-[#18241D] focus:border-[#14532D] focus:outline-none"
                >
                  {COMMUNITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.distanceFromCenterKm} km de Canoinhas)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <CloudRain
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    selectedCommunity.weatherAlert.severity === 'alto'
                      ? 'text-[#B91C1C]'
                      : selectedCommunity.weatherAlert.severity === 'moderado'
                        ? 'text-[#B45309]'
                        : 'text-[#15803D]'
                  }`}
                />
                <div>
                  <h1 className="font-display text-lg font-bold leading-snug text-[#18241D] sm:text-xl [text-wrap:balance]">
                    {selectedCommunity.weatherAlert.headline}
                  </h1>
                  <p className="mt-1 text-xs text-[#55635A] tabular-nums">
                    Chuva 3h: {selectedCommunity.weatherAlert.rainLast3hMm} mm ·{' '}
                    {selectedCommunity.weatherAlert.riverStatus} ·{' '}
                    {selectedCommunity.weatherAlert.updatedLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Offline Queue & PWA Controls */}
            <div className="flex flex-wrap items-center gap-2.5 border-t border-[#EEF2EA] pt-4 lg:border-t-0 lg:pt-0">
              <button
                type="button"
                onClick={() => setSimulateOffline((v) => !v)}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  isOnline
                    ? 'border-[#D4DBD0] bg-[#F8FAF6] text-[#18241D] hover:bg-[#EEF2EA]'
                    : 'border-[#B45309]/40 bg-[#FEF3C7] text-[#78350F]'
                }`}
                title="Alterne para testar o registro de estrada sem sinal de internet"
              >
                {isOnline ? (
                  <>
                    <Wifi className="h-4 w-4 text-[#15803D]" />
                    <span>Sinal Ativo · Testar Offline</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-[#B45309]" />
                    <span>{simulateOffline ? 'Modo Sem Sinal (Voltar Sinal)' : 'Sem Sinal (Offline)'}</span>
                  </>
                )}
              </button>

              {queuedIncidents.length > 0 && (
                <button
                  type="button"
                  disabled={!isOnline || isSyncing}
                  onClick={() => void syncNow()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#B45309]/35 bg-[#FFFBEB] px-3.5 py-2 text-xs font-bold text-[#92400E] hover:bg-[#FEF3C7] disabled:opacity-70 whitespace-nowrap shrink-0 tabular-nums"
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CloudOff className="h-4 w-4" />
                  )}
                  {isOnline
                    ? `Sincronizar ${queuedIncidents.length} pendente(s)`
                    : `${queuedIncidents.length} salvo(s) no celular`}
                </button>
              )}

              <PWAInstallButton />
            </div>
          </div>
        </section>

        {/* Bloco 2: O Mapa Vivo ("Waze do Interior") */}
        <InteractiveRuralMap
          selectedCommunity={selectedCommunity}
          showAllRegion={showAllRegion}
          onToggleRegionScope={setShowAllRegion}
          incidents={combinedIncidents}
          onSelectIncident={(inc) => setActiveIncidentId(inc.id)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        {/* Bloco 3: Utilidades da Semana */}
        <WeeklyUtilitiesSection
          community={selectedCommunity}
          schedule={utilitySchedule}
          myConfirmations={transportConfirmations}
          healthCard={healthCard}
          isOnline={isOnline}
          onConfirmTransport={handleConfirmTransport}
          onOpenHealthCard={() => setIsHealthModalOpen(true)}
        />

        {/* Alertas Comunitários & Retornos da Solução */}
        <CommunityAlertsPanel
          community={selectedCommunity}
          showAllRegion={showAllRegion}
          alerts={alerts}
          incidents={combinedIncidents}
          onSelectIncident={(inc) => setActiveIncidentId(inc.id)}
        />
      </main>

      {/* Bloco 4: Rodapé Fixo de Emergência Real */}
      <EmergencyFooter />

      {/* Modals / Bottom Sheets */}
      <ReportIncidentSheet
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedCommunity={selectedCommunity}
        isOnline={isOnline}
        onSubmitIncident={handleReportSubmit}
      />

      <IncidentDetailModal
        incident={activeIncident}
        onClose={() => setActiveIncidentId(null)}
        isOnline={isOnline}
        onConfirmIncident={handleConfirmIncident}
        onMarkResolved={handleMarkResolved}
      />

      <HealthCardModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        profile={healthCard}
        onSaveProfile={handleSaveHealthCard}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-[#18241D] px-4 py-3 text-center text-xs font-semibold text-white shadow-xl"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
