import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ChargeJournal } from './components/ChargeJournal';
import Settings from './components/Settings';
import Stats from './components/Stats';
import Dashboard from './components/Dashboard';
import TripJournal from './components/TripJournal';
import MaintenanceJournal from './components/MaintenanceJournal';
import ReleaseNotes from './components/ReleaseNotes';
import UserGuide from './components/UserGuide';
import { BarChart2, BookOpen, Settings as SettingsIcon, LayoutDashboard, MapPin, Wrench, LogOut, ScrollText, BookText, ChevronsUpDown, Car } from 'lucide-react';
import SkeletonLoader from './components/SkeletonLoader';
import { useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Notification from './components/Notification';
import { AnimatePresence } from 'framer-motion';
import ChargeForm from './components/ChargeForm';
import TripForm from './components/TripForm';
import MaintenanceForm from './components/MaintenanceForm';
import { View } from './types';
import LegalInfo from './components/LegalInfo';
import { releaseNotes } from './data/releaseNotesData';
import FleetOverview from './components/FleetOverview';
import PinPromptModal from './components/PinPromptModal';

const NavItem = ({ label, icon: Icon, isActive, onClick }: { label: string; icon: React.ElementType, isActive: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${
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

const VehicleSelector: React.FC = () => {
    const { vehicles, activeVehicle, attemptVehicleSwitch } = useAppContext();

    if (vehicles.length <= 1) {
        return null;
    }

    return (
        <div className="relative">
            <select
                value={activeVehicle?.id || ''}
                onChange={(e) => attemptVehicleSwitch(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 border border-transparent rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Sélectionner un véhicule"
            >
                {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                ))}
            </select>
             <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronsUpDown size={14} className="text-slate-500 dark:text-slate-400" />
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { isLoading, notification, setNotification, activeView, setActiveView, vehicleToUnlock } = useAppContext();
    const { currentUser, logout } = useAuth();
    const appVersion = releaseNotes[0]?.version;

    useEffect(() => {
        if (activeView === 'dashboard') {
            document.body.classList.add('dashboard-background');
        } else {
            document.body.classList.remove('dashboard-background');
        }
        return () => {
            document.body.classList.remove('dashboard-background');
        };
    }, [activeView]);

    if (isLoading) {
        return <SkeletonLoader />;
    }

    return (
        <div className="min-h-screen font-sans pb-20 sm:pb-0">
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-sm sticky top-0 z-10 no-print">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 dark:text-blue-400">
                                    <path d="M13 3V9H18L10 21V15H5L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                        SUIVI CONSO-FUN&LEC
                                    </h1>
                                    {appVersion && <span className="text-xs font-mono text-slate-500 dark:text-slate-500">v{appVersion}</span>}
                                </div>
                            </div>
                            <VehicleSelector />
                        </div>
                        <div className="flex items-center">
                            <nav className="hidden sm:flex sm:items-center sm:flex-wrap sm:gap-x-2 sm:gap-y-1">
                                <NavItem label="Tableau de bord" icon={LayoutDashboard} isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                                <NavItem label="Journal" icon={BookOpen} isActive={activeView === 'journal'} onClick={() => setActiveView('journal')} />
                                <NavItem label="Trajets" icon={MapPin} isActive={activeView === 'trajets'} onClick={() => setActiveView('trajets')} />
                                <NavItem label="Entretien" icon={Wrench} isActive={activeView === 'entretien'} onClick={() => setActiveView('entretien')} />
                                <NavItem label="Statistiques" icon={BarChart2} isActive={activeView === 'stats'} onClick={() => setActiveView('stats')} />
                                <NavItem label="Notes de version" icon={ScrollText} isActive={activeView === 'release-notes'} onClick={() => setActiveView('release-notes')} />
                                <NavItem label="Notice" icon={BookText} isActive={activeView === 'user-guide'} onClick={() => setActiveView('user-guide')} />
                                <NavItem label="Paramètres" icon={SettingsIcon} isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
                            </nav>
                             <div className="flex items-center gap-4 ml-4">
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
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'journal' && <ChargeJournal />}
                {activeView === 'trajets' && <TripJournal />}
                {activeView === 'entretien' && <MaintenanceJournal />}
                {activeView === 'stats' && <Stats />}
                {activeView === 'settings' && <Settings />}
                {activeView === 'release-notes' && <ReleaseNotes />}
                {activeView === 'user-guide' && <UserGuide />}
                {activeView === 'add-charge' && <ChargeForm />}
                {activeView === 'add-trip' && <TripForm />}
                {activeView === 'add-maintenance' && <MaintenanceForm />}
                {activeView === 'legal-info' && <LegalInfo />}
                {activeView === 'fleet-overview' && <FleetOverview />}
            </main>
            
            {/* Mobile Bottom Navigation */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 grid grid-cols-8 z-20 no-print">
                <MobileNavItem label="Tableau" icon={LayoutDashboard} isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                <MobileNavItem label="Journal" icon={BookOpen} isActive={activeView === 'journal'} onClick={() => setActiveView('journal')} />
                <MobileNavItem label="Trajets" icon={MapPin} isActive={activeView === 'trajets'} onClick={() => setActiveView('trajets')} />
                <MobileNavItem label="Entretien" icon={Wrench} isActive={activeView === 'entretien'} onClick={() => setActiveView('entretien')} />
                <MobileNavItem label="Stats" icon={BarChart2} isActive={activeView === 'stats'} onClick={() => setActiveView('stats')} />
                <MobileNavItem label="Versions" icon={ScrollText} isActive={activeView === 'release-notes'} onClick={() => setActiveView('release-notes')} />
                <MobileNavItem label="Notice" icon={BookText} isActive={activeView === 'user-guide'} onClick={() => setActiveView('user-guide')} />
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
            
             <AnimatePresence>
                {vehicleToUnlock && <PinPromptModal />}
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