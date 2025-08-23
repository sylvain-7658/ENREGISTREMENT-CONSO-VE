import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ProcessedTrip, Settings, TripStatsData, ClientStats, DestinationStats, UserVehicle } from '../types';

interface ReportData {
  year: number;
  annualTrips: ProcessedTrip[];
  annualStats: TripStatsData;
  monthlyBreakdown: TripStatsData[];
  clientStats: ClientStats[];
  destinationStats: DestinationStats[];
  settings: Settings;
  vehicle: UserVehicle;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f97316', '#a855f7', '#ef4444', '#64748b'];

const ReportStat = ({ title, value }: { title: string; value: string; }) => (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-500">{title}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
);

const AnnualTripReport: React.FC<{ data: ReportData }> = ({ data }) => {
    const { year, annualStats, monthlyBreakdown, clientStats, destinationStats, settings, vehicle } = data;

    const topDestinations = destinationStats.sort((a, b) => b.tripCount - a.tripCount).slice(0, 5);
    const topClients = clientStats.filter(c => c.totalBillingAmount > 0).sort((a, b) => b.totalBillingAmount - a.totalBillingAmount).slice(0, 5);
    
    const monthlyChartData = monthlyBreakdown.map(stat => ({
        name: new Date(stat.name + '-02').toLocaleString('fr-FR', { month: 'short' }),
        'Distance (km)': stat.totalDistance,
        'Facturation (€)': stat.totalBillingAmount,
    }));

    return (
        <div id="pdf-annual-trip-report" className="p-6 bg-white text-slate-900 font-sans" style={{ width: '1123px', height: '794px' }}>
            <header className="flex justify-between items-center pb-4 border-b border-slate-300">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Rapport de Trajet Annuel</h1>
                    <p className="text-lg font-semibold text-blue-600">Année {year}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{vehicle.name} ({vehicle.model})</p>
                    <p className="text-sm text-slate-600">{vehicle.registrationNumber}</p>
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
                                <YAxis yAxisId="left" unit=" km" fontSize={10} />
                                <YAxis yAxisId="right" orientation="right" unit="€" fontSize={10} />
                                <Tooltip formatter={(value, name) => [`${Number(value).toFixed(0)} ${name === 'Facturation (€)' ? '€' : 'km'}`, name]} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="Distance (km)" fill="#3b82f6" name="Distance" />
                                <Bar yAxisId="right" dataKey="Facturation (€)" fill="#10b981" name="Facturation" />
                            </BarChart>
                        </ResponsiveContainer>
                    </section>
                    <section>
                         <h2 className="text-lg font-bold text-slate-700 mb-2">Récapitulatif par mois</h2>
                         <div className="overflow-hidden border border-slate-200 rounded-lg" style={{ maxHeight: '280px' }}>
                             <table className="min-w-full text-xs">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="py-2 px-3 text-left font-semibold">Mois</th>
                                        <th className="py-2 px-3 text-left font-semibold">Distance</th>
                                        <th className="py-2 px-3 text-left font-semibold">Coût</th>
                                        <th className="py-2 px-3 text-left font-semibold">Économies</th>
                                        <th className="py-2 px-3 text-left font-semibold">Facturation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {monthlyBreakdown.map(stat => (
                                        <tr key={stat.name}>
                                            <td className="py-1 px-3 font-semibold">{new Date(stat.name + '-02').toLocaleString('fr-FR', { month: 'long' })}</td>
                                            <td className="py-1 px-3">{stat.totalDistance.toLocaleString('fr-FR')} km</td>
                                            <td className="py-1 px-3">{stat.totalCost.toFixed(2)} €</td>
                                            <td className="py-1 px-3" style={{ color: stat.totalSavings > 0 ? '#10b981' : '#ef4444' }}>{stat.totalSavings.toFixed(2)} €</td>
                                            <td className="py-1 px-3 font-semibold">{stat.totalBillingAmount > 0 ? `${stat.totalBillingAmount.toFixed(2)} €` : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
                <div className="col-span-2 space-y-4">
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 mb-2">Résumé de l'année</h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <ReportStat title="Distance Totale" value={`${annualStats.totalDistance.toLocaleString('fr-FR')} km`} />
                            <ReportStat title="Coût Total" value={`${annualStats.totalCost.toFixed(2)} €`} />
                            <ReportStat title="Économies" value={`${annualStats.totalSavings.toFixed(2)} €`} />
                            <ReportStat title="Total Facturé" value={`${annualStats.totalBillingAmount.toFixed(2)} €`} />
                        </div>
                    </section>
                    {topDestinations.length > 0 && (
                        <section>
                            <h3 className="text-center text-sm font-bold text-slate-700">Top 5 Destinations (# trajets)</h3>
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie data={topDestinations} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label={(e) => `${e.name} (${e.value})`}>
                                        {topDestinations.map((e, i) => <Cell key={e.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => `${v} trajet(s)`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </section>
                    )}
                     {topClients.length > 0 && (
                        <section>
                            <h3 className="text-center text-sm font-bold text-slate-700">Top 5 Clients (€ facturé)</h3>
                             <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie data={topClients} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label={(e) => `${e.value.toFixed(0)}€`}>
                                        {topClients.map((e, i) => <Cell key={e.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => `${Number(v).toFixed(2)} €`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AnnualTripReport;