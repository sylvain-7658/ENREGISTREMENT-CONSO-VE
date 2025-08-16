import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TariffType, Charge } from '../types';
import Card from './Card';

const ChargeForm: React.FC = () => {
    const { addCharge } = useAppContext();
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
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Ajouter une recharge</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date de recharge</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="odometer" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kilométrage (km)</label>
                        <input type="number" id="odometer" placeholder="ex: 45120" value={odometer} onChange={e => setOdometer(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="startPercentage" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Batterie avant recharge (%)</label>
                        <input type="number" id="startPercentage" placeholder="ex: 20" value={startPercentage} onChange={e => setStartPercentage(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="endPercentage" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Batterie après recharge (%)</label>
                        <input type="number" id="endPercentage" placeholder="ex: 80" value={endPercentage} onChange={e => setEndPercentage(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                        <label htmlFor="tariff" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tarif appliqué</label>
                        <select id="tariff" value={tariff} onChange={e => setTariff(e.target.value as TariffType)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
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
                        </select>
                    </div>
                    {tariff === TariffType.QUICK_CHARGE && (
                        <div>
                            <label htmlFor="customPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tarif personnalisé (€/kWh)</label>
                            <input type="number" id="customPrice" placeholder="ex: 0.59" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                    )}
                 </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="pt-2 flex justify-end">
                     <button type="submit" className="px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Ajouter
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default ChargeForm;