export enum SeverityLevel {
  Blocked = 'bloqueado',
  Caution = 'atencao',
  Cleared = 'liberado',
}

export enum IncidentCategory {
  Flood = 'alagamento',
  Tree = 'arvore',
  Landslide = 'barreira',
}

export enum SolutionStage {
  Reported = 'reportado',
  NeighborsNotified = 'vizinhos_avisados',
  CrewDispatched = 'equipe_acionada',
  Resolved = 'liberado',
}

export enum AchievementId {
  RoadEye = 'olho_na_estrada',
  TrustedValidator = 'validador_confianca',
  RainSentinel = 'sentinela_chuva',
  ClearPath = 'caminho_livre',
  CommunityVoice = 'voz_comunidade',
}

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
}

export interface ContributorProfile {
  id: string;
  name: string;
  communityId: string;
  communityName: string;
  roleLabel: string;
  points: number;
  stars: number;
  reportsCount: number;
  validationsGiven: number;
  validationsReceived: number;
  clearancesCount: number;
  reliabilityPct: number;
  achievements: AchievementId[];
  updatedAt: string;
}

export interface CommunityInfo {
  id: string;
  name: string;
  distanceFromCenterKm: number;
  centerLat: number;
  centerLng: number;
  mapX: number; // 0..1000 SVG viewBox X
  mapY: number; // 0..600 SVG viewBox Y
  weatherAlert: {
    severity: 'alto' | 'moderado' | 'estavel';
    headline: string;
    rainLast3hMm: number;
    riverStatus: string;
    updatedLabel: string;
  };
  healthPostName: string;
  dropOffPoint: string;
}

export interface RoadIncident {
  id: string;
  communityId: string;
  communityName: string;
  roadName: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: SeverityLevel;
  solutionStage: SolutionStage;
  resolutionNote?: string;
  photoUrl?: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  authorName: string;
  authorStars?: number;
  authorAchievements?: AchievementId[];
  createdAt: string;
  updatedAt: string;
  confirmations: number;
  validatedBy?: string[];
  notifyNeighbors: boolean;
  isOfflinePending?: boolean;
}

export interface CommunityAlert {
  id: string;
  communityId: string;
  communityName: string;
  title: string;
  message: string;
  audience: string;
  kind: 'bloqueio' | 'atencao' | 'retorno_liberado' | 'utilidade';
  createdAt: string;
  incidentId?: string;
  authorName?: string;
  authorStars?: number;
  validationsCount?: number;
  validatedBy?: string[];
}

export interface UtilitySchedule {
  communityId: string;
  selectiveCollection: {
    dayOfWeek: string;
    nextDateLabel: string;
    routeDescription: string;
    isTomorrow: boolean;
  };
  pesticideAndElectronics: {
    nextDate: string;
    location: string;
    itemsAccepted: string;
  };
  ruralHealth: {
    serviceTitle: string;
    scheduleLabel: string;
    location: string;
    transportDeadline: string;
    confirmedSeatsCount: number;
  };
}

export interface TransportConfirmation {
  id: string;
  communityId: string;
  patientName: string;
  destination: string;
  appointmentDate: string;
  createdAt: string;
}

export interface HealthCardProfile {
  fullName: string;
  communityId: string;
  bloodType: string;
  susNumber: string;
  allergies: string;
  continuousMedications: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  updatedAt: string;
}

export type MapThemeMode = 'trafego' | 'risco_chuva' | 'rotas_essenciais';

export type ThematicLayerKey =
  | 'ocorrencias'
  | 'risco_alagamento'
  | 'rotas_desvios'
  | 'pontos_apoio';

export interface ThematicCorridor {
  id: string;
  name: string;
  communityIds: string[];
  kind: 'rodovia' | 'desvio_seguro' | 'linha_escolar' | 'estrada_critica' | 'estrada_rural';
  statusLabel: string;
  guidance: string;
  pathLatLng: Array<{ lat: number; lng: number }>;
  svgPath: string;
  center: {
    lat: number;
    lng: number;
    mapX: number;
    mapY: number;
  };
}

export interface ThematicRiskZone {
  id: string;
  name: string;
  communityId: string;
  communityName: string;
  riskLevel: 'alto' | 'moderado' | 'monitorado';
  rain3hMm: number;
  riverNote: string;
  guidance: string;
  radiusMeters: number;
  svgRadius: number;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
}

export interface ThematicSupportPoint {
  id: string;
  name: string;
  communityId: string;
  communityName: string;
  kind: 'saude' | 'coleta';
  scheduleSummary: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
}

