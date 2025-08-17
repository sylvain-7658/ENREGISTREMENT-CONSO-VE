
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import Card from './Card';
import { Settings as SettingsType, Vehicle } from '../types';

const InputGroup = ({ label, id, value, onChange, type = "number", unit, step = "0.01", disabled = false }: { 
    label: string;
    id: keyof SettingsType; 
    value: string | number; 
    onChange: (id: keyof SettingsType, value: string | number) => void; 
    type?: "number" | "email" | "text"; 
    unit: string; 
    step?: string; 
    disabled?: boolean 
}) => (
    <div>
        <label htmlFor={id as string} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
            <input
                type={type}
                name={id as string}
                id={id as string}
                step={step}
                className={`block w-full ${unit ? 'pr-12' : 'pr-4'} pl-4 py-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed`}
                value={value}
                onChange={(e) => onChange(id, type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
                disabled={disabled}
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
    const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
    const [isSaved, setIsSaved] = useState(false);
    const [selectedVehicleName, setSelectedVehicleName] = useState<string>('Autre / Personnalisé');

    useEffect(() => {
        setLocalSettings(settings);
        const matchingVehicle = vehicles.find(v => v.capacity === settings.batteryCapacity);
        if (matchingVehicle) {
            setSelectedVehicleName(matchingVehicle.name);
        } else {
            setSelectedVehicleName('Autre / Personnalisé');
        }
    }, [settings, vehicles]);

    const handleChange = (id: keyof SettingsType, value: string | number) => {
        setLocalSettings(prev => ({ ...prev, [id]: value }));
    };
    
    const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const vehicleName = e.target.value;
        setSelectedVehicleName(vehicleName);

        const vehicle = vehicles.find(v => v.name === vehicleName);
        if (vehicle && vehicle.name !== 'Autre / Personnalisé') {
             setLocalSettings(prev => ({ ...prev, batteryCapacity: vehicle.capacity }));
        }
    };

    const handleSave = () => {
        updateSettings(localSettings);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Paramètres</h2>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">Récapitulatifs par e-mail</h3>
                    <InputGroup
                        label="Adresse e-mail de destination"
                        id="recapEmail"
                        value={localSettings.recapEmail}
                        onChange={handleChange}
                        type="email"
                        unit=""
                    />
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">Configuration du Véhicule</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                             <label htmlFor="vehicle-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Modèle du véhicule
                            </label>
                            <select
                                id="vehicle-select"
                                value={selectedVehicleName}
                                onChange={handleVehicleChange}
                                className="mt-1 block w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                            disabled={selectedVehicleName !== 'Autre / Personnalisé'}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Tarifs de Base</h3>
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
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">Tarifs Tempo EDF</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Blue Days */}
                        <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
                            <h4 className="font-bold text-center text-lg text-blue-800 dark:text-blue-300 mb-4">Jours Bleus</h4>
                            <div className="space-y-4">
                                <InputGroup
                                    label="Heures Pleines"
                                    id="priceTempoBluePeak"
                                    value={localSettings.priceTempoBluePeak}
                                    onChange={handleChange}
                                    unit="€/kWh"
                                />
                                <InputGroup
                                    label="Heures Creuses"
                                    id="priceTempoBlueOffPeak"
                                    value={localSettings.priceTempoBlueOffPeak}
                                    onChange={handleChange}
                                    unit="€/kWh"
                                />
                            </div>
                        </div>
                        {/* White Days */}
                         <div className="p-4 rounded-lg bg-slate-200 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600">
                            <h4 className="font-bold text-center text-lg text-slate-800 dark:text-slate-200 mb-4">Jours Blancs</h4>
                            <div className="space-y-4">
                                <InputGroup
                                    label="Heures Pleines"
                                    id="priceTempoWhitePeak"
                                    value={localSettings.priceTempoWhitePeak}
                                    onChange={handleChange}
                                    unit="€/kWh"
                                />
                                <InputGroup
                                    label="Heures Creuses"
                                    id="priceTempoWhiteOffPeak"
                                    value={localSettings.priceTempoWhiteOffPeak}
                                    onChange={handleChange}
                                    unit="€/kWh"
                                />
                            </div>
                        </div>
                         {/* Red Days */}
                        <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800">
                            <h4 className="font-bold text-center text-lg text-red-800 dark:text-red-300 mb-4">Jours Rouges</h4>
                            <div className="space-y-4">
                                <InputGroup
                                    label="Heures Pleines"
                                    id="priceTempoRedPeak"
                                    value={localSettings.priceTempoRedPeak}
                                    onChange={handleChange}
                                    unit="€/kWh"
                                />
                                <InputGroup
                                    label="Heures Creuses"
                                    id="priceTempoRedOffPeak"
                                    value={localSettings.priceTempoRedOffPeak}
                                    onChange={handleChange}
                                    unit="€/kWh"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Comparaison Thermique</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Configurez ici les données d'un véhicule thermique de référence pour comparer les coûts.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup
                            label="Consommation thermique"
                            id="gasolineCarConsumption"
                            value={localSettings.gasolineCarConsumption}
                            onChange={handleChange}
                            unit="L/100km"
                            step="0.1"
                        />
                        <InputGroup
                            label="Prix de l'essence"
                            id="gasolinePricePerLiter"
                            value={localSettings.gasolinePricePerLiter}
                            onChange={handleChange}
                            unit="€/L"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex justify-center items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                        {isSaved ? 'Enregistré !' : 'Enregistrer'}
                    </button>
                </div>
                 {isSaved && <p className="text-right mt-2 text-green-500">Paramètres sauvegardés !</p>}
            </div>
        </Card>
    );
};

export default Settings;
