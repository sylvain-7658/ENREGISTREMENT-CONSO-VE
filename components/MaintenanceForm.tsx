

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MaintenanceEntry, MaintenanceType } from '../types';
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

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
     <select {...props} className="block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"/>
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className="block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"/>
);


const MaintenanceForm: React.FC = () => {
    const { addMaintenanceEntry, user } = useAppContext();
    const today = new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(today);
    const [odometer, setOdometer] = useState('');
    const [type, setType] = useState<MaintenanceType>(MaintenanceType.LAVAGE);
    const [details, setDetails] = useState('');
    const [cost, setCost] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const odo = parseInt(odometer, 10);
        const costValue = parseFloat(cost);

        if (isNaN(odo) || isNaN(costValue)) {
            setError('Veuillez remplir le kilométrage et le tarif avec des nombres valides.');
            return;
        }
        if (odo <= 0 || costValue < 0) {
            setError('Le kilométrage doit être positif et le coût ne peut pas être négatif.');
            return;
        }

        const newEntry: Omit<MaintenanceEntry, 'id'> = {
            date,
            odometer: odo,
            type,
            cost: costValue,
        };

        if (details.trim()) {
            newEntry.details = details.trim();
        }

        addMaintenanceEntry(newEntry);
        // Reset form
        setOdometer('');
        setType(MaintenanceType.LAVAGE);
        setDetails('');
        setCost('');
        setError('');
    };

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-baseline">
                <span>Ajouter une dépense d'entretien</span>
                {user && <span className="text-lg font-medium text-slate-500 dark:text-slate-400 ml-3 truncate max-w-xs">pour {user.email}</span>}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField label="Date" id="date">
                        <Input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} />
                    </FormField>
                    <FormField label="Kilométrage (km)" id="odometer">
                        <Input type="number" id="odometer" placeholder="ex: 45120" value={odometer} onChange={e => setOdometer(e.target.value)} />
                    </FormField>
                     <FormField label="Tarif (€)" id="cost">
                        <Input type="number" step="0.01" id="cost" placeholder="ex: 75.50" value={cost} onChange={e => setCost(e.target.value)} />
                    </FormField>
                </div>
                <FormField label="Type d'entretien" id="type">
                    <Select id="type" value={type} onChange={e => setType(e.target.value as MaintenanceType)}>
                        {Object.values(MaintenanceType).map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                </FormField>
                <FormField label="Détails (optionnel)" id="details">
                    <Textarea id="details" placeholder="ex: Changement plaquettes de frein avant" value={details} onChange={e => setDetails(e.target.value)} rows={3} />
                </FormField>
               
                {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
                <div className="pt-2 flex justify-end">
                     <button type="submit" className="px-6 py-2 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        Ajouter
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default MaintenanceForm;