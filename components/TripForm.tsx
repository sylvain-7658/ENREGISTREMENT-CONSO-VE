
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Trip } from '../types';
import Card from './Card';
import { GoogleGenAI, Type } from '@google/genai';
import { Camera, X, Loader2 } from 'lucide-react';
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

const CameraModal = ({ isOpen, onClose, onCapture, isAnalyzing }: { isOpen: boolean, onClose: () => void, onCapture: (data: string) => void, isAnalyzing: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            if (isOpen && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Error accessing camera: ", err);
                    alert("Impossible d'accéder à la caméra. Veuillez vérifier les autorisations de votre navigateur.");
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
            onCapture(canvas.toDataURL('image/jpeg'));
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
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

const TripForm: React.FC = () => {
    const { addTrip, startTrip } = useAppContext();
    const { currentUser } = useAuth();
    const today = new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(today);
    const [destination, setDestination] = useState('');
    const [client, setClient] = useState('');
    const [startOdometer, setStartOdometer] = useState('');
    const [endOdometer, setEndOdometer] = useState('');
    const [startPercentage, setStartPercentage] = useState('');
    const [endPercentage, setEndPercentage] = useState('');
    const [isBilled, setIsBilled] = useState(false);
    const [error, setError] = useState('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const resetForm = () => {
        setDestination('');
        setClient('');
        setStartOdometer('');
        setEndOdometer('');
        setStartPercentage('');
        setEndPercentage('');
        setIsBilled(false);
        setError('');
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
        
        const tripData: Omit<Trip, 'id' | 'status' | 'endOdometer' | 'endPercentage'> = {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const startOdo = parseInt(startOdometer, 10);
        const endOdo = parseInt(endOdometer, 10);
        const startPerc = parseInt(startPercentage, 10);
        const endPerc = parseInt(endPercentage, 10);

        if (isNaN(startOdo) || isNaN(endOdo) || isNaN(startPerc) || isNaN(endPerc) || !destination.trim()) {
            setError('Veuillez remplir tous les champs avec des données valides.');
            return;
        }
        if (startPerc < 0 || startPerc > 100 || endPerc < 0 || endPerc > 100) {
            setError('Le pourcentage doit être entre 0 et 100.');
            return;
        }
        if (endOdo <= startOdo) {
            setError('Le kilométrage d\'arrivée doit être supérieur à celui de départ.');
            return;
        }
        if (endPerc >= startPerc) {
            setError('Le pourcentage à l\'arrivée doit être inférieur à celui de départ.');
            return;
        }

        const newTrip: Omit<Trip, 'id' | 'status'> = {
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
                    <FormField label="Kilométrage arrivée (km)" id="endOdometer">
                        <Input type="number" id="endOdometer" placeholder="ex: 45155" value={endOdometer} onChange={e => setEndOdometer(e.target.value)} />
                    </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField label="Batterie au départ (%)" id="startPercentage">
                        <Input type="number" id="startPercentage" placeholder="ex: 80" value={startPercentage} onChange={e => setStartPercentage(e.target.value)} required/>
                    </FormField>
                    <FormField label="Batterie à l'arrivée (%)" id="endPercentage">
                        <Input type="number" id="endPercentage" placeholder="ex: 72" value={endPercentage} onChange={e => setEndPercentage(e.target.value)} />
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