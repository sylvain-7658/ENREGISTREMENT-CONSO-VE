

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, LabelList, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { generateStats } from '../utils/calculations';
import Card from './Card';
import { BarChart3 } from 'lucide-react';
import { TariffType, StatsData } from '../types';

type Period = 'weekly' | 'monthly' | 'yearly';

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

const Stats: React.FC = () => {
    const { charges, settings, activeVehicle } = useAppContext();
    const [period, setPeriod] = useState<Period>('monthly');

    const statsData = useMemo(() => generateStats(charges, period, settings, activeVehicle), [charges, period, settings, activeVehicle]);
    const vehicleInfoText = activeVehicle ? [activeVehicle.name, activeVehicle.registrationNumber].filter(Boolean).join(' - ') : '';

    const hp_hc_tariffs = [TariffType.PEAK, TariffType.OFF_PEAK];
    const tempo_tariffs = [
        TariffType.TEMPO_BLUE_PEAK,
        TariffType.TEMPO_BLUE_OFFPEAK,
        TariffType.TEMPO_WHITE_PEAK,
        TariffType.TEMPO_WHITE_OFFPEAK,
        TariffType.TEMPO_RED_PEAK,
        TariffType.TEMPO_RED_OFFPEAK,
    ];
    const quick_charge_tariffs = [TariffType.QUICK_CHARGE];
    
    const hp_hc_stats = useMemo(() => generateStats(charges, period, settings, activeVehicle, hp_hc_tariffs).filter(d => d.totalCost > 0), [charges, period, settings, activeVehicle]);
    const tempo_stats = useMemo(() => generateStats(charges, period, settings, activeVehicle, tempo_tariffs).filter(d => d.totalCost > 0), [charges, period, settings, activeVehicle]);
    const quick_charge_stats = useMemo(() => generateStats(charges, period, settings, activeVehicle, quick_charge_tariffs).filter(d => d.totalCost > 0), [charges, period, settings, activeVehicle]);


    const existingTariffs = useMemo(() => {
        const allTariffs = new Set<TariffType>();
        statsData.forEach(stat => {
            if (stat.kwhPerTariff) {
                (Object.keys(stat.kwhPerTariff) as TariffType[]).forEach(tariff => {
                    allTariffs.add(tariff);
                });
            }
        });
        return Array.from(allTariffs);
    }, [statsData]);

    const existing_hp_hc_tariffs = useMemo(() => {
        const allTariffs = new Set<TariffType>();
        hp_hc_stats.forEach(stat => {
            if (stat.costPerTariff) {
                (Object.keys(stat.costPerTariff) as TariffType[]).forEach(tariff => allTariffs.add(tariff));
            }
        });
        return Array.from(allTariffs);
    }, [hp_hc_stats]);
    
    const existing_tempo_tariffs = useMemo(() => {
        const allTariffs = new Set<TariffType>();
        tempo_stats.forEach(stat => {
            if (stat.costPerTariff) {
                (Object.keys(stat.costPerTariff) as TariffType[]).forEach(tariff => allTariffs.add(tariff));
            }
        });
        return Array.from(allTariffs);
    }, [tempo_stats]);

    const allTimeSlowFastStats = useMemo(() => {
        const totals = charges.reduce((acc, charge) => {
            if (charge.tariff === TariffType.QUICK_CHARGE) {
                acc.fastKwh += charge.kwhAdded;
            } else {
                acc.slowKwh += charge.kwhAdded;
            }
            return acc;
        }, { slowKwh: 0, fastKwh: 0 });
        
        return [
            { name: 'Recharges Lentes', value: totals.slowKwh },
            { name: 'Recharges Rapides', value: totals.fastKwh },
        ].filter(d => d.value > 0);
    }, [charges]);

    const lastPeriodStats = statsData.length > 0 ? statsData[statsData.length - 1] : null;

    const lastPeriodSlowFastStats = useMemo(() => {
        if (!lastPeriodStats) return [];
        return [
            { name: 'Recharges Lentes', value: lastPeriodStats.slowChargeKwh || 0 },
            { name: 'Recharges Rapides', value: lastPeriodStats.fastChargeKwh || 0 }
        ].filter(d => d.value > 0);
    }, [lastPeriodStats]);
    
    const PIE_COLORS = ['#3b82f6', '#f97316']; // Bleu pour Lente, Orange pour Rapide

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
                    <p className="text-slate-500 dark:text-slate-400">Veuillez ajouter au moins deux recharges pour ce véhicule pour commencer à voir ses statistiques.</p>
                </div>
            </Card>
        );
    }
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const isStackedEnergyChart = payload.every((p: any) => p.unit === 'kWh');
            const isStackedCostChart = payload.every((p: any) => p.unit === '€');
            const total = payload.reduce((acc: number, p: any) => acc + p.value, 0);

            return (
                <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 shadow-lg text-sm">
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map((pld: any) => (
                        pld.value > 0 &&
                        <p key={pld.name} style={{ color: pld.fill || pld.stroke }}>
                            <span className="font-semibold">{`${pld.name} : `}</span>
                            {`${pld.value.toLocaleString('fr-FR')} ${pld.unit || ''}`}
                        </p>
                    ))}
                    {(isStackedEnergyChart || isStackedCostChart) && payload.length > 1 && total > 0 && (
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

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null;

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
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
                                <BarChart data={statsData} margin={{ top: 40, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                    <XAxis dataKey="name" />
                                    <YAxis unit="€" width={50}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="totalCost" name="Coût Électrique" unit="€" fill="#1e40af">
                                        <LabelList dataKey="totalCost" position="top" formatter={(value: number) => value > 0 ? `${value.toFixed(2)}€` : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                    </Bar>
                                    <Bar dataKey="totalGasolineCost" name="Coût Thermique Équivalent" unit="€" fill="#1e293b">
                                        <LabelList dataKey="totalGasolineCost" position="top" formatter={(value: number) => value > 0 ? `${value.toFixed(2)}€` : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Graphique de l'Énergie */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Énergie Rechargée par Type de Tarif</h3>
                        {vehicleInfoText && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{vehicleInfoText}</p>}
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={statsData} margin={{ top: 40, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                    <XAxis dataKey="name" />
                                    <YAxis unit=" kWh" width={50}/>
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
                    </div>
                    
                    {/* Graphique de la Consommation Moyenne */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Consommation Moyenne</h3>
                         {vehicleInfoText && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{vehicleInfoText}</p>}
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={statsData} margin={{ top: 40, right: 20, left: -10, bottom: 5 }}>
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
                                <LineChart data={statsData} margin={{ top: 40, right: 20, left: -10, bottom: 5 }}>
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

                    {/* Graphique Coûts HP / HC */}
                    {hp_hc_stats.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Coûts par Tarif Heures Pleines / Creuses</h3>
                            {vehicleInfoText && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{vehicleInfoText}</p>}
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={hp_hc_stats} margin={{ top: 40, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                        <XAxis dataKey="name" />
                                        <YAxis unit="€" width={50}/>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        {existing_hp_hc_tariffs.map((tariff, index) => (
                                            <Bar
                                                key={tariff}
                                                dataKey={(data: StatsData) => data.costPerTariff?.[tariff] || 0}
                                                name={tariff}
                                                stackId="a"
                                                fill={TARIFF_COLORS[tariff]}
                                                unit="€"
                                            >
                                            {index === existing_hp_hc_tariffs.length - 1 && (
                                                <LabelList
                                                    dataKey="totalCost"
                                                    position="top"
                                                    formatter={(value: number) => value > 0 ? `${value.toFixed(2)}€` : ''}
                                                    fontSize={12}
                                                    className="fill-slate-600 dark:fill-slate-300"
                                                />
                                            )}
                                            </Bar>
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Graphique Coûts Tempo */}
                    {tempo_stats.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Coûts par Tarif Tempo</h3>
                            {vehicleInfoText && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{vehicleInfoText}</p>}
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={tempo_stats} margin={{ top: 40, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                        <XAxis dataKey="name" />
                                        <YAxis unit="€" width={50}/>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        {existing_tempo_tariffs.map((tariff, index) => (
                                            <Bar
                                                key={tariff}
                                                dataKey={(data: StatsData) => data.costPerTariff?.[tariff] || 0}
                                                name={tariff}
                                                stackId="a"
                                                fill={TARIFF_COLORS[tariff]}
                                                unit="€"
                                            >
                                            {index === existing_tempo_tariffs.length - 1 && (
                                                <LabelList
                                                    dataKey="totalCost"
                                                    position="top"
                                                    formatter={(value: number) => value > 0 ? `${value.toFixed(2)}€` : ''}
                                                    fontSize={12}
                                                    className="fill-slate-600 dark:fill-slate-300"
                                                />
                                            )}
                                            </Bar>
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Graphique Coûts Recharge Rapide */}
                    {quick_charge_stats.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Coûts des Recharges Rapides</h3>
                            {vehicleInfoText && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{vehicleInfoText}</p>}
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={quick_charge_stats} margin={{ top: 40, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                        <XAxis dataKey="name" />
                                        <YAxis unit="€" width={50}/>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="totalCost" name="Coût Recharge Rapide" unit="€" fill={TARIFF_COLORS[TariffType.QUICK_CHARGE]}>
                                            <LabelList dataKey="totalCost" position="top" formatter={(value: number) => value > 0 ? `${value.toFixed(2)}€` : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Répartition Totale (Lente vs. Rapide)</h2>
                    {allTimeSlowFastStats.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={allTimeSlowFastStats}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={110}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {allTimeSlowFastStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${Number(value).toFixed(2)} kWh`, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-10">Pas de données pour afficher ce graphique.</p>
                    )}
                </Card>
                <Card>
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">
                        Répartition pour {lastPeriodStats ? `"${lastPeriodStats.name}"` : 'la dernière période'}
                    </h2>
                     {lastPeriodSlowFastStats.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={lastPeriodSlowFastStats}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={110}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {lastPeriodSlowFastStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${Number(value).toFixed(2)} kWh`, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-10">Pas de données pour la période sélectionnée.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Stats;