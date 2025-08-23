import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Card from './Card';
import { Settings as SettingsType, VehiclePreset, UserVehicle } from '../types';
import { User, Mail, Car, Zap, Sun, Leaf, FileText, LogOut, DownloadCloud, Smartphone, Gavel, Plus, Trash2, Edit, Save, XCircle, KeyRound, Sparkles, Loader2, Upload, Database } from 'lucide-react';
import Accordion from './Accordion';
import { GoogleGenAI, Type } from '@google/genai';

const InputGroup = ({ label, id, value, onChange, type = "number", unit, step = "0.01", disabled = false, placeholder = '', maxLength, children }: { 
    label: string;
    id: any; 
    value: string | number; 
    onChange: (id: any, value: string | number) => void; 
    type?: "number" | "email" | "text" | "password"; 
    unit: string; 
    step?: string; 
    disabled?: boolean,
    placeholder?: string,
    maxLength?: number,
    children?: React.ReactNode,
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
                className={`block w-full ${unit || children ? 'pr-12' : 'pr-4'} pl-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed`}
                value={value}
                onChange={(e) => onChange(id, type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value) || 0) : e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                maxLength={maxLength}
            />
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {children}
                {unit && <span className="text-slate-500 dark:text-slate-400 sm:text-sm">{unit}</span>}
            </div>
        </div>
    </div>
);

const VehicleForm: React.FC<{ vehicle?: UserVehicle; onSave: (vehicleData: Omit<UserVehicle, 'id'>) => void; onCancel: () => void }> = ({ vehicle, onSave, onCancel }) => {
    const { vehiclePresets, setNotification } = useAppContext();
    const [name, setName] = useState(vehicle?.name || '');
    const [model, setModel] = useState(vehicle?.model || vehiclePresets[0].name);
    const [customModel, setCustomModel] = useState('');
    const [batteryCapacity, setBatteryCapacity] = useState(vehicle?.batteryCapacity || 0);
    const [registrationNumber, setRegistrationNumber] = useState(vehicle?.registrationNumber || '');
    const [fiscalPower, setFiscalPower] = useState(vehicle?.fiscalPower || 4);
    const [accessPin, setAccessPin] = useState(vehicle?.accessPin || '');
    const [isSearching, setIsSearching] = useState(false);
    const [imageUrl, setImageUrl] = useState(vehicle?.imageUrl || '');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const isPreset = vehiclePresets.some(p => p.name === vehicle?.model);
        if (vehicle) {
            setName(vehicle.name);
            if (!isPreset && vehicle.model) {
                setModel('Autre / Personnalisé');
                setCustomModel(vehicle.model);
            } else {
                setModel(vehicle.model || vehiclePresets[0].name);
                setCustomModel('');
            }
            setBatteryCapacity(vehicle.batteryCapacity);
            setRegistrationNumber(vehicle.registrationNumber);
            setFiscalPower(vehicle.fiscalPower);
            setAccessPin(vehicle.accessPin || '');
            setImageUrl(vehicle.imageUrl || '');
        } else {
            const firstPreset = vehiclePresets[0];
            setModel(firstPreset.name);
            setBatteryCapacity(firstPreset.capacity);
            setImageUrl('');
        }
    }, [vehicle, vehiclePresets]);

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedModelName = e.target.value;
        const preset = vehiclePresets.find(p => p.name === selectedModelName);
        setModel(selectedModelName);
        if (preset && preset.name !== 'Autre / Personnalisé') {
            setBatteryCapacity(preset.capacity);
            setCustomModel('');
        } else {
            setCustomModel('');
        }
    };
    
    const handleAiSearch = async () => {
        if (!customModel.trim()) {
            setNotification({ type: 'warning', message: 'Veuillez entrer un nom de modèle personnalisé.'});
            return;
        }
        setIsSearching(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Quelle est la capacité de la batterie utile (en kWh) pour le véhicule suivant : "${customModel.trim()}".`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            batteryCapacity: { type: Type.NUMBER, description: 'La capacité utile de la batterie en kWh.' }
                        }
                    },
                },
            });
            const jsonStr = response.text.trim();
            const result = JSON.parse(jsonStr);

            if (result.batteryCapacity && typeof result.batteryCapacity === 'number') {
                setBatteryCapacity(result.batteryCapacity);
                setNotification({ type: 'success', message: `Capacité de ${result.batteryCapacity} kWh trouvée !`});
            } else {
                setNotification({ type: 'warning', message: "L'IA n'a pas pu trouver la capacité. Veuillez la saisir manuellement."});
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            setNotification({ type: 'warning', message: "Erreur lors de la recherche IA. Le modèle est peut-être inconnu."});
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleGenerateImage = async () => {
        const finalModelName = model === 'Autre / Personnalisé' ? customModel.trim() : model;
        if (!finalModelName) {
            setNotification({ type: 'warning', message: "Veuillez d'abord choisir ou saisir un modèle de véhicule." });
            return;
        }
        setIsGeneratingImage(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: `Photorealistic studio shot of the new, modern electric ${finalModelName}, model year 2024 or later. Side view, on a clean white background, showing the entire car.`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png',
                    aspectRatio: '16:9',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const dataUrl = `data:image/png;base64,${base64ImageBytes}`;
                setImageUrl(dataUrl);
                setNotification({ type: 'success', message: 'Image générée avec succès !' });
            } else {
                setNotification({ type: 'warning', message: "L'IA n'a pas pu générer d'image." });
            }
        } catch (error) {
            console.error("Gemini Image Gen error:", error);
            setNotification({ type: 'warning', message: "Erreur lors de la génération d'image." });
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setNotification({ message: "L'image est trop grande (max 2Mo).", type: 'warning' });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImageUrl(reader.result as string);
            setNotification({ message: 'Image importée avec succès !', type: 'success' });
        };
        reader.onerror = () => {
            setNotification({ message: "Erreur lors de la lecture du fichier.", type: 'warning' });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalModelName = model === 'Autre / Personnalisé' ? customModel.trim() : model;
        if (!name.trim() || !finalModelName || batteryCapacity <= 0) {
            alert("Veuillez renseigner un nom, un modèle et une capacité de batterie valide.");
            return;
        }
        onSave({ name, model: finalModelName, batteryCapacity, registrationNumber, fiscalPower, accessPin: accessPin.trim(), imageUrl });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 my-4 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
            <h4 className="font-semibold text-lg">{vehicle ? "Modifier le véhicule" : "Ajouter un véhicule"}</h4>
            <InputGroup label="Prénom et nom de l'utilisateur" id="name" type="text" value={name} onChange={(_, val) => setName(val as string)} unit="" placeholder="ex: Jean Dupont" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="model" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Modèle</label>
                    <div className="flex gap-2">
                        <select id="model" value={model} onChange={handleModelChange} className="mt-1 block w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                            {vehiclePresets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                     {model === 'Autre / Personnalisé' && (
                        <div>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="text"
                                    value={customModel}
                                    onChange={(e) => setCustomModel(e.target.value)}
                                    placeholder="ex: Renault Megane E-Tech EV60"
                                    className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                                    aria-label="Modèle de véhicule personnalisé"
                                />
                                <button type="button" onClick={handleAiSearch} disabled={isSearching || !customModel} className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Rechercher la capacité de la batterie avec l'IA">
                                    {isSearching ? <Loader2 size={20} className="animate-spin"/> : <Sparkles size={20}/>}
                                </button>
                            </div>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-1">
                                Cliquez sur l'étoile pour que l'IA recherche la capacité de la batterie.
                            </p>
                        </div>
                    )}
                </div>
                <InputGroup label="Capacité de la batterie" id="batteryCapacity" value={batteryCapacity} onChange={(_, val) => setBatteryCapacity(val as number)} unit="kWh" step="0.1" />
            </div>
            
            <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Image du véhicule</label>
                <div className="mt-1 flex items-center gap-4">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Aperçu du véhicule" className="w-24 h-16 object-cover rounded-lg bg-slate-200 dark:bg-slate-700" />
                    ) : (
                        <div className="w-24 h-16 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-400">
                            <Car size={32} />
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            type="button"
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGeneratingImage ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            <span className="whitespace-nowrap">{isGeneratingImage ? 'Génération...' : 'Générer avec l\'IA'}</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                        >
                            <Upload size={16} />
                            Importer
                        </button>
                    </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Générez une image avec l'IA ou importez la vôtre (max 2Mo).</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup label="Immatriculation" id="registrationNumber" type="text" value={registrationNumber} onChange={(_, val) => setRegistrationNumber(val as string)} unit="" placeholder="AA-123-BB" />
                <InputGroup label="Puissance fiscale" id="fiscalPower" value={fiscalPower} onChange={(_, val) => setFiscalPower(val as number)} unit="CV" step="1" type="number" />
            </div>
            <div>
                 <InputGroup label="Code PIN d'accès (optionnel, 4 chiffres)" id="accessPin" type="password" value={accessPin} onChange={(_, val) => setAccessPin((val as string).replace(/\D/g, ''))} unit="" placeholder="••••" maxLength={4} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className="flex items-center gap-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"><XCircle size={16}/> Annuler</button>
                <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"><Save size={16}/> Enregistrer</button>
            </div>
        </form>
    );
};

const Settings: React.FC = () => {
    const { settings, updateSettings, vehicles, setActiveView, activeVehicleId, setActiveVehicleId, addVehicle, updateVehicle, deleteVehicle, downloadBackup, importBackup } = useAppContext();
    const { currentUser, logout } = useAuth();
    const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
    const [isSaved, setIsSaved] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
    const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
    const [isAddingVehicle, setIsAddingVehicle] = useState(false);

    // State for PIN authorization flow
    const [authorizingVehicleId, setAuthorizingVehicleId] = useState<string | null>(null);
    const [actionToAuthorize, setActionToAuthorize] = useState<'edit' | 'delete' | null>(null);
    const [authPin, setAuthPin] = useState('');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleInstallClick = async () => {
        if (!installPromptEvent) return;
        installPromptEvent.prompt();
        await installPromptEvent.userChoice;
        setInstallPromptEvent(null);
    };

    const handleChange = (id: keyof SettingsType, value: string | number) => {
        setLocalSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = () => {
        const { activeVehicleId, ...settingsToUpdate } = localSettings;
        updateSettings(settingsToUpdate);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
    };

    const handleSaveVehicle = (vehicleData: Omit<UserVehicle, 'id'>) => {
        if (editingVehicleId) {
            updateVehicle(editingVehicleId, vehicleData);
        } else {
            addVehicle(vehicleData);
        }
        setEditingVehicleId(null);
        setIsAddingVehicle(false);
    };

    const handleEditClick = (vehicle: UserVehicle) => {
        if (vehicle.accessPin) {
            setActionToAuthorize('edit');
            setAuthorizingVehicleId(vehicle.id);
            setAuthPin('');
            setAuthError('');
        } else {
            setEditingVehicleId(vehicle.id);
        }
    };

    const handleDeleteRequest = (vehicle: UserVehicle) => {
        const confirmationMessage = `Supprimer le véhicule "${vehicle.name}" ? Toutes les données associées (recharges, trajets, entretiens) seront définitivement perdues. Cette action est irréversible.`;
        if (vehicle.accessPin) {
            setActionToAuthorize('delete');
            setAuthorizingVehicleId(vehicle.id);
            setAuthPin('');
            setAuthError('');
        } else {
            if (window.confirm(confirmationMessage)) {
                deleteVehicle(vehicle.id);
            }
        }
    };
    
    const handleAuthorize = (e: React.FormEvent) => {
        e.preventDefault();
        const vehicle = vehicles.find(v => v.id === authorizingVehicleId);
        if (!vehicle || !actionToAuthorize) return;

        if (authPin === vehicle.accessPin) {
            if (actionToAuthorize === 'edit') {
                setEditingVehicleId(vehicle.id);
            } else if (actionToAuthorize === 'delete') {
                const confirmationMessage = `Supprimer le véhicule "${vehicle.name}" ? Toutes les données associées (recharges, trajets, entretiens) seront définitivement perdues. Cette action est irréversible.`;
                if (window.confirm(confirmationMessage)) {
                    deleteVehicle(vehicle.id);
                }
            }
            cancelAuthorization();
        } else {
            setAuthError('Code PIN incorrect.');
            setAuthPin('');
        }
    };
    
    const cancelAuthorization = () => {
        setAuthorizingVehicleId(null);
        setActionToAuthorize(null);
        setAuthPin('');
        setAuthError('');
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
                        <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                            <LogOut size={16} /> Se déconnecter
                        </button>
                    </div>
                </Accordion>

                <Accordion title="Gestion des Véhicules" icon={<Car size={20} />} startOpen={true}>
                    <div className="space-y-2">
                        {vehicles.map(v => (
                            <div key={v.id} className={`p-3 border rounded-lg ${v.id === activeVehicleId ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                {editingVehicleId === v.id ? (
                                    <VehicleForm vehicle={v} onSave={handleSaveVehicle} onCancel={() => setEditingVehicleId(null)} />
                                ) : authorizingVehicleId === v.id ? (
                                    <form onSubmit={handleAuthorize} className="p-4 my-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                                        <h4 className="font-semibold text-lg flex items-center gap-2"><KeyRound size={18} /> Vérification Requise</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Pour {actionToAuthorize === 'edit' ? 'modifier les informations de' : 'supprimer le véhicule'} "<strong>{v.name}</strong>", veuillez saisir son code PIN.
                                        </p>
                                        <div>
                                            <label htmlFor="authPin" className="sr-only">Code PIN</label>
                                            <input
                                                id="authPin"
                                                type="password"
                                                value={authPin}
                                                onChange={(e) => setAuthPin(e.target.value.replace(/\D/g, ''))}
                                                maxLength={4}
                                                className="block w-full text-center text-2xl tracking-[1em] p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                                                placeholder="••••"
                                                autoFocus
                                                autoComplete="off"
                                                pattern="\d{4}"
                                                inputMode="numeric"
                                            />
                                        </div>
                                        {authError && <p className="text-red-500 text-sm font-semibold text-center">{authError}</p>}
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button type="button" onClick={cancelAuthorization} className="flex items-center gap-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600">
                                                Annuler
                                            </button>
                                            <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                                                Valider
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            {v.imageUrl && <img src={v.imageUrl} alt={v.name} className="w-16 h-12 object-cover rounded-md bg-slate-200 dark:bg-slate-700" />}
                                            <div>
                                                <p className="font-semibold">{v.name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{v.model} - {v.batteryCapacity} kWh</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEditClick(v)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteRequest(v)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isAddingVehicle ? (
                            <VehicleForm onSave={handleSaveVehicle} onCancel={() => setIsAddingVehicle(false)} />
                        ) : (
                            <button onClick={() => setIsAddingVehicle(true)} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                <Plus size={16} /> Ajouter un véhicule
                            </button>
                        )}
                    </div>
                </Accordion>
                
                 <Accordion title="Application" icon={<Smartphone size={20} />}>
                     <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Installez cette application sur votre écran d'accueil pour un accès rapide et une expérience hors ligne.</p>
                        {installPromptEvent ? (
                            <button onClick={handleInstallClick} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                                <DownloadCloud size={16} /> Installer l'application
                            </button>
                        ) : (
                             <p className="text-sm font-medium text-green-600 dark:text-green-400">L'application est déjà installée ou votre navigateur ne supporte pas cette fonctionnalité.</p>
                        )}
                    </div>
                </Accordion>
                
                 <Accordion title="Gestion des Données" icon={<Database size={20} />}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Exportez ou importez toutes vos données (recharges, trajets, entretien) au format CSV. Des fichiers séparés seront téléchargés pour chaque type de données. L'application effectue également une sauvegarde automatique chaque semaine.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={() => downloadBackup()} 
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                <DownloadCloud size={16} /> Télécharger une sauvegarde (CSV)
                            </button>
                             <button 
                                onClick={importBackup} 
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                <Upload size={16} /> Importer une sauvegarde (CSV)
                            </button>
                        </div>
                    </div>
                </Accordion>

                <Accordion title="Récapitulatifs par e-mail" icon={<Mail size={20} />}>
                     <InputGroup label="Adresse e-mail de destination" id="recapEmail" value={localSettings.recapEmail} onChange={handleChange} type="email" unit="" />
                </Accordion>

                <Accordion title="Facturation des Trajets" icon={<FileText size={20} />}>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">Définissez les montants forfaitaires pour la facturation des trajets courts et moyens.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Forfait zone locale (< 11 km)" id="billingRateLocal" value={localSettings.billingRateLocal} onChange={handleChange} unit="€" />
                        <InputGroup label="Forfait zone moyenne (11-30 km)" id="billingRateMedium" value={localSettings.billingRateMedium} onChange={handleChange} unit="€" />
                    </div>
                </Accordion>
                
                <Accordion title="Tarifs de Base" icon={<Zap size={20} />}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Heures Pleines" id="pricePeak" value={localSettings.pricePeak} onChange={handleChange} unit="€/kWh" />
                        <InputGroup label="Heures Creuses" id="priceOffPeak" value={localSettings.priceOffPeak} onChange={handleChange} unit="€/kWh" />
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">Configurez ici les données d'un véhicule thermique de référence pour comparer les coûts.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Consommation thermique" id="gasolineCarConsumption" value={localSettings.gasolineCarConsumption} onChange={handleChange} unit="L/100km" step="0.1"/>
                        <InputGroup label="Prix de l'essence" id="gasolinePricePerLiter" value={localSettings.gasolinePricePerLiter} onChange={handleChange} unit="€/L"/>
                    </div>
                </Accordion>

                <Accordion title="Informations Légales" icon={<Gavel size={20} />}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Consultez nos mentions légales et notre politique de protection des données.</p>
                        <button onClick={() => setActiveView('legal-info')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                            <FileText size={16} /> Voir les informations légales
                        </button>
                    </div>
                </Accordion>
            </div>

            <div className="pt-8 mt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button onClick={handleSave} className="flex justify-center items-center px-6 py-2.5 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {isSaved ? 'Enregistré !' : 'Enregistrer les paramètres globaux'}
                </button>
            </div>
             {isSaved && <p className="text-right mt-2 text-green-500 font-medium">Paramètres sauvegardés avec succès !</p>}
        </Card>
    );
};

export default Settings;