

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Card from './Card';
import { Settings as SettingsType, Vehicle } from '../types';
import { User, Mail, Car, Zap, Sun, Leaf, FileText, LogOut, DownloadCloud, Smartphone } from 'lucide-react';
import Accordion from './Accordion';

const InputGroup = ({ label, id, value, onChange, type = "number", unit, step = "0.01", disabled = false, placeholder = '' }: { 
    label: string;
    id: keyof SettingsType; 
    value: string | number; 
    onChange: (id: any, value: string | number) => void; 
    type?: "number" | "email" | "text" | "password"; 
    unit: string; 
    step?: string; 
    disabled?: boolean,
    placeholder?: string,
}) => (
    <div>
        <label htmlFor={id as string} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
        </label>
        <div className="mt-1 relative rounded-md">
            <input
                type={type}
                name={id as string}
                id={id as string}
                step={step}
                className={`block w-full ${unit ? 'pr-12' : 'pr-4'} pl-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed`}
                value={value}
                onChange={(e) => onChange(id, type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
            />
            {unit && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 dark:text-slate-400 sm:text-sm">{unit}</span>
                </div>
            )}
        </div>
    </div>
);

const Settings: React.FC = () => {
    const { settings, updateSettings, vehicles } = useAppContext();
    const { currentUser, logout } = useAuth();
    const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
    const [isSaved, setIsSaved] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleInstallClick = async () => {
        if (!installPromptEvent) return;

        installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
        } else {
            console.log('User dismissed the A2HS prompt');
        }
        setInstallPromptEvent(null);
    };

    const handleChange = (id: keyof SettingsType, value: string | number) => {
        setLocalSettings(prev => ({ ...prev, [id]: value }));
    };
    
    const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const vehicleName = e.target.value;
        const vehicle = vehicles.find(v => v.name === vehicleName);
    
        if (vehicle && vehicle.name !== 'Autre / Personnalisé') {
            setLocalSettings(prev => ({
                ...prev,
                vehicleModel: vehicleName,
                batteryCapacity: vehicle.capacity
            }));
        } else {
             setLocalSettings(prev => ({
                ...prev,
                vehicleModel: vehicleName
            }));
        }
    };

    const handleSave = () => {
        updateSettings(localSettings);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
    };

    return (
        <Card>
            <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">Paramètres</h2>
            <div className="space-y-1">
                 <Accordion title="Mon Compte" icon={<User size={20} />} startOpen={true}>
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Connecté en tant que :</p>
                            <p className="font-semibold text-lg text-slate-800 dark:text-slate-200 truncate">{currentUser?.email}</p>
                        </div>
                        <button 
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                        >
                            <LogOut size={16} />
                            Se déconnecter
                        </button>
                    </div>
                </Accordion>
                
                 <Accordion title="Application" icon={<Smartphone size={20} />}>
                     <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Installez cette application sur votre écran d'accueil pour un accès rapide et une expérience hors ligne, comme une application native.
                        </p>
                        {installPromptEvent ? (
                            <button
                                onClick={handleInstallClick}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                            >
                                <DownloadCloud size={16} />
                                Installer l'application sur votre appareil
                            </button>
                        ) : (
                             <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                L'application est déjà installée ou votre navigateur ne supporte pas cette fonctionnalité.
                            </p>
                        )}
                    </div>
                </Accordion>

                <Accordion title="Récapitulatifs par e-mail" icon={<Mail size={20} />}>
                     <InputGroup
                        label="Adresse e-mail de destination"
                        id="recapEmail"
                        value={localSettings.recapEmail}
                        onChange={handleChange}
                        type="email"
                        unit=""
                    />
                </Accordion>
                
                <Accordion title="Configuration du Véhicule" icon={<Car size={20} />} startOpen={false}>
                     <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup
                                label="Immatriculation (optionnel)"
                                id="registrationNumber"
                                type="text"
                                value={localSettings.registrationNumber}
                                onChange={handleChange}
                                unit=""
                                placeholder="AA-123-BB"
                            />
                            <InputGroup
                                label="Puissance fiscale"
                                id="fiscalPower"
                                value={localSettings.fiscalPower}
                                onChange={handleChange}
                                unit="CV"
                                step="1"
                                type="number"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label htmlFor="vehicle-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Modèle du véhicule
                                </label>
                                <select
                                    id="vehicle-select"
                                    value={localSettings.vehicleModel || ''}
                                    onChange={handleVehicleChange}
                                    className="mt-1 block w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    {vehicles.map(v => (
                                        <option key={v.name} value={v.name}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <InputGroup
                                label="Capacité de la batterie"
                                id="batteryCapacity"
                                value={localSettings.batteryCapacity}
                                onChange={handleChange}
                                unit="kWh"
                                step="0.1"
                                disabled={localSettings.vehicleModel !== 'Autre / Personnalisé'}
                            />
                        </div>
                    </div>
                </Accordion>

                <Accordion title="Facturation des Trajets" icon={<FileText size={20} />}>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">
                        Définissez les montants forfaitaires pour la facturation des trajets courts et moyens.
                    </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup
                            label="Forfait zone locale (< 11 km)"
                            id="billingRateLocal"
                            value={localSettings.billingRateLocal}
                            onChange={handleChange}
                            unit="€"
                        />
                        <InputGroup
                            label="Forfait zone moyenne (11-30 km)"
                            id="billingRateMedium"
                            value={localSettings.billingRateMedium}
                            onChange={handleChange}
                            unit="€"
                        />
                    </div>
                </Accordion>
                
                <Accordion title="Tarifs de Base" icon={<Zap size={20} />}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup
                            label="Heures Pleines"
                            id="pricePeak"
                            value={localSettings.pricePeak}
                            onChange={handleChange}
                            unit="€/kWh"
                        />
                        <InputGroup
                            label="Heures Creuses"
                            id="priceOffPeak"
                            value={localSettings.priceOffPeak}
                            onChange={handleChange}
                            unit="€/kWh"
                        />
                    </div>
                </Accordion>

                <Accordion title="Tarifs Tempo EDF" icon={<Sun size={20} />}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                            <h4 className="font-bold text-center text-lg text-blue-800 dark:text-blue-300 mb-4">Jours Bleus</h4>
                            <div className="space-y-4">
                                <InputGroup label="Heures Pleines" id="priceTempoBluePeak" value={localSettings.priceTempoBluePeak} onChange={handleChange} unit="€/kWh"/>
                                <InputGroup label="Heures Creuses" id="priceTempoBlueOffPeak" value={localSettings.priceTempoBlueOffPeak} onChange={handleChange} unit="€/kWh"/>
                            </div>
                        </div>
                         <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                            <h4 className="font-bold text-center text-lg text-slate-800 dark:text-slate-200 mb-4">Jours Blancs</h4>
                            <div className="space-y-4">
                                <InputGroup label="Heures Pleines" id="priceTempoWhitePeak" value={localSettings.priceTempoWhitePeak} onChange={handleChange} unit="€/kWh"/>
                                <InputGroup label="Heures Creuses" id="priceTempoWhiteOffPeak" value={localSettings.priceTempoWhiteOffPeak} onChange={handleChange} unit="€/kWh"/>
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                            <h4 className="font-bold text-center text-lg text-red-800 dark:text-red-300 mb-4">Jours Rouges</h4>
                            <div className="space-y-4">
                                <InputGroup label="Heures Pleines" id="priceTempoRedPeak" value={localSettings.priceTempoRedPeak} onChange={handleChange} unit="€/kWh"/>
                                <InputGroup label="Heures Creuses" id="priceTempoRedOffPeak" value={localSettings.priceTempoRedOffPeak} onChange={handleChange} unit="€/kWh"/>
                            </div>
                        </div>
                    </div>
                </Accordion>
                
                <Accordion title="Comparaison Thermique" icon={<Leaf size={20} />}>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">
                        Configurez ici les données d'un véhicule thermique de référence pour comparer les coûts.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Consommation thermique" id="gasolineCarConsumption" value={localSettings.gasolineCarConsumption} onChange={handleChange} unit="L/100km" step="0.1"/>
                        <InputGroup label="Prix de l'essence" id="gasolinePricePerLiter" value={localSettings.gasolinePricePerLiter} onChange={handleChange} unit="€/L"/>
                    </div>
                </Accordion>

            </div>

            <div className="pt-8 mt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex justify-center items-center px-6 py-2.5 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                    {isSaved ? 'Enregistré !' : 'Enregistrer les paramètres'}
                </button>
            </div>
             {isSaved && <p className="text-right mt-2 text-green-500 font-medium">Paramètres sauvegardés avec succès !</p>}
        </Card>
    );
};

export default Settings;