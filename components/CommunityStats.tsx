import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import Card from './Card';
import { ArrowLeft, Users, Car, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface GlobalStat {
    id: string;
    modelName: string;
    vehicleCount?: number;
    totalDistance?: number;
    tripCount?: number;
    totalKwhConsumedOnTrips?: number;
    totalChargeCost?: number;
}

interface ProcessedStat extends GlobalStat {
    avgDistancePerVehicle: number;
    avgConsumption: number;
    avgCostPerKm: number;
}

const StatCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
    <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-xl flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    </div>
);

const CommunityStats: React.FC = () => {
    const { setActiveView } = useAppContext();
    const [stats, setStats] = useState<ProcessedStat[]>([]);
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [totalVehicles, setTotalVehicles] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Attempt to fetch user count, but gracefully fail if permissions are restrictive.
                let userCount: number | null = null;
                try {
                    const usersSnapshot = await db.collection('users').get();
                    userCount = usersSnapshot.size;
                } catch (userCountError) {
                    console.warn("Could not fetch user count. This is likely due to Firestore security rules and is expected.", userCountError);
                }
                setTotalUsers(userCount);

                const statsSnapshot = await db.collection('globalStats').get();
                const globalStatsData: GlobalStat[] = statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlobalStat));

                let vehicleSum = 0;
                const processedStats = globalStatsData
                    .filter(stat => stat.vehicleCount && stat.vehicleCount > 0)
                    .map(stat => {
                        vehicleSum += stat.vehicleCount || 0;
                        const totalDistance = stat.totalDistance || 0;
                        const vehicleCount = stat.vehicleCount || 1;
                        const totalKwhConsumedOnTrips = stat.totalKwhConsumedOnTrips || 0;
                        const totalChargeCost = stat.totalChargeCost || 0;

                        const avgDistancePerVehicle = totalDistance / vehicleCount;
                        const avgConsumption = totalDistance > 0 ? (totalKwhConsumedOnTrips / totalDistance) * 100 : 0;
                        const avgCostPerKm = totalDistance > 0 ? totalChargeCost / totalDistance : 0;

                        return {
                            ...stat,
                            avgDistancePerVehicle,
                            avgConsumption,
                            avgCostPerKm,
                        };
                    })
                    .sort((a, b) => (b.vehicleCount || 0) - (a.vehicleCount || 0));
                
                setTotalVehicles(vehicleSum);
                setStats(processedStats);
            } catch (err) {
                console.error("Error fetching community stats:", err);
                setError("Impossible de charger les statistiques de la communauté. Veuillez réessayer plus tard.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <p className="text-center text-red-500">{error}</p>
            </Card>
        );
    }

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
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Statistiques de la communauté Volty-Conso</h2>
                    <p className="text-slate-500 dark:text-slate-400">Données agrégées et anonymes de tous les utilisateurs.</p>
                </div>
            </div>
            
            <div className={`grid grid-cols-1 ${totalUsers !== null ? 'md:grid-cols-2' : ''} gap-6`}>
                {totalUsers !== null && (
                    <StatCard title="Utilisateurs Inscrits" value={totalUsers.toLocaleString('fr-FR')} icon={<Users size={24} />} />
                )}
                <StatCard title="Véhicules Enregistrés" value={totalVehicles !== null ? totalVehicles.toLocaleString('fr-FR') : '-'} icon={<Car size={24} />} />
            </div>
            
            <Card>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Statistiques par Modèle de Véhicule</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Modèle</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Distance Moy./Véhicule</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Conso. Moy.</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Coût Moy./km</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {stats.map(stat => (
                                <tr key={stat.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{stat.modelName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 font-semibold">{stat.vehicleCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.avgDistancePerVehicle.toFixed(0)} km</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.avgConsumption.toFixed(2)} kWh/100km</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{stat.avgCostPerKm.toFixed(3)} €</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {stats.length === 0 && <p className="text-center py-8 text-slate-500 dark:text-slate-400">Aucune statistique de la communauté n'est encore disponible.</p>}
            </Card>
        </div>
    );
};

export default CommunityStats;
