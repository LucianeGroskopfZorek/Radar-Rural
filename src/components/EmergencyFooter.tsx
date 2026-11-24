import React from 'react';
import { Phone, ShieldAlert } from 'lucide-react';

export const EmergencyFooter: React.FC = () => {
  return (
    <div
      role="region"
      aria-label="Emergência com risco de vida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/8 bg-white/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <div className="hidden items-center gap-2 text-xs text-[#525C54] md:flex">
          <ShieldAlert className="h-4 w-4 shrink-0 text-[#B91C1C]" />
          <span>
            Emergência grave, incêndio ou pessoas ilhadas? Não espere — ligue direto para o socorro:
          </span>
        </div>

        <div className="grid w-full grid-cols-2 gap-2.5 md:flex md:w-auto md:items-center">
          <a
            href="tel:193"
            className="flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-[#B91C1C] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#991B1B] whitespace-nowrap shrink-0"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            Ligar 193 · Bombeiros
          </a>

          <a
            href="tel:199"
            className="flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-black/10 bg-[#F7F6F2] px-4 py-2 text-xs font-semibold text-[#141A16] transition-colors hover:bg-[#ECEBE4] whitespace-nowrap shrink-0"
          >
            <Phone className="h-3.5 w-3.5 shrink-0 text-[#B45309]" />
            Defesa Civil · 199
          </a>
        </div>
      </div>
    </div>
  );
};
