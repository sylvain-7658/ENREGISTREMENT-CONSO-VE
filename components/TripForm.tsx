import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Trip } from '../types';
import Card from './Card';
import { GoogleGenAI, Type } from '@google/genai';
import { Camera, X, Loader2, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FormField = ({ label, id, children }: { label: string; id: string; children: React.ReactNode }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <div className="mt-1">{children}</div>
    </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"/>
);

const modalBackdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalContentVariants = {
    hidden: { scale: 0.9, y: 20 },
    visible: { scale: 1, y: 0 },
};

const CameraModal = ({ isOpen, onClose, onCapture, isAnalyzing }: { isOpen: boolean, onClose: () => void, onCapture: (data: string) => void, isAnalyzing: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            if (isOpen && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                     const constraints = {
                        video: {
                            facingMode: 'environment',
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                        }
                    };
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Error accessing camera: ", err);
                    alert("Impossible d'accéder à la caméra. Veuillez vérifier les autorisations et les capacités de votre appareil.");
                    onClose();
                }
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen, onClose]);

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            onCapture(canvas.toDataURL('image/jpeg', 0.95));
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={modalBackdropVariants.hidden}
                    animate={modalBackdropVariants.visible}
                    exit={modalBackdropVariants.hidden}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={modalContentVariants.hidden}
                        animate={modalContentVariants.visible}
                        exit={modalContentVariants.hidden}
                        className="relative w-full max-w-2xl bg-slate-800 rounded-lg overflow-hidden"
                    >
                         {isAnalyzing && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-20">
                                <Loader2 className="animate-spin h-12 w-12 mb-4" />
                                <p className="text-lg font-semibold">Analyse de l'image en cours...</p>
                                <p className="text-sm">Veuillez patienter.</p>
                            </div>
                        )}
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="absolute top-4 left-4 right-4 text-center text-white text-sm bg-black/40 p-2 rounded-lg">
                           <p>Tenez votre téléphone horizontalement pour un meilleur résultat.</p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex justify-center">
                           <button onClick={handleTakePhoto} className="p-4 bg-white rounded-full shadow-lg" aria-label="Prendre une photo">
                               <Camera size={24} className="text-slate-800" />
                           </button>
                        </div>
                         <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white" aria-label="Fermer la caméra">
                            <X size={20} />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const getDistance = (coords1: GeolocationCoordinates, coords2: GeolocationCoordinates): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
    const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coords1.latitude * Math.PI / 180) * Math.cos(coords2.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const TripForm: React.FC = () => {
    const { addTrip, startTrip } = useAppContext();
    const { currentUser } = useAuth();
    const today = new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(today);
    const [destination, setDestination] = useState('');
    const [client, setClient] = useState('');
    const [startOdometer, setStartOdometer] = useState('');
    const [distance, setDistance] = useState('');
    const [startPercentage, setStartPercentage] = useState('');
    const [endPercentage, setEndPercentage] = useState('');
    const [isBilled, setIsBilled] = useState(false);
    const [error, setError] = useState('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // GPS Tracking State
    const [isTracking, setIsTracking] = useState(false);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [positions, setPositions] = useState<GeolocationCoordinates[]>([]);
    const [trackingError, setTrackingError] = useState('');
    const [liveDistance, setLiveDistance] = useState(0);

    const resetForm = () => {
        setDestination('');
        setClient('');
        setStartOdometer('');
        setDistance('');
        setStartPercentage('');
        setEndPercentage('');
        setIsBilled(false);
        setError('');
        
        if (isTracking && watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
        setIsTracking(false);
        setWatchId(null);
        setPositions([]);
        setTrackingError('');
        setLiveDistance(0);
    };

    const analyzeDashboardImage = async (base64Image: string) => {
        setIsAnalyzing(true);
        setError('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const imagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image.split(',')[1],
                },
            };

            const textPart = {
                text: "Analyse cette image du tableau de bord d'un véhicule. Extrais le kilométrage total (odometer) en kilomètres et le pourcentage de la batterie (batteryPercentage). Le kilométrage est souvent la plus grande valeur suivie de 'km'. Le pourcentage est indiqué par le symbole '%'. Ne renvoie que des nombres entiers."
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            odometer: { type: Type.INTEGER, description: 'Le kilométrage total du véhicule.' },
                            batteryPercentage: { type: Type.INTEGER, description: 'Le pourcentage de la batterie.' }
                        },
                        required: ["odometer", "batteryPercentage"],
                    },
                },
            });
            
            const jsonStr = response.text.trim();
            const data = JSON.parse(jsonStr);

            if (data.odometer) {
                setStartOdometer(String(data.odometer));
            }
            if (data.batteryPercentage) {
                setStartPercentage(String(data.batteryPercentage));
            }

            if (!data.odometer && !data.batteryPercentage) {
                 setError("L'IA n'a pas pu extraire les données. Essayez une photo plus nette.");
            }

        } catch (e) {
            console.error("Gemini API error:", e);
            setError("Erreur lors de l'analyse de l'image. Veuillez réessayer.");
        } finally {
            setIsAnalyzing(false);
            setIsCameraOpen(false);
        }
    };

    const handleStartTrip = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const startOdo = parseInt(startOdometer, 10);
        const startPerc = parseInt(startPercentage, 10);
        
        if (isNaN(startOdo) || isNaN(startPerc) || !destination.trim() || !date) {
            setError('Veuillez remplir la date, la destination, le kilométrage et le % de départ.'); return;
        }
        if (startPerc < 0 || startPerc > 100) {
            setError('Le pourcentage doit être entre 0 et 100.'); return;
        }
        if (startOdo <= 0) {
            setError('Le kilométrage doit être positif.'); return;
        }
        
        const tripData: Omit<Trip, 'id' | 'status' | 'endOdometer' | 'endPercentage' | 'vehicleId'> = {
            date,
            destination: destination.trim(),
            startOdometer: startOdo,
            startPercentage: startPerc,
            isBilled,
        };

        const clientName = client.trim();
        if (clientName) {
            tripData.client = clientName;
        }

        startTrip(tripData);
        resetForm();
    };

    const handleStartTracking = () => {
        if (!navigator.geolocation) {
            setTrackingError("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        setTrackingError('');
        setPositions([]);
        setLiveDistance(0);
        setDistance('');
        setIsTracking(true);

        const id = navigator.geolocation.watchPosition(
            (position) => {
                setPositions(prev => {
                    const newPositions = [...prev, position.coords];
                    if (newPositions.length > 1) {
                        let totalDist = 0;
                        for (let i = 0; i < newPositions.length - 1; i++) {
                            totalDist += getDistance(newPositions[i], newPositions[i + 1]);
                        }
                        setLiveDistance(totalDist);
                    }
                    return newPositions;
                });
            },
            (error) => {
                let message = "Erreur de géolocalisation.";
                if (error.code === 1) message = "Veuillez autoriser l'accès à votre position.";
                if (error.code === 2) message = "Position non disponible.";
                if (error.code === 3) message = "Timeout de la requête de position.";
                setTrackingError(message);
                setIsTracking(false);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
        setWatchId(id);
    };

    const handleStopTracking = () => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
        setIsTracking(false);
        setWatchId(null);
        if (positions.length > 1) {
            let totalDist = 0;
            for (let i = 0; i < positions.length - 1; i++) {
                totalDist += getDistance(positions[i], positions[i + 1]);
            }
            setDistance(totalDist.toFixed(2));
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const startOdo = parseInt(startOdometer, 10);
        const dist = parseFloat(distance);
        const startPerc = parseInt(startPercentage, 10);
        const endPerc = parseInt(endPercentage, 10);

        if (isNaN(startOdo) || isNaN(dist) || isNaN(startPerc) || isNaN(endPerc) || !destination.trim()) {
            setError('Veuillez remplir tous les champs avec des données valides.');
            return;
        }
        if (startPerc < 0 || startPerc > 100 || endPerc < 0 || endPerc > 100) {
            setError('Le pourcentage doit être entre 0 et 100.');
            return;
        }
        if (dist <= 0) {
            setError("La distance doit être un nombre positif.");
            return;
        }
        const endOdo = startOdo + dist;

        if (endPerc >= startPerc) {
            setError('Le pourcentage à l\'arrivée doit être inférieur à celui de départ.');
            return;
        }

        const newTrip: Omit<Trip, 'id' | 'status' | 'vehicleId'> = {
            date,
            destination: destination.trim(),
            startOdometer: startOdo,
            endOdometer: endOdo,
            startPercentage: startPerc,
            endPercentage: endPerc,
            isBilled,
        };
        
        const clientName = client.trim();
        if (clientName) {
            (newTrip as Partial<Trip>).client = clientName;
        }

        addTrip(newTrip);
        resetForm();
    };

    return (
        <Card>
             <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={analyzeDashboardImage}
                isAnalyzing={isAnalyzing}
            />
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-baseline">
                <span>Ajouter un trajet</span>
                 {currentUser && <span className="text-lg font-medium text-slate-500 dark:text-slate-400 ml-3 truncate" title={currentUser.email || ''}>pour {currentUser.displayName || currentUser.email}</span>}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField label="Date du trajet" id="date">
                        <Input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required/>
                    </FormField>
                    <FormField label="Destination" id="destination">
                        <Input type="text" id="destination" placeholder="ex: Bureau" value={destination} onChange={e => setDestination(e.target.value)} required/>
                    </FormField>
                </div>
                <FormField label="Client (optionnel)" id="client">
                    <Input type="text" id="client" placeholder="ex: Acme Corp" value={client} onChange={e => setClient(e.target.value)} />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Kilométrage départ (km)" id="startOdometer">
                         <div className="relative">
                            <Input type="number" id="startOdometer" placeholder="ex: 45120" value={startOdometer} onChange={e => setStartOdometer(e.target.value)} required/>
                             <button type="button" onClick={() => setIsCameraOpen(true)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Scanner le tableau de bord">
                                <Camera size={18} />
                            </button>
                        </div>
                    </FormField>
                    <FormField label="Batterie au départ (%)" id="startPercentage">
                        <Input type="number" id="startPercentage" placeholder="ex: 80" value={startPercentage} onChange={e => setStartPercentage(e.target.value)} required/>
                    </FormField>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                        <MapIcon size={18} className="text-blue-500"/>
                        Suivi GPS du trajet
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        Calculez la distance automatiquement. Pour un suivi précis, gardez cet onglet ouvert durant le trajet.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button 
                            type="button" 
                            onClick={isTracking ? handleStopTracking : handleStartTracking}
                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg shadow-sm transition-colors ${
                                isTracking 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {isTracking ? <Loader2 size={16} className="animate-spin" /> : <MapIcon size={16} />}
                            <span>{isTracking ? 'Arrêter le suivi' : 'Démarrer le suivi'}</span>
                        </button>
                        {isTracking && (
                             <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                Distance actuelle : {liveDistance.toFixed(2)} km
                            </p>
                        )}
                    </div>
                     {trackingError && <p className="text-red-500 text-sm font-semibold mt-2">{trackingError}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Distance du trajet (km)" id="distance">
                        <Input type="number" step="0.1" id="distance" placeholder="ex: 35.5" value={distance} onChange={e => setDistance(e.target.value)} required/>
                    </FormField>
                    <FormField label="Batterie à l'arrivée (%)" id="endPercentage">
                        <Input type="number" id="endPercentage" placeholder="ex: 72" value={endPercentage} onChange={e => setEndPercentage(e.target.value)} required/>
                    </FormField>
                </div>

                <div className="flex items-start pt-2">
                    <div className="flex items-center h-5">
                        <input
                            id="isBilled"
                            name="isBilled"
                            type="checkbox"
                            checked={isBilled}
                            onChange={(e) => setIsBilled(e.target.checked)}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="isBilled" className="font-medium text-slate-700 dark:text-slate-300">
                            Facturer ce trajet
                        </label>
                        <p className="text-slate-500 dark:text-slate-400">Cocher pour calculer le montant de la facturation client.</p>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm font-semibold mt-2">{error}</p>}
                <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3">
                    <button type="button" onClick={handleStartTrip} className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-lg shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                        Démarrer le trajet
                    </button>
                     <button type="submit" className="px-6 py-2 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        Ajouter (complet)
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default TripForm;