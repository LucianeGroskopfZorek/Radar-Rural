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
  createdAt: string;
  updatedAt: string;
  confirmations: number;
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
