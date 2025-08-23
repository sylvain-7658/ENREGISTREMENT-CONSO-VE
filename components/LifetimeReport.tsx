import React from 'react';
import { Settings, MaintenanceEntry, UserVehicle } from '../types';

interface ReportData {
    rechargeSummaryByYear: {
        [year: string]: {
            hpc: { kwh: number; cost: number };
            tempo: { kwh: number; cost: number };
            quick: { kwh: number; cost: number };
            free: { kwh: number; cost: number };
            total: { kwh: number; cost: number };
        };
    };
    yearlyConsumptionData: { year: string; totalDistance: number; avgConsumption: number; avgCostPer100km: number; }[];
    consumptionGrandTotal: {
        totalDistance: number;
        avgConsumption: number;
        avgCostPer100km: number;
    };
    yearlySavingsData: {
        year: string;
        savings: number;
    }[];
    savingsGrandTotal: number;
    maintenanceSummaryByYear: {
        [year: string]: {
            entries: MaintenanceEntry[];
            subtotal: number;
        };
    };
    yearlyChargeDistribution: {
        [year: string]: {
            slowKwh: number;
            fastKwh: number;
            totalKwh: number;
            slowPercent: number;
            fastPercent: number;
        };
    };
    grandTotalChargeDistribution: {
        slowKwh: number;
        fastKwh: number;
        totalKwh: number;
        slowPercent: number;
        fastPercent: number;
    };
    settings: Settings;
    vehicle: UserVehicle;
}

