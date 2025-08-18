
import React, { createContext, useContext, useMemo, FC, PropsWithChildren, useState, useEffect } from 'react';
import { Settings, Charge, ProcessedCharge, Vehicle, User, Trip, ProcessedTrip, MaintenanceEntry, ProcessedMaintenanceEntry } from '../types';
import { processCharges, processTrips, processMaintenanceEntries } from '../utils/calculations';
import { vehicles as defaultVehles } from '../data/vehicleData';
import useLocalStorage from '../hooks/useLocalStorage';

interface SyncConfig {
  url: string;
  apiKey: string;
}

interface AppContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  charges: ProcessedCharge[];
  addCharge: (charge: Omit<Charge, 'id'>) => void;
  deleteCharge: (id: string) => void;
  importCharges: (charges: Omit<Charge, 'id'>[]) => Promise<{ addedCount: number; skippedCount: number }>;
  trips: ProcessedTrip[];
  addTrip: (trip: Omit<Trip, 'id'>) => void;
  deleteTrip: (id: string) => void;
  importTrips: (trips: Omit<Trip, 'id'>[]) => Promise<{ addedCount: number; skippedCount: number }>;
  maintenanceEntries: ProcessedMaintenanceEntry[];
  addMaintenanceEntry: (entry: Omit<MaintenanceEntry, 'id'>) => void;
  deleteMaintenanceEntry: (id: string) => void;
  vehicles: Vehicle[];
  users: User[];
  currentUser: User | undefined;
  addUser: (name: string) => void;
  switchUser: (id: string) => void;
  isLoading: boolean;
  syncConfig: SyncConfig | null;
  updateSyncConfig: (config: SyncConfig) => void;
  clearSyncConfig: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: Settings = {
  recapEmail: '',
  batteryCapacity: 52,
  vehicleModel: 'Renault Zoe E-Tech',
  registrationNumber: '',
  pricePeak: 0.2516,
  priceOffPeak: 0.1828,
  priceTempoBluePeak: 0.1798,
  priceTempoBlueOffPeak: 0.1296,
  priceTempoWhitePeak: 0.3022,
  priceTempoWhiteOffPeak: 0.1486,
  priceTempoRedPeak: 0.7562,
  priceTempoRedOffPeak: 0.1526,
  gasolineCarConsumption: 6.5,
  gasolinePricePerLiter: 1.90,
  fiscalPower: 4,
  billingRateLocal: 15,
  billingRateMedium: 25,
};

const EMPTY_CHARGES: Charge[] = [];
const EMPTY_TRIPS: Trip[] = [];
const EMPTY_MAINTENANCE: MaintenanceEntry[] = [];

