import React from 'react';
import { ProcessedCharge, Settings, UserVehicle } from '../types';

interface MonthlyStats {
    totalDistance: number;
    totalKwh: number;
    avgConsumption: number;
    totalSavings: number;
    totalCost: number;
}

interface ChargeInvoiceProps {
  data: {
    charge: ProcessedCharge;
    monthlyStats: MonthlyStats;
    settings: Settings;
    vehicle: UserVehicle;
  }
}

const StatItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-baseline py-1.5 border-b border-slate-100">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-sm font-semibold text-slate-700">{value}</span>
    </div>
);


const ChargeInvoice: React.FC<ChargeInvoiceProps> = ({ data }) => {
    const { charge, monthlyStats, settings, vehicle } = data;
    const chargeDate = new Date(charge.date);

    return (
        <div id="pdf-invoice" className="p-8 bg-white text-slate-900 font-sans" style={{ width: '794px', height: '1123px', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <header className="flex justify-between items-start pb-6 border-b-2 border-blue-600">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-md">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 3V9H18L10 21V15H5L13 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Suivi EV Online</h1>
                        <p className="text-sm text-slate-500">Relevé de recharge électrique</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold text-blue-600">RELEVÉ</h2>
                    <p className="text-sm text-slate-600">Date de la recharge : {chargeDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="text-xs text-slate-500">Généré le : {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
            </header>

            {/* Vehicle Info */}
            <section className="mt-8 grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Véhicule</h3>
                    <p className="font-bold text-lg text-slate-800">{vehicle.name} ({vehicle.model})</p>
                    {vehicle.registrationNumber && <p className="text-slate-600">{vehicle.registrationNumber}</p>}
                </div>
                 <div className="text-right">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Kilométrage</h3>
                    <p className="font-bold text-lg text-slate-800">{charge.odometer.toLocaleString('fr-FR')} km</p>
                </div>
            </section>

            {/* Charge Details Table */}
            <section className="mt-8">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Détails de la recharge</h3>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 text-sm font-semibold text-slate-600">Description</th>
                            <th className="p-3 text-sm font-semibold text-slate-600 text-right">Valeur</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-100">
                            <td className="p-3">Niveau de batterie</td>
                            <td className="p-3 text-right">{charge.startPercentage}% → {charge.endPercentage}%</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="p-3">Énergie ajoutée (compteur)</td>
                            <td className="p-3 text-right">{charge.kwhAdded.toFixed(2)} kWh</td>
                        </tr>
                         <tr className="border-b border-slate-100">
                            <td className="p-3">Énergie ajoutée (batterie)</td>
                            <td className="p-3 text-right">{charge.kwhAddedToBattery.toFixed(2)} kWh</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="p-3">Tarif appliqué</td>
                            <td className="p-3 text-right">{charge.tariff}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="p-3">Prix unitaire</td>
                            <td className="p-3 text-right">{charge.pricePerKwh.toFixed(2)} € / kWh</td>
                        </tr>
                    </tbody>
                    <tfoot className="bg-slate-50">
                        <tr>
                            <td className="p-4 text-lg font-bold text-slate-800">Total de la recharge</td>
                            <td className="p-4 text-lg font-bold text-slate-800 text-right">{charge.cost.toFixed(2)} €</td>
                        </tr>
                    </tfoot>
                </table>
            </section>

            {/* Monthly Summary */}
            <section className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                 <h3 className="text-lg font-semibold text-slate-700 mb-3">Résumé du mois en cours ({new Date().toLocaleString('fr-FR', { month: 'long' })})</h3>
                 <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <StatItem label="Distance parcourue ce mois-ci" value={`${monthlyStats.totalDistance.toLocaleString('fr-FR')} km`} />
                    <StatItem label="Coût total des recharges" value={`${monthlyStats.totalCost.toFixed(2)} €`} />
                    <StatItem label="Énergie rechargée" value={`${monthlyStats.totalKwh.toFixed(2)} kWh`} />
                    <StatItem label="Consommation moyenne" value={`${monthlyStats.avgConsumption.toFixed(2)} kWh/100km`} />
                    <StatItem label="Économies vs. thermique" value={`${monthlyStats.totalSavings.toFixed(2)} €`} />
                 </div>
            </section>
            
            {/* Footer */}
            <footer className="absolute bottom-8 left-8 right-8 text-center text-xs text-slate-400 border-t border-slate-200 pt-4">
                <p>Merci d'utiliser Suivi Conso EV Online pour le suivi de votre véhicule électrique.</p>
                <p>Ce document est un relevé et non une facture officielle à valeur comptable.</p>
            </footer>

        </div>
    );
};

export default ChargeInvoice;