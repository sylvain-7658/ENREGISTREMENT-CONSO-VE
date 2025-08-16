import React, { createContext, useContext, useMemo, FC, PropsWithChildren, useState } from 'react';
import { Settings, Charge, ProcessedCharge, Vehicle } from '../types';
import { processCharges } from '../utils/calculations';
import { vehicles as defaultVehicles } from '../data/vehicleData';
import useLocalStorage from '../hooks/useLocalStorage';

interface AppContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  charges: ProcessedCharge[];
  addCharge: (charge: Omit<Charge, 'id'>) => void;
  deleteCharge: (id: string) => void;
  importCharges: (charges: Omit<Charge, 'id'>[]) => Promise<{ addedCount: number; skippedCount: number }>;
  vehicles: Vehicle[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: Settings = {
  recapEmail: '',
  batteryCapacity: 52,
  pricePeak: 0.2516,
  priceOffPeak: 0.1828,
  priceTempoBluePeak: 0.1798,
  priceTempoBlueOffPeak: 0.1296,
  priceTempoWhitePeak: 0.3022,
  priceTempoWhiteOffPeak: 0.1486,
  priceTempoRedPeak: 0.7562,
  priceTempoRedOffPeak: 0.1526,
};

// AppProvider utilise maintenant le stockage local et n'a plus besoin d'un userId.
export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<Settings>('suivi-ev-settings', defaultSettings);
  const [rawCharges, setRawCharges] = useLocalStorage<Charge[]>('suivi-ev-charges', []);
  const [vehicles] = useState<Vehicle[]>(defaultVehicles);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };

  const addCharge = async (chargeData: Omit<Charge, 'id'>) => {
    const newCharge = { ...chargeData, id: crypto.randomUUID() };
    setRawCharges(prevCharges => [...prevCharges, newCharge]);
  };
  
  const deleteCharge = async (id: string) => {
    setRawCharges(prevCharges => prevCharges.filter(charge => charge.id !== id));
  }

  const importCharges = async (chargesToImport: Omit<Charge, 'id'>[]): Promise<{ addedCount: number; skippedCount: number }> => {
    const existingOdometerSet = new Set(rawCharges.map(c => c.odometer));
    const uniqueNewCharges: Charge[] = [];
    let skippedCount = 0;

    for (const newCharge of chargesToImport) {
        if (!existingOdometerSet.has(newCharge.odometer)) {
            uniqueNewCharges.push({ ...newCharge, id: crypto.randomUUID() });
            existingOdometerSet.add(newCharge.odometer);
        } else {
          skippedCount++;
        }
    }
    
    if (uniqueNewCharges.length > 0) {
      setRawCharges(prev => [...prev, ...uniqueNewCharges]);
    }
    
    return { addedCount: uniqueNewCharges.length, skippedCount };
  };


  const processedCharges = useMemo(() => processCharges(rawCharges, settings), [rawCharges, settings]);

  const value = {
    settings,
    updateSettings,
    charges: processedCharges,
    addCharge,
    deleteCharge,
    importCharges,
    vehicles,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};