import React, { useEffect, useState, useRef } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ChargeJournal } from './components/ChargeJournal';
import Settings from './components/Settings';
import Stats from './components/Stats';
import Dashboard from './components/Dashboard';
import TripJournal from './components/TripJournal';
import MaintenanceJournal from './components/MaintenanceJournal';
import ReleaseNotes from './components/ReleaseNotes';
import UserGuide from './components/UserGuide';
import { BarChart2, BookOpen, Settings as SettingsIcon, LayoutDashboard, MapPin, Wrench, LogOut, ScrollText, BookText, ChevronsUpDown, Car, Users, MoreHorizontal } from 'lucide-react';
import SkeletonLoader from './components/SkeletonLoader';
import { useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Notification from './components/Notification';
import { AnimatePresence, motion } from 'framer-motion';
import ChargeForm from './components/ChargeForm';
import TripForm from './components/TripForm';
import MaintenanceForm from './components/MaintenanceForm';
import { View } from './types';
import LegalInfo from './components/LegalInfo';
import FleetOverview from './components/FleetOverview';
import PinPromptModal from './components/PinPromptModal';
import CommunityStats from './components/CommunityStats';

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
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    if (vehicles.length <= 1) {
        if (!activeVehicle) return null;
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-700/50">
                <Car size={16} />
                <span>{activeVehicle.name}</span>
            </div>
        );
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-40 sm:w-48 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors duration-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600/50"
            >
                <div className="flex items-center gap-2 truncate">
                    <Car size={16} />
                    <span className="truncate">{activeVehicle ? activeVehicle.name : 'Sélectionner'}</span>
                </div>
                <ChevronsUpDown size={16} className="text-slate-500 flex-shrink-0" />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                        <ul>
                            {vehicles.map(vehicle => (
                                <li key={vehicle.id}>
                                    <button
                                        onClick={() => {
                                            attemptVehicleSwitch(vehicle.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${activeVehicle?.id === vehicle.id ? 'font-bold bg-blue-50 dark:bg-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    >
                                        {vehicle.imageUrl ? <img src={vehicle.imageUrl} alt={vehicle.name} className="w-8 h-6 object-cover rounded-sm flex-shrink-0"/> : <Car size={16} className="text-slate-400 flex-shrink-0"/>}
                                        <span className="truncate">{vehicle.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const AppContent: React.FC = () => {
    const { activeView, setActiveView, logout, isLoading } = useAppContext();

    useEffect(() => {
        if (activeView === 'dashboard') {
            document.body.classList.add('dashboard-background');
        } else {
            document.body.classList.remove('dashboard-background');
        }
        
        return () => {
            document.body.classList.remove('dashboard-background');
        }
    }, [activeView]);
    
    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard />;
            case 'journal': return <ChargeJournal />;
            case 'add-charge': return <ChargeForm />;
            case 'trajets': return <TripJournal />;
            case 'add-trip': return <TripForm />;
            case 'entretien': return <MaintenanceJournal />;
            case 'add-maintenance': return <MaintenanceForm />;
            case 'stats': return <Stats />;
            case 'settings': return <Settings />;
            case 'release-notes': return <ReleaseNotes />;
            case 'user-guide': return <UserGuide />;
            case 'legal-info': return <LegalInfo />;
            case 'fleet-overview': return <FleetOverview />;
            case 'community-stats': return <CommunityStats />;
            default: return <Dashboard />;
        }
    };

    const navItems = [
        { view: 'dashboard' as View, label: 'Tableau de bord', icon: LayoutDashboard },
        { view: 'journal' as View, label: 'Journal', icon: ScrollText },
        { view: 'trajets' as View, label: 'Trajets', icon: MapPin },
        { view: 'entretien' as View, label: 'Entretien', icon: Wrench },
        { view: 'stats' as View, label: 'Statistiques', icon: BarChart2 },
    ];
    
    const mobileNavItems = [
        { view: 'dashboard' as View, label: 'Accueil', icon: LayoutDashboard },
        { view: 'journal' as View, label: 'Journal', icon: ScrollText },
        { view: 'trajets' as View, label: 'Trajets', icon: MapPin },
        { view: 'entretien' as View, label: 'Entretien', icon: Wrench },
        { view: 'settings' as View, label: 'Plus', icon: MoreHorizontal },
    ];

    return (
        <div className="min-h-screen font-sans text-slate-200">
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 no-print">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 dark:text-blue-400">
                                   <path d="M13 3V9H18L10 21V15H5L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="font-bold text-lg hidden md:block text-slate-800 dark:text-slate-100">Volty-Conso</span>
                            </div>
                            <div className="hidden sm:flex items-center space-x-2">
                                {navItems.map(item => (
                                    <NavItem key={item.view} label={item.label} icon={item.icon} isActive={activeView === item.view} onClick={() => setActiveView(item.view)} />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <VehicleSelector />
                            <div className="hidden sm:flex items-center space-x-2">
                                <NavItem label="Communauté" icon={Users} isActive={activeView === 'community-stats'} onClick={() => setActiveView('community-stats')} />
                                <NavItem label="Paramètres" icon={SettingsIcon} isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
                            </div>
                            <button onClick={logout} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg" title="Se déconnecter">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {isLoading ? <SkeletonLoader /> : renderView()}
            </main>
            <footer className="sm:hidden h-16" />
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 grid grid-cols-5 z-40 no-print">
                {mobileNavItems.map(item => (
                    <MobileNavItem key={item.view} label={item.label} icon={item.icon} isActive={activeView === item.view} onClick={() => setActiveView(item.view)} />
                ))}
            </nav>
        </div>
    );
};

const AppUI: React.FC = () => {
    const { currentUser, loading } = useAuth();
    const { notification, setNotification } = useAppContext();

    useEffect(() => {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    if (loading) {
        return <SkeletonLoader />;
    }

    return (
        <>
            {!currentUser ? <Login /> : <AppContent />}
            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>
            <PinPromptModal />
        </>
    );
};

const App: React.FC = () => (
    <AppProvider>
        <AppUI />
    </AppProvider>
);

export default App;