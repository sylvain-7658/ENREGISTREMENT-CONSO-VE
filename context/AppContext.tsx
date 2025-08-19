import React, { createContext, useContext, useMemo, FC, PropsWithChildren, useState, useEffect } from 'react';
import { Settings, Charge, ProcessedCharge, Vehicle, Trip, ProcessedTrip, MaintenanceEntry, ProcessedMaintenanceEntry, View, TariffType } from '../types';
import { processCharges, processTrips, processMaintenanceEntries } from '../utils/calculations';
import { vehicles as defaultVehles } from '../data/vehicleData';
import { useAuth } from './AuthContext';
import { db, firestorePromise } from '../firebase/config';

export type NotificationType = {
  message: string;
  type: 'warning' | 'success';
}

interface AppContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  charges: ProcessedCharge[];
  addCharge: (charge: Omit<Charge, 'id' | 'status'>) => void;
  deleteCharge: (id: string) => void;
  importCharges: (charges: Omit<Charge, 'id'>[]) => Promise<{ addedCount: number; skippedCount: number }>;
  pendingCharges: Charge[];
  startCharge: (charge: Omit<Charge, 'id' | 'status' | 'endPercentage' | 'tariff' | 'customPrice'>) => void;
  completeCharge: (chargeId: string, completionData: { endPercentage: number; tariff: TariffType; customPrice?: number; }) => void;
  trips: ProcessedTrip[];
  addTrip: (trip: Omit<Trip, 'id' | 'status'>) => void;
  deleteTrip: (id: string) => void;
  importTrips: (trips: Omit<Trip, 'id'>[]) => Promise<{ addedCount: number; skippedCount: number }>;
  pendingTrips: Trip[];
  startTrip: (trip: Omit<Trip, 'id' | 'status' | 'endOdometer' | 'endPercentage'>) => void;
  completeTrip: (tripId: string, completionData: { endOdometer: number; endPercentage: number; }) => void;
  maintenanceEntries: ProcessedMaintenanceEntry[];
  addMaintenanceEntry: (entry: Omit<MaintenanceEntry, 'id'>) => void;
  deleteMaintenanceEntry: (id: string) => void;
  vehicles: Vehicle[];
  isLoading: boolean;
  isOnline: boolean;
  notification: NotificationType | null;
  setNotification: React.Dispatch<React.SetStateAction<NotificationType | null>>;
  activeView: View;
  setActiveView: React.Dispatch<React.SetStateAction<View>>;
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
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [rawCharges, setRawCharges] = useState<Charge[]>(EMPTY_CHARGES);
  const [rawTrips, setRawTrips] = useState<Trip[]>(EMPTY_TRIPS);
  const [rawMaintenance, setRawMaintenance] = useState<MaintenanceEntry[]>(EMPTY_MAINTENANCE);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles] = useState<Vehicle[]>(defaultVehles);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNotification({ message: 'Connexion rétablie !', type: 'success' });
      setTimeout(() => {
        setNotification(currentNotif => (currentNotif?.type === 'success' ? null : currentNotif));
      }, 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNotification({ message: "Connexion perdue. Vous êtes en mode hors ligne.", type: 'warning' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!currentUser) {
      setSettings(defaultSettings);
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
      // Wait for persistence to be enabled before trying to access Firestore.
      // This fixes a potential race condition.
      await firestorePromise;

      if (isCancelled) {
        return;
      }

      const userId = currentUser.uid;
      const userDocRef = db.collection('users').doc(userId);
      const chargesColRef = userDocRef.collection('charges');
      const tripsColRef = userDocRef.collection('trips');
      const maintenanceColRef = userDocRef.collection('maintenance');

      unsubscribes = [
        userDocRef.onSnapshot((docSnap) => {
          if (docSnap.exists) {
            setSettings({ ...defaultSettings, ...(docSnap.data() as Partial<Settings>) });
          } else {
            userDocRef.set(defaultSettings);
            setSettings(defaultSettings);
          }
        }),
        chargesColRef.onSnapshot((snapshot) => {
          const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            if (docData.date && typeof docData.date.toDate === 'function') {
                docData.date = docData.date.toDate().toISOString();
            }
            return ({ id: doc.id, ...docData } as Charge);
          });
          setRawCharges(data);
        }),
        tripsColRef.onSnapshot((snapshot) => {
          const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            if (docData.date && typeof docData.date.toDate === 'function') {
                docData.date = docData.date.toDate().toISOString();
            }
            return ({ id: doc.id, ...docData } as Trip);
          });
          setRawTrips(data);
        }),
        maintenanceColRef.onSnapshot((snapshot) => {
          const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            if (docData.date && typeof docData.date.toDate === 'function') {
                docData.date = docData.date.toDate().toISOString();
            }
            return ({ id: doc.id, ...docData } as MaintenanceEntry);
          });
          setRawMaintenance(data);
        }),
      ];
      
      setIsLoading(false);
    };

    setupFirestoreListeners();

    return () => {
        isCancelled = true;
        unsubscribes.forEach(unsub => unsub());
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser]);

  const updateSettings = async (newSettingsPart: Partial<Settings>) => {
    if (!currentUser) return;
    const userDocRef = db.collection('users').doc(currentUser.uid);
    await userDocRef.set(newSettingsPart, { merge: true });
  };
  
  const addCharge = async (chargeData: Omit<Charge, 'id' | 'status'>) => {
    if (!currentUser) return;
    const chargesColRef = db.collection('users').doc(currentUser.uid).collection('charges');
    await chargesColRef.add({ ...chargeData, status: 'completed' });
    setActiveView('journal');
  };

  const startCharge = async (chargeData: Omit<Charge, 'id' | 'status' | 'endPercentage' | 'tariff' | 'customPrice'>) => {
    if (!currentUser) return;
    const chargesColRef = db.collection('users').doc(currentUser.uid).collection('charges');
    await chargesColRef.add({ ...chargeData, status: 'pending' });
    setActiveView('dashboard');
  };

  const completeCharge = async (chargeId: string, completionData: { endPercentage: number; tariff: TariffType; customPrice?: number; }) => {
    if (!currentUser) return;
    const chargeDocRef = db.collection('users').doc(currentUser.uid).collection('charges').doc(chargeId);
    await chargeDocRef.update({ ...completionData, status: 'completed' });
  };
  
  const deleteCharge = async (id: string) => {
    if (!currentUser) return;
    const chargeDocRef = db.collection('users').doc(currentUser.uid).collection('charges').doc(id);
    await chargeDocRef.delete();
  }

  const importCharges = async (chargesToImport: Omit<Charge, 'id'>[]): Promise<{ addedCount: number; skippedCount: number }> => {
    if (!currentUser) return { addedCount: 0, skippedCount: 0 };
    
    const chargesColRef = db.collection('users').doc(currentUser.uid).collection('charges');
    const querySnapshot = await chargesColRef.get();
    const existingOdometerSet = new Set(querySnapshot.docs.map(doc => doc.data().odometer));

    const uniqueNewCharges: Omit<Charge, 'id'>[] = [];
    let skippedCount = 0;

    for (const newCharge of chargesToImport) {
        if (!existingOdometerSet.has(newCharge.odometer)) {
            uniqueNewCharges.push(newCharge);
            existingOdometerSet.add(newCharge.odometer);
        } else {
          skippedCount++;
        }
    }
    
    if (uniqueNewCharges.length > 0) {
      const batch = db.batch();
      uniqueNewCharges.forEach(charge => {
        const newDocRef = chargesColRef.doc();
        batch.set(newDocRef, { ...charge, status: 'completed' });
      });
      await batch.commit();
    }
    
    return { addedCount: uniqueNewCharges.length, skippedCount };
  };

  const addTrip = async (tripData: Omit<Trip, 'id' | 'status'>) => {
    if (!currentUser) return;
    const tripsColRef = db.collection('users').doc(currentUser.uid).collection('trips');
    await tripsColRef.add({ ...tripData, status: 'completed' });
    setActiveView('trajets');
  };

  const startTrip = async (tripData: Omit<Trip, 'id' | 'status' | 'endOdometer' | 'endPercentage'>) => {
    if (!currentUser) return;
    const tripsColRef = db.collection('users').doc(currentUser.uid).collection('trips');
    await tripsColRef.add({ ...tripData, status: 'pending' });
    setActiveView('dashboard');
  };

  const completeTrip = async (tripId: string, completionData: { endOdometer: number; endPercentage: number; }) => {
    if (!currentUser) return;
    const tripDocRef = db.collection('users').doc(currentUser.uid).collection('trips').doc(tripId);
    await tripDocRef.update({ ...completionData, status: 'completed' });
  };

  const deleteTrip = async (id: string) => {
    if (!currentUser) return;
    const tripDocRef = db.collection('users').doc(currentUser.uid).collection('trips').doc(id);
    await tripDocRef.delete();
  };

  const importTrips = async (tripsToImport: Omit<Trip, 'id'>[]): Promise<{ addedCount: number; skippedCount: number }> => {
    if (!currentUser) return { addedCount: 0, skippedCount: 0 };

    const tripsColRef = db.collection('users').doc(currentUser.uid).collection('trips');
    const querySnapshot = await tripsColRef.get();
    const existingTripSet = new Set(querySnapshot.docs.map(d => `${d.data().date}-${d.data().startOdometer}`));
    
    const uniqueNewTrips: Omit<Trip, 'id'>[] = [];
    let skippedCount = 0;

    for (const newTrip of tripsToImport) {
        const tripKey = `${newTrip.date}-${newTrip.startOdometer}`;
        if (!existingTripSet.has(tripKey)) {
            uniqueNewTrips.push(newTrip);
            existingTripSet.add(tripKey);
        } else {
          skippedCount++;
        }
    }
    
    if (uniqueNewTrips.length > 0) {
      const batch = db.batch();
      uniqueNewTrips.forEach(trip => {
        const newDocRef = tripsColRef.doc();
        batch.set(newDocRef, { ...trip, status: 'completed' });
      });
      await batch.commit();
    }
    
    return { addedCount: uniqueNewTrips.length, skippedCount };
  };

  const addMaintenanceEntry = async (entryData: Omit<MaintenanceEntry, 'id'>) => {
    if (!currentUser) return;
    const maintenanceColRef = db.collection('users').doc(currentUser.uid).collection('maintenance');
    await maintenanceColRef.add(entryData);
    setActiveView('entretien');
  };

  const deleteMaintenanceEntry = async (id: string) => {
    if (!currentUser) return;
    const maintenanceDocRef = db.collection('users').doc(currentUser.uid).collection('maintenance').doc(id);
    await maintenanceDocRef.delete();
  };

  const pendingCharges = useMemo(() => rawCharges.filter(c => c.status === 'pending').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [rawCharges]);
  const completedCharges = useMemo(() => rawCharges.filter(c => c.status === 'completed'), [rawCharges]);
  
  const pendingTrips = useMemo(() => rawTrips.filter(t => t.status === 'pending').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [rawTrips]);

  const processedCharges = useMemo(() => processCharges(completedCharges, settings), [completedCharges, settings]);
  const processedTrips = useMemo(() => {
    return processTrips(rawTrips, settings, processedCharges);
  }, [rawTrips, settings, processedCharges]);
  const processedMaintenanceEntries = useMemo(() => processMaintenanceEntries(rawMaintenance), [rawMaintenance]);

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
    vehicles,
    isLoading,
    isOnline,
    notification,
    setNotification,
    activeView,
    setActiveView,
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