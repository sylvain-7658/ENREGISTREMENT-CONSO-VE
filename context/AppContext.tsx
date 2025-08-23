import React, { createContext, useContext, useMemo, FC, PropsWithChildren, useState, useEffect, useCallback } from 'react';
import { Settings, Charge, ProcessedCharge, VehiclePreset, Trip, ProcessedTrip, MaintenanceEntry, ProcessedMaintenanceEntry, View, TariffType, UserVehicle, MaintenanceType } from '../types';
import { processCharges, processTrips, processMaintenanceEntries } from '../utils/calculations';
import { vehicles as defaultVehlesPresets } from '../data/vehicleData';
import { useAuth } from './AuthContext';
import { db, firestorePromise } from '../firebase/config';
import firebase from 'firebase/compat/app';
import * as XLSX from 'xlsx';

export type NotificationType = {
  message: string;
  type: 'warning' | 'success';
}

interface AppContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Omit<Settings, 'activeVehicleId'>>) => void;
  charges: ProcessedCharge[];
  addCharge: (charge: Omit<Charge, 'id' | 'status' | 'vehicleId'>) => void;
  deleteCharge: (id: string) => void;
  importCharges: (charges: Omit<Charge, 'id' | 'vehicleId'>[]) => Promise<{ addedCount: number; skippedCount: number }>;
  pendingCharges: Charge[];
  startCharge: (charge: Omit<Charge, 'id' | 'status' | 'endPercentage' | 'tariff' | 'customPrice' | 'vehicleId'>) => void;
  completeCharge: (chargeId: string, completionData: { endPercentage: number; tariff: TariffType; customPrice?: number; }) => void;
  trips: ProcessedTrip[];
  addTrip: (trip: Omit<Trip, 'id' | 'status' | 'vehicleId'>) => void;
  deleteTrip: (id: string) => void;
  importTrips: (trips: Omit<Trip, 'id' | 'vehicleId'>[]) => Promise<{ addedCount: number; skippedCount: number }>;
  pendingTrips: Trip[];
  startTrip: (trip: Omit<Trip, 'id' | 'status' | 'endOdometer' | 'endPercentage' | 'vehicleId'>) => void;
  completeTrip: (tripId: string, completionData: { endOdometer: number; endPercentage: number; }) => void;
  maintenanceEntries: ProcessedMaintenanceEntry[];
  addMaintenanceEntry: (entry: Omit<MaintenanceEntry, 'id' | 'vehicleId'>) => void;
  deleteMaintenanceEntry: (id: string) => void;
  importMaintenanceEntries: (entries: Omit<MaintenanceEntry, 'id' | 'vehicleId'>[]) => Promise<{ addedCount: number; skippedCount: number }>;
  
  vehicles: UserVehicle[];
  addVehicle: (vehicleData: Omit<UserVehicle, 'id'>) => void;
  updateVehicle: (id: string, vehicleData: Omit<UserVehicle, 'id'>) => void;
  deleteVehicle: (id: string) => void;
  activeVehicle: UserVehicle | null;
  activeVehicleId: string | null;
  setActiveVehicleId: (id: string) => void;
  attemptVehicleSwitch: (id: string) => void;
  
  vehiclePresets: VehiclePreset[];
  isLoading: boolean;
  isOnline: boolean;
  notification: NotificationType | null;
  setNotification: React.Dispatch<React.SetStateAction<NotificationType | null>>;
  activeView: View;
  setActiveView: React.Dispatch<React.SetStateAction<View>>;
  
  // PIN Modal state
  vehicleToUnlock: UserVehicle | null;
  setVehicleToUnlock: React.Dispatch<React.SetStateAction<UserVehicle | null>>;
  
  // Raw data for fleet calculations
  rawCharges: Charge[];
  rawTrips: Trip[];
  rawMaintenance: MaintenanceEntry[];
  logout: () => Promise<void>;
  downloadBackup: (isAutomatic?: boolean) => Promise<void>;
  importBackup: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: Settings = {
  recapEmail: '',
  activeVehicleId: null,
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
  billingRateLocal: 15,
  billingRateMedium: 25,
};

const EMPTY_CHARGES: Charge[] = [];
const EMPTY_TRIPS: Trip[] = [];
const EMPTY_MAINTENANCE: MaintenanceEntry[] = [];
const EMPTY_VEHICLES: UserVehicle[] = [];

