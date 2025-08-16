import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import ChargeJournal from './components/ChargeJournal';
import Settings from './components/Settings';
import Stats from './components/Stats';
import Dashboard from './components/Dashboard';
import { BarChart2, BookOpen, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react';

export type View = 'dashboard' | 'journal' | 'stats' | 'settings';

const NavItem = ({ label, icon: Icon, isActive, onClick }: { label: string; icon: React.ElementType, isActive: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
    >
        <Icon size={16} />
        <span>{label}</span>
    </button>
);

const MobileNavItem = ({ label, icon: Icon, isActive, onClick }: { label: string; icon: React.ElementType, isActive: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center space-y-1 w-1/4 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
            isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300'
        }`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </button>
);


const AppContent: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('dashboard');

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
            <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10 no-print">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            Suivi Conso EV
                        </h1>
                        <div className="hidden sm:flex items-center space-x-2">
                            <NavItem label="Tableau de bord" icon={LayoutDashboard} isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                            <NavItem label="Journal" icon={BookOpen} isActive={activeView === 'journal'} onClick={() => setActiveView('journal')} />
                            <NavItem label="Statistiques" icon={BarChart2} isActive={activeView === 'stats'} onClick={() => setActiveView('stats')} />
                            <NavItem label="Paramètres" icon={SettingsIcon} isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
                        </div>
                    </div>
                     <div className="sm:hidden mt-2 flex justify-around items-center border-t border-slate-200 dark:border-slate-700 pt-2">
                        <MobileNavItem label="Tableau" icon={LayoutDashboard} isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                        <MobileNavItem label="Journal" icon={BookOpen} isActive={activeView === 'journal'} onClick={() => setActiveView('journal')} />
                        <MobileNavItem label="Stats" icon={BarChart2} isActive={activeView === 'stats'} onClick={() => setActiveView('stats')} />
                        <MobileNavItem label="Config" icon={SettingsIcon} isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
                    </div>
                </nav>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {activeView === 'dashboard' && <Dashboard setActiveView={setActiveView} />}
                {activeView === 'journal' && <ChargeJournal />}
                {activeView === 'stats' && <Stats />}
                {activeView === 'settings' && <Settings />}
            </main>
        </div>
    );
};


const App: React.FC = () => {
     useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('Service Worker registered: ', registration);
                }).catch(registrationError => {
                    console.log('Service Worker registration failed: ', registrationError);
                });
            });
        }
    }, []);

    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;