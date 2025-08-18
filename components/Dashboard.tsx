

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { generateStats } from '../utils/calculations';
import Card from './Card';
import { View } from '../App';
import { ArrowRight, BarChart3, Euro, Gauge, PlusCircle, Settings, History, Leaf, Wrench, MapPin } from 'lucide-react';


const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, subtext?: string, color: string }> = ({ title, value, icon, subtext, color }) => (
    <Card className={`transform hover:-translate-y-1 transition-transform duration-300`}>
        <div className="flex items-center space-x-4">
            <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                 {subtext && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>}
            </div>
        </div>
    </Card>
);

const Dashboard: React.FC<{ setActiveView: (view: View) => void }> = ({ setActiveView }) => {
    const { charges, settings, maintenanceEntries } = useAppContext();
    
    const summary = useMemo(() => {
        if (charges.length === 0) {
            return { totalCost: 0, totalDistance: 0, avgConsumption: 0, lastCharge: null, savings: null, avgCostPer100km: 0, gasCostPer100km: null, totalMaintenanceCost: 0, avgCostPer100kmWithMaintenance: 0 };
        }
        const totalCost = charges.reduce((sum, c) => sum + c.cost, 0);
        const totalDistance = charges.reduce((sum, c) => sum + (c.distanceDriven || 0), 0);
        const totalKwh = charges.reduce((sum, c) => sum + c.kwhAdded, 0);
        const avgConsumption = totalDistance > 0 ? (totalKwh / totalDistance) * 100 : 0;
        const lastCharge = charges[charges.length - 1];

        const totalTripCost = charges.reduce((sum, c) => sum + ((c.costPer100km || 0) * (c.distanceDriven || 0) / 100), 0);
        const avgCostPer100km = totalDistance > 0 ? (totalTripCost / totalDistance) * 100 : 0;


        let savings: number | null = null;
        let gasCostPer100km: number | null = null;
        if (totalDistance > 0 && settings.gasolineCarConsumption > 0 && settings.gasolinePricePerLiter > 0) {
            const totalGasolineCost = (totalDistance / 100) * settings.gasolineCarConsumption * settings.gasolinePricePerLiter;
            savings = totalGasolineCost - totalCost;
            gasCostPer100km = (settings.gasolineCarConsumption / 100) * settings.gasolinePricePerLiter * 100;
        }

        const totalMaintenanceCost = maintenanceEntries.reduce((sum, entry) => sum + entry.cost, 0);
        
        const maintenanceCostForAvg = maintenanceEntries
            .filter(entry => entry.type !== 'Lavage')
            .reduce((sum, entry) => sum + entry.cost, 0);
        
        const totalCostWithMaintenance = totalTripCost + maintenanceCostForAvg;
        const avgCostPer100kmWithMaintenance = totalDistance > 0 ? (totalCostWithMaintenance / totalDistance) * 100 : 0;

        return {
            totalCost,
            totalDistance,
            avgConsumption,
            lastCharge,
            savings,
            avgCostPer100km,
            gasCostPer100km,
            totalMaintenanceCost,
            avgCostPer100kmWithMaintenance,
        };
    }, [charges, settings, maintenanceEntries]);

    const monthlyStats = useMemo(() => {
        const stats = generateStats(charges, 'monthly', settings);
        return stats.slice(-6); // Get last 6 months
    }, [charges, settings]);
    
    const vehicleInfoText = [settings.vehicleModel, settings.registrationNumber].filter(Boolean).join(' - ');

    if (charges.length < 2) {
        return (
            <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md border border-slate-200/80 dark:border-slate-700/80">
                 <div className="flex justify-center items-center">
                    <div className="relative">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500">
                             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 3V9H18L10 21V15H5L13 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                 </div>
                 <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2">Bienvenue sur Suivi EV !</h1>
                 <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Commencez par ajouter au moins deux recharges pour débloquer votre tableau de bord et vos statistiques.</p>
                 <button 
                    onClick={() => setActiveView('journal')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform hover:scale-105 duration-300"
                >
                    <PlusCircle size={20} />
                    Ajouter ma première recharge
                </button>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    Tableau de bord
                </h1>
                {vehicleInfoText && <p className="text-md text-slate-500 dark:text-slate-400 mt-1">{vehicleInfoText}</p>}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <StatCard 
                    title="Coût Moyen / 100km"
                    value={`${summary.avgCostPer100km.toFixed(2)} €`}
                    icon={<Euro className="text-green-600 dark:text-green-400" />}
                    subtext={summary.gasCostPer100km ? `vs ${summary.gasCostPer100km.toFixed(2)}€ thermique` : undefined}
                    color="green"
                 />
                  <StatCard 
                    title="Coût / 100km (avec entretien)"
                    value={`${summary.avgCostPer100kmWithMaintenance.toFixed(2)} €`}
                    icon={<Euro className="text-indigo-600 dark:text-indigo-400" />}
                    subtext="hors lavage"
                    color="indigo"
                 />
                 <StatCard 
                    title="Conso. Moyenne"
                    value={`${summary.avgConsumption.toFixed(2)}`}
                    icon={<BarChart3 className="text-blue-600 dark:text-blue-400" />}
                    subtext="kWh/100km"
                    color="blue"
                 />
                 <StatCard 
                    title="Distance Totale"
                    value={`${summary.totalDistance.toLocaleString('fr-FR')} km`}
                    icon={<Gauge className="text-orange-600 dark:text-orange-400" />}
                    color="orange"
                 />
                 <StatCard 
                    title="Économies Réalisées"
                    value={`${summary.savings ? summary.savings.toFixed(2) : '0.00'} €`}
                    icon={<Leaf className="text-teal-600 dark:text-teal-400" />}
                    subtext="vs. équivalent thermique"
                    color="teal"
                 />
                 <StatCard 
                    title="Coût d'Entretien"
                    value={`${summary.totalMaintenanceCost.toFixed(2)} €`}
                    icon={<Wrench className="text-purple-600 dark:text-purple-400" />}
                    color="purple"
                 />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Costs Chart */}
                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-xl font-bold">Dépenses des 6 derniers mois</h2>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={monthlyStats} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} unit="€" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                            borderColor: '#e2e8f0',
                                            borderRadius: '0.75rem',
                                            color: '#1e293b'
                                        }}
                                        cursor={{ fill: 'rgba(71, 85, 105, 0.1)' }}
                                    />
                                    <Bar dataKey="totalCost" name="Coût Total" unit="€" fill="#475569" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="totalCost" position="top" formatter={(value: number) => value > 0 ? `${value.toFixed(2)} €` : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                    </Bar>
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
                                 <button onClick={() => setActiveView('trajets')} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                     <MapPin className="text-green-500" />
                                     <span className="font-semibold">Ajouter un trajet</span>
                                     <ArrowRight className="ml-auto text-slate-400" size={16} />
                                 </button>
                                  <button onClick={() => setActiveView('entretien')} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                     <Wrench className="text-orange-500" />
                                     <span className="font-semibold">Ajouter un entretien</span>
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