import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, XAxis, YAxis, Legend, Bar, CartesianGrid } from 'recharts';
import { ProcessedCharge, Settings, StatsData, TariffType, MaintenanceEntry } from '../types';

const TARIFF_COLORS: { [key in TariffType]: string } = {
    [TariffType.PEAK]: '#f97316',
    [TariffType.OFF_PEAK]: '#3b82f6',
    [TariffType.TEMPO_BLUE_PEAK]: '#60a5fa',
    [TariffType.TEMPO_BLUE_OFFPEAK]: '#93c5fd',
    [TariffType.TEMPO_WHITE_PEAK]: '#a1a1aa',
    [TariffType.TEMPO_WHITE_OFFPEAK]: '#d4d4d8',
    [TariffType.TEMPO_RED_PEAK]: '#ef4444',
    [TariffType.TEMPO_RED_OFFPEAK]: '#fca5a5',
    [TariffType.QUICK_CHARGE]: '#a855f7',
    [TariffType.FREE_CHARGE]: '#22c55e',
};

const ReportStat = ({ title, value }: { title: string; value: string; }) => (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-500">{title}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
);

interface ReportData {
  year: number;
  annualCharges: ProcessedCharge[];
  annualMaintenance: MaintenanceEntry[];
  annualStats: StatsData;
  monthlyBreakdown: StatsData[];
  settings: Settings;
}

