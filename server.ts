import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  COMMUNITIES,
  COMMUNITY_UTILITIES,
  INITIAL_ALERTS,
  INITIAL_INCIDENTS,
} from './src/data/canoinhasData.ts';
import {
  CommunityAlert,
  IncidentCategory,
  RoadIncident,
  SeverityLevel,
  SolutionStage,
  TransportConfirmation,
} from './src/types.ts';

interface PersistedState {
  incidents: RoadIncident[];
  alerts: CommunityAlert[];
  transportConfirmations: TransportConfirmation[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'radar-rural-db.json');

function loadState(): PersistedState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedState;
      if (Array.isArray(parsed.incidents) && Array.isArray(parsed.alerts)) {
        return {
          incidents: parsed.incidents,
          alerts: parsed.alerts,
          transportConfirmations: parsed.transportConfirmations || [],
        };
      }
    }
  } catch (err) {
    console.warn('Could not read persisted state, using defaults:', err);
  }
  return {
    incidents: [...INITIAL_INCIDENTS],
    alerts: [...INITIAL_ALERTS],
    transportConfirmations: [],
  };
}

function saveState(state: PersistedState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist state to disk:', err);
  }
}

function mapCoordsToSvg(communityId: string, lat?: number, lng?: number): { mapX: number; mapY: number } {
  const community = COMMUNITIES.find((c) => c.id === communityId) || COMMUNITIES[0];
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    // Convert Canoinhas region lat/lng (-26.08..-26.34, -50.62..-50.18) smoothly onto 1000x600 SVG
    const normX = ((lng - -50.62) / (-50.18 - -50.62)) * 840 + 80;
    const normY = ((lat - -26.08) / (-26.34 - -26.08)) * 460 + 70;
    if (normX >= 60 && normX <= 940 && normY >= 60 && normY <= 540) {
      return { mapX: Math.round(normX), mapY: Math.round(normY) };
    }
  }
  // Small deterministic jitter near community center so pins don't overlap exactly
  const offsetX = Math.round((Math.random() - 0.5) * 56);
  const offsetY = Math.round((Math.random() - 0.5) * 44);
  return {
    mapX: Math.max(70, Math.min(930, community.mapX + offsetX)),
    mapY: Math.max(70, Math.min(530, community.mapY + offsetY)),
  };
}

function categoryDefaultTitle(category: IncidentCategory, severity: SeverityLevel): string {
  if (category === IncidentCategory.Flood) {
    return severity === SeverityLevel.Blocked ? 'Trecho ou ponte alagada (sem passagem)' : 'Água na pista — atenção ao atravessar';
  }
  if (category === IncidentCategory.Tree) {
    return severity === SeverityLevel.Blocked ? 'Queda de árvore fechando a estrada' : 'Árvore caída em meia pista';
  }
  return severity === SeverityLevel.Blocked ? 'Queda de barreira / estrada bloqueada' : 'Lama pesada ou buraco fundo (só 4x4/trator)';
}

