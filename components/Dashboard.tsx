import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { generateStats } from '../utils/calculations';
import Card from './Card';
import { View } from '../../App';
import { ArrowRight, BarChart3, BatteryCharging, Euro, Gauge, PlusCircle, Settings, History } from 'lucide-react';


const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, subtext?: string }> = ({ title, value, icon, subtext }) => (
    <Card className="transform hover:scale-105 transition-transform duration-300">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                {icon}
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                 {subtext && <p className="text-xs text-slate-400 dark:text-slate-500">{subtext}</p>}
            </div>
        </div>
    </Card>
);

const Dashboard: React.FC<{ setActiveView: (view: View) => void }> = ({ setActiveView }) => {
    const { charges } = useAppContext();
    
    const summary = useMemo(() => {
        if (charges.length === 0) {
            return { totalCost: 0, totalDistance: 0, totalKwh: 0, avgConsumption: 0, lastCharge: null };
        }
        const totalCost = charges.reduce((sum, c) => sum + c.cost, 0);
        const totalDistance = charges.reduce((sum, c) => sum + (c.distanceDriven || 0), 0);
        const totalKwh = charges.reduce((sum, c) => sum + c.kwhAdded, 0);
        const avgConsumption = totalDistance > 0 ? (totalKwh / totalDistance) * 100 : 0;
        const lastCharge = charges[charges.length - 1];
        
        return {
            totalCost,
            totalDistance,
            totalKwh,
            avgConsumption,
            lastCharge,
        };
    }, [charges]);

    const monthlyStats = useMemo(() => {
        const stats = generateStats(charges, 'monthly');
        return stats.slice(-6); // Get last 6 months
    }, [charges]);

    if (charges.length < 2) {
        return (
            <div className="text-center">
                 <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Bienvenue !</h1>
                 <p className="text-slate-500 dark:text-slate-400 mb-8">Commencez par ajouter au moins deux recharges pour débloquer votre tableau de bord.</p>
                 <button 
                    onClick={() => setActiveView('journal')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-300"
                >
                    <PlusCircle size={20} />
                    Ajouter ma première recharge
                </button>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Bienvenue !
            </h1>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    title="Total Dépensé"
                    value={`${summary.totalCost.toFixed(2)} €`}
                    icon={<Euro className="text-blue-600 dark:text-blue-400" />}
                 />
                 <StatCard 
                    title="Distance Totale"
                    value={`${summary.totalDistance.toLocaleString('fr-FR')} km`}
                    icon={<Gauge className="text-blue-600 dark:text-blue-400" />}
                 />
                 <StatCard 
                    title="Énergie Totale"
                    value={`${summary.totalKwh.toFixed(2)} kWh`}
                    icon={<BatteryCharging className="text-blue-600 dark:text-blue-400" />}
                 />
                 <StatCard 
                    title="Conso. Moyenne"
                    value={`${summary.avgConsumption.toFixed(2)}`}
                    subtext="kWh/100km"
                    icon={<BarChart3 className="text-blue-600 dark:text-blue-400" />}
                 />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Costs Chart */}
                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Dépenses des 6 derniers mois</h2>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={monthlyStats} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} unit="€" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                            borderColor: '#334155',
                                            borderRadius: '0.5rem',
                                            color: '#f1f5f9'
                                        }}
                                        cursor={{ fill: 'rgba(71, 85, 105, 0.3)' }}
                                    />
                                    <Bar dataKey="totalCost" name="Coût Total" unit="€" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions & Last Charge */}
                <div className="space-y-6">
                    <Card className="h-full flex flex-col justify-between">
                         <div>
                            <h2 className="text-xl font-bold mb-4">Accès rapide</h2>
                             <div className="space-y-3">
                                 <button onClick={() => setActiveView('journal')} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                     <PlusCircle className="text-blue-500" />
                                     <span className="font-semibold">Ajouter une recharge</span>
                                     <ArrowRight className="ml-auto text-slate-400" size={16} />
                                 </button>
                                 <button onClick={() => setActiveView('settings')} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                     <Settings className="text-slate-500" />
                                     <span className="font-semibold">Modifier les paramètres</span>
                                     <ArrowRight className="ml-auto text-slate-400" size={16} />
                                 </button>
                             </div>
                        </div>

                        {summary.lastCharge && (
                            <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4">
                                <h3 className="text-lg font-bold mb-2">Dernière recharge</h3>
                                <div className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                                    <p><strong>Date:</strong> {new Date(summary.lastCharge.date).toLocaleDateString('fr-FR')}</p>
                                    <p><strong>Niveau:</strong> {summary.lastCharge.startPercentage}% → {summary.lastCharge.endPercentage}%</p>
                                    <p><strong>Coût:</strong> {summary.lastCharge.cost.toFixed(2)} €</p>
                                </div>
                                <button onClick={() => setActiveView('journal')} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-3 flex items-center gap-1">
                                    Voir l'historique <History size={14} />
                                </button>
                            </div>
                        )}

                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;