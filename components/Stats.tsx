import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, LabelList } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { generateStats } from '../utils/calculations';
import Card from './Card';

type Period = 'weekly' | 'monthly' | 'yearly';

const Stats: React.FC = () => {
    const { charges, settings } = useAppContext();
    const [period, setPeriod] = useState<Period>('monthly');

    const statsData = useMemo(() => generateStats(charges, period, settings), [charges, period, settings]);

    const PeriodButton = ({ p, label }: { p: Period, label: string }) => (
        <button
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
            }`}
        >
            {label}
        </button>
    );

    if (charges.length < 2) {
        return (
            <Card>
                <div className="text-center py-10">
                    <h2 className="text-xl font-bold mb-2">Statistiques</h2>
                    <p className="text-slate-500 dark:text-slate-400">Pas assez de données pour afficher les statistiques.</p>
                    <p className="text-slate-500 dark:text-slate-400">Veuillez ajouter au moins deux recharges pour commencer.</p>
                </div>
            </Card>
        );
    }
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-lg text-white shadow-lg text-sm">
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map((pld: any) => (
                        <p key={pld.dataKey} style={{ color: pld.fill || pld.stroke }}>
                            {`${pld.name} : ${pld.value.toLocaleString('fr-FR')} ${pld.unit || ''}`}
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
                    <div className="flex space-x-2 p-1 bg-slate-200 dark:bg-slate-900 rounded-lg">
                        <PeriodButton p="weekly" label="Semaine" />
                        <PeriodButton p="monthly" label="Mois" />
                        <PeriodButton p="yearly" label="Année" />
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Graphique des Coûts */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">Coûts de Recharge</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={statsData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" />
                                    <YAxis unit="€" width={50}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="totalCost" name="Coût Total" unit="€" fill="#82ca9d">
                                        <LabelList dataKey="totalCost" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) : ''} fontSize={12} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Graphique de l'Énergie */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">Énergie Rechargée</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={statsData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" />
                                    <YAxis unit=" kWh" width={50}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="totalKwh" name="kWh Total" unit="kWh" fill="#8884d8">
                                        <LabelList dataKey="totalKwh" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) : ''} fontSize={12} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    {/* Graphique de la Consommation Moyenne */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">Consommation Moyenne</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={statsData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                                     <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" />
                                    <YAxis unit=" kWh/100km" width={80} domain={['dataMin - 2', 'dataMax + 2']}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="avgConsumption" name="Conso. Moyenne" unit="kWh/100km" stroke="#ff7300" strokeWidth={2} activeDot={{ r: 8 }}>
                                        <LabelList dataKey="avgConsumption" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) : ''} fontSize={12} />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Graphique du Coût Moyen / 100km */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">Coût Moyen / 100km</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={statsData} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                                     <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" />
                                    <YAxis unit=" €/100km" width={80} domain={['dataMin - 1', 'dataMax + 1']}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="avgCostPer100km" name="Coût Moyen" unit="€/100km" stroke="#38bdf8" strokeWidth={2} activeDot={{ r: 8 }}>
                                        <LabelList dataKey="avgCostPer100km" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) : ''} fontSize={12} />
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