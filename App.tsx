import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import ChargeJournal from './components/ChargeJournal';
import Settings from './components/Settings';
import Stats from './components/Stats';
import Dashboard from './components/Dashboard';
import TripJournal from './components/TripJournal';
import MaintenanceJournal from './components/MaintenanceJournal';
import { BarChart2, BookOpen, Settings as SettingsIcon, LayoutDashboard, MapPin, Wrench, LogOut } from 'lucide-react';
import SkeletonLoader from './components/SkeletonLoader';
import { useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Notification from './components/Notification';
import { AnimatePresence } from 'framer-motion';
import ChargeForm from './components/ChargeForm';
import TripForm from './components/TripForm';
import MaintenanceForm from './components/MaintenanceForm';
import { View } from './types';

const NavItem = ({ label, icon: Icon, isActive, onClick }: { label: string; icon: React.ElementType, isActive: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
            isActive
                ? 'bg-blue-600 text-white shadow-md'
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
        className={`flex flex-col items-center justify-center space-y-1 w-full pt-2 pb-1 text-xs font-medium transition-colors duration-200 ${
            isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
    >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span className={isActive ? 'font-bold' : ''}>{label}</span>
    </button>
);

const AppContent: React.FC = () => {
    const { isLoading, notification, setNotification, activeView, setActiveView } = useAppContext();
    const { currentUser, logout } = useAuth();

    if (isLoading) {
        return <SkeletonLoader />;
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans pb-20 sm:pb-0">
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-sm sticky top-0 z-10 no-print">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-2">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 dark:text-blue-400">
                                    <path d="M13 3V9H18L10 21V15H5L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    Suivi EV Online
                                </h1>
                            </div>
                        </div>
                        <nav className="hidden sm:flex items-center space-x-2">
                            <NavItem label="Tableau de bord" icon={LayoutDashboard} isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                            <NavItem label="Journal" icon={BookOpen} isActive={activeView === 'journal'} onClick={() => setActiveView('journal')} />
                            <NavItem label="Trajets" icon={MapPin} isActive={activeView === 'trajets'} onClick={() => setActiveView('trajets')} />
                            <NavItem label="Entretien" icon={Wrench} isActive={activeView === 'entretien'} onClick={() => setActiveView('entretien')} />
                            <NavItem label="Statistiques" icon={BarChart2} isActive={activeView === 'stats'} onClick={() => setActiveView('stats')} />
                            <NavItem label="Paramètres" icon={SettingsIcon} isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
                        </nav>
                         <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden md:block truncate max-w-xs" title={currentUser?.email || ''}>
                                {currentUser?.email}
                            </span>
                            <button
                                onClick={logout}
                                title="Se déconnecter"
                                className="p-2 rounded-lg transition-colors duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'journal' && <ChargeJournal />}
                {activeView === 'trajets' && <TripJournal />}
                {activeView === 'entretien' && <MaintenanceJournal />}
                {activeView === 'stats' && <Stats />}
                {activeView === 'settings' && <Settings />}
                {activeView === 'add-charge' && <ChargeForm />}
                {activeView === 'add-trip' && <TripForm />}
                {activeView === 'add-maintenance' && <MaintenanceForm />}
            </main>
            
            {/* Mobile Bottom Navigation */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 grid grid-cols-6 z-20 no-print">
                <MobileNavItem label="Tableau" icon={LayoutDashboard} isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                <MobileNavItem label="Journal" icon={BookOpen} isActive={activeView === 'journal'} onClick={() => setActiveView('journal')} />
                <MobileNavItem label="Trajets" icon={MapPin} isActive={activeView === 'trajets'} onClick={() => setActiveView('trajets')} />
                <MobileNavItem label="Entretien" icon={Wrench} isActive={activeView === 'entretien'} onClick={() => setActiveView('entretien')} />
                <MobileNavItem label="Stats" icon={BarChart2} isActive={activeView === 'stats'} onClick={() => setActiveView('stats')} />
                <MobileNavItem label="Paramètres" icon={SettingsIcon} isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
            </nav>

            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};


const App: React.FC = () => {
    const { currentUser, loading } = useAuth();
    
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
    
    if (loading) {
        return <SkeletonLoader />;
    }

    return (
        <>
            {currentUser ? (
                <AppProvider>
                    <AppContent />
                </AppProvider>
            ) : (
                <Login />
            )}
        </>
    );
};

export default App;