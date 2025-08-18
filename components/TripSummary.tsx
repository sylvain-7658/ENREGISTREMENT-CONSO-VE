
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateTripStats } from '../utils/calculations';

type Period = 'weekly' | 'monthly' | 'yearly';

const TripSummary: React.FC = () => {
    const { trips, settings } = useAppContext();
    const [period, setPeriod] = useState<Period>('monthly');

    const statsData = useMemo(() => {
        if (trips.length === 0) return [];
        return generateTripStats(trips, period);
    }, [trips, period]);
    
    const reversedStats = [...statsData].reverse();

    const periodOptions: {key: Period, label: string}[] = [
        { key: 'weekly', label: 'Semaine' },
        { key: 'monthly', label: 'Mois' },
        { key: 'yearly', label: 'Année' },
    ];

    return (
        <div className="pb-4">
             <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        Résumés des trajets
                    </h2>
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

            <div className="px-6 pt-4 pb-4">
                 <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Période</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Distance</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Coût des trajets</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Économies</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Facturation</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {reversedStats.map(stat => (
                                <tr key={stat.name}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{stat.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.totalDistance.toLocaleString('fr-FR')} km</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.totalCost.toFixed(2)} €</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                         {stat.totalSavings >= 0 ? (
                                            <span className="text-green-600 dark:text-green-400">+{stat.totalSavings.toFixed(2)} €</span>
                                        ) : (
                                            <span className="text-red-600 dark:text-red-500">{stat.totalSavings.toFixed(2)} €</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                        {stat.totalBillingAmount > 0 ? (
                                            <span className="text-indigo-600 dark:text-indigo-400">{stat.totalBillingAmount.toFixed(2)} €</span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TripSummary;