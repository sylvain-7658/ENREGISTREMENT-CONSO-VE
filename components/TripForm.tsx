

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trip } from '../types';
import Card from './Card';

const FormField = ({ label, id, children }: { label: string; id: string; children: React.ReactNode }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <div className="mt-1">{children}</div>
    </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"/>
);

const TripForm: React.FC = () => {
    const { addTrip, user } = useAppContext();
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

        const newTrip: Omit<Trip, 'id'> = {
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

        addTrip(newTrip as Omit<Trip, 'id'>);
        // Reset form
        setDestination('');
        setClient('');
        setStartOdometer('');
        setEndOdometer('');
        setStartPercentage('');
        setEndPercentage('');
        setIsBilled(false);
        setError('');
    };

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-baseline">
                <span>Ajouter un trajet</span>
                 {user && <span className="text-lg font-medium text-slate-500 dark:text-slate-400 ml-3 truncate max-w-xs">pour {user.email}</span>}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField label="Date du trajet" id="date">
                        <Input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} />
                    </FormField>
                    <FormField label="Destination" id="destination">
                        <Input type="text" id="destination" placeholder="ex: Bureau" value={destination} onChange={e => setDestination(e.target.value)} />
                    </FormField>
                </div>
                <FormField label="Client (optionnel)" id="client">
                    <Input type="text" id="client" placeholder="ex: Acme Corp" value={client} onChange={e => setClient(e.target.value)} />
                </FormField>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Kilométrage départ (km)" id="startOdometer">
                        <Input type="number" id="startOdometer" placeholder="ex: 45120" value={startOdometer} onChange={e => setStartOdometer(e.target.value)} />
                    </FormField>
                    <FormField label="Kilométrage arrivée (km)" id="endOdometer">
                        <Input type="number" id="endOdometer" placeholder="ex: 45155" value={endOdometer} onChange={e => setEndOdometer(e.target.value)} />
                    </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField label="Batterie au départ (%)" id="startPercentage">
                        <Input type="number" id="startPercentage" placeholder="ex: 80" value={startPercentage} onChange={e => setStartPercentage(e.target.value)} />
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
                <div className="pt-2 flex justify-end">
                     <button type="submit" className="px-6 py-2 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        Ajouter
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default TripForm;