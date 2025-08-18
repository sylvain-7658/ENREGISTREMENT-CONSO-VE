
import React, { createContext, useContext, useMemo, FC, PropsWithChildren, useState, useEffect } from 'react';
import { Settings, Charge, ProcessedCharge, Vehicle, Trip, ProcessedTrip, MaintenanceEntry, ProcessedMaintenanceEntry } from '../types';
import { processCharges, processTrips, processMaintenanceEntries } from '../utils/calculations';
import { vehicles as defaultVehles } from '../data/vehicleData';
import { auth, db } from '../firebase/config';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, collection, onSnapshot, addDoc, deleteDoc, setDoc, WithFieldValue, QueryDocumentSnapshot, DocumentData, FirestoreError } from 'firebase/firestore';

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'ERROR';

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
  user: User | null; // Firebase User
  isLoading: boolean;
  connectionStatus: ConnectionStatus;
  connectionMessage: string;
  logout: () => Promise<void>;
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

const fromFirestore = <T extends { id: string }>(doc: QueryDocumentSnapshot<DocumentData>): T => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
    } as T;
};

export const AppProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [rawCharges, setRawCharges] = useState<Charge[]>(EMPTY_CHARGES);
  const [rawTrips, setRawTrips] = useState<Trip[]>(EMPTY_TRIPS);
  const [rawMaintenance, setRawMaintenance] = useState<MaintenanceEntry[]>(EMPTY_MAINTENANCE);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles] = useState<Vehicle[]>(defaultVehles);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('ONLINE');
  const [connectionMessage, setConnectionMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setSettings(defaultSettings);
      setRawCharges(EMPTY_CHARGES);
      setRawTrips(EMPTY_TRIPS);
      setRawMaintenance(EMPTY_MAINTENANCE);
      return;
    }

    const handleError = (error: FirestoreError) => {
        console.error("Firestore Error:", error);
        if (error.code === 'unavailable') {
            if (connectionStatus !== 'OFFLINE') {
                setConnectionStatus('OFFLINE');
                setConnectionMessage("Connexion à la base de données impossible. L'application est en mode hors ligne.");
            }
        } else {
            if (connectionStatus !== 'ERROR') {
                setConnectionStatus('ERROR');
                setConnectionMessage(`Erreur de base de données (${error.code}). Vérifiez la configuration de votre projet Firebase.`);
            }
        }
    };
    
    const handleSuccess = () => {
        if (connectionStatus !== 'ONLINE') {
            setConnectionStatus('ONLINE');
            setConnectionMessage("");
        }
    };

    const userDocRef = doc(db, 'users', user.uid);
    const settingsDocRef = doc(userDocRef, 'data', 'settings');
    
    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...defaultSettings, ...docSnap.data() });
      } else {
        setDoc(settingsDocRef, defaultSettings, { merge: true });
        setSettings(defaultSettings);
      }
      handleSuccess();
    }, handleError);

    const chargesColRef = collection(userDocRef, 'charges');
    const unsubCharges = onSnapshot(chargesColRef, (snapshot) => {
      setRawCharges(snapshot.docs.map(d => fromFirestore<Charge>(d)));
      handleSuccess();
    }, handleError);

    const tripsColRef = collection(userDocRef, 'trips');
    const unsubTrips = onSnapshot(tripsColRef, (snapshot) => {
      setRawTrips(snapshot.docs.map(d => fromFirestore<Trip>(d)));
      handleSuccess();
    }, handleError);

    const maintenanceColRef = collection(userDocRef, 'maintenance');
    const unsubMaintenance = onSnapshot(maintenanceColRef, (snapshot) => {
      setRawMaintenance(snapshot.docs.map(d => fromFirestore<MaintenanceEntry>(d)));
      handleSuccess();
    }, handleError);

    return () => {
      unsubSettings();
      unsubCharges();
      unsubTrips();
      unsubMaintenance();
    };
  }, [user, connectionStatus]);

  const updateSettings = async (newSettingsPart: Partial<Settings>) => {
    if (!user) return;
    const settingsDocRef = doc(db, 'users', user.uid, 'data', 'settings');
    await setDoc(settingsDocRef, newSettingsPart, { merge: true });
  };
  
  const addCharge = async (chargeData: Omit<Charge, 'id'>) => {
    if (!user) return;
    const chargesColRef = collection(db, 'users', user.uid, 'charges');
    await addDoc(chargesColRef, chargeData as WithFieldValue<Omit<Charge, 'id'>>);
  };
  
  const deleteCharge = async (id: string) => {
    if (!user) return;
    const chargeDocRef = doc(db, 'users', user.uid, 'charges', id);
    await deleteDoc(chargeDocRef);
  }

  const importCharges = async (chargesToImport: Omit<Charge, 'id'>[]): Promise<{ addedCount: number; skippedCount: number }> => {
    const existingOdometerSet = new Set(rawCharges.map(c => c.odometer));
    let addedCount = 0;
    
    for (const newCharge of chargesToImport) {
        if (!existingOdometerSet.has(newCharge.odometer)) {
            await addCharge(newCharge);
            existingOdometerSet.add(newCharge.odometer);
            addedCount++;
        }
    }
    
    return { addedCount, skippedCount: chargesToImport.length - addedCount };
  };

  const addTrip = async (tripData: Omit<Trip, 'id'>) => {
    if (!user) return;
    const tripsColRef = collection(db, 'users', user.uid, 'trips');
    await addDoc(tripsColRef, tripData as WithFieldValue<Omit<Trip, 'id'>>);
  };

  const deleteTrip = async (id: string) => {
    if (!user) return;
    const tripDocRef = doc(db, 'users', user.uid, 'trips', id);
    await deleteDoc(tripDocRef);
  };

  const importTrips = async (tripsToImport: Omit<Trip, 'id'>[]): Promise<{ addedCount: number; skippedCount: number }> => {
    const existingTripSet = new Set(rawTrips.map(t => `${t.date}-${t.startOdometer}`));
    let addedCount = 0;

    for (const newTrip of tripsToImport) {
        const tripKey = `${newTrip.date}-${newTrip.startOdometer}`;
        if (!existingTripSet.has(tripKey)) {
            await addTrip(newTrip);
            existingTripSet.add(tripKey);
            addedCount++;
        }
    }
    
    return { addedCount, skippedCount: tripsToImport.length - addedCount };
  };

  const addMaintenanceEntry = async (entryData: Omit<MaintenanceEntry, 'id'>) => {
    if (!user) return;
    const maintenanceColRef = collection(db, 'users', user.uid, 'maintenance');
    await addDoc(maintenanceColRef, entryData as WithFieldValue<Omit<MaintenanceEntry, 'id'>>);
  };

  const deleteMaintenanceEntry = async (id: string) => {
    if (!user) return;
    const maintenanceDocRef = doc(db, 'users', user.uid, 'maintenance', id);
    await deleteDoc(maintenanceDocRef);
  };

  const logout = async () => {
    await signOut(auth);
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
    user,
    isLoading,
    connectionStatus,
    connectionMessage,
    logout,
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
