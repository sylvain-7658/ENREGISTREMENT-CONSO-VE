

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, LabelList } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { generateStats } from '../utils/calculations';
import Card from './Card';
import { BarChart3 } from 'lucide-react';

type Period = 'weekly' | 'monthly' | 'yearly';

const Stats: React.FC = () => {
    const { charges, settings } = useAppContext();
    const [period, setPeriod] = useState<Period>('monthly');

    const statsData = useMemo(() => generateStats(charges, period, settings), [charges, period, settings]);
    const vehicleInfoText = [settings.vehicleModel, settings.registrationNumber].filter(Boolean).join(' - ');

    const PeriodButton = ({ p, label }: { p: Period, label: string }) => (
        <button
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${
                period === p
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'
            }`}
        >
            {label}
        </button>
    );

    if (charges.length < 2) {
        return (
            <Card>
                <div className="text-center py-16">
                    <BarChart3 size={48} className="mx-auto text-slate-400" />
                    <h2 className="text-xl font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100">Statistiques indisponibles</h2>
                    <p className="text-slate-500 dark:text-slate-400">Veuillez ajouter au moins deux recharges pour commencer à voir vos statistiques.</p>
                </div>
            </Card>
        );
    }
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 shadow-lg text-sm">
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map((pld: any) => (
                        <p key={pld.dataKey} style={{ color: pld.fill || pld.stroke }}>
                            <span className="font-semibold">{`${pld.name} : `}</span>
                            {`${pld.value.toLocaleString('fr-FR')} ${pld.unit || ''}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 sm:mb-0">
                        Statistiques de Consommation
                    </h2>
                    <div className="flex space-x-1 p-1 bg-slate-200 dark:bg-slate-900/50 rounded-lg">
                        <PeriodButton p="weekly" label="Semaine" />
                        <PeriodButton p="monthly" label="Mois" />
                        <PeriodButton p="yearly" label="Année" />
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Graphique de Comparaison des Coûts */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Comparaison des Coûts : Électrique vs. Thermique</h3>
                        {vehicleInfoText && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{vehicleInfoText}</p>}
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={statsData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                    <XAxis dataKey="name" />
                                    <YAxis unit="€" width={50}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="totalCost" name="Coût Électrique" unit="€" fill="#3b82f6">
                                        <LabelList dataKey="totalCost" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                    </Bar>
                                    <Bar dataKey="totalGasolineCost" name="Coût Thermique Équivalent" unit="€" fill="#f97316">
                                        <LabelList dataKey="totalGasolineCost" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Graphique de l'Énergie */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Énergie Rechargée</h3>
                        {vehicleInfoText && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{vehicleInfoText}</p>}
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={statsData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                    <XAxis dataKey="name" />
                                    <YAxis unit=" kWh" width={50}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="totalKwh" name="kWh Total" unit="kWh" fill="#16a34a">
                                        <LabelList dataKey="totalKwh" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    {/* Graphique de la Consommation Moyenne */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Consommation Moyenne</h3>
                         {vehicleInfoText && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{vehicleInfoText}</p>}
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={statsData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                                     <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                    <XAxis dataKey="name" />
                                    <YAxis unit=" kWh/100km" width={80} domain={['dataMin - 2', 'dataMax + 2']}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="avgConsumption" name="Conso. Moyenne" unit="kWh/100km" stroke="#ea580c" strokeWidth={2} activeDot={{ r: 8 }}>
                                        <LabelList dataKey="avgConsumption" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Graphique du Coût Moyen / 100km */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Coût Moyen / 100km</h3>
                        {vehicleInfoText && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{vehicleInfoText}</p>}
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={statsData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                                     <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                    <XAxis dataKey="name" />
                                    <YAxis unit=" €/100km" width={80} domain={['dataMin - 1', 'dataMax + 1']}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="avgCostPer100km" name="Coût Moyen" unit="€/100km" stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 8 }}>
                                        <LabelList dataKey="avgCostPer100km" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </Card>
        </div>
    );
};

export default Stats;