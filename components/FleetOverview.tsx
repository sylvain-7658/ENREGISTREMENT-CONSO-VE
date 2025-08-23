import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { processCharges } from '../utils/calculations';
import Card from './Card';
import { ArrowLeft, BarChart3, Euro, Leaf, Route, Wrench } from 'lucide-react';
import { UserVehicle } from '../types';

interface VehicleStat {
    totalDistance: number;
    totalChargeCost: number;
    totalMaintenanceCost: number;
    totalCost: number;
    avgConsumption: number;
    avgCostPer100km: number;
    totalSavings: number;
}

interface FleetData extends UserVehicle {
    stats: VehicleStat;
}

const StatItem = ({ label, value, unit, icon }: { label: string, value: string, unit: string, icon: React.ReactNode }) => (
    <div className="flex items-center gap-3">
        <div className="flex-shrink-0 text-slate-500">{icon}</div>
        <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
            <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                {value} <span className="text-sm font-normal">{unit}</span>
            </p>
        </div>
    </div>
);

const FleetOverview: React.FC = () => {
    const { vehicles, rawCharges, rawMaintenance, settings, setActiveView } = useAppContext();

    const fleetData = useMemo<FleetData[]>(() => {
        if (!vehicles || vehicles.length === 0) return [];
        
        return vehicles.map(vehicle => {
            const chargesForVehicle = rawCharges.filter(c => c.vehicleId === vehicle.id);
            const maintenanceForVehicle = rawMaintenance.filter(m => m.vehicleId === vehicle.id);
            
            if (chargesForVehicle.length < 2) {
                 return { ...vehicle, stats: { totalDistance: 0, totalChargeCost: 0, totalMaintenanceCost: 0, totalCost: 0, avgConsumption: 0, avgCostPer100km: 0, totalSavings: 0 } };
            }

            const processedCharges = processCharges(chargesForVehicle, settings, vehicle);
            
            const totalDistance = processedCharges.reduce((sum, c) => sum + (c.distanceDriven || 0), 0);
            const totalChargeCost = processedCharges.reduce((sum, c) => sum + c.cost, 0);
            const totalKwhToBattery = processedCharges.reduce((sum, c) => sum + c.kwhAddedToBattery, 0);
            
            const avgConsumption = totalDistance > 0 ? (totalKwhToBattery / totalDistance) * 100 : 0;
            const avgCostPer100km = totalDistance > 0 ? (totalChargeCost / totalDistance) * 100 : 0;
            
            let totalSavings = 0;
            if (totalDistance > 0 && settings.gasolineCarConsumption > 0 && settings.gasolinePricePerLiter > 0) {
                const totalGasolineCost = (totalDistance / 100) * settings.gasolineCarConsumption * settings.gasolinePricePerLiter;
                totalSavings = totalGasolineCost - totalChargeCost;
            }

            const totalMaintenanceCost = maintenanceForVehicle.reduce((sum, entry) => sum + entry.cost, 0);
            const totalCost = totalChargeCost + totalMaintenanceCost;

            return {
                ...vehicle,
                stats: {
                    totalDistance,
                    totalChargeCost,
                    totalMaintenanceCost,
                    totalCost,
                    avgConsumption,
                    avgCostPer100km,
                    totalSavings,
                }
            };
        });
    }, [vehicles, rawCharges, rawMaintenance, settings]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setActiveView('dashboard')} 
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                    aria-label="Retour au tableau de bord"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Synthèse de la Flotte</h2>
            </div>
            {fleetData.length === 0 ? (
                <Card>
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">Aucun véhicule à afficher. Ajoutez des véhicules et des données pour voir la synthèse ici.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {fleetData.map(data => (
                        <Card key={data.id}>
                            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{data.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{data.model} - {data.registrationNumber}</p>
                            
                            <div className="space-y-5">
                                <StatItem label="Distance totale" value={data.stats.totalDistance.toLocaleString('fr-FR')} unit="km" icon={<Route size={24}/>} />
                                <StatItem label="Consommation moyenne" value={data.stats.avgConsumption.toFixed(2)} unit="kWh/100km" icon={<BarChart3 size={24}/>} />
                                <StatItem label="Coût moyen" value={data.stats.avgCostPer100km.toFixed(2)} unit="€/100km" icon={<Euro size={24}/>} />
                                <StatItem label="Coût total des recharges" value={data.stats.totalChargeCost.toFixed(2)} unit="€" icon={<Euro size={24}/>} />
                                <StatItem label="Coût total de l'entretien" value={data.stats.totalMaintenanceCost.toFixed(2)} unit="€" icon={<Wrench size={24}/>} />
                                <StatItem label="Économies totales" value={data.stats.totalSavings.toFixed(2)} unit="€" icon={<Leaf size={24}/>} />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FleetOverview;