const getPriceForTariff = (tariff: TariffType, customPrice: number | undefined, settings: Settings): number => {
    switch (tariff) {
        case TariffType.PEAK: return settings.pricePeak;
        case TariffType.OFF_PEAK: return settings.priceOffPeak;
        case TariffType.TEMPO_BLUE_PEAK: return settings.priceTempoBluePeak;
        case TariffType.TEMPO_BLUE_OFFPEAK: return settings.priceTempoBlueOffPeak;
        case TariffType.TEMPO_WHITE_PEAK: return settings.priceTempoWhitePeak;
        case TariffType.TEMPO_WHITE_OFFPEAK: return settings.priceTempoWhiteOffPeak;
        case TariffType.TEMPO_RED_PEAK: return settings.priceTempoRedPeak;
        case TariffType.TEMPO_RED_OFFPEAK: return settings.priceTempoRedOffPeak;
        case TariffType.QUICK_CHARGE: return customPrice || 0;
        case TariffType.FREE_CHARGE: return 0;
        default: return 0;
    }
};

export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [vehicles, setVehicles] = useState<UserVehicle[]>(EMPTY_VEHICLES);
  const [activeVehicleId, _setActiveVehicleId] = useState<string | null>(null);
  const [rawCharges, setRawCharges] = useState<Charge[]>(EMPTY_CHARGES);
  const [rawTrips, setRawTrips] = useState<Trip[]>(EMPTY_TRIPS);
  const [rawMaintenance, setRawMaintenance] = useState<MaintenanceEntry[]>(EMPTY_MAINTENANCE);
  const [isLoading, setIsLoading] = useState(true);
  const [vehiclePresets] = useState<VehiclePreset[]>(defaultVehlesPresets);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [vehicleToUnlock, setVehicleToUnlock] = useState<UserVehicle | null>(null);


  const activeVehicle = useMemo(() => vehicles.find(v => v.id === activeVehicleId) || null, [vehicles, activeVehicleId]);
  
  const setActiveVehicleId = async (id: string) => {
    if (!currentUser || id === activeVehicleId) return;
    _setActiveVehicleId(id);
    const userDocRef = db.collection('users').doc(currentUser.uid);
    await userDocRef.update({ activeVehicleId: id });
  };
  
  const attemptVehicleSwitch = (id: string) => {
    if (id === activeVehicleId) return;
    const targetVehicle = vehicles.find(v => v.id === id);
    if (!targetVehicle) return;

    if (targetVehicle.accessPin) {
        setVehicleToUnlock(targetVehicle);
    } else {
        setActiveVehicleId(id);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    if (vehicles.length > 0 && settings.activeVehicleId) {
        const activeVehicleExists = vehicles.some(v => v.id === settings.activeVehicleId);
        if (!activeVehicleExists) {
           _setActiveVehicleId(vehicles[0].id);
        }
    }
  }, [vehicles, settings.activeVehicleId, currentUser]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!currentUser) {
      setSettings(defaultSettings);
      setVehicles(EMPTY_VEHICLES);
      _setActiveVehicleId(null);
      setRawCharges(EMPTY_CHARGES);
      setRawTrips(EMPTY_TRIPS);
      setRawMaintenance(EMPTY_MAINTENANCE);
      setIsLoading(false);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    setIsLoading(true);
    let isCancelled = false;
    let unsubscribes: (() => void)[] = [];

    const setupFirestoreListeners = async () => {
      try {
        await firestorePromise;
        if (isCancelled) return;

        const userId = currentUser.uid;
        const userDocRef = db.collection('users').doc(userId);
        const vehiclesColRef = userDocRef.collection('vehicles');
        const chargesColRef = userDocRef.collection('charges');
        const tripsColRef = userDocRef.collection('trips');
        const maintenanceColRef = userDocRef.collection('maintenance');

        // Non-blocking migration check. Runs in parallel and won't stop listeners.
        (async () => {
            try {
                const docSnap = await userDocRef.get();
                const vehiclesSnap = await vehiclesColRef.get();
                if (vehiclesSnap.empty && docSnap.exists && docSnap.data()?.vehicleModel) {
                    const oldSettingsData = docSnap.data();
                    const newVehicleData = {
                        name: oldSettingsData.vehicleModel,
                        model: oldSettingsData.vehicleModel,
                        batteryCapacity: oldSettingsData.batteryCapacity,
                        registrationNumber: oldSettingsData.registrationNumber || '',
                        fiscalPower: oldSettingsData.fiscalPower || 4,
                    };
                    const newVehicleRef = await vehiclesColRef.add(newVehicleData);
                    const newVehicleId = newVehicleRef.id;

                    await userDocRef.update({
                        activeVehicleId: newVehicleId,
                        vehicleModel: firebase.firestore.FieldValue.delete(),
                        batteryCapacity: firebase.firestore.FieldValue.delete(),
                        registrationNumber: firebase.firestore.FieldValue.delete(),
                        fiscalPower: firebase.firestore.FieldValue.delete(),
                    });
                    
                    const batch = db.batch();
                    const [chargesToUpdate, tripsToUpdate, maintenanceToUpdate] = await Promise.all([chargesColRef.get(), tripsColRef.get(), maintenanceColRef.get()]);
                    chargesToUpdate.docs.forEach(doc => batch.update(doc.ref, { vehicleId: newVehicleId }));
                    tripsToUpdate.docs.forEach(doc => batch.update(doc.ref, { vehicleId: newVehicleId }));
                    maintenanceToUpdate.docs.forEach(doc => batch.update(doc.ref, { vehicleId: newVehicleId }));
                    await batch.commit();
                    setNotification({message: "Votre compte a été mis à jour pour la gestion multi-véhicules !", type: 'success'})
                }
            } catch (migrationError) {
                 console.warn("Migration check failed. This is expected if offline.", migrationError);
            }
        })();
        
        unsubscribes = [
          userDocRef.onSnapshot((doc) => {
            if (doc.exists) {
              const data = doc.data() as Settings;
              const newSettings = { ...defaultSettings, ...data };
              setSettings(newSettings);
              if (newSettings.activeVehicleId) {
                  _setActiveVehicleId(newSettings.activeVehicleId);
              } else if (vehicles.length > 0) {
                  // If no active vehicle is set in DB, default to first one
                  const firstVehicleId = vehicles[0]?.id;
                  if (firstVehicleId) {
                      setActiveVehicleId(firstVehicleId);
                  }
              }
            } else {
              userDocRef.set(defaultSettings);
              setSettings(defaultSettings);
            }
          }),
          vehiclesColRef.onSnapshot((snapshot) => {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserVehicle));
              setVehicles(data);
               if (!activeVehicleId && data.length > 0) {
                 const currentSettings = settings; // Access current state
                 if (!currentSettings.activeVehicleId) {
                     setActiveVehicleId(data[0].id);
                 }
              }
          }),
          chargesColRef.onSnapshot((snapshot) => setRawCharges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Charge)))),
          tripsColRef.onSnapshot((snapshot) => setRawTrips(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip)))),
          maintenanceColRef.onSnapshot((snapshot) => setRawMaintenance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceEntry)))),
        ];
      } catch (error) {
        console.error("Firestore setup failed, possibly due to being offline:", error);
        setNotification({
          message: "Connexion au serveur échouée. L'application est en mode hors ligne.",
          type: 'warning',
        });
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    setupFirestoreListeners();

    return () => {
        isCancelled = true;
        unsubscribes.forEach(unsub => unsub());
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, settings.activeVehicleId]);
  
  const downloadBackup = async (isAutomatic = false) => {
    try {
      if (rawCharges.length === 0 && rawTrips.length === 0 && rawMaintenance.length === 0) {
        if (!isAutomatic) {
          setNotification({ type: 'warning', message: 'Aucune donnée à sauvegarder.' });
        }
        return;
      }

      if (isAutomatic) {
        setNotification({
          type: 'success',
          message: 'Sauvegarde hebdomadaire automatique de vos données en cours de téléchargement...',
        });
      } else {
        setNotification({
          type: 'success',
          message: 'Préparation de votre sauvegarde. Le téléchargement va bientôt commencer...',
        });
      }

      const vehicleMap = new Map(vehicles.map(v => [v.id, v.name]));

      const chargesSheetData = rawCharges
        .filter(c => c.status === 'completed')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(c => ({
            'Date': new Date(c.date).toLocaleDateString('fr-FR'),
            'Véhicule': vehicleMap.get(c.vehicleId) || 'Inconnu',
            'Kilométrage (km)': c.odometer,
            'Batterie Avant (%)': c.startPercentage,
            'Batterie Après (%)': c.endPercentage,
            'Tarif': c.tariff,
            'Prix/kWh (€)': c.pricePerKwh,
            'Statut': c.status,
        }));

      const tripsSheetData = rawTrips
        .filter(t => t.status === 'completed')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(t => ({
            'Date': new Date(t.date).toLocaleDateString('fr-FR'),
            'Véhicule': vehicleMap.get(t.vehicleId) || 'Inconnu',
            'Destination': t.destination,
            'Client': t.client || '',
            'KM Départ': t.startOdometer,
            'KM Arrivée': t.endOdometer,
            'Batterie Départ (%)': t.startPercentage,
            'Batterie Arrivée (%)': t.endPercentage,
            'Facturé': t.isBilled ? 'Oui' : 'Non',
            'Statut': t.status,
        }));
        
      const maintenanceSheetData = rawMaintenance
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(m => ({
            'Date': new Date(m.date).toLocaleDateString('fr-FR'),
            'Véhicule': vehicleMap.get(m.vehicleId) || 'Inconnu',
            'Kilométrage (km)': m.odometer,
            'Type': m.type,
            'Détails': m.details || '',
            'Coût (€)': m.cost,
        }));

      const downloadCsv = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(data);
        const csvString = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      const now = new Date();
      const todayString = now.toISOString().split('T')[0];
      let filesDownloaded = false;

      if (chargesSheetData.length > 0) {
        downloadCsv(chargesSheetData, `sauvegarde-recharges-${todayString}.csv`);
        filesDownloaded = true;
      }
      if (tripsSheetData.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
        downloadCsv(tripsSheetData, `sauvegarde-trajets-${todayString}.csv`);
        filesDownloaded = true;
      }
      if (maintenanceSheetData.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
        downloadCsv(maintenanceSheetData, `sauvegarde-entretien-${todayString}.csv`);
        filesDownloaded = true;
      }

      if (!filesDownloaded && !isAutomatic) {
         setNotification({ type: 'warning', message: 'Aucune donnée à sauvegarder.' });
         return;
      }
      
      if (currentUser) {
        localStorage.setItem(`lastBackup_${currentUser.uid}`, now.toISOString());
      }
    } catch (error) {
      console.error("Backup failed:", error);
      setNotification({
        type: 'warning',
        message: `La sauvegarde a échoué : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      });
    }
  };

  // Effect for automatic weekly backup
  useEffect(() => {
    if (isLoading || !currentUser || !isOnline) {
      return;
    }

    const LAST_BACKUP_KEY = `lastBackup_${currentUser.uid}`;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const performAutomaticBackup = async () => {
      if (rawCharges.length === 0 && rawTrips.length === 0 && rawMaintenance.length === 0) {
        return;
      }

      const lastBackupString = localStorage.getItem(LAST_BACKUP_KEY);
      const now = new Date();

      if (lastBackupString) {
        const lastBackupDate = new Date(lastBackupString);
        if (now.getTime() - lastBackupDate.getTime() < SEVEN_DAYS_MS) {
          return; // Not time for a backup yet
        }
      }
      
      await downloadBackup(true);
    };

    const backupTimeout = setTimeout(() => {
        performAutomaticBackup();
    }, 5000); 

    return () => clearTimeout(backupTimeout);

  }, [isLoading, currentUser, isOnline, rawCharges, rawTrips, rawMaintenance, vehicles]);

  const updateSettings = async (newSettingsPart: Partial<Omit<Settings, 'activeVehicleId'>>) => {
    if (!currentUser) return;
    await db.collection('users').doc(currentUser.uid).set(newSettingsPart, { merge: true });
  };
  
  const addVehicle = async (vehicleData: Omit<UserVehicle, 'id'>) => {
    if (!currentUser) return;
    const newVehicleRef = await db.collection('users').doc(currentUser.uid).collection('vehicles').add(vehicleData);
    // If it's the first vehicle, set it as active
    if (vehicles.length === 0) {
        await setActiveVehicleId(newVehicleRef.id);
    }
  };
  const updateVehicle = async (id: string, vehicleData: Omit<UserVehicle, 'id'>) => {
    if (!currentUser) return;
    await db.collection('users').doc(currentUser.uid).collection('vehicles').doc(id).update(vehicleData);
  };
  const deleteVehicle = async (id: string) => {
    if (!currentUser) return;
    // Note: This is a destructive action. Consider soft deletes or archiving in a real app.
    const batch = db.batch();
    batch.delete(db.collection('users').doc(currentUser.uid).collection('vehicles').doc(id));
    const [chargesToDelete, tripsToDelete, maintenanceToDelete] = await Promise.all([
        db.collection('users').doc(currentUser.uid).collection('charges').where('vehicleId', '==', id).get(),
        db.collection('users').doc(currentUser.uid).collection('trips').where('vehicleId', '==', id).get(),
        db.collection('users').doc(currentUser.uid).collection('maintenance').where('vehicleId', '==', id).get()
    ]);
    chargesToDelete.docs.forEach(doc => batch.delete(doc.ref));
    tripsToDelete.docs.forEach(doc => batch.delete(doc.ref));
    maintenanceToDelete.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  };
  
  const addCharge = async (chargeData: Omit<Charge, 'id' | 'status' | 'vehicleId'>) => {
    if (!currentUser || !activeVehicleId) return;
    const pricePerKwh = getPriceForTariff(chargeData.tariff!, chargeData.customPrice, settings);
    await db.collection('users').doc(currentUser.uid).collection('charges').add({ ...chargeData, pricePerKwh, vehicleId: activeVehicleId, status: 'completed' });
    setActiveView('journal');
  };
  const startCharge = async (chargeData: Omit<Charge, 'id' | 'status' | 'endPercentage' | 'tariff' | 'customPrice' | 'vehicleId'>) => {
    if (!currentUser || !activeVehicleId) return;
    await db.collection('users').doc(currentUser.uid).collection('charges').add({ ...chargeData, vehicleId: activeVehicleId, status: 'pending' });
    setActiveView('dashboard');
  };
  const completeCharge = async (chargeId: string, completionData: { endPercentage: number; tariff: TariffType; customPrice?: number; }) => {
    if (!currentUser) return;
    const pricePerKwh = getPriceForTariff(completionData.tariff, completionData.customPrice, settings);
    await db.collection('users').doc(currentUser.uid).collection('charges').doc(chargeId).update({ ...completionData, pricePerKwh, status: 'completed' });
  };
  const deleteCharge = async (id: string) => {
    if (!currentUser) return;
    await db.collection('users').doc(currentUser.uid).collection('charges').doc(id).delete();
  }
  const importCharges = async (chargesToImport: Omit<Charge, 'id' | 'vehicleId'>[]): Promise<{ addedCount: number; skippedCount: number }> => {
    if (!currentUser || !activeVehicleId) return { addedCount: 0, skippedCount: 0 };
    const chargesColRef = db.collection('users').doc(currentUser.uid).collection('charges');
    const q = chargesColRef.where('vehicleId', '==', activeVehicleId);
    const querySnapshot = await q.get();
    const existingOdometerSet = new Set(querySnapshot.docs.map(doc => doc.data().odometer));

    let skippedCount = 0;
    const batch = db.batch();
    chargesToImport.forEach(newCharge => {
        if (!existingOdometerSet.has(newCharge.odometer)) {
            const pricePerKwh = newCharge.pricePerKwh ?? getPriceForTariff(newCharge.tariff!, newCharge.customPrice, settings);
            const newDocRef = chargesColRef.doc();
            batch.set(newDocRef, { ...newCharge, pricePerKwh, vehicleId: activeVehicleId, status: 'completed' });
            existingOdometerSet.add(newCharge.odometer);
        } else {
          skippedCount++;
        }
    });
    
    await batch.commit();
    return { addedCount: chargesToImport.length - skippedCount, skippedCount };
  };

  const addTrip = async (tripData: Omit<Trip, 'id' | 'status' | 'vehicleId'>) => {
    if (!currentUser || !activeVehicleId) return;
    await db.collection('users').doc(currentUser.uid).collection('trips').add({ ...tripData, vehicleId: activeVehicleId, status: 'completed' });
    setActiveView('trajets');
  };
  const startTrip = async (tripData: Omit<Trip, 'id' | 'status' | 'endOdometer' | 'endPercentage' | 'vehicleId'>) => {
    if (!currentUser || !activeVehicleId) return;
    await db.collection('users').doc(currentUser.uid).collection('trips').add({ ...tripData, vehicleId: activeVehicleId, status: 'pending' });
    setActiveView('dashboard');
  };
  const completeTrip = async (tripId: string, completionData: { endOdometer: number; endPercentage: number; }) => {
    if (!currentUser) return;
    await db.collection('users').doc(currentUser.uid).collection('trips').doc(tripId).update({ ...completionData, status: 'completed' });
  };
  const deleteTrip = async (id: string) => {
    if (!currentUser) return;
    await db.collection('users').doc(currentUser.uid).collection('trips').doc(id).delete();
  };
  const importTrips = async (tripsToImport: Omit<Trip, 'id' | 'vehicleId'>[]): Promise<{ addedCount: number; skippedCount: number }> => {
    if (!currentUser || !activeVehicleId) return { addedCount: 0, skippedCount: 0 };
    const tripsColRef = db.collection('users').doc(currentUser.uid).collection('trips');
    const q = tripsColRef.where('vehicleId', '==', activeVehicleId);
    const querySnapshot = await q.get();
    const existingTripSet = new Set(querySnapshot.docs.map(d => `${d.data().date}-${d.data().startOdometer}`));
    
    let skippedCount = 0;
    const batch = db.batch();
    tripsToImport.forEach(newTrip => {
        const tripKey = `${newTrip.date}-${newTrip.startOdometer}`;
        if (!existingTripSet.has(tripKey)) {
            const newDocRef = tripsColRef.doc();
            batch.set(newDocRef, { ...newTrip, vehicleId: activeVehicleId, status: 'completed' });
            existingTripSet.add(tripKey);
        } else {
          skippedCount++;
        }
    });
    
    await batch.commit();
    return { addedCount: tripsToImport.length - skippedCount, skippedCount };
  };

  const addMaintenanceEntry = async (entryData: Omit<MaintenanceEntry, 'id' | 'vehicleId'>) => {
    if (!currentUser || !activeVehicleId) return;
    await db.collection('users').doc(currentUser.uid).collection('maintenance').add({ ...entryData, vehicleId: activeVehicleId });
    setActiveView('entretien');
  };
  const deleteMaintenanceEntry = async (id: string) => {
    if (!currentUser) return;
    await db.collection('users').doc(currentUser.uid).collection('maintenance').doc(id).delete();
  };
  const importMaintenanceEntries = async (entriesToImport: Omit<MaintenanceEntry, 'id' | 'vehicleId'>[]): Promise<{ addedCount: number; skippedCount: number }> => {
    if (!currentUser || !activeVehicleId) return { addedCount: 0, skippedCount: 0 };
    const maintenanceColRef = db.collection('users').doc(currentUser.uid).collection('maintenance');
    const q = maintenanceColRef.where('vehicleId', '==', activeVehicleId);
    const querySnapshot = await q.get();
    const existingEntrySet = new Set(querySnapshot.docs.map(d => `${d.data().date}-${d.data().odometer}`));

    let skippedCount = 0;
    const batch = db.batch();
    entriesToImport.forEach(newEntry => {
        const entryKey = `${newEntry.date}-${newEntry.odometer}`;
        if (!existingEntrySet.has(entryKey)) {
            const newDocRef = maintenanceColRef.doc();
            batch.set(newDocRef, { ...newEntry, vehicleId: activeVehicleId });
            existingEntrySet.add(entryKey);
        } else {
            skippedCount++;
        }
    });

    await batch.commit();
    return { addedCount: entriesToImport.length - skippedCount, skippedCount };
  };
  
  const importBackup = () => {
        if (!activeVehicle) {
            setNotification({ type: 'warning', message: "Veuillez d'abord sélectionner un véhicule." });
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.multiple = true;
        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files || files.length === 0) return;

            setNotification({ type: 'success', message: 'Importation en cours... Veuillez patienter.' });

            const results = {
                charges: { added: 0, skipped: 0 },
                trips: { added: 0, skipped: 0 },
                maintenance: { added: 0, skipped: 0 },
            };
            const errors: string[] = [];

            for (const file of Array.from(files)) {
                try {
                    const csvString = await file.text();
                    const workbook = XLSX.read(csvString, { type: 'string', raw: true, cellDates: true, FS: ';' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                    const parseFrDate = (dateStr: string): string => {
                        const [day, month, year] = dateStr.split('/');
                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString().split('T')[0];
                    };

                    if (file.name.includes('recharges')) {
                        const chargesToImport = data
                            .map((row): Omit<Charge, 'id' | 'vehicleId'> | null => {
                                try {
                                    if (!row['Date'] || row['Kilométrage (km)'] == null || row['Batterie Avant (%)'] == null || row['Batterie Après (%)'] == null || !row['Tarif']) {
                                        return null;
                                    }
                                    const tariff = row['Tarif'] as TariffType;
                                    const pricePerKwhStr = String(row['Prix/kWh (€)'] || '').replace(',', '.');
                                    const pricePerKwh = pricePerKwhStr && !isNaN(parseFloat(pricePerKwhStr)) ? parseFloat(pricePerKwhStr) : undefined;
                                    const charge = {
                                        date: parseFrDate(row['Date']),
                                        odometer: parseInt(row['Kilométrage (km)']),
                                        startPercentage: parseInt(row['Batterie Avant (%)']),
                                        endPercentage: parseInt(row['Batterie Après (%)']),
                                        tariff: tariff,
                                        customPrice: tariff === TariffType.QUICK_CHARGE ? pricePerKwh : undefined,
                                        pricePerKwh: pricePerKwh,
                                        status: 'completed' as 'completed',
                                    };
                                    if (isNaN(charge.odometer) || isNaN(charge.startPercentage) || isNaN(charge.endPercentage)) {
                                        return null;
                                    }
                                    return charge;
                                } catch (e) {
                                    console.warn("Skipping malformed charge row:", row, e);
                                    return null;
                                }
                            })
                            .filter((c): c is Omit<Charge, 'id' | 'vehicleId'> => c !== null);
                        const { addedCount, skippedCount } = await importCharges(chargesToImport);
                        results.charges.added += addedCount;
                        results.charges.skipped += skippedCount;
                    } else if (file.name.includes('trajets')) {
                         const tripsToImport = data
                            .map((row): Omit<Trip, 'id' | 'vehicleId'> | null => {
                                try {
                                    if (!row['Date'] || !row['Destination'] || row['KM Départ'] == null || row['KM Arrivée'] == null || row['Batterie Départ (%)'] == null || row['Batterie Arrivée (%)'] == null) {
                                        return null;
                                    }
                                    const trip = {
                                        date: parseFrDate(row['Date']),
                                        destination: row['Destination'],
                                        client: row['Client'],
                                        startOdometer: parseInt(row['KM Départ']),
                                        endOdometer: parseInt(row['KM Arrivée']),
                                        startPercentage: parseInt(row['Batterie Départ (%)']),
                                        endPercentage: parseInt(row['Batterie Arrivée (%)']),
                                        isBilled: String(row['Facturé']).toLowerCase() === 'oui',
                                        status: 'completed' as 'completed',
                                    };
                                    if (isNaN(trip.startOdometer) || isNaN(trip.endOdometer) || isNaN(trip.startPercentage) || isNaN(trip.endPercentage)) {
                                        return null;
                                    }
                                    return trip;
                                } catch (e) {
                                    console.warn("Skipping malformed trip row:", row, e);
                                    return null;
                                }
                            })
                            .filter((t): t is Omit<Trip, 'id' | 'vehicleId'> => t !== null);
                        const { addedCount, skippedCount } = await importTrips(tripsToImport);
                        results.trips.added += addedCount;
                        results.trips.skipped += skippedCount;
                    } else if (file.name.includes('entretien')) {
                        const maintenanceToImport = data
                            .map((row): Omit<MaintenanceEntry, 'id' | 'vehicleId'> | null => {
                                try {
                                    if (!row['Date'] || row['Kilométrage (km)'] == null || !row['Type'] || row['Coût (€)'] == null) {
                                        return null;
                                    }
                                    const entry = {
                                        date: parseFrDate(row['Date']),
                                        odometer: parseInt(row['Kilométrage (km)']),
                                        type: row['Type'] as MaintenanceType,
                                        details: row['Détails'],
                                        cost: parseFloat(String(row['Coût (€)']).replace(',', '.')),
                                    };
                                    if (isNaN(entry.odometer) || isNaN(entry.cost)) {
                                        return null;
                                    }
                                    return entry;
                                } catch (e) {
                                    console.warn("Skipping malformed maintenance row:", row, e);
                                    return null;
                                }
                            })
                            .filter((m): m is Omit<MaintenanceEntry, 'id' | 'vehicleId'> => m !== null);
                        const { addedCount, skippedCount } = await importMaintenanceEntries(maintenanceToImport);
                        results.maintenance.added += addedCount;
                        results.maintenance.skipped += skippedCount;
                    }
                } catch (err) {
                    console.error('Error processing file:', file.name, err);
                    errors.push(file.name);
                }
            }

            let summary = 'Importation terminée. ';
            if (results.charges.added > 0) summary += `${results.charges.added} recharge(s) ajoutée(s). `;
            if (results.trips.added > 0) summary += `${results.trips.added} trajet(s) ajouté(s). `;
            if (results.maintenance.added > 0) summary += `${results.maintenance.added} entretien(s) ajouté(s). `;
            
            const totalSkipped = results.charges.skipped + results.trips.skipped + results.maintenance.skipped;
            if (totalSkipped > 0) summary += `${totalSkipped} doublon(s) ignoré(s). `;

            if (errors.length > 0) {
                setNotification({ type: 'warning', message: `${summary} Erreur sur les fichiers: ${errors.join(', ')}` });
            } else {
                setNotification({ type: 'success', message: summary });
            }
        };
        input.click();
  };

  // Memoized filters for active vehicle
  const chargesForActiveVehicle = useMemo(() => rawCharges.filter(c => c.vehicleId === activeVehicleId), [rawCharges, activeVehicleId]);
  const tripsForActiveVehicle = useMemo(() => rawTrips.filter(t => t.vehicleId === activeVehicleId), [rawTrips, activeVehicleId]);
  const maintenanceForActiveVehicle = useMemo(() => rawMaintenance.filter(m => m.vehicleId === activeVehicleId), [rawMaintenance, activeVehicleId]);
  
  const pendingCharges = useMemo(() => chargesForActiveVehicle.filter(c => c.status === 'pending').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [chargesForActiveVehicle]);
  const completedCharges = useMemo(() => chargesForActiveVehicle.filter(c => c.status === 'completed'), [chargesForActiveVehicle]);
  const pendingTrips = useMemo(() => tripsForActiveVehicle.filter(t => t.status === 'pending').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [tripsForActiveVehicle]);

  const processedCharges = useMemo(() => activeVehicle ? processCharges(completedCharges, settings, activeVehicle) : [], [completedCharges, settings, activeVehicle]);
  const processedTrips = useMemo(() => activeVehicle ? processTrips(tripsForActiveVehicle, settings, activeVehicle, processedCharges) : [], [tripsForActiveVehicle, settings, activeVehicle, processedCharges]);
  const processedMaintenanceEntries = useMemo(() => processMaintenanceEntries(maintenanceForActiveVehicle), [maintenanceForActiveVehicle]);

  const value = {
    settings,
    updateSettings,
    charges: processedCharges,
    addCharge,
    deleteCharge,
    importCharges,
    pendingCharges,
    startCharge,
    completeCharge,
    trips: processedTrips,
    addTrip,
    deleteTrip,
    importTrips,
    pendingTrips,
    startTrip,
    completeTrip,
    maintenanceEntries: processedMaintenanceEntries,
    addMaintenanceEntry,
    deleteMaintenanceEntry,
    importMaintenanceEntries,
    vehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    activeVehicle,
    activeVehicleId,
    setActiveVehicleId,
    attemptVehicleSwitch,
    vehiclePresets,
    isLoading,
    isOnline,
    notification,
    setNotification,
    activeView,
    setActiveView,
    vehicleToUnlock,
    setVehicleToUnlock,
    rawCharges,
    rawTrips,
    rawMaintenance,
    logout,
    downloadBackup,
    importBackup,
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