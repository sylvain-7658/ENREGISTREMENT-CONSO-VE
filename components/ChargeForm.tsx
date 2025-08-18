
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TariffType, Charge } from '../types';
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

const ChargeForm: React.FC = () => {
    const { addCharge, user } = useAppContext();
    const today = new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(today);
    const [startPercentage, setStartPercentage] = useState('');
    const [endPercentage, setEndPercentage] = useState('');
    const [odometer, setOdometer] = useState('');
    const [tariff, setTariff] = useState<TariffType>(TariffType.OFF_PEAK);
    const [customPrice, setCustomPrice] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const start = parseInt(startPercentage, 10);
        const end = parseInt(endPercentage, 10);
        const odo = parseInt(odometer, 10);
        const price = parseFloat(customPrice);

        if (isNaN(start) || isNaN(end) || isNaN(odo)) {
            setError('Veuillez remplir tous les champs avec des nombres valides.');
            return;
        }
        if (tariff === TariffType.QUICK_CHARGE && (isNaN(price) || price <= 0)) {
            setError('Veuillez entrer un tarif valide pour la recharge rapide.');
            return;
        }
        if (start < 0 || start > 100 || end < 0 || end > 100) {
            setError('Le pourcentage doit être entre 0 et 100.');
            return;
        }
        if (end <= start) {
            setError('Le pourcentage après recharge doit être supérieur au pourcentage avant recharge.');
            return;
        }
        if (odo <= 0) {
            setError('Le kilométrage doit être positif.');
            return;
        }

        const newCharge: Omit<Charge, 'id'> = {
            date,
            startPercentage: start,
            endPercentage: end,
            odometer: odo,
            tariff,
        };

        if (tariff === TariffType.QUICK_CHARGE) {
            newCharge.customPrice = price;
        }

        addCharge(newCharge);
        // Reset form
        setStartPercentage('');
        setEndPercentage('');
        setOdometer('');
        setCustomPrice('');
        setTariff(TariffType.OFF_PEAK);
        setError('');
    };

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-baseline">
                <span>Ajouter une recharge</span>
                {user && <span className="text-lg font-medium text-slate-500 dark:text-slate-400 ml-3 truncate max-w-xs">pour {user.email}</span>}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Date de recharge" id="date">
                        <Input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} />
                    </FormField>
                    <FormField label="Kilométrage (km)" id="odometer">
                        <Input type="number" id="odometer" placeholder="ex: 45120" value={odometer} onChange={e => setOdometer(e.target.value)} />
                    </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField label="Batterie avant recharge (%)" id="startPercentage">
                        <Input type="number" id="startPercentage" placeholder="ex: 20" value={startPercentage} onChange={e => setStartPercentage(e.target.value)} />
                    </FormField>
                    <FormField label="Batterie après recharge (%)" id="endPercentage">
                        <Input type="number" id="endPercentage" placeholder="ex: 80" value={endPercentage} onChange={e => setEndPercentage(e.target.value)} />
                    </FormField>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <FormField label="Tarif appliqué" id="tariff">
                        <Select id="tariff" value={tariff} onChange={e => setTariff(e.target.value as TariffType)}>
                            <optgroup label="Tarifs de base">
                                <option value={TariffType.PEAK}>{TariffType.PEAK}</option>
                                <option value={TariffType.OFF_PEAK}>{TariffType.OFF_PEAK}</option>
                            </optgroup>
                            <optgroup label="Tarifs Tempo">
                                <option value={TariffType.TEMPO_BLUE_PEAK}>{TariffType.TEMPO_BLUE_PEAK}</option>
                                <option value={TariffType.TEMPO_BLUE_OFFPEAK}>{TariffType.TEMPO_BLUE_OFFPEAK}</option>
                                <option value={TariffType.TEMPO_WHITE_PEAK}>{TariffType.TEMPO_WHITE_PEAK}</option>
                                <option value={TariffType.TEMPO_WHITE_OFFPEAK}>{TariffType.TEMPO_WHITE_OFFPEAK}</option>
                                <option value={TariffType.TEMPO_RED_PEAK}>{TariffType.TEMPO_RED_PEAK}</option>
                                <option value={TariffType.TEMPO_RED_OFFPEAK}>{TariffType.TEMPO_RED_OFFPEAK}</option>
                            </optgroup>
                            <optgroup label="Autre">
                                <option value={TariffType.QUICK_CHARGE}>{TariffType.QUICK_CHARGE}</option>
                            </optgroup>
                        </Select>
                    </FormField>
                    {tariff === TariffType.QUICK_CHARGE && (
                        <FormField label="Tarif personnalisé (€/kWh)" id="customPrice">
                            <Input type="number" id="customPrice" placeholder="ex: 0.59" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
                        </FormField>
                    )}
                 </div>
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

export default ChargeForm;