import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { TariffType, StatsData } from '../types';
import { generateStats } from '../utils/calculations';

type Period = 'weekly' | 'monthly' | 'yearly';

const SummarySection: React.FC<{
    title: string;
    statsData: StatsData[];
    emptyMessage: string;
}> = ({ title, statsData, emptyMessage }) => {
    
    if (statsData.length === 0) {
        return (
            <div className="px-6 pt-4 pb-4 border-t border-slate-200 dark:border-slate-700 no-print">
                 <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</h3>
                <div className="text-center py-5 text-sm text-slate-500 dark:text-slate-400">
                    <p>{emptyMessage}</p>
                </div>
            </div>
        );
    }
    
    const reversedStats = [...statsData].reverse();

    return (
        <div className="px-6 pt-4 pb-4 border-t border-slate-200 dark:border-slate-700 no-print">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">{title}</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Période</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Distance</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">kWh Total</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Coût Total</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Conso. Moyenne</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Coût / 100km</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {reversedStats.map(stat => (
                            <tr key={stat.name}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{stat.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.totalDistance.toLocaleString('fr-FR')} km</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.totalKwh.toFixed(2)} kWh</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                    <div>
                                        <span className="font-semibold text-slate-800 dark:text-slate-100">{stat.totalCost.toFixed(2)} €</span>
                                        {stat.totalGasolineCost > 0 && (
                                            <span className="text-xs ml-2 text-slate-400">(vs {stat.totalGasolineCost.toFixed(2)} €)</span>
                                        )}
                                    </div>
                                    {stat.totalGasolineCost > stat.totalCost && stat.totalCost > 0 && (
                                        <div className="text-xs font-bold text-green-600 dark:text-green-400 mt-1">
                                            Économie de {(stat.totalGasolineCost - stat.totalCost).toFixed(2)} €
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                    {stat.avgConsumption > 0 ? 
                                        <span className="text-blue-600 dark:text-blue-400">{stat.avgConsumption.toFixed(2)} kWh/100km</span> 
                                        : <span className="text-slate-400">-</span>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                    {stat.avgCostPer100km > 0 ? 
                                        <span className="text-orange-600 dark:text-orange-400">{stat.avgCostPer100km.toFixed(2)} €/100km</span> 
                                        : <span className="text-slate-400">-</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ChargeList: React.FC = () => {
    const { charges, settings, currentUser } = useAppContext();
    const [period, setPeriod] = useState<Period>('monthly');
    const vehicleInfoText = useMemo(() => {
        if (settings.registrationNumber) {
            return `${settings.vehicleModel} (${settings.registrationNumber})`;
        }
        return settings.vehicleModel;
    }, [settings.vehicleModel, settings.registrationNumber]);

    const globalStatsData = useMemo(() => {
        if (charges.length < 1) return [];
        return generateStats(charges, period, settings);
    }, [charges, period, settings]);

    const hpHcStatsData = useMemo(() => {
        if (charges.length < 1) return [];
        const peakOffPeakTariffs = [TariffType.PEAK, TariffType.OFF_PEAK];
        return generateStats(charges, period, settings, peakOffPeakTariffs);
    }, [charges, period, settings]);

    const tempoStatsData = useMemo(() => {
        if (charges.length < 1) return [];
        const tempoTariffs = [
            TariffType.TEMPO_BLUE_PEAK,
            TariffType.TEMPO_BLUE_OFFPEAK,
            TariffType.TEMPO_WHITE_PEAK,
            TariffType.TEMPO_WHITE_OFFPEAK,
            TariffType.TEMPO_RED_PEAK,
            TariffType.TEMPO_RED_OFFPEAK,
        ];
        return generateStats(charges, period, settings, tempoTariffs);
    }, [charges, period, settings]);

    const quickChargeStatsData = useMemo(() => {
        if (charges.length < 1) return [];
        const quickChargeTariffs = [TariffType.QUICK_CHARGE];
        return generateStats(charges, period, settings, quickChargeTariffs);
    }, [charges, period, settings]);

    const periodOptions: {key: Period, label: string}[] = [
        { key: 'weekly', label: 'Semaine' },
        { key: 'monthly', label: 'Mois' },
        { key: 'yearly', label: 'Année' },
    ];

    return (
        <div className="pb-4">
            <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center no-print">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        Résumés par période
                    </h2>
                     <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 space-x-2">
                        {currentUser && <span>Profil: <span className="font-semibold text-slate-600 dark:text-slate-300">{currentUser.name}</span></span>}
                        {currentUser && vehicleInfoText && <span className="text-slate-400">&bull;</span>}
                        {vehicleInfoText && <span>Véhicule: <span className="font-semibold text-slate-600 dark:text-slate-300">{vehicleInfoText}</span></span>}
                    </div>
                </div>
                <div className="flex space-x-1 p-1 bg-slate-200 dark:bg-slate-700/50 rounded-lg mt-4 sm:mt-0">
                    {periodOptions.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setPeriod(opt.key)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                period === opt.key
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <SummarySection
                title="Résumé global"
                statsData={globalStatsData}
                emptyMessage="Pas de données pour générer un résumé global."
            />
            <SummarySection
                title="Résumé Heures Pleines / Creuses"
                statsData={hpHcStatsData}
                emptyMessage="Pas de données de recharge en Heures Pleines/Creuses."
            />
            <SummarySection
                title="Résumé Tarif Tempo"
                statsData={tempoStatsData}
                emptyMessage="Pas de données de recharge au tarif Tempo."
            />
             <SummarySection
                title="Résumé Recharge Rapide"
                statsData={quickChargeStatsData}
                emptyMessage="Pas de données de recharge rapide."
            />
        </div>
    );
};

export default ChargeList;