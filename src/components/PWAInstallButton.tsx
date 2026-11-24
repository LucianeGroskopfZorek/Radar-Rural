import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#14532D]/20 bg-[#14532D]/8 px-4 py-2 text-xs font-semibold text-[#14532D] transition-colors hover:bg-[#14532D]/14 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
      >
        <Download className="h-4 w-4" />
        Instalar no Celular
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#141A16] shadow-xs transition-colors hover:bg-[#F7F6F2] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
        >
          <Smartphone className="h-4 w-4" />
          Instalar no iPhone
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl border border-black/6 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-lg font-bold text-[#141A16]">
                  Instalar Radar Rural no iPhone
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Fechar instruções"
                  className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-[#57645C] hover:bg-[#F7F6F2]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#3F4D44]">
                <li>1. Toque no botão Compartilhar na barra do Safari.</li>
                <li>2. Role para baixo e toque em Adicionar à Tela de Início.</li>
                <li>3. Depois de instalado, o Cartão de Saúde e o registro por GPS funcionam mesmo sem sinal.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-full bg-[#14532D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166534]"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
