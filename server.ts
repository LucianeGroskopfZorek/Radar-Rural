import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  ACHIEVEMENT_CATALOG,
  COMMUNITIES,
  COMMUNITY_UTILITIES,
  INITIAL_ALERTS,
  INITIAL_CONTRIBUTORS,
  INITIAL_INCIDENTS,
} from './src/data/canoinhasData.ts';
import {
  AchievementId,
  CommunityAlert,
  ContributorProfile,
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
  contributors: ContributorProfile[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'radar-rural-db.json');

function loadState(): PersistedState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (Array.isArray(parsed.incidents) && Array.isArray(parsed.alerts)) {
        const existingIncIds = new Set(parsed.incidents.map((i) => i.id));
        const existingAlertIds = new Set(parsed.alerts.map((a) => a.id));
        const existingContributors =
          Array.isArray(parsed.contributors) && parsed.contributors.length > 0
            ? parsed.contributors
            : [...INITIAL_CONTRIBUTORS];
        const existingContribIds = new Set(existingContributors.map((c) => c.id));

        return {
          incidents: [
            ...parsed.incidents,
            ...INITIAL_INCIDENTS.filter((i) => !existingIncIds.has(i.id)),
          ],
          alerts: [
            ...parsed.alerts,
            ...INITIAL_ALERTS.filter((a) => !existingAlertIds.has(a.id)),
          ],
          transportConfirmations: parsed.transportConfirmations || [],
          contributors: [
            ...existingContributors,
            ...INITIAL_CONTRIBUTORS.filter((c) => !existingContribIds.has(c.id)),
          ],
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
    contributors: [...INITIAL_CONTRIBUTORS],
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

function computeStarsFromPoints(points: number): number {
  if (points >= 90) return 5;
  if (points >= 50) return 4;
  if (points >= 30) return 3;
  if (points >= 15) return 2;
  return 1;
}

function computeReliability(c: ContributorProfile): number {
  const base = 86 + Math.min(10, c.validationsReceived * 1.2) + Math.min(4, c.validationsGiven * 0.6);
  return Math.min(100, Math.round(base));
}

function recalculateAchievements(c: ContributorProfile): void {
  const set = new Set<AchievementId>(c.achievements);
  if (c.reportsCount >= 1) set.add(AchievementId.RoadEye);
  if (c.validationsGiven >= 3) set.add(AchievementId.TrustedValidator);
  if (c.clearancesCount >= 1) set.add(AchievementId.ClearPath);
  if (c.validationsReceived >= 5) set.add(AchievementId.CommunityVoice);
  c.achievements = Array.from(set);
  c.stars = computeStarsFromPoints(c.points);
  c.reliabilityPct = computeReliability(c);
}

function getOrCreateContributor(
  state: PersistedState,
  rawName: string,
  communityId: string,
  roleLabel = 'Morador local'
): ContributorProfile {
  const cleanName = rawName.trim().slice(0, 80) || 'Morador da comunidade';
  const normalized = cleanName.toLowerCase();
  const existing = state.contributors.find((c) => c.name.trim().toLowerCase() === normalized);
  if (existing) return existing;

  const community = COMMUNITIES.find((c) => c.id === communityId) || COMMUNITIES[0];
  const created: ContributorProfile = {
    id: `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    communityId: community.id,
    communityName: community.name,
    roleLabel,
    points: 0,
    stars: 1,
    reportsCount: 0,
    validationsGiven: 0,
    validationsReceived: 0,
    clearancesCount: 0,
    reliabilityPct: 88,
    achievements: [],
    updatedAt: new Date().toISOString(),
  };
  state.contributors.push(created);
  return created;
}

function sortedContributors(state: PersistedState, communityId?: string): ContributorProfile[] {
  const list =
    communityId && communityId !== 'todas'
      ? state.contributors.filter((c) => c.communityId === communityId)
      : state.contributors;
  return [...list].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.validationsGiven - a.validationsGiven;
  });
}

function mapCoordsToSvg(communityId: string, lat?: number, lng?: number): { mapX: number; mapY: number } {
  const community = COMMUNITIES.find((c) => c.id === communityId) || COMMUNITIES[0];
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    const normX = ((lng - -50.62) / (-50.18 - -50.62)) * 840 + 80;
    const normY = ((lat - -26.08) / (-26.34 - -26.08)) * 460 + 70;
    if (normX >= 60 && normX <= 940 && normY >= 60 && normY <= 540) {
      return { mapX: Math.round(normX), mapY: Math.round(normY) };
    }
  }
  const offsetX = Math.round((Math.random() - 0.5) * 56);
  const offsetY = Math.round((Math.random() - 0.5) * 44);
  return {
    mapX: Math.max(70, Math.min(930, community.mapX + offsetX)),
    mapY: Math.max(70, Math.min(530, community.mapY + offsetY)),
  };
}

function categoryDefaultTitle(category: IncidentCategory, severity: SeverityLevel): string {
  if (category === IncidentCategory.Flood) {
    return severity === SeverityLevel.Blocked
      ? 'Trecho ou ponte alagada (sem passagem)'
      : 'Água na pista — atenção ao atravessar';
  }
  if (category === IncidentCategory.Tree) {
    return severity === SeverityLevel.Blocked
      ? 'Queda de árvore fechando a estrada'
      : 'Árvore caída em meia pista';
  }
  return severity === SeverityLevel.Blocked
    ? 'Queda de barreira / estrada bloqueada'
    : 'Lama pesada ou buraco fundo (só 4x4/trator)';
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
    res.json({
      ok: true,
      communities: COMMUNITIES.length,
      incidents: state.incidents.length,
      contributors: state.contributors.length,
    });
  });

  app.get('/api/maps-config', (_req, res) => {
    const apiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    res.json({ apiKey });
  });

  app.get('/api/ranking', (req, res) => {
    const communityId = typeof req.query.community === 'string' ? req.query.community : undefined;
    res.json({
      contributors: sortedContributors(state, communityId),
      achievementsCatalog: ACHIEVEMENT_CATALOG,
    });
  });

  app.get('/api/incidents', (req, res) => {
    const communityId = typeof req.query.community === 'string' ? req.query.community : undefined;
    const list =
      communityId && communityId !== 'todas'
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

    const authorName = String(body.authorName || 'Morador da comunidade').slice(0, 80);
    const author = getOrCreateContributor(state, authorName, community.id);
    author.points += 10;
    author.reportsCount += 1;
    if (category === IncidentCategory.Flood) {
      author.achievements = Array.from(
        new Set([...author.achievements, AchievementId.RainSentinel])
      );
    }
    author.updatedAt = now;
    recalculateAchievements(author);

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
      solutionStage:
        body.notifyNeighbors !== false ? SolutionStage.NeighborsNotified : SolutionStage.Reported,
      photoUrl: body.photoUrl || categoryFallbackPhoto(category, severity),
      lat,
      lng,
      mapX,
      mapY,
      authorName: author.name,
      authorStars: author.stars,
      authorAchievements: author.achievements,
      createdAt: body.createdAt || now,
      updatedAt: now,
      confirmations: 1,
      validatedBy: [],
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
        authorName: author.name,
        authorStars: author.stars,
        validationsCount: 1,
        validatedBy: [],
      };
      state.alerts.unshift(alert);
    }

    saveState(state);
    res.status(201).json({
      incident: newIncident,
      alerts: state.alerts.slice(0, 25),
      contributors: sortedContributors(state),
    });
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

      const authorName = String(item.authorName || 'Morador (envio offline)').slice(0, 80);
      const author = getOrCreateContributor(state, authorName, community.id);
      author.points += 10;
      author.reportsCount += 1;
      if (category === IncidentCategory.Flood) {
        author.achievements = Array.from(
          new Set([...author.achievements, AchievementId.RainSentinel])
        );
      }
      author.updatedAt = now;
      recalculateAchievements(author);

      const created: RoadIncident = {
        id: item.id || `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        communityId: community.id,
        communityName: community.name,
        roadName: String(item.roadName || `Estrada Geral de ${community.name}`).slice(0, 120),
        title: String(item.title || categoryDefaultTitle(category, severity)).slice(0, 140),
        description: String(
          item.description ||
            `Registro feito sem sinal e sincronizado automaticamente ao retornar à rede.`
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
        authorName: author.name,
        authorStars: author.stars,
        authorAchievements: author.achievements,
        createdAt: item.createdAt || now,
        updatedAt: now,
        confirmations: 1,
        validatedBy: [],
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
          authorName: author.name,
          authorStars: author.stars,
          validationsCount: 1,
          validatedBy: [],
        });
      }
    }

    saveState(state);
    res.json({
      syncedCount: synced.length,
      synced,
      contributors: sortedContributors(state),
    });
  });

  app.post('/api/incidents/:id/confirm', (req, res) => {
    const incident = state.incidents.find((i) => i.id === req.params.id);
    if (!incident) {
      res.status(404).json({ error: 'Ocorrência não encontrada.' });
      return;
    }
    const body = req.body || {};
    const validatorName = String(body.validatorName || 'Vizinho da região').trim().slice(0, 80);
    const now = new Date().toISOString();

    incident.confirmations += 1;
    incident.validatedBy = Array.from(new Set([...(incident.validatedBy || []), validatorName]));
    incident.updatedAt = now;

    // Award points to validator (+5)
    const validator = getOrCreateContributor(
      state,
      validatorName,
      String(body.communityId || incident.communityId)
    );
    validator.points += 5;
    validator.validationsGiven += 1;
    validator.updatedAt = now;
    recalculateAchievements(validator);

    // Award credibility points to original author (+8)
    const author = state.contributors.find(
      (c) => c.name.trim().toLowerCase() === incident.authorName.trim().toLowerCase()
    );
    if (author && author.id !== validator.id) {
      author.points += 8;
      author.validationsReceived += 1;
      author.updatedAt = now;
      recalculateAchievements(author);
      incident.authorStars = author.stars;
      incident.authorAchievements = author.achievements;
    }

    // Keep linked alert validation count synced
    const linkedAlert = state.alerts.find((a) => a.incidentId === incident.id);
    if (linkedAlert) {
      linkedAlert.validationsCount = (linkedAlert.validationsCount || 1) + 1;
      linkedAlert.validatedBy = Array.from(
        new Set([...(linkedAlert.validatedBy || []), validatorName])
      );
      if (author) linkedAlert.authorStars = author.stars;
    }

    saveState(state);
    res.json({
      incident,
      validator,
      contributors: sortedContributors(state),
      alerts: state.alerts.slice(0, 25),
    });
  });

  app.post('/api/alerts/:id/validate', (req, res) => {
    const alert = state.alerts.find((a) => a.id === req.params.id);
    if (!alert) {
      res.status(404).json({ error: 'Alerta não encontrado.' });
      return;
    }
    const body = req.body || {};
    const validatorName = String(body.validatorName || 'Vizinho da região').trim().slice(0, 80);
    const now = new Date().toISOString();

    alert.validationsCount = (alert.validationsCount || 1) + 1;
    alert.validatedBy = Array.from(new Set([...(alert.validatedBy || []), validatorName]));

    const validator = getOrCreateContributor(
      state,
      validatorName,
      String(body.communityId || alert.communityId)
    );
    validator.points += 5;
    validator.validationsGiven += 1;
    validator.updatedAt = now;
    recalculateAchievements(validator);

    if (alert.authorName) {
      const author = state.contributors.find(
        (c) => c.name.trim().toLowerCase() === alert.authorName!.trim().toLowerCase()
      );
      if (author && author.id !== validator.id) {
        author.points += 6;
        author.validationsReceived += 1;
        author.updatedAt = now;
        recalculateAchievements(author);
        alert.authorStars = author.stars;
      }
    }

    if (alert.incidentId) {
      const linkedInc = state.incidents.find((i) => i.id === alert.incidentId);
      if (linkedInc) {
        linkedInc.confirmations += 1;
        linkedInc.validatedBy = Array.from(
          new Set([...(linkedInc.validatedBy || []), validatorName])
        );
      }
    }

    saveState(state);
    res.json({
      alert,
      validator,
      contributors: sortedContributors(state),
      incidents: state.incidents,
    });
  });

  app.patch('/api/incidents/:id/status', (req, res) => {
    const incident = state.incidents.find((i) => i.id === req.params.id);
    if (!incident) {
      res.status(404).json({ error: 'Ocorrência não encontrada.' });
      return;
    }
    const { solutionStage, resolutionNote, actorName } = req.body || {};
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
      const clearerName = String(actorName || 'Morador da comunidade').trim().slice(0, 80);
      const clearer = getOrCreateContributor(state, clearerName, incident.communityId);
      clearer.points += 12;
      clearer.clearancesCount += 1;
      clearer.updatedAt = now;
      recalculateAchievements(clearer);

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
        authorName: clearer.name,
        authorStars: clearer.stars,
        validationsCount: 1,
        validatedBy: [],
      });
    }

    incident.updatedAt = now;
    saveState(state);
    res.json({
      incident,
      alerts: state.alerts.slice(0, 25),
      contributors: sortedContributors(state),
    });
  });

  app.get('/api/alerts', (req, res) => {
    const communityId = typeof req.query.community === 'string' ? req.query.community : undefined;
    const list =
      communityId && communityId !== 'todas'
        ? state.alerts.filter((a) => a.communityId === communityId)
        : state.alerts;
    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted.slice(0, 30));
  });

  app.get('/api/utilities', (req, res) => {
    const communityId =
      typeof req.query.community === 'string' ? req.query.community : 'marcilio-dias';
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
