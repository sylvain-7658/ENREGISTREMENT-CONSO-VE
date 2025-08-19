import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

const ReportStat = ({ title, value, subtext }: { title: string; value: string; subtext?: string }) => (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-500">{title}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
);

const SummaryTable = ({ title, stats }: { title: string, stats?: StatsData }) => {
    if (!stats || stats.totalCost === 0) return null;
    return (
        <div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">{title}</h3>
            <table className="w-full text-xs border-collapse">
                <tbody>
                    <tr className="border-b border-slate-200">
                        <td className="py-1 pr-2">Total kWh</td>
                        <td className="py-1 text-right font-semibold">{stats.totalKwh.toFixed(2)} kWh</td>
                    </tr>
                    <tr>
                        <td className="py-1 pr-2">Coût Total</td>
                        <td className="py-1 text-right font-semibold">{stats.totalCost.toFixed(2)} €</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

interface ReportData {
  month: number;
  year: number;
  monthlyCharges: ProcessedCharge[];
  monthlyMaintenance: MaintenanceEntry[];
  monthlyStats: StatsData;
  hpHcStats?: StatsData;
  tempoStats?: StatsData;
  quickChargeStats?: StatsData;
  settings: Settings;
}

const MonthlyReport: React.FC<{ data: ReportData }> = ({ data }) => {
    const { month, year, monthlyCharges, monthlyMaintenance, monthlyStats, hpHcStats, tempoStats, quickChargeStats, settings } = data;
    const monthName = new Date(year, month).toLocaleString('fr-FR', { month: 'long' });

    const hasChargeData = monthlyStats && monthlyStats.totalKwh > 0;
    const totalMaintenanceCost = monthlyMaintenance.reduce((sum, entry) => sum + entry.cost, 0);
    const totalCost = (monthlyStats?.totalCost || 0) + totalMaintenanceCost;

    const costChartData = hasChargeData ? Object.entries(monthlyStats.costPerTariff)
        .map(([name, value]) => ({ name: name as TariffType, value: parseFloat(value.toFixed(2)) }))
        .filter(item => item.value > 0) : [];
        
    const kwhChartData = hasChargeData ? Object.entries(monthlyStats.kwhPerTariff)
        .map(([name, value]) => ({ name: name as TariffType, value: parseFloat(value.toFixed(2)) }))
        .filter(item => item.value > 0) : [];

    const chargeCountByTariff = monthlyCharges.reduce((acc, charge) => {
        acc[charge.tariff] = (acc[charge.tariff] || 0) + 1;
        return acc;
    }, {} as { [key in TariffType]?: number });

    const chargeCountChartData = Object.entries(chargeCountByTariff)
        .map(([name, value]) => ({ name: name as TariffType, value: value! }))
        .filter(item => item.value > 0);
    
    const legendPayload = costChartData.map(entry => ({
        value: entry.name,
        color: TARIFF_COLORS[entry.name],
    }));

    return (
        <div id="pdf-report" className="p-6 bg-white text-slate-900 font-sans" style={{ width: '1123px', height: '794px' }}>
            <header className="flex justify-between items-center pb-4 border-b border-slate-300">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Rapport Mensuel</h1>
                    <p className="text-lg font-semibold text-blue-600">{monthName} {year}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{settings.vehicleModel}</p>
                    <p className="text-sm text-slate-600">{settings.registrationNumber}</p>
                </div>
            </header>

            <main className="mt-4 space-y-4">
                <section>
                    <h2 className="text-lg font-bold text-slate-700 mb-2">Résumé du mois</h2>
                     <div className="grid grid-cols-5 gap-4 text-sm">
                        <ReportStat title="Coût Général" value={`${totalCost.toFixed(2)} €`} subtext="Électricité + Entretien" />
                        <ReportStat title="Coût Entretien" value={`${totalMaintenanceCost.toFixed(2)} €`} />
                        {hasChargeData && (
                            <>
                                <ReportStat title="Coût Électricité" value={`${monthlyStats.totalCost.toFixed(2)} €`} />
                                <ReportStat title="Distance Totale" value={`${monthlyStats.totalDistance.toLocaleString('fr-FR')} km`} />
                                <ReportStat title="Conso. Moyenne" value={`${monthlyStats.avgConsumption.toFixed(2)} kWh/100km`} />
                            </>
                        )}
                    </div>
                </section>
                
                {hasChargeData && (
                    <section className="grid grid-cols-5 gap-4 pt-2">
                        <div className="col-span-3">
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <h3 className="text-center text-sm font-bold text-slate-700 mb-1">Répartition des Coûts</h3>
                                    <ResponsiveContainer width="100%" height={120}>
                                        <PieChart>
                                            <Pie data={costChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} label={(entry) => `${entry.value.toFixed(0)}€`}>
                                                {costChartData.map((entry) => <Cell key={`cell-cost-${entry.name}`} fill={TARIFF_COLORS[entry.name]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value) => `${Number(value).toFixed(2)} €`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <h3 className="text-center text-sm font-bold text-slate-700 mb-1">Répartition de la Consommation</h3>
                                    <ResponsiveContainer width="100%" height={120}>
                                        <PieChart>
                                            <Pie data={kwhChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} label={(entry) => `${entry.value.toFixed(0)}kWh`}>
                                                {kwhChartData.map((entry) => <Cell key={`cell-kwh-${entry.name}`} fill={TARIFF_COLORS[entry.name]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value) => `${Number(value).toFixed(2)} kWh`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <h3 className="text-center text-sm font-bold text-slate-700 mb-1">Répartition des Recharges</h3>
                                    <ResponsiveContainer width="100%" height={120}>
                                        <PieChart>
                                            <Pie data={chargeCountChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} label={(entry) => `${entry.value}`}>
                                                {chargeCountChartData.map((entry) => <Cell key={`cell-count-${entry.name}`} fill={TARIFF_COLORS[entry.name]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value, name) => [`${value} recharge(s)`, name]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="col-span-3 flex items-center justify-center pt-2">
                                <ul className="flex flex-wrap justify-center p-0 m-0 list-none">
                                    {legendPayload.map((entry, index) => (
                                        <li key={`item-${index}`} className="flex items-center text-xs mr-4 mb-1">
                                            <span className="inline-block w-2.5 h-2.5 mr-2 rounded-sm" style={{ backgroundColor: entry.color }}></span>
                                            <span className="text-slate-600">{entry.value}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="col-span-2 space-y-3">
                            <h3 className="text-lg font-bold text-slate-700 mb-2">Résumés par tarif</h3>
                            <SummaryTable title="Heures Pleines / Creuses" stats={hpHcStats} />
                            <SummaryTable title="Tarif Tempo" stats={tempoStats} />
                            <SummaryTable title="Recharge Rapide" stats={quickChargeStats} />
                        </div>
                    </section>
                )}

                 <div className="grid grid-cols-2 gap-x-6 pt-2">
                     {monthlyCharges.length > 0 && (
                        <section>
                             <h2 className="text-lg font-bold text-slate-700 mb-2">Historique des recharges</h2>
                             <div className="overflow-hidden border border-slate-200 rounded-lg" style={{ maxHeight: '280px' }}>
                                <table className="min-w-full text-xs">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-semibold">Date</th>
                                            <th className="py-2 px-3 text-left font-semibold">KM</th>
                                            <th className="py-2 px-3 text-left font-semibold">Batterie</th>
                                            <th className="py-2 px-3 text-left font-semibold">kWh</th>
                                            <th className="py-2 px-3 text-left font-semibold">Coût</th>
                                            <th className="py-2 px-3 text-left font-semibold">Tarif</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {monthlyCharges.map(charge => (
                                            <tr key={charge.id}>
                                                <td className="py-1 px-3 whitespace-nowrap">{new Date(charge.date).toLocaleDateString('fr-FR')}</td>
                                                <td className="py-1 px-3 whitespace-nowrap">{charge.odometer.toLocaleString('fr-FR')}</td>
                                                <td className="py-1 px-3 whitespace-nowrap">{charge.startPercentage}%→{charge.endPercentage}%</td>
                                                <td className="py-1 px-3 whitespace-nowrap font-semibold">{charge.kwhAdded.toFixed(2)}</td>
                                                <td className="py-1 px-3 whitespace-nowrap font-semibold">{charge.cost.toFixed(2)}€</td>
                                                <td className="py-1 px-3 whitespace-nowrap">{charge.tariff}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                    {monthlyMaintenance.length > 0 && (
                        <section>
                             <h2 className="text-lg font-bold text-slate-700 mb-2">Historique des entretiens</h2>
                             <div className="overflow-hidden border border-slate-200 rounded-lg" style={{ maxHeight: '280px' }}>
                                <table className="min-w-full text-xs">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-semibold">Date</th>
                                            <th className="py-2 px-3 text-left font-semibold">KM</th>
                                            <th className="py-2 px-3 text-left font-semibold">Type</th>
                                            <th className="py-2 px-3 text-left font-semibold">Détails</th>
                                            <th className="py-2 px-3 text-left font-semibold">Coût</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {monthlyMaintenance.map(entry => (
                                            <tr key={entry.id}>
                                                <td className="py-1 px-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                                                <td className="py-1 px-3 whitespace-nowrap">{entry.odometer.toLocaleString('fr-FR')}</td>
                                                <td className="py-1 px-3 whitespace-nowrap">{entry.type}</td>
                                                <td className="py-1 px-3 whitespace-nowrap">{entry.details || '-'}</td>
                                                <td className="py-1 px-3 whitespace-nowrap font-semibold">{entry.cost.toFixed(2)}€</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MonthlyReport;