function categoryFallbackPhoto(category: IncidentCategory, severity: SeverityLevel): string {
  if (severity === SeverityLevel.Cleared) {
    return '/src/assets/images/road_graded_clear_1795044561881.jpg';
  }
  if (category === IncidentCategory.Flood) {
    return '/src/assets/images/road_flood_bridge_1795044560692.jpg';
  }
  return '/src/assets/images/road_fallen_tree_1795044560805.jpg';
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const state = loadState();

  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, communities: COMMUNITIES.length, incidents: state.incidents.length });
  });

  app.get('/api/incidents', (req, res) => {
    const communityId = typeof req.query.community === 'string' ? req.query.community : undefined;
    const list = communityId && communityId !== 'todas'
      ? state.incidents.filter((i) => i.communityId === communityId)
      : state.incidents;
    const sorted = [...list].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    res.json(sorted);
  });

  app.post('/api/incidents', (req, res) => {
    const body = req.body || {};
    const community = COMMUNITIES.find((c) => c.id === body.communityId) || COMMUNITIES[0];
    const category = Object.values(IncidentCategory).includes(body.category)
      ? (body.category as IncidentCategory)
      : IncidentCategory.Flood;
    const severity = Object.values(SeverityLevel).includes(body.severity)
      ? (body.severity as SeverityLevel)
      : SeverityLevel.Blocked;
    const lat = typeof body.lat === 'number' ? body.lat : community.centerLat;
    const lng = typeof body.lng === 'number' ? body.lng : community.centerLng;
    const { mapX, mapY } = mapCoordsToSvg(community.id, lat, lng);
    const now = new Date().toISOString();

    const newIncident: RoadIncident = {
      id: body.id || `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      communityId: community.id,
      communityName: community.name,
      roadName: String(body.roadName || `Estrada Geral de ${community.name}`).slice(0, 120),
      title: String(body.title || categoryDefaultTitle(category, severity)).slice(0, 140),
      description: String(
        body.description ||
          `Relato enviado por morador da região de ${community.name} com localização GPS registrada.`
      ).slice(0, 500),
      category,
      severity,
      solutionStage: body.notifyNeighbors !== false ? SolutionStage.NeighborsNotified : SolutionStage.Reported,
      photoUrl: body.photoUrl || categoryFallbackPhoto(category, severity),
      lat,
      lng,
      mapX,
      mapY,
      authorName: String(body.authorName || 'Morador da comunidade').slice(0, 80),
      createdAt: body.createdAt || now,
      updatedAt: now,
      confirmations: 1,
      notifyNeighbors: body.notifyNeighbors !== false,
      isOfflinePending: false,
    };

    state.incidents.unshift(newIncident);

    if (newIncident.notifyNeighbors) {
      const alert: CommunityAlert = {
        id: `alt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        communityId: community.id,
        communityName: community.name,
        title: `${newIncident.title} — ${newIncident.roadName}`,
        message: `${newIncident.description} (${newIncident.authorName})`,
        audience: `Moradores de ${community.name} · Transporte Escolar · Ambulância`,
        kind: newIncident.severity === SeverityLevel.Blocked ? 'bloqueio' : 'atencao',
        createdAt: now,
        incidentId: newIncident.id,
      };
      state.alerts.unshift(alert);
    }

    saveState(state);
    res.status(201).json({ incident: newIncident, alerts: state.alerts.slice(0, 25) });
  });

  app.post('/api/incidents/sync', (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const synced: RoadIncident[] = [];
    const now = new Date().toISOString();

    for (const item of items) {
      const existing = state.incidents.find((inc) => inc.id === item.id);
      if (existing) {
        synced.push(existing);
        continue;
      }
      const community = COMMUNITIES.find((c) => c.id === item.communityId) || COMMUNITIES[0];
      const category = Object.values(IncidentCategory).includes(item.category)
        ? (item.category as IncidentCategory)
        : IncidentCategory.Flood;
      const severity = Object.values(SeverityLevel).includes(item.severity)
        ? (item.severity as SeverityLevel)
        : SeverityLevel.Blocked;
      const lat = typeof item.lat === 'number' ? item.lat : community.centerLat;
      const lng = typeof item.lng === 'number' ? item.lng : community.centerLng;
      const { mapX, mapY } = mapCoordsToSvg(community.id, lat, lng);

      const created: RoadIncident = {
        id: item.id || `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        communityId: community.id,
        communityName: community.name,
        roadName: String(item.roadName || `Estrada Geral de ${community.name}`).slice(0, 120),
        title: String(item.title || categoryDefaultTitle(category, severity)).slice(0, 140),
        description: String(
          item.description || `Registro feito sem sinal e sincronizado automaticamente ao retornar à rede.`
        ).slice(0, 500),
        category,
        severity,
        solutionStage:
          item.notifyNeighbors !== false ? SolutionStage.NeighborsNotified : SolutionStage.Reported,
        photoUrl: item.photoUrl || categoryFallbackPhoto(category, severity),
        lat,
        lng,
        mapX,
        mapY,
        authorName: String(item.authorName || 'Morador (envio offline)').slice(0, 80),
        createdAt: item.createdAt || now,
        updatedAt: now,
        confirmations: 1,
        notifyNeighbors: item.notifyNeighbors !== false,
        isOfflinePending: false,
      };
      state.incidents.unshift(created);
      synced.push(created);

      if (created.notifyNeighbors) {
        state.alerts.unshift({
          id: `alt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          communityId: community.id,
          communityName: community.name,
          title: `${created.title} — ${created.roadName}`,
          message: `${created.description} (Sincronizado via GPS offline)`,
          audience: `Moradores de ${community.name} · Transporte Escolar`,
          kind: created.severity === SeverityLevel.Blocked ? 'bloqueio' : 'atencao',
          createdAt: now,
          incidentId: created.id,
        });
      }
    }

    saveState(state);
    res.json({ syncedCount: synced.length, synced });
  });

  app.post('/api/incidents/:id/confirm', (req, res) => {
    const incident = state.incidents.find((i) => i.id === req.params.id);
    if (!incident) {
      res.status(404).json({ error: 'Ocorrência não encontrada.' });
      return;
    }
    incident.confirmations += 1;
    incident.updatedAt = new Date().toISOString();
    saveState(state);
    res.json(incident);
  });

  app.patch('/api/incidents/:id/status', (req, res) => {
    const incident = state.incidents.find((i) => i.id === req.params.id);
    if (!incident) {
      res.status(404).json({ error: 'Ocorrência não encontrada.' });
      return;
    }
    const { solutionStage, resolutionNote } = req.body || {};
    const now = new Date().toISOString();

    if (Object.values(SolutionStage).includes(solutionStage)) {
      incident.solutionStage = solutionStage as SolutionStage;
    }
    if (typeof resolutionNote === 'string' && resolutionNote.trim()) {
      incident.resolutionNote = resolutionNote.trim().slice(0, 240);
    }

    if (incident.solutionStage === SolutionStage.Resolved) {
      incident.severity = SeverityLevel.Cleared;
      if (!incident.resolutionNote) {
        incident.resolutionNote = 'Trecho desobstruído e liberado para tráfego normal.';
      }
      state.alerts.unshift({
        id: `alt-res-${Date.now()}`,
        communityId: incident.communityId,
        communityName: incident.communityName,
        title: `Trecho liberado: ${incident.roadName}`,
        message: `${incident.resolutionNote} A estrada em ${incident.communityName} já está liberada para passagem.`,
        audience: `Retorno da Solução · ${incident.communityName}`,
        kind: 'retorno_liberado',
        createdAt: now,
        incidentId: incident.id,
      });
    }

    incident.updatedAt = now;
    saveState(state);
    res.json({ incident, alerts: state.alerts.slice(0, 25) });
  });

  app.get('/api/alerts', (req, res) => {
    const communityId = typeof req.query.community === 'string' ? req.query.community : undefined;
    const list = communityId && communityId !== 'todas'
      ? state.alerts.filter((a) => a.communityId === communityId)
      : state.alerts;
    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted.slice(0, 30));
  });

  app.get('/api/utilities', (req, res) => {
    const communityId = typeof req.query.community === 'string' ? req.query.community : 'marcilio-dias';
    const base = COMMUNITY_UTILITIES[communityId] || COMMUNITY_UTILITIES['marcilio-dias'];
    const communityConfirmations = state.transportConfirmations.filter(
      (c) => c.communityId === communityId
    );
    res.json({
      schedule: {
        ...base,
        ruralHealth: {
          ...base.ruralHealth,
          confirmedSeatsCount: base.ruralHealth.confirmedSeatsCount + communityConfirmations.length,
        },
      },
      myConfirmations: communityConfirmations,
    });
  });

  app.post('/api/utilities/transport-confirm', (req, res) => {
    const body = req.body || {};
    if (!body.patientName || !body.destination) {
      res.status(400).json({ error: 'Informe o nome do paciente e o local da consulta.' });
      return;
    }
    const confirmation: TransportConfirmation = {
      id: `tr-${Date.now()}`,
      communityId: String(body.communityId || 'marcilio-dias'),
      patientName: String(body.patientName).trim().slice(0, 80),
      destination: String(body.destination).trim().slice(0, 120),
      appointmentDate: String(body.appointmentDate || 'Próxima Quinta-feira · 7h30').slice(0, 60),
      createdAt: new Date().toISOString(),
    };
    state.transportConfirmations.unshift(confirmation);
    saveState(state);
    res.status(201).json(confirmation);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Radar Rural server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
