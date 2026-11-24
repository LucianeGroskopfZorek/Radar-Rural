import React, { useMemo, useState } from 'react';
import { Award, ShieldCheck, Star, Trophy } from 'lucide-react';
import { ACHIEVEMENT_CATALOG } from '../data/canoinhasData.ts';
import {
  CommunityInfo,
  ContributorProfile,
} from '../types.ts';
import {
  AchievementSymbols,
  CredibilityStars,
  getAchievementMeta,
} from './CredibilityStars.tsx';

interface ParticipationRankingSectionProps {
  selectedCommunity: CommunityInfo;
  contributors: ContributorProfile[];
  currentResidentName: string;
}

export const ParticipationRankingSection: React.FC<ParticipationRankingSectionProps> = ({
  selectedCommunity,
  contributors,
  currentResidentName,
}) => {
  const [scope, setScope] = useState<'comunidade' | 'regiao'>('regiao');

  const visibleContributors = useMemo(() => {
    const filtered =
      scope === 'comunidade'
        ? contributors.filter((c) => c.communityId === selectedCommunity.id)
        : contributors;
    return [...filtered].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.validationsGiven - a.validationsGiven;
    });
  }, [contributors, scope, selectedCommunity.id]);

  const myProfile = useMemo(() => {
    const clean = currentResidentName.trim().toLowerCase();
    if (!clean) return contributors.find((c) => c.name.toLowerCase().includes('maria')) || null;
    return (
      contributors.find((c) => c.name.trim().toLowerCase() === clean) || null
    );
  }, [contributors, currentResidentName]);

  const nextStarThreshold = myProfile
    ? myProfile.points >= 90
      ? 90
      : myProfile.points >= 50
        ? 90
        : myProfile.points >= 30
          ? 50
          : myProfile.points >= 15
            ? 30
            : 15
    : 15;

  const progressPct = myProfile
    ? Math.min(100, Math.round((myProfile.points / nextStarThreshold) * 100))
    : 0;

  return (
    <section id="ranking" aria-labelledby="ranking-heading" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="ranking-heading" className="font-display text-2xl font-bold tracking-tight text-[#141A16] sm:text-3xl">
            Ranking de Participação e Credibilidade
          </h2>
          <p className="mt-1 text-sm text-[#525C54]">
            Quem envia avisos reais e confirma a situação das estradas acumula estrelas e conquistas de confiança
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-black/[0.04] p-1" role="group" aria-label="Escopo do ranking">
          <button
            type="button"
            onClick={() => setScope('regiao')}
            className={`min-h-[34px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 ${
              scope === 'regiao'
                ? 'bg-white text-[#141A16] shadow-xs'
                : 'text-[#525C54] hover:text-[#141A16]'
            }`}
          >
            Toda a Região
          </button>
          <button
            type="button"
            onClick={() => setScope('comunidade')}
            className={`min-h-[34px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 ${
              scope === 'comunidade'
                ? 'bg-white text-[#141A16] shadow-xs'
                : 'text-[#525C54] hover:text-[#141A16]'
            }`}
          >
            {selectedCommunity.name}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-stretch">
        {/* Left 7 cols: Leaderboard */}
        <div className="flex flex-col rounded-3xl bg-white shadow-[0_1px_2px_rgba(20,26,22,0.04),0_8px_24px_rgba(20,26,22,0.03)] lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/6 px-6 py-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#B45309]" />
              <h3 className="font-display text-base font-bold text-[#141A16]">
                Colaboradores Mais Confiáveis
              </h3>
            </div>
            <span className="text-xs text-[#525C54] tabular-nums">
              +10 pts aviso · +5 pts validar · +12 pts liberar via
            </span>
          </div>

          {visibleContributors.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[#525C54]">
              Ainda não há colaboradores pontuados em {selectedCommunity.name}. Envie ou valide um alerta para iniciar o ranking local.
            </div>
          ) : (
            <ul className="divide-y divide-black/6">
              {visibleContributors.slice(0, 8).map((person, index) => {
                const isSelf = myProfile && myProfile.id === person.id;
                return (
                  <li
                    key={person.id}
                    className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors ${
                      isSelf ? 'bg-[#F3F7F0]' : 'hover:bg-black/[0.015]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span
                        className={`w-6 shrink-0 font-mono text-sm font-bold tabular-nums ${
                          index === 0
                            ? 'text-[#B45309]'
                            : index === 1
                              ? 'text-[#141A16]'
                              : index === 2
                                ? 'text-[#7C2D12]'
                                : 'text-[#879189]'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="truncate text-sm font-bold text-[#141A16]">
                            {person.name}
                          </span>
                          <CredibilityStars
                            stars={person.stars}
                            reliabilityPct={person.reliabilityPct}
                          />
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#525C54] tabular-nums">
                          <span>{person.communityName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{person.reportsCount} avisos</span>
                          <span aria-hidden="true">·</span>
                          <span>{person.validationsGiven} validações feitas</span>
                          <span aria-hidden="true">·</span>
                          <span>{person.validationsReceived} confirmações recebidas</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                      <AchievementSymbols achievements={person.achievements} />
                      <div className="text-right font-mono tabular-nums">
                        <span className="text-sm font-bold text-[#14532D]">
                          {person.points}
                        </span>
                        <span className="ml-1 text-xs text-[#525C54]">pts</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right 5 cols: Personal Credibility & Achievement Guide in one cohesive panel */}
        <div className="flex flex-col divide-y divide-black/6 rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(20,26,22,0.04),0_8px_24px_rgba(20,26,22,0.03)] lg:col-span-5">
          {/* Personal Progress */}
          <div className="pb-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#14532D]">Sua Participação</p>
                <h3 className="mt-0.5 font-display text-lg font-bold text-[#141A16]">
                  {myProfile ? myProfile.name : currentResidentName || 'Morador da região'}
                </h3>
              </div>
              <div className="text-right font-mono tabular-nums">
                <span className="text-xl font-bold text-[#14532D]">
                  {myProfile ? myProfile.points : 0}
                </span>
                <span className="ml-1 text-xs text-[#525C54]">pts</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <CredibilityStars
                stars={myProfile ? myProfile.stars : 1}
                reliabilityPct={myProfile ? myProfile.reliabilityPct : 88}
              />
              <span className="text-xs text-[#525C54] tabular-nums">
                {myProfile
                  ? `${myProfile.achievements.length} de ${ACHIEVEMENT_CATALOG.length} conquistas`
                  : 'Valide 1 aviso para começar'}
              </span>
            </div>

            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-[#14532D] transition-all"
                  style={{ width: `${Math.max(8, progressPct)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#525C54] tabular-nums">
                {myProfile && myProfile.stars >= 5
                  ? 'Nível máximo de credibilidade comunitária atingido (5 estrelas).'
                  : `Faltam ${Math.max(0, nextStarThreshold - (myProfile?.points || 0))} pontos para a próxima estrela.`}
              </p>
            </div>
          </div>

          {/* Achievement Catalog */}
          <div className="flex-1 pt-5">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#14532D]" />
              <h3 className="font-display text-base font-bold text-[#141A16]">
                Símbolos de Conquista
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#525C54]">
              Sinais visuais que mostram quem participa ativamente da rede:
            </p>

            <ul className="mt-4 space-y-3.5">
              {ACHIEVEMENT_CATALOG.map((ach) => {
                const meta = getAchievementMeta(ach.id);
                const Icon = meta.icon;
                const unlocked = myProfile?.achievements.includes(ach.id) ?? false;
                return (
                  <li key={ach.id} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        unlocked
                          ? 'bg-[#EAF1E8] text-[#14532D]'
                          : 'bg-black/[0.04] text-[#7D877F]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-[#141A16]">{ach.title}</span>
                        {unlocked && (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#15803D]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Conquistado
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#525C54]">
                        {ach.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex items-center gap-2 border-t border-black/6 pt-4 text-xs text-[#525C54]">
              <Star className="h-4 w-4 shrink-0 fill-[#D97706] text-[#B45309]" />
              <span>
                Validar avisos dos vizinhos evita boatos e protege o transporte escolar.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
