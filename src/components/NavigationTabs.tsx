import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  AlertTriangle, 
  Cpu, 
  Calculator, 
  TableProperties,
  ShieldAlert
} from 'lucide-react';
import { TabId } from '../types';
import { safePlotlyResize } from '../utils/plotlySafe';

interface NavigationTabsProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  counts: {
    total: number;
    paretoTop: number;
    anomalies: number;
    highRisk: number;
    forensics?: number;
  };
  darkMode: boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  counts,
  darkMode,
}) => {
  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'overview',
      label: 'Visão Geral & KPIs',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: counts.total > 0 ? counts.total : undefined,
      badgeColor: '#049DD9',
    },
    {
      id: 'pareto',
      label: 'Curva de Pareto (80/20)',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: counts.paretoTop > 0 ? `${counts.paretoTop} vitais` : undefined,
      badgeColor: '#98BF0B',
    },
    {
      id: 'anomalies',
      label: 'Anomalias (Z-Score)',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: counts.anomalies > 0 ? counts.anomalies : undefined,
      badgeColor: '#ef4444',
    },
    {
      id: 'predictive',
      label: 'Motor Preditivo (ML)',
      icon: <Cpu className="w-4 h-4" />,
      badge: counts.highRisk > 0 ? `${counts.highRisk} em risco` : undefined,
      badgeColor: '#f59e0b',
    },
    {
      id: 'whatif',
      label: 'Simulador ROI (What-If)',
      icon: <Calculator className="w-4 h-4" />,
      badge: 'Interativo',
      badgeColor: '#078C28',
    },
    {
      id: 'intelligence',
      label: 'Inteligência & Forense',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: counts.forensics && counts.forensics > 0 ? `${counts.forensics} achados` : undefined,
      badgeColor: '#e11d48',
    },
    {
      id: 'table',
      label: 'Tabela Operacional',
      icon: <TableProperties className="w-4 h-4" />,
    },
  ];

  const handleTabClick = (tabId: TabId) => {
    onSelectTab(tabId);
    
    // Solução defensiva para redimensionamento de gráficos Plotly em abas ocultas
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      const plotlyPlots = document.querySelectorAll('.js-plotly-plot');
      plotlyPlots.forEach((plotEl) => {
        safePlotlyResize(plotEl as HTMLElement);
      });
    }, 60);
  };

  return (
    <div 
      id="dashboard-navigation-tabs"
      className={`border-b transition-colors ${
        darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none" aria-label="Abas de Navegação">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'text-[#F2F2F2] shadow-sm'
                    : darkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={{
                  backgroundColor: isActive ? '#049DD9' : 'transparent',
                }}
              >
                <span className={isActive ? 'text-white' : ''}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase transition-all ${
                      isActive ? 'bg-white/25 text-white' : ''
                    }`}
                    style={{
                      backgroundColor: !isActive && tab.badgeColor ? `${tab.badgeColor}20` : undefined,
                      color: !isActive && tab.badgeColor ? tab.badgeColor : undefined,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
