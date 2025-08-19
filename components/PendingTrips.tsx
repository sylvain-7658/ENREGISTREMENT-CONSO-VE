import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trip } from '../types';
import Card from './Card';
import { Map, Flag } from 'lucide-react';

const CompleteTripForm: React.FC<{ trip: Trip, onCancel: () => void }> = ({ trip, onCancel }) => {
    const { completeTrip } = useAppContext();
    const [endOdometer, setEndOdometer] = useState('');
    const [endPercentage, setEndPercentage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const endOdo = parseInt(endOdometer, 10);
        const endPerc = parseInt(endPercentage, 10);

        if (isNaN(endOdo) || isNaN(endPerc)) {
            setError('Veuillez remplir tous les champs avec des nombres valides.'); return;
        }
        if (endPerc >= trip.startPercentage) {
            setError("Le pourcentage d'arrivée doit être inférieur au départ."); return;
        }
        if (endOdo <= trip.startOdometer) {
            setError("Le kilométrage d'arrivée doit être supérieur au départ."); return;
        }
         if (endPerc < 0 || endPerc > 100) {
            setError('Le pourcentage doit être entre 0 et 100.'); return;
        }

        completeTrip(trip.id, { endOdometer: endOdo, endPercentage: endPerc });
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor={`endOdo-${trip.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kilométrage à l'arrivée (km)</label>
                    <input type="number" id={`endOdo-${trip.id}`} value={endOdometer} onChange={e => setEndOdometer(e.target.value)} placeholder="ex: 45210" className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm" required />
                </div>
                <div>
                     <label htmlFor={`endPerc-${trip.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Batterie à l'arrivée (%)</label>
                    <input type="number" id={`endPerc-${trip.id}`} value={endPercentage} onChange={e => setEndPercentage(e.target.value)} placeholder="ex: 75" className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm" required />
                </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
             <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Valider le trajet</button>
            </div>
        </form>
    );
};


const PendingTrips: React.FC = () => {
    const { pendingTrips } = useAppContext();
    const [editingTripId, setEditingTripId] = useState<string | null>(null);
    
    if (pendingTrips.length === 0) {
        return null;
    }

    return (
        <Card className="border-2 border-green-500 shadow-green-500/20">
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Map className="text-green-600 dark:text-green-400" size={24}/>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Trajets en cours ({pendingTrips.length})
                </h2>
            </div>
            <div className="mt-4 space-y-4">
                {pendingTrips.map(trip => (
                    <div key={trip.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg transition-all duration-300">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div>
                                <p className="font-semibold">Vers "{trip.destination}"</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Démarré le {new Date(trip.date).toLocaleDateString('fr-FR')} à {trip.startOdometer.toLocaleString('fr-FR')} km ({trip.startPercentage}%)
                                </p>
                            </div>
                            <button 
                                onClick={() => setEditingTripId(editingTripId === trip.id ? null : trip.id)}
                                className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 transition-colors text-sm"
                            >
                                <Flag size={16} />
                                {editingTripId === trip.id ? 'Annuler' : 'Terminer le trajet'}
                            </button>
                        </div>
                         {editingTripId === trip.id && (
                            <CompleteTripForm 
                                trip={trip} 
                                onCancel={() => setEditingTripId(null)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}

export default PendingTrips;