const AnnualReport: React.FC<{ data: ReportData }> = ({ data }) => {
    const { year, annualStats, monthlyBreakdown, settings, annualMaintenance } = data;
    
    const totalMaintenanceCost = annualMaintenance.reduce((sum, entry) => sum + entry.cost, 0);
    const totalCost = (annualStats?.totalCost || 0) + totalMaintenanceCost;

    const costChartData = annualStats ? Object.entries(annualStats.costPerTariff).map(([name, value]) => ({ name: name as TariffType, value })).filter(item => item.value > 0) : [];
    const kwhChartData = annualStats ? Object.entries(annualStats.kwhPerTariff).map(([name, value]) => ({ name: name as TariffType, value })).filter(item => item.value > 0) : [];
    const chargeCountChartData = Object.entries(
        data.annualCharges.reduce((acc, charge) => {
            acc[charge.tariff] = (acc[charge.tariff] || 0) + 1;
            return acc;
        }, {} as { [key in TariffType]?: number })
    ).map(([name, value]) => ({ name: name as TariffType, value: value! }));

    const monthlyChartData = monthlyBreakdown.map(stat => ({
        name: new Date(stat.name + '-02').toLocaleString('fr-FR', { month: 'short' }),
        'Coût (€)': stat.totalCost,
        'Énergie (kWh)': stat.totalKwh,
    }));
    
    const legendPayload = costChartData.map(entry => ({ value: entry.name, color: TARIFF_COLORS[entry.name] }));

    return (
        <div id="pdf-annual-report" className="p-6 bg-white text-slate-900 font-sans" style={{ width: '1123px', height: '794px' }}>
            <header className="flex justify-between items-center pb-4 border-b border-slate-300">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Rapport Annuel</h1>
                    <p className="text-lg font-semibold text-blue-600">Année {year}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{settings.vehicleModel}</p>
                    <p className="text-sm text-slate-600">{settings.registrationNumber}</p>
                </div>
            </header>

            <main className="mt-4 grid grid-cols-5 gap-6">
                <div className="col-span-3 space-y-4">
                     <section>
                        <h2 className="text-lg font-bold text-slate-700 mb-2">Évolution mensuelle</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={monthlyChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" fontSize={10} />
                                <YAxis yAxisId="left" unit="€" fontSize={10} />
                                <YAxis yAxisId="right" orientation="right" unit=" kWh" fontSize={10} />
                                <Tooltip formatter={(value, name) => [`${Number(value).toFixed(2)} ${name === 'Coût (€)' ? '€' : 'kWh'}`, name]} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="Coût (€)" fill="#3b82f6" name="Coût" />
                                <Bar yAxisId="right" dataKey="Énergie (kWh)" fill="#10b981" name="Énergie" />
                            </BarChart>
                        </ResponsiveContainer>
                    </section>
                    <section>
                         <h2 className="text-lg font-bold text-slate-700 mb-2">Récapitulatif par mois</h2>
                         <div className="overflow-hidden border border-slate-200 rounded-lg" style={{ maxHeight: annualMaintenance.length > 0 ? '160px' : '280px' }}>
                             <table className="min-w-full text-xs">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="py-2 px-3 text-left font-semibold">Mois</th>
                                        <th className="py-2 px-3 text-left font-semibold">Distance</th>
                                        <th className="py-2 px-3 text-left font-semibold">kWh Total</th>
                                        <th className="py-2 px-3 text-left font-semibold">Coût Total</th>
                                        <th className="py-2 px-3 text-left font-semibold">Conso. Moy.</th>
                                        <th className="py-2 px-3 text-left font-semibold">Coût / 100km</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {monthlyBreakdown.map(stat => (
                                        <tr key={stat.name}>
                                            <td className="py-1 px-3 font-semibold">{new Date(stat.name + '-02').toLocaleString('fr-FR', { month: 'long' })}</td>
                                            <td className="py-1 px-3">{stat.totalDistance.toLocaleString('fr-FR')} km</td>
                                            <td className="py-1 px-3">{stat.totalKwh.toFixed(2)} kWh</td>
                                            <td className="py-1 px-3">{stat.totalCost.toFixed(2)} €</td>
                                            <td className="py-1 px-3">{stat.avgConsumption > 0 ? stat.avgConsumption.toFixed(2) : '-'}</td>
                                            <td className="py-1 px-3">{stat.avgCostPer100km > 0 ? stat.avgCostPer100km.toFixed(2) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                     {annualMaintenance.length > 0 && (
                        <section>
                             <h2 className="text-lg font-bold text-slate-700 mb-2">Historique des entretiens</h2>
                             <div className="overflow-hidden border border-slate-200 rounded-lg" style={{ maxHeight: '100px' }}>
                                <table className="min-w-full text-xs">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-semibold">Date</th>
                                            <th className="py-2 px-3 text-left font-semibold">KM</th>
                                            <th className="py-2 px-3 text-left font-semibold">Type</th>
                                            <th className="py-2 px-3 text-left font-semibold">Coût</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {annualMaintenance.map(entry => (
                                            <tr key={entry.id}>
                                                <td className="py-1 px-3">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                                                <td className="py-1 px-3">{entry.odometer.toLocaleString('fr-FR')}</td>
                                                <td className="py-1 px-3">{entry.type}</td>
                                                <td className="py-1 px-3 font-semibold">{entry.cost.toFixed(2)} €</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
                <div className="col-span-2 space-y-4">
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 mb-2">Résumé de l'année</h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <ReportStat title="Coût Général" value={`${totalCost.toFixed(2)} €`} />
                            <ReportStat title="Coût Entretien" value={`${totalMaintenanceCost.toFixed(2)} €`} />
                            {annualStats && <>
                                <ReportStat title="Distance Totale" value={`${annualStats.totalDistance.toLocaleString('fr-FR')} km`} />
                                <ReportStat title="Conso. Moyenne" value={`${annualStats.avgConsumption > 0 ? annualStats.avgConsumption.toFixed(2) : '-'} kWh/100km`} />
                                <ReportStat title="Coût / 100km" value={`${annualStats.avgCostPer100km > 0 ? annualStats.avgCostPer100km.toFixed(2) : '-'} €`} />
                                <ReportStat title="Économies" value={`${(annualStats.totalGasolineCost - (annualStats.totalCost || 0)).toFixed(2)} €`} />
                            </>}
                        </div>
                    </section>
                    {annualStats && costChartData.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold text-slate-700 mb-2">Répartition annuelle par tarif</h2>
                            <div className="grid grid-cols-3 gap-1">
                                <div className="text-center">
                                    <h3 className="text-xs font-bold text-slate-700">Coûts</h3>
                                    <ResponsiveContainer width="100%" height={100}>
                                        <PieChart><Pie data={costChartData} dataKey="value" cx="50%" cy="50%" outerRadius={35} label={(e) => `${e.value.toFixed(0)}€`}>{costChartData.map(e => <Cell key={e.name} fill={TARIFF_COLORS[e.name]} />)}</Pie><Tooltip formatter={(v) => `${Number(v).toFixed(2)} €`} /></PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xs font-bold text-slate-700">Énergie</h3>
                                    <ResponsiveContainer width="100%" height={100}>
                                        <PieChart><Pie data={kwhChartData} dataKey="value" cx="50%" cy="50%" outerRadius={35} label={(e) => `${e.value.toFixed(0)}`} >{kwhChartData.map(e => <Cell key={e.name} fill={TARIFF_COLORS[e.name]} />)}</Pie><Tooltip formatter={(v) => `${Number(v).toFixed(2)} kWh`} /></PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xs font-bold text-slate-700">Recharges</h3>
                                    <ResponsiveContainer width="100%" height={100}>
                                        <PieChart><Pie data={chargeCountChartData} dataKey="value" cx="50%" cy="50%" outerRadius={35} label={(e) => e.value} >{chargeCountChartData.map(e => <Cell key={e.name} fill={TARIFF_COLORS[e.name]} />)}</Pie><Tooltip formatter={(v) => `${v} recharge(s)`} /></PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="flex items-center justify-center pt-2">
                                <ul className="flex flex-wrap justify-center p-0 m-0 list-none">
                                    {legendPayload.map((entry, index) => (
                                        <li key={`item-${index}`} className="flex items-center text-xs mr-3 mb-1">
                                            <span className="inline-block w-2.5 h-2.5 mr-1.5 rounded-sm" style={{ backgroundColor: entry.color }}></span>
                                            <span className="text-slate-600">{entry.value}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AnnualReport;