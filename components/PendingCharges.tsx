import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Charge, TariffType } from '../types';
import Card from './Card';
import { BatteryCharging, PowerOff } from 'lucide-react';

const CompleteChargeForm: React.FC<{ charge: Charge, onCancel: () => void }> = ({ charge, onCancel }) => {
    const { completeCharge } = useAppContext();
    const [endPercentage, setEndPercentage] = useState('');
    const [tariff, setTariff] = useState<TariffType>(TariffType.OFF_PEAK);
    const [customPrice, setCustomPrice] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const end = parseInt(endPercentage, 10);
        const price = parseFloat(customPrice);

        if (isNaN(end)) {
            setError('Veuillez entrer un pourcentage de fin valide.'); return;
        }
        if (tariff === TariffType.QUICK_CHARGE && (isNaN(price) || price <= 0)) {
            setError('Veuillez entrer un tarif valide pour la recharge rapide.'); return;
        }
        if (end <= charge.startPercentage) {
            setError('Le pourcentage final doit être supérieur au pourcentage de départ.'); return;
        }
        if (end < 0 || end > 100) {
            setError('Le pourcentage doit être entre 0 et 100.'); return;
        }
        
        const completionData: any = { endPercentage: end, tariff };
        if (tariff === TariffType.QUICK_CHARGE) {
            completionData.customPrice = price;
        }
        completeCharge(charge.id, completionData);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor={`endPerc-${charge.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Batterie après recharge (%)</label>
                    <input type="number" id={`endPerc-${charge.id}`} value={endPercentage} onChange={e => setEndPercentage(e.target.value)} placeholder="ex: 90" className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm" required />
                </div>
                <div>
                    <label htmlFor={`tariff-${charge.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tarif appliqué</label>
                    <select id={`tariff-${charge.id}`} value={tariff} onChange={e => setTariff(e.target.value as TariffType)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
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
                            <option value={TariffType.FREE_CHARGE}>{TariffType.FREE_CHARGE}</option>
                        </optgroup>
                    </select>
                </div>
                {tariff === TariffType.QUICK_CHARGE && (
                    <div>
                        <label htmlFor={`price-${charge.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tarif personnalisé (€/kWh)</label>
                        <input type="number" id={`price-${charge.id}`} value={customPrice} onChange={e => setCustomPrice(e.target.value)} step="0.01" placeholder="ex: 0.59" className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm" required />
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
             <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Valider la recharge</button>
            </div>
        </form>
    );
};


const PendingCharges: React.FC = () => {
    const { pendingCharges } = useAppContext();
    const [editingChargeId, setEditingChargeId] = useState<string | null>(null);
    
    if (pendingCharges.length === 0) {
        return null;
    }

    return (
        <Card className="border-2 border-blue-500 shadow-blue-500/20">
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg animate-pulse">
                    <BatteryCharging className="text-blue-600 dark:text-blue-400" size={24}/>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Recharges en cours ({pendingCharges.length})
                </h2>
            </div>
            <div className="mt-4 space-y-4">
                {pendingCharges.map(charge => (
                    <div key={charge.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg transition-all duration-300">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div>
                                <p className="font-semibold">{new Date(charge.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Démarrée à {charge.odometer.toLocaleString('fr-FR')} km, batterie à {charge.startPercentage}%
                                </p>
                            </div>
                            <button 
                                onClick={() => setEditingChargeId(editingChargeId === charge.id ? null : charge.id)}
                                className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 transition-colors text-sm"
                            >
                                <PowerOff size={16} />
                                {editingChargeId === charge.id ? 'Annuler' : 'Terminer la recharge'}
                            </button>
                        </div>
                         {editingChargeId === charge.id && (
                            <CompleteChargeForm 
                                charge={charge} 
                                onCancel={() => setEditingChargeId(null)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}

export default PendingCharges;