import React from 'react';
import {
  Award,
  CloudRain,
  Eye,
  Route,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { AchievementId } from '../types.ts';

interface CredibilityStarsProps {
  stars?: number;
  reliabilityPct?: number;
  compact?: boolean;
}

export const CredibilityStars: React.FC<CredibilityStarsProps> = ({
  stars = 3,
  reliabilityPct,
  compact = false,
}) => {
  const clamped = Math.max(1, Math.min(5, Math.round(stars)));
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-[#92400E] tabular-nums"
      aria-label={`Credibilidade ${clamped} de 5 estrelas`}
      title={`Credibilidade: ${clamped} de 5 estrelas`}
    >
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`h-3.5 w-3.5 ${
              n <= clamped ? 'fill-[#D97706] text-[#B45309]' : 'text-[#D4DBD0]'
            }`}
          />
        ))}
      </span>
      {!compact && reliabilityPct !== undefined && (
        <span className="ml-1 font-medium text-[#4A5950]">
          {reliabilityPct}% confiável
        </span>
      )}
    </span>
  );
};

export function getAchievementMeta(id: AchievementId) {
  switch (id) {
    case AchievementId.RoadEye:
      return {
        icon: Eye,
        label: 'Olho na Estrada',
        hint: 'Enviou aviso com foto e GPS',
      };
    case AchievementId.TrustedValidator:
      return {
        icon: ShieldCheck,
        label: 'Validador de Confiança',
        hint: 'Validou 3+ avisos de vizinhos',
      };
    case AchievementId.RainSentinel:
      return {
        icon: CloudRain,
        label: 'Sentinela da Chuva',
        hint: 'Alertou em cenário de alagamento',
      };
    case AchievementId.ClearPath:
      return {
        icon: Route,
        label: 'Caminho Livre',
        hint: 'Confirmou trecho desobstruído',
      };
    case AchievementId.CommunityVoice:
      return {
        icon: Award,
        label: 'Voz da Comunidade',
        hint: '5+ vizinhos confirmaram seus avisos',
      };
  }
}

interface AchievementSymbolsProps {
  achievements?: AchievementId[];
  showLabels?: boolean;
}

export const AchievementSymbols: React.FC<AchievementSymbolsProps> = ({
  achievements = [],
  showLabels = false,
}) => {
  if (achievements.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {achievements.map((id) => {
        const meta = getAchievementMeta(id);
        const Icon = meta.icon;
        return (
          <span
            key={id}
            title={`${meta.label}: ${meta.hint}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#14532D]"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#14532D]" />
            {showLabels && <span>{meta.label}</span>}
          </span>
        );
      })}
    </span>
  );
};