const LifetimeReport: React.FC<{ data: ReportData }> = ({ data }) => {
    const {
        rechargeSummaryByYear,
        yearlyConsumptionData,
        consumptionGrandTotal,
        yearlySavingsData,
        savingsGrandTotal,
        maintenanceSummaryByYear,
        yearlyChargeDistribution,
        grandTotalChargeDistribution,
        settings,
        vehicle,
    } = data;

    const sortedRechargeYears = Object.keys(rechargeSummaryByYear).sort((a, b) => Number(b) - Number(a));
    const sortedMaintenanceYears = Object.keys(maintenanceSummaryByYear).sort((a, b) => Number(b) - Number(a));
    const sortedConsumptionYears = [...yearlyConsumptionData].sort((a, b) => Number(b.year) - Number(a.year));
    const sortedSavingsData = [...yearlySavingsData].sort((a, b) => Number(b.year) - Number(a.year));
    const sortedChargeDistributionYears = Object.keys(yearlyChargeDistribution).sort((a, b) => Number(b) - Number(a));

    const maintenanceGrandTotal = Object.values(maintenanceSummaryByYear).reduce((sum, yearData) => sum + yearData.subtotal, 0);

    return (
        <div id="pdf-lifetime-report" className="p-8 bg-white text-slate-900 font-sans" style={{ width: '794px', height: '1123px' }}>
            <header className="flex justify-between items-center pb-4 border-b-2 border-blue-600">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Rapport Complet du Véhicule</h1>
                    <p className="text-lg font-semibold text-slate-600">Historique complet</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-lg">{vehicle.name} ({vehicle.model})</p>
                    <p className="text-sm text-slate-600">{vehicle.registrationNumber}</p>
                </div>
            </header>

            <main className="mt-6 space-y-6">
                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-3">Récapitulatif des Recharges par Année</h2>
                    <table className="w-full text-xs border-collapse">
                        <thead className="bg-slate-100">
                            <tr className="border-b-2 border-slate-300">
                                <th className="p-2 text-left font-semibold">Année</th>
                                <th className="p-2 text-right font-semibold">HP/HC</th>
                                <th className="p-2 text-right font-semibold">Tempo</th>
                                <th className="p-2 text-right font-semibold">Rapide</th>
                                <th className="p-2 text-right font-semibold">Gratuit</th>
                                <th className="p-2 text-right font-semibold border-l-2 border-slate-300">Total Annuel</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRechargeYears.map(year => (
                                <tr key={year} className="border-b border-slate-200">
                                    <td className="p-2 font-bold">{year}</td>
                                    <td className="p-2 text-right">
                                        <div>{rechargeSummaryByYear[year].hpc.cost.toFixed(2)} €</div>
                                        <div className="text-slate-500">{rechargeSummaryByYear[year].hpc.kwh.toFixed(1)} kWh</div>
                                    </td>
                                    <td className="p-2 text-right">
                                        <div>{rechargeSummaryByYear[year].tempo.cost.toFixed(2)} €</div>
                                        <div className="text-slate-500">{rechargeSummaryByYear[year].tempo.kwh.toFixed(1)} kWh</div>
                                    </td>
                                    <td className="p-2 text-right">
                                        <div>{rechargeSummaryByYear[year].quick.cost.toFixed(2)} €</div>
                                        <div className="text-slate-500">{rechargeSummaryByYear[year].quick.kwh.toFixed(1)} kWh</div>
                                    </td>
                                    <td className="p-2 text-right">
                                        <div className="text-slate-500">{rechargeSummaryByYear[year].free.kwh.toFixed(1)} kWh</div>
                                    </td>
                                    <td className="p-2 text-right font-bold border-l-2 border-slate-300">
                                        <div>{rechargeSummaryByYear[year].total.cost.toFixed(2)} €</div>
                                        <div className="text-slate-500 font-normal">{rechargeSummaryByYear[year].total.kwh.toFixed(1)} kWh</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="grid grid-cols-2 gap-6 pt-4">
                     <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">Synthèse Consommation & Coûts</h2>
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-100">
                                <tr className="border-b-2 border-slate-300">
                                    <th className="p-2 text-left font-semibold">Année</th>
                                    <th className="p-2 text-right font-semibold">Distance</th>
                                    <th className="p-2 text-right font-semibold">Conso. Moy.</th>
                                    <th className="p-2 text-right font-semibold">Coût / 100km</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedConsumptionYears.map(stat => (
                                    <tr key={stat.year} className="border-b border-slate-200">
                                        <td className="p-2 font-bold">{stat.year}</td>
                                        <td className="p-2 text-right">{stat.totalDistance.toLocaleString('fr-FR')} km</td>
                                        <td className="p-2 text-right">{stat.avgConsumption.toFixed(2)} kWh/100km</td>
                                        <td className="p-2 text-right">{stat.avgCostPer100km.toFixed(2)} €/100km</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <tr>
                                    <td className="p-2 text-left">Total Général</td>
                                    <td className="p-2 text-right">{consumptionGrandTotal.totalDistance.toLocaleString('fr-FR')} km</td>
                                    <td className="p-2 text-right">{consumptionGrandTotal.avgConsumption.toFixed(2)} kWh/100km</td>
                                    <td className="p-2 text-right">{consumptionGrandTotal.avgCostPer100km.toFixed(2)} €/100km</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                     <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">Gains vs. Véhicule Thermique</h2>
                         <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-100">
                                <tr className="border-b-2 border-slate-300">
                                    <th className="p-2 text-left font-semibold">Année</th>
                                    <th className="p-2 text-right font-semibold">Économies Réalisées</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedSavingsData.map(item => (
                                    <tr key={item.year} className="border-b border-slate-200">
                                        <td className="p-2 font-bold">{item.year}</td>
                                        <td className="p-2 text-right" style={{ color: item.savings >= 0 ? '#10b981' : '#ef4444' }}>
                                            {item.savings.toFixed(2)} €
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <tr>
                                    <td className="p-2 text-left">Total des Gains</td>
                                    <td className="p-2 text-right" style={{ color: savingsGrandTotal >= 0 ? '#10b981' : '#ef4444' }}>
                                        {savingsGrandTotal.toFixed(2)} €
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">Répartition des Types de Recharge</h2>
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-100">
                                <tr className="border-b-2 border-slate-300">
                                    <th className="p-2 text-left font-semibold">Année</th>
                                    <th className="p-2 text-right font-semibold">% Recharge Lente (kWh)</th>
                                    <th className="p-2 text-right font-semibold">% Recharge Rapide (kWh)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedChargeDistributionYears.map(year => (
                                    <tr key={year} className="border-b border-slate-200">
                                        <td className="p-2 font-bold">{year}</td>
                                        <td className="p-2 text-right">{yearlyChargeDistribution[year].slowPercent.toFixed(1)} %</td>
                                        <td className="p-2 text-right">{yearlyChargeDistribution[year].fastPercent.toFixed(1)} %</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <tr>
                                    <td className="p-2 text-left">Total Général</td>
                                    <td className="p-2 text-right">{grandTotalChargeDistribution.slowPercent.toFixed(1)} %</td>
                                    <td className="p-2 text-right">{grandTotalChargeDistribution.fastPercent.toFixed(1)} %</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                     <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">Synthèse des Coûts d'Entretien</h2>
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-100">
                                <tr className="border-b-2 border-slate-300">
                                    <th className="p-2 text-left font-semibold">Année</th>
                                    <th className="p-2 text-right font-semibold">Coût Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedMaintenanceYears.map(year => (
                                    <tr key={year} className="border-b border-slate-200">
                                        <td className="p-2 font-bold">{year}</td>
                                        <td className="p-2 text-right">{maintenanceSummaryByYear[year].subtotal.toFixed(2)} €</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <tr>
                                    <td className="p-2 text-left">Total Général</td>
                                    <td className="p-2 text-right">{maintenanceGrandTotal.toFixed(2)} €</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-3">Historique des Entretiens</h2>
                    <div className="border border-slate-200 rounded-lg">
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-100">
                                <tr className="border-b-2 border-slate-300">
                                    <th className="p-2 text-left font-semibold">Date</th>
                                    <th className="p-2 text-left font-semibold">Kilométrage</th>
                                    <th className="p-2 text-left font-semibold">Type</th>
                                    <th className="p-2 text-left font-semibold">Détails</th>
                                    <th className="p-2 text-right font-semibold">Coût</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedMaintenanceYears.length > 0 ? sortedMaintenanceYears.map(year => (
                                    <React.Fragment key={year}>
                                        {maintenanceSummaryByYear[year].entries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(entry => (
                                            <tr key={entry.id} className="border-b border-slate-200">
                                                <td className="p-2">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                                                <td className="p-2">{entry.odometer.toLocaleString('fr-FR')} km</td>
                                                <td className="p-2">{entry.type}</td>
                                                <td className="p-2">{entry.details || '-'}</td>
                                                <td className="p-2 text-right">{entry.cost.toFixed(2)} €</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-100 font-bold">
                                            <td colSpan={4} className="p-2 text-right">Sous-total {year}</td>
                                            <td className="p-2 text-right">{maintenanceSummaryByYear[year].subtotal.toFixed(2)} €</td>
                                        </tr>
                                    </React.Fragment>
                                )) : (
                                    <tr><td colSpan={5} className="p-4 text-center text-slate-500">Aucun entretien enregistré.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LifetimeReport;