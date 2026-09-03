/**
 * Utilitários defensivos para gráficos Plotly.js.
 * Previne "Script error." e exceções de colapso de dimensões causadas por:
 * 1. ResizeObserver disparando antes da conclusão assíncrona de Plotly.newPlot.
 * 2. Chamadas a Plotly.Plots.resize em elementos sem layout interno (_fullLayout).
 * 3. Elementos desconectados do DOM durante alternância de abas.
 */

export function getPlotly(): any {
  if (typeof window !== 'undefined' && (window as any).Plotly) {
    return (window as any).Plotly;
  }
  return null;
}

export function safePlotlyResize(el: HTMLElement | null): void {
  if (!el || !el.isConnected) return;

  try {
    const Plotly = getPlotly();
    // Plotly só pode ser redimensionado com segurança se _fullLayout já estiver computado
    if (Plotly && Plotly.Plots && typeof Plotly.Plots.resize === 'function') {
      const isPlotInitialized = !!(el as any)._fullLayout && !(el as any)._redrawing;
      if (isPlotInitialized) {
        Plotly.Plots.resize(el);
      }
    }
  } catch {
    // Silencia com segurança qualquer colapso transiente durante transições de layout
  }
}

/**
 * Cria um ResizeObserver debounced e seguro para elementos de gráficos Plotly
 */
export function observePlotlyResize(
  getElements: () => (HTMLElement | null)[]
): () => void {
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
    return () => {};
  }

  let rafId: number | null = null;

  const ro = new ResizeObserver(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const elements = getElements();
      elements.forEach((el) => {
        safePlotlyResize(el);
      });
    });
  });

  const elements = getElements();
  elements.forEach((el) => {
    if (el) {
      ro.observe(el);
    }
  });

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    ro.disconnect();
  };
}
