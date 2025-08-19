import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LabelList } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { generateStats } from '../utils/calculations';
import Card from './Card';
import { View } from '../types';
import { ArrowRight, BarChart3, Euro, Gauge, PlusCircle, Settings, History, Leaf, Wrench, MapPin, Zap, Route } from 'lucide-react';
import { TariffType } from '../types';
import PendingCharges from './PendingCharges';

const TARIFF_COLORS: { [key in TariffType]: string } = {
    [TariffType.PEAK]: '#f97316', // orange-500
    [TariffType.OFF_PEAK]: '#3b82f6', // blue-500
    [TariffType.TEMPO_BLUE_PEAK]: '#60a5fa', // blue-400
    [TariffType.TEMPO_BLUE_OFFPEAK]: '#93c5fd', // blue-300
    [TariffType.TEMPO_WHITE_PEAK]: '#a1a1aa', // zinc-400
    [TariffType.TEMPO_WHITE_OFFPEAK]: '#d4d4d8', // zinc-300
    [TariffType.TEMPO_RED_PEAK]: '#ef4444', // red-500
    [TariffType.TEMPO_RED_OFFPEAK]: '#fca5a5', // red-300
    [TariffType.QUICK_CHARGE]: '#a855f7', // purple-500
    [TariffType.FREE_CHARGE]: '#22c55e', // green-500
};

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

const MonthlyStatDisplay = ({ icon, title, value, unit }: { icon: React.ReactNode, title: string, value: string, unit: string }) => (
    <div className="flex flex-col p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg h-full">
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-slate-200 dark:bg-slate-700 mr-4">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {value} <span className="text-base font-normal text-slate-600 dark:text-slate-300">{unit}</span>
                </p>
            </div>
        </div>
    </div>
);

const MonthlyCostDisplay = ({ icon, title, totalValue, unit, breakdown }: { icon: React.ReactNode, title: string, totalValue: string, unit: string, breakdown: { label: string, value: number }[] }) => (
    <div className="flex flex-col p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg h-full">
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-slate-200 dark:bg-slate-700 mr-4">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {totalValue} <span className="text-base font-normal text-slate-600 dark:text-slate-300">{unit}</span>
                </p>
            </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
            {breakdown.map(item =>
                item.value > 0 && (
                    <div key={item.label} className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">{item.label}:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{item.value.toFixed(2)} €</span>
                    </div>
                )
            )}
        </div>
    </div>
);


