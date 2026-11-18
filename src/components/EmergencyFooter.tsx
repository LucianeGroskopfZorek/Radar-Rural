import React from 'react';
import { Phone, ShieldAlert } from 'lucide-react';

export const EmergencyFooter: React.FC = () => {
  return (
    <div
      role="region"
      aria-label="Emergência com risco de vida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4DBD0] bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="hidden items-center gap-2 text-xs text-[#3F4D44] md:flex">
          <ShieldAlert className="h-4 w-4 shrink-0 text-[#B91C1C]" />
          <span>
            Risco de vida, incêndio ou pessoas ilhadas? O Radar Rural é informativo — ligue imediatamente:
          </span>
        </div>

        <div className="grid w-full grid-cols-2 gap-2.5 md:flex md:w-auto md:items-center">
          <a
            href="tel:193"
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#B91C1C] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#991B1B] whitespace-nowrap shrink-0"
          >
            <Phone className="h-4 w-4 shrink-0" />
            Ligar 193 · Bombeiros
          </a>

          <a
            href="tel:199"
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-[#D4DBD0] bg-[#F8FAF6] px-4 py-2 text-xs font-bold text-[#18241D] transition-colors hover:bg-[#EEF2EA] whitespace-nowrap shrink-0"
          >
            <Phone className="h-4 w-4 shrink-0 text-[#B45309]" />
            Defesa Civil · 199
          </a>
        </div>
      </div>
    </div>
  );
};
