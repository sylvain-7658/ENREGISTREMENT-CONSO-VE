import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ProcessedTrip, Settings, TripStatsData, ClientStats, DestinationStats } from '../types';

interface ReportData {
  month: number;
  year: number;
  monthlyTrips: ProcessedTrip[];
  monthlyStats: TripStatsData;
  clientStats: ClientStats[];
  destinationStats: DestinationStats[];
  settings: Settings;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f97316', '#a855f7', '#ef4444', '#64748b'];

const ReportStat = ({ title, value }: { title: string; value: string; }) => (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-500">{title}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
);

const MonthlyTripReport: React.FC<{ data: ReportData }> = ({ data }) => {
    const { month, year, monthlyTrips, monthlyStats, clientStats, destinationStats, settings } = data;
    const monthName = new Date(year, month).toLocaleString('fr-FR', { month: 'long' });

    const destinationChartData = destinationStats
        .sort((a, b) => b.tripCount - a.tripCount)
        .slice(0, 5)
        .map(d => ({ name: d.name, value: d.tripCount }));
    
    const clientChartData = clientStats
        .filter(c => c.totalBillingAmount > 0)
        .sort((a, b) => b.totalBillingAmount - a.totalBillingAmount)
        .slice(0, 5)
        .map(c => ({ name: c.name, value: c.totalBillingAmount }));

    return (
        <div id="pdf-trip-report" className="p-6 bg-white text-slate-900 font-sans" style={{ width: '1123px', height: '794px' }}>
            <header className="flex justify-between items-center pb-4 border-b border-slate-300">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Rapport de Trajet Mensuel</h1>
                    <p className="text-lg font-semibold text-blue-600">{monthName} {year}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{settings.vehicleModel}</p>
                    <p className="text-sm text-slate-600">{settings.registrationNumber}</p>
                </div>
            </header>

            <main className="mt-4 grid grid-cols-5 gap-6">
                <div className="col-span-3 space-y-4">
                    <section>
                         <h2 className="text-lg font-bold text-slate-700 mb-2">Historique des trajets</h2>
                         <div className="overflow-hidden border border-slate-200 rounded-lg" style={{ maxHeight: '620px' }}>
                            <table className="min-w-full text-xs">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="py-2 px-3 text-left font-semibold">Date</th>
                                        <th className="py-2 px-3 text-left font-semibold">Destination</th>
                                        <th className="py-2 px-3 text-left font-semibold">Client</th>
                                        <th className="py-2 px-3 text-left font-semibold">Distance</th>
                                        <th className="py-2 px-3 text-left font-semibold">Coût</th>
                                        <th className="py-2 px-3 text-left font-semibold">Économie</th>
                                        <th className="py-2 px-3 text-left font-semibold">Facturé</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {monthlyTrips.map(trip => (
                                        <tr key={trip.id}>
                                            <td className="py-1 px-3 whitespace-nowrap">{new Date(trip.date).toLocaleDateString('fr-FR')}</td>
                                            <td className="py-1 px-3 whitespace-nowrap">{trip.destination}</td>
                                            <td className="py-1 px-3 whitespace-nowrap">{trip.client || '-'}</td>
                                            <td className="py-1 px-3 whitespace-nowrap font-semibold">{trip.distance} km</td>
                                            <td className="py-1 px-3 whitespace-nowrap">{trip.cost.toFixed(2)} €</td>
                                            <td className="py-1 px-3 whitespace-nowrap" style={{ color: trip.savings > 0 ? '#10b981' : '#ef4444' }}>{trip.savings.toFixed(2)} €</td>
                                            <td className="py-1 px-3 whitespace-nowrap font-semibold">{trip.billingAmount ? `${trip.billingAmount.toFixed(2)} €` : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
                <div className="col-span-2 space-y-4">
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 mb-2">Résumé du mois</h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <ReportStat title="Distance Totale" value={`${monthlyStats.totalDistance.toLocaleString('fr-FR')} km`} />
                            <ReportStat title="Coût Total des Trajets" value={`${monthlyStats.totalCost.toFixed(2)} €`} />
                            <ReportStat title="Économies Réalisées" value={`${monthlyStats.totalSavings.toFixed(2)} €`} />
                            <ReportStat title="Total Facturé" value={`${monthlyStats.totalBillingAmount.toFixed(2)} €`} />
                        </div>
                    </section>
                    {destinationChartData.length > 0 && (
                        <section>
                            <h3 className="text-center text-sm font-bold text-slate-700 mb-1">Top 5 Destinations (par # trajet)</h3>
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie data={destinationChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label={(entry) => `${entry.name} (${entry.value})`}>
                                        {destinationChartData.map((entry, index) => <Cell key={`cell-dest-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} trajet(s)`]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </section>
                    )}
                     {clientChartData.length > 0 && (
                        <section>
                            <h3 className="text-center text-sm font-bold text-slate-700 mb-1">Top 5 Clients (par € facturé)</h3>
                             <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie data={clientChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label={(entry) => `${entry.value.toFixed(0)}€`}>
                                        {clientChartData.map((entry, index) => <Cell key={`cell-client-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)} €`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MonthlyTripReport;