export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('suivi-ev-users', []);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>('suivi-ev-currentUserId', null);
  
  useEffect(() => {
    if (users.length === 0) {
        const firstUserId = crypto.randomUUID();
        const firstUser: User = { id: firstUserId, name: 'Profil 1' };
        setUsers([firstUser]);
        setCurrentUserId(firstUserId);
    } else if (!currentUserId && users.length > 0) {
        setCurrentUserId(users[0].id);
    }
  }, [users, currentUserId, setUsers, setCurrentUserId]);

  const [syncConfigs, setSyncConfigs] = useLocalStorage<{ [key: string]: SyncConfig }>('suivi-ev-sync-configs', {});
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [rawCharges, setRawCharges] = useState<Charge[]>(EMPTY_CHARGES);
  const [rawTrips, setRawTrips] = useState<Trip[]>(EMPTY_TRIPS);
  const [rawMaintenance, setRawMaintenance] = useState<MaintenanceEntry[]>(EMPTY_MAINTENANCE);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles] = useState<Vehicle[]>(defaultVehles);

  const currentUser = useMemo(() => users.find(u => u.id === currentUserId), [users, currentUserId]);
  const syncConfig = useMemo(() => (currentUserId ? syncConfigs[currentUserId] : null), [syncConfigs, currentUserId]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUserId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      if (syncConfig) {
        try {
          const res = await fetch(syncConfig.url, {
            headers: { 'X-Master-Key': syncConfig.apiKey, 'X-Bin-Meta': 'false' }
          });
          if (res.ok) {
            const data = await res.json();
            setSettings(data.settings ? { ...defaultSettings, ...data.settings } : defaultSettings);
            setRawCharges(data.charges || EMPTY_CHARGES);
            setRawTrips(data.trips || EMPTY_TRIPS);
            setRawMaintenance(data.maintenance || EMPTY_MAINTENANCE);
          } else if (res.status === 404) {
            setSettings(defaultSettings);
            setRawCharges(EMPTY_CHARGES);
            setRawTrips(EMPTY_TRIPS);
            setRawMaintenance(EMPTY_MAINTENANCE);
          } else {
            console.error("Failed to fetch cloud data", res.status);
            setSettings(defaultSettings);
            setRawCharges(EMPTY_CHARGES);
            setRawTrips(EMPTY_TRIPS);
            setRawMaintenance(EMPTY_MAINTENANCE);
          }
        } catch (error) {
          console.error("Error fetching cloud data", error);
        }
      } else {
        const localSettings = localStorage.getItem(`suivi-ev-settings-${currentUserId}`);
        const localCharges = localStorage.getItem(`suivi-ev-charges-${currentUserId}`);
        const localTrips = localStorage.getItem(`suivi-ev-trips-${currentUserId}`);
        const localMaintenance = localStorage.getItem(`suivi-ev-maintenance-${currentUserId}`);
        setSettings(localSettings ? { ...defaultSettings, ...JSON.parse(localSettings) } : defaultSettings);
        setRawCharges(localCharges ? JSON.parse(localCharges) : EMPTY_CHARGES);
        setRawTrips(localTrips ? JSON.parse(localTrips) : EMPTY_TRIPS);
        setRawMaintenance(localMaintenance ? JSON.parse(localMaintenance) : EMPTY_MAINTENANCE);
      }
      setIsLoading(false);
    };
    loadData();
  }, [currentUserId, syncConfig]);

  const saveData = async (newSettings: Settings, newCharges: Charge[], newTrips: Trip[], newMaintenance: MaintenanceEntry[]) => {
    if (!currentUserId) return;
    
    if (syncConfig) {
      await fetch(syncConfig.url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': syncConfig.apiKey,
        },
        body: JSON.stringify({ settings: newSettings, charges: newCharges, trips: newTrips, maintenance: newMaintenance }),
      });
    } else {
      localStorage.setItem(`suivi-ev-settings-${currentUserId}`, JSON.stringify(newSettings));
      localStorage.setItem(`suivi-ev-charges-${currentUserId}`, JSON.stringify(newCharges));
      localStorage.setItem(`suivi-ev-trips-${currentUserId}`, JSON.stringify(newTrips));
      localStorage.setItem(`suivi-ev-maintenance-${currentUserId}`, JSON.stringify(newMaintenance));
    }
  };

  const updateSettings = async (newSettingsPart: Partial<Settings>) => {
    const newSettings = { ...settings, ...newSettingsPart };
    setSettings(newSettings);
    await saveData(newSettings, rawCharges, rawTrips, rawMaintenance);
  };
  
  const addCharge = async (chargeData: Omit<Charge, 'id'>) => {
    const newCharge = { ...chargeData, id: crypto.randomUUID() };
    const newCharges = [...rawCharges, newCharge];
    setRawCharges(newCharges);
    await saveData(settings, newCharges, rawTrips, rawMaintenance);
  };
  
  const deleteCharge = async (id: string) => {
    const newCharges = rawCharges.filter(charge => charge.id !== id);
    setRawCharges(newCharges);
    await saveData(settings, newCharges, rawTrips, rawMaintenance);
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
      const newChargeList = [...rawCharges, ...uniqueNewCharges];
      setRawCharges(newChargeList);
      await saveData(settings, newChargeList, rawTrips, rawMaintenance);
    }
    
    return { addedCount: uniqueNewCharges.length, skippedCount };
  };

  const addTrip = async (tripData: Omit<Trip, 'id'>) => {
    const newTrip = { ...tripData, id: crypto.randomUUID() };
    const newTrips = [...rawTrips, newTrip];
    setRawTrips(newTrips);
    await saveData(settings, rawCharges, newTrips, rawMaintenance);
  };

  const deleteTrip = async (id: string) => {
    const newTrips = rawTrips.filter(trip => trip.id !== id);
    setRawTrips(newTrips);
    await saveData(settings, rawCharges, newTrips, rawMaintenance);
  };

  const importTrips = async (tripsToImport: Omit<Trip, 'id'>[]): Promise<{ addedCount: number; skippedCount: number }> => {
    const existingTripSet = new Set(rawTrips.map(t => `${t.date}-${t.startOdometer}`));
    const uniqueNewTrips: Trip[] = [];
    let skippedCount = 0;

    for (const newTrip of tripsToImport) {
        const tripKey = `${newTrip.date}-${newTrip.startOdometer}`;
        if (!existingTripSet.has(tripKey)) {
            uniqueNewTrips.push({ ...newTrip, id: crypto.randomUUID() });
            existingTripSet.add(tripKey);
        } else {
          skippedCount++;
        }
    }
    
    if (uniqueNewTrips.length > 0) {
      const newTripList = [...rawTrips, ...uniqueNewTrips];
      setRawTrips(newTripList);
      await saveData(settings, rawCharges, newTripList, rawMaintenance);
    }
    
    return { addedCount: uniqueNewTrips.length, skippedCount };
  };

  const addMaintenanceEntry = async (entryData: Omit<MaintenanceEntry, 'id'>) => {
    const newEntry = { ...entryData, id: crypto.randomUUID() };
    const newEntries = [...rawMaintenance, newEntry];
    setRawMaintenance(newEntries);
    await saveData(settings, rawCharges, rawTrips, newEntries);
  };

  const deleteMaintenanceEntry = async (id: string) => {
    const newEntries = rawMaintenance.filter(entry => entry.id !== id);
    setRawMaintenance(newEntries);
    await saveData(settings, rawCharges, rawTrips, newEntries);
  };

  const addUser = (name: string) => {
    const newUser: User = { id: crypto.randomUUID(), name };
    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
  };

  const switchUser = (id: string) => {
    if (users.some(u => u.id === id)) {
        setCurrentUserId(id);
    }
  };
  
  const updateSyncConfig = (config: SyncConfig) => {
    if (!currentUserId) return;
    setSyncConfigs(prev => ({ ...prev, [currentUserId]: config }));
  };

  const clearSyncConfig = () => {
    if (!currentUserId) return;
    localStorage.removeItem(`suivi-ev-settings-${currentUserId}`);
    localStorage.removeItem(`suivi-ev-charges-${currentUserId}`);
    localStorage.removeItem(`suivi-ev-trips-${currentUserId}`);
    localStorage.removeItem(`suivi-ev-maintenance-${currentUserId}`);
    setSyncConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[currentUserId];
      return newConfigs;
    });
  };

  const processedCharges = useMemo(() => processCharges(rawCharges, settings), [rawCharges, settings]);
  const processedTrips = useMemo(() => {
    const lastCharge = processedCharges.length > 0 ? processedCharges[processedCharges.length - 1] : undefined;
    return processTrips(rawTrips, settings, lastCharge);
  }, [rawTrips, settings, processedCharges]);
  const processedMaintenanceEntries = useMemo(() => processMaintenanceEntries(rawMaintenance), [rawMaintenance]);

  const value = {
    settings,
    updateSettings,
    charges: processedCharges,
    addCharge,
    deleteCharge,
    importCharges,
    trips: processedTrips,
    addTrip,
    deleteTrip,
    importTrips,
    maintenanceEntries: processedMaintenanceEntries,
    addMaintenanceEntry,
    deleteMaintenanceEntry,
    vehicles,
    users,
    currentUser,
    addUser,
    switchUser,
    isLoading,
    syncConfig,
    updateSyncConfig,
    clearSyncConfig,
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