const Dashboard: React.FC = () => {
    const { charges, settings, maintenanceEntries, setActiveView } = useAppContext();
    
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
    
    const currentMonthStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const chargesThisMonth = charges.filter(c => {
            const chargeDate = new Date(c.date);
            return chargeDate.getMonth() === currentMonth && chargeDate.getFullYear() === currentYear;
        });
        
        const initialStats = {
            totalDistance: 0,
            totalKwh: 0,
            avgConsumption: 0,
            totalSavings: 0,
            totalCost: 0,
            costHpHc: 0,
            costTempo: 0,
            costQuickCharge: 0,
        };

        if (chargesThisMonth.length === 0) {
            return initialStats;
        }

        const stats = chargesThisMonth.reduce((acc, c) => {
            acc.totalDistance += (c.distanceDriven || 0);
            acc.totalKwh += c.kwhAdded;
            acc.totalCost += c.cost;

            // Cost breakdown
            if ([TariffType.PEAK, TariffType.OFF_PEAK].includes(c.tariff)) {
                acc.costHpHc += c.cost;
            } else if ([
                TariffType.TEMPO_BLUE_PEAK, TariffType.TEMPO_BLUE_OFFPEAK,
                TariffType.TEMPO_WHITE_PEAK, TariffType.TEMPO_WHITE_OFFPEAK,
                TariffType.TEMPO_RED_PEAK, TariffType.TEMPO_RED_OFFPEAK
            ].includes(c.tariff)) {
                acc.costTempo += c.cost;
            } else if (c.tariff === TariffType.QUICK_CHARGE) {
                acc.costQuickCharge += c.cost;
            }
            
            return acc;
        }, initialStats);


        stats.avgConsumption = stats.totalDistance > 0 ? (stats.totalKwh / stats.totalDistance) * 100 : 0;

        if (stats.totalDistance > 0 && settings.gasolineCarConsumption > 0 && settings.gasolinePricePerLiter > 0) {
            const totalGasolineCost = (stats.totalDistance / 100) * settings.gasolineCarConsumption * settings.gasolinePricePerLiter;
            stats.totalSavings = totalGasolineCost - stats.totalCost;
        }

        stats.totalDistance = Math.round(stats.totalDistance);

        return stats;
    }, [charges, settings]);

    const monthlyStats = useMemo(() => {
        const stats = generateStats(charges, 'monthly', settings);
        return stats.slice(-6); // Get last 6 months
    }, [charges, settings]);

    const existingTariffs = useMemo(() => {
        const allTariffs = new Set<TariffType>();
        monthlyStats.forEach(stat => {
            if (stat.kwhPerTariff) {
                (Object.keys(stat.kwhPerTariff) as TariffType[]).forEach(tariff => {
                    allTariffs.add(tariff);
                });
            }
        });
        return Array.from(allTariffs);
    }, [monthlyStats]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const total = payload.reduce((acc: number, p: any) => acc + p.value, 0);

            return (
                <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 shadow-lg text-sm">
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map((pld: any) => (
                        pld.value > 0 &&
                        <p key={pld.name} style={{ color: pld.fill }}>
                            <span className="font-semibold">{`${pld.name} : `}</span>
                            {`${pld.value.toLocaleString('fr-FR')} ${pld.unit || ''}`}
                        </p>
                    ))}
                    {payload.length > 1 && total > 0 && (
                        <>
                            <hr className="my-2 border-slate-300 dark:border-slate-600" />
                            <p className="font-bold">
                                Total : {total.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {payload[0].unit || ''}
                            </p>
                        </>
                    )}
                </div>
            );
        }
        return null;
    };
    
    const vehicleInfoText = settings.vehicleModel;

    if (charges.length < 2) {
        return (
            <div className="space-y-8">
                 <PendingCharges />
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
                     <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2">Bienvenue sur Suivi Conso EV Online !</h1>
                     <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Commencez par ajouter au moins deux recharges pour débloquer votre tableau de bord et vos statistiques. N'oubliez pas de personnaliser l'application dans les paramètres avant de commencer.</p>
                     <div className="flex flex-col items-center space-y-4">
                        <button 
                            onClick={() => setActiveView('add-charge')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform hover:scale-105 duration-300"
                        >
                            <PlusCircle size={20} />
                            Ajouter ma première recharge
                        </button>
                        <button 
                            onClick={() => setActiveView('settings')}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            <Settings size={16} />
                            Configurer les paramètres
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <PendingCharges />

            <div className="flex items-baseline gap-x-3 flex-wrap">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    Tableau de bord
                </h1>
                {vehicleInfoText && <span className="text-xl font-semibold text-slate-500 dark:text-slate-400">{vehicleInfoText}</span>}
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => setActiveView('add-charge')}
                    className="flex items-center justify-center gap-3 p-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform hover:scale-105 duration-300"
                >
                    <PlusCircle size={20} />
                    <span>Ajouter une recharge</span>
                </button>
                <button
                    onClick={() => setActiveView('add-trip')}
                    className="flex items-center justify-center gap-3 p-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-transform hover:scale-105 duration-300"
                >
                    <MapPin size={20} />
                    <span>Ajouter un trajet</span>
                </button>
            </div>

            {/* Current Month Summary */}
            <Card>
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Résumé du mois en cours</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
                    <MonthlyStatDisplay 
                        icon={<Route size={22} className="text-orange-500" />}
                        title="Distance parcourue"
                        value={currentMonthStats.totalDistance.toLocaleString('fr-FR')}
                        unit="km"
                    />
                    <MonthlyCostDisplay
                        icon={<Euro size={22} className="text-indigo-500" />}
                        title="Coût des recharges"
                        totalValue={currentMonthStats.totalCost.toFixed(2)}
                        unit="€"
                        breakdown={[
                            { label: 'HP / HC', value: currentMonthStats.costHpHc },
                            { label: 'Tempo', value: currentMonthStats.costTempo },
                            { label: 'Borne Rapide', value: currentMonthStats.costQuickCharge },
                        ]}
                    />
                     <MonthlyStatDisplay 
                        icon={<Zap size={22} className="text-yellow-500" />}
                        title="Énergie rechargée"
                        value={currentMonthStats.totalKwh.toFixed(2)}
                        unit="kWh"
                    />
                     <MonthlyStatDisplay 
                        icon={<BarChart3 size={22} className="text-blue-500" />}
                        title="Consommation"
                        value={currentMonthStats.avgConsumption.toFixed(2)}
                        unit="kWh/100km"
                    />
                     <MonthlyStatDisplay 
                        icon={<Leaf size={22} className="text-green-500" />}
                        title="Économies réalisées"
                        value={currentMonthStats.totalSavings.toFixed(2)}
                        unit="€"
                    />
                </div>
            </Card>

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
                {/* Monthly Energy Chart */}
                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Énergie Rechargée des 6 derniers mois</h2>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={monthlyStats} margin={{ top: 40, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" kWh" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    {existingTariffs.map((tariff, index) => (
                                        <Bar
                                            key={tariff}
                                            dataKey={(data) => data.kwhPerTariff?.[tariff] || 0}
                                            name={tariff}
                                            stackId="a"
                                            fill={TARIFF_COLORS[tariff]}
                                            unit="kWh"
                                        >
                                         {index === existingTariffs.length - 1 && (
                                            <LabelList
                                                dataKey="totalKwh"
                                                position="top"
                                                formatter={(value: number) => value > 0 ? Math.round(value) : ''}
                                                fontSize={12}
                                                className="fill-slate-600 dark:fill-slate-300"
                                            />
                                         )}
                                        </Bar>
                                    ))}
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
                                 <button onClick={() => setActiveView('add-charge')} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                     <PlusCircle className="text-blue-500" />
                                     <span className="font-semibold">Ajouter une recharge</span>
                                     <ArrowRight className="ml-auto text-slate-400" size={16} />
                                 </button>
                                 <button onClick={() => setActiveView('add-trip')} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                     <MapPin className="text-green-500" />
                                     <span className="font-semibold">Ajouter un trajet</span>
                                     <ArrowRight className="ml-auto text-slate-400" size={16} />
                                 </button>
                                  <button onClick={() => setActiveView('add-maintenance')} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
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
                                    <p><strong>Coût:</strong> {summary.lastCharge.cost.toFixed(2)} €</p>
                                    <p><strong>Énergie:</strong> {summary.lastCharge.kwhAdded.toFixed(2)} kWh</p>
                                </div>
                                <button onClick={() => setActiveView('journal')} className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                    Voir le journal
                                    <ArrowRight size={14} />
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