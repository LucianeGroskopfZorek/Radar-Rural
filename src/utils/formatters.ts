import { IncidentCategory, RoadIncident, SeverityLevel, SolutionStage } from '../types.ts';

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

export function getSeverityLabel(severity: SeverityLevel): string {
  switch (severity) {
    case SeverityLevel.Blocked:
      return 'Totalmente bloqueado';
    case SeverityLevel.Caution:
      return 'Atenção · Só 4x4 ou trator';
    case SeverityLevel.Cleared:
      return 'Liberado · Patrolado';
  }
}

export function getCategoryLabel(category: IncidentCategory): string {
  switch (category) {
    case IncidentCategory.Flood:
      return 'Alagamento';
    case IncidentCategory.Tree:
      return 'Queda de árvore';
    case IncidentCategory.Landslide:
      return 'Buraco / Barreira';
  }
}

export function getSolutionStageLabel(stage: SolutionStage): string {
  switch (stage) {
    case SolutionStage.Reported:
      return 'Registrado pelo morador';
    case SolutionStage.NeighborsNotified:
      return 'Vizinhos avisados';
    case SolutionStage.CrewDispatched:
      return 'Obras / Defesa Civil acionada';
    case SolutionStage.Resolved:
      return 'Trecho liberado para tráfego';
  }
}

export function buildWhatsAppAlertText(incident: RoadIncident): string {
  const status =
    incident.severity === SeverityLevel.Blocked
      ? 'BLOQUEIO NA ESTRADA'
      : incident.severity === SeverityLevel.Caution
        ? 'ATENÇÃO NA ESTRADA (SÓ 4x4/TRATOR)'
        : 'TRECHO LIBERADO PARA TRÁFEGO';
  const mapsLink = `https://maps.google.com/?q=${incident.lat.toFixed(5)},${incident.lng.toFixed(5)}`;
  return [
    `*Radar Rural · ${incident.communityName}*`,
    `${status}: ${incident.title}`,
    `Local: ${incident.roadName}`,
    `Detalhes: ${incident.description}`,
    `Ponto GPS: ${mapsLink}`,
  ].join('\n');
}

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const maxSide = 880;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
