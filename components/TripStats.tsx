
import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateClientStats, generateDestinationStats } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MapPin, Briefcase, BarChart3 } from 'lucide-react';

const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
            <div className="text-blue-500">{icon}</div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 shadow-lg text-sm">
                <p className="font-bold mb-2">{label}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.fill }}>
                        <span className="font-semibold">{`${pld.name} : `}</span>
                        {`${pld.value.toLocaleString('fr-FR')} ${pld.unit || ''}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


const TripStats: React.FC = () => {
    const { trips } = useAppContext();

    const clientStats = useMemo(() => generateClientStats(trips), [trips]);
    const destinationStats = useMemo(() => generateDestinationStats(trips), [trips]);
    const topClients = useMemo(() => clientStats.filter(c => c.totalBillingAmount > 0).slice(0, 5), [clientStats]);

    const globalStats = useMemo(() => {
        const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
        const totalCost = trips.reduce((sum, t) => sum + t.cost, 0);
        const totalSavings = trips.reduce((sum, t) => sum + t.savings, 0);
        const totalBillingAmount = trips.reduce((sum, t) => sum + (t.billingAmount || 0), 0);
        return { totalDistance, totalCost, totalSavings, totalBillingAmount };
    }, [trips]);

    if (trips.length === 0) {
        return (
            <div className="text-center py-16 px-6">
                <BarChart3 size={48} className="mx-auto text-slate-400" />
                <h3 className="text-xl font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100">Statistiques indisponibles</h3>
                <p className="text-slate-500 dark:text-slate-400">Ajoutez des trajets pour voir les statistiques.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Statistiques des trajets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Distance Totale" value={`${globalStats.totalDistance.toLocaleString('fr-FR')} km`} icon={<MapPin size={24} />} />
                    <StatCard title="Coût Total" value={`${globalStats.totalCost.toFixed(2)} €`} icon={<span className="font-bold text-xl">€</span>} />
                    <StatCard title="Économies Totales" value={`${globalStats.totalSavings.toFixed(2)} €`} icon={<span className="font-bold text-xl text-green-500">€+</span>} />
                    <StatCard title="Total Facturé" value={`${globalStats.totalBillingAmount.toFixed(2)} €`} icon={<Briefcase size={24} />} />
                </div>
            </div>

            {topClients.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Top 5 Clients par Montant Facturé</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={topClients} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" />
                                <YAxis unit="€" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="totalBillingAmount" name="Total Facturé" unit="€" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><Briefcase size={20}/> Par Client</h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                             <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Client</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Trajets</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Distance</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Total Facturé</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {clientStats.map(stat => (
                                    <tr key={stat.name}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{stat.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.tripCount}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.totalDistance.toLocaleString('fr-FR')} km</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600 dark:text-indigo-400">{stat.totalBillingAmount.toFixed(2)} €</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div>
                     <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><MapPin size={20}/> Par Destination</h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                             <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Destination</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Trajets</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Distance Totale</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Distance Moyenne</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {destinationStats.map(stat => (
                                    <tr key={stat.name}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{stat.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.tripCount}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.totalDistance.toLocaleString('fr-FR')} km</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.avgDistance.toLocaleString('fr-FR')} km</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TripStats;
