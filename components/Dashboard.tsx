import React, { useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LabelList, LineChart, Line } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { generateStats } from '../utils/calculations';
import Card from './Card';
import { View, Charge } from '../types';
import { ArrowRight, BarChart3, Euro, PlusCircle, Settings, History, Leaf, Wrench, MapPin, Zap, Route, CalendarDays, Car, Upload, BatteryCharging, TrendingUp, Sparkles, Droplets, Footprints, Trophy } from 'lucide-react';
import { TariffType } from '../types';
import PendingCharges from './PendingCharges';
import PendingTrips from './PendingTrips';
import * as XLSX from 'xlsx';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Mascot } from './Mascot';

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

const Counter = ({ value, duration = 1.5, className, decimals = 0 }: { value: number, duration?: number, className?: string, decimals?: number }) => {
    const count = useMotionValue(0);
    const formatted = useTransform<number, string>(count, (latest) => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(latest as number);
    });

    useEffect(() => {
        const controls = animate(count, value, { duration });
        return controls.stop;
    }, [value, duration]);

    return (
        <motion.span className={className}>{formatted}</motion.span>
    );
};

const Gauge = ({ percentage, label, colorClass }: { percentage: number, label: string, colorClass: string }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * (circumference / 2); // Half circle

    const gaugeVariants = {
        hidden: { strokeDashoffset: circumference / 2 },
        visible: { strokeDashoffset }
    };

    return (
        <div className="flex flex-col items-center">
            <svg width="100" height="60" viewBox="0 0 100 60">
                <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    strokeWidth="10"
                    className="stroke-slate-200 dark:stroke-slate-700"
                />
                <motion.path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className={colorClass}
                    strokeDasharray={circumference}
                    initial={gaugeVariants.hidden}
                    animate={gaugeVariants.visible}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <text x="50" y="45" textAnchor="middle" className="text-xl font-bold fill-slate-800 dark:fill-slate-100">
                    {Math.round(percentage)}%
                </text>
            </svg>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 -mt-2">{label}</span>
        </div>
    );
};

const DayChart = ({ data, highlightColorClass, unit }: { data: { day: string; value: number }[], highlightColorClass: string, unit: string }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero
    
    const barVariants = (value: number) => ({
        hidden: { height: "0%" },
        visible: { height: `${(value / maxValue) * 100}%` },
    });

    return (
        <div className="flex justify-around items-end h-24">
            {data.map(item => (
                <div key={item.day} className="flex flex-col items-center w-full">
                    {/* Value Label */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex flex-col items-center justify-center"
                        style={{ height: '32px' }} // fixed height for the label container
                    >
                         {item.value > 0 ? (
                             <>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{Math.round(item.value)}</span>
                                {unit && <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">{unit}</span>}
                            </>
                         ) : (
                            <span className="h-full">&nbsp;</span>
                         )}
                    </motion.div>

                    {/* Bar */}
                    <div className="w-4 h-12 flex items-end">
                         <motion.div
                            className={`w-full rounded-t-md ${maxValue > 0 && item.value === maxValue ? highlightColorClass : 'bg-slate-300 dark:bg-slate-600'}`}
                            initial="hidden"
                            animate="visible"
                            variants={barVariants(item.value)}
                            transition={{ duration: 1, ease: "circOut" }}
                        />
                    </div>
                    
                    {/* Day Label */}
                    <span className="text-xs mt-1 font-bold text-slate-500 dark:text-slate-400">{item.day}</span>
                </div>
            ))}
        </div>
    );
};

const InfoCard = ({ icon, title, value, unit, subtext, color = 'blue', decimals = 0, breakdown }: {
    icon: React.ReactElement<{ className?: string }>;
    title: string;
    value: number;
    unit: string;
    subtext?: string;
    color?: string;
    decimals?: number;
    breakdown?: { label: string; value: number; unit: string }[];
}) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-400' },
        indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-600 dark:text-indigo-400' },
        yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-400' },
        green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400' },
        cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/50', text: 'text-cyan-600 dark:text-cyan-400' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-400' },
        emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-600 dark:text-emerald-400' },
        teal: { bg: 'bg-teal-100 dark:bg-teal-900/50', text: 'text-teal-600 dark:text-teal-400' },
        sky: { bg: 'bg-sky-100 dark:bg-sky-900/50', text: 'text-sky-600 dark:text-sky-400' },
    };

    const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    return (
        <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl flex flex-col justify-between h-full">
            <div>
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${selectedColor.bg}`}>
                        {React.cloneElement(icon, { className: `w-6 h-6 ${selectedColor.text}` })}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
                        <div className="flex items-baseline gap-1">
                            <Counter value={value} decimals={decimals} className={`text-3xl font-bold ${selectedColor.text}`} />
                            <span className={`text-lg font-medium ${selectedColor.text}`}>{unit}</span>
                        </div>
                    </div>
                </div>
                {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-16">{subtext}</p>}
            </div>
            {breakdown && breakdown.length > 0 && breakdown.some(item => item.value > 0) && (
                 <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    {breakdown.filter(item => item.value > 0).map(item => (
                        <div key={item.label} className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">{item.label}:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{item.value.toFixed(2)} {item.unit}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { charges, settings, maintenanceEntries, setActiveView, activeVehicle, vehicles, importCharges } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const summary = useMemo(() => {
        if (charges.length === 0) {
            return { totalCost: 0, totalDistance: 0, avgConsumption: 0, lastCharge: null, savings: null, avgCostPer100km: 0, gasCostPer100km: null, totalMaintenanceCost: 0, avgCostPer100kmWithMaintenance: 0, totalKwh: 0, avgKwhCost: 0, costHpHc: 0, costTempo: 0, costQuickCharge: 0, kwhHpHc: 0, kwhTempo: 0, kwhQuickCharge: 0, avgDistancePerDay: 0, avgKwhPerDay: 0, avgDistancePerMonth: 0, avgKwhPerMonth: 0, avgSavingsPerMonth: 0, avgMaintenanceCostPerMonth: 0, totalCharges: 0, avgChargesPerMonth: 0, avgStartPercentage: 0, avgEndPercentage: 0, mostFrequentChargeDay: { dayName: '-', avgKwh: 0 }, mostFrequentDriveDay: { dayName: '-', avgDistance: 0 }, chargesByDayOfWeek: [], drivesByDayOfWeek: [], totalCo2Saved: 0, co2SavedByYear: {}, lowestStartPercentage: null };
        }
        const CO2_PER_LITER_GASOLINE = 2.31; // kg CO2 per liter of gasoline
        const totalCost = charges.reduce((sum, c) => sum + c.cost, 0);
        const totalDistance = charges.reduce((sum, c) => sum + (c.distanceDriven || 0), 0);
        const totalKwh = charges.reduce((sum, c) => sum + c.kwhAdded, 0);
        const totalKwhToBattery = charges.reduce((sum, c) => sum + c.kwhAddedToBattery, 0);
        const avgKwhCost = totalKwh > 0 ? totalCost / totalKwh : 0;

        const breakdown = charges.reduce((acc, c) => {
            if ([TariffType.PEAK, TariffType.OFF_PEAK].includes(c.tariff)) {
                acc.costHpHc += c.cost;
                acc.kwhHpHc += c.kwhAdded;
            } else if (c.tariff.startsWith('Tempo')) {
                acc.costTempo += c.cost;
                acc.kwhTempo += c.kwhAdded;
            } else if (c.tariff === TariffType.QUICK_CHARGE) {
                acc.costQuickCharge += c.cost;
                acc.kwhQuickCharge += c.kwhAdded;
            }
            return acc;
        }, { costHpHc: 0, kwhHpHc: 0, costTempo: 0, kwhTempo: 0, costQuickCharge: 0, kwhQuickCharge: 0 });

        const avgConsumption = totalDistance > 0 ? (totalKwhToBattery / totalDistance) * 100 : 0;
        const lastCharge = charges[charges.length - 1];

        const totalTripCost = charges.reduce((sum, c) => sum + ((c.costPer100km || 0) * (c.distanceDriven || 0) / 100), 0);
        const avgCostPer100km = totalDistance > 0 ? (totalTripCost / totalDistance) * 100 : 0;


        let savings: number | null = null;
        let gasCostPer100km: number | null = null;
        if (totalDistance > 0 && settings.gasolineCarConsumption > 0 && settings.gasolinePricePerLiter > 0) {
            const totalGasolineCost = (totalDistance / 100) * settings.gasolineCarConsumption * settings.gasolinePricePerLiter;
            savings = totalGasolineCost - totalCost;
            gasCostPer100km = (settings.gasolineCarConsumption / 100) * settings.gasolinePricePerLiter * 100;
        }

        const totalMaintenanceCost = maintenanceEntries.reduce((sum, entry) => sum + entry.cost, 0);
        
        const maintenanceCostForAvg = maintenanceEntries
            .filter(entry => entry.type !== 'Lavage')
            .reduce((sum, entry) => sum + entry.cost, 0);
        
        const totalCostWithMaintenance = totalTripCost + maintenanceCostForAvg;
        const avgCostPer100kmWithMaintenance = totalDistance > 0 ? (totalCostWithMaintenance / totalDistance) * 100 : 0;
        
        const sortedChargesByDate = [...charges].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstChargeDate = new Date(sortedChargesByDate[0].date);
        const today = new Date();
        const totalDays = Math.ceil((today.getTime() - firstChargeDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const totalMonths = (today.getFullYear() - firstChargeDate.getFullYear()) * 12 + (today.getMonth() - firstChargeDate.getMonth()) + 1;
        
        const avgDistancePerDay = totalDistance > 0 && totalDays > 0 ? totalDistance / totalDays : 0;
        const avgKwhPerDay = totalKwh > 0 && totalDays > 0 ? totalKwh / totalDays : 0;
        const avgDistancePerMonth = totalDistance > 0 && totalMonths > 0 ? totalDistance / totalMonths : 0;
        const avgKwhPerMonth = totalKwh > 0 && totalMonths > 0 ? totalKwh / totalMonths : 0;
        
        const avgSavingsPerMonth = savings && totalMonths > 0 ? savings / totalMonths : 0;
        const avgMaintenanceCostPerMonth = totalMaintenanceCost > 0 && totalMonths > 0 ? totalMaintenanceCost / totalMonths : 0;

        const totalCharges = charges.length;
        const avgChargesPerMonth = totalMonths > 0 ? totalCharges / totalMonths : 0;
        const avgStartPercentage = totalCharges > 0 ? charges.reduce((sum, c) => sum + c.startPercentage, 0) / totalCharges : 0;
        const avgEndPercentage = totalCharges > 0 ? charges.reduce((sum, c) => sum + c.endPercentage, 0) / totalCharges : 0;
        const lowestStartPercentage = charges.length > 0 ? Math.min(...charges.map(c => c.startPercentage)) : null;
        
        const daysOfWeekLong = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const daysOfWeekShort = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    
        const chargesByDayOfWeek = daysOfWeekShort.map(day => ({ day, value: 0, kwh: 0 }));
        charges.forEach(charge => {
            const dayIndex = new Date(charge.date).getDay();
            chargesByDayOfWeek[dayIndex].value++;
            chargesByDayOfWeek[dayIndex].kwh += charge.kwhAdded;
        });

        let mostFrequentChargeDay = { dayName: '-', avgKwh: 0 };
        if (charges.length > 0) {
            let mostCharges = -1;
            let mostFrequentDayIndex = -1;
            chargesByDayOfWeek.forEach((dayData, index) => {
                if (dayData.value > mostCharges) {
                    mostCharges = dayData.value;
                    mostFrequentDayIndex = index;
                }
            });
            if(mostFrequentDayIndex !== -1){
                const dayData = chargesByDayOfWeek[mostFrequentDayIndex];
                mostFrequentChargeDay = {
                    dayName: daysOfWeekLong[mostFrequentDayIndex],
                    avgKwh: dayData.value > 0 ? dayData.kwh / dayData.value : 0,
                };
            }
        }

        const drivesByDayOfWeek = daysOfWeekShort.map(day => ({ day, value: 0 }));
        charges.forEach(charge => {
            if (charge.distanceDriven && charge.distanceDriven > 0) {
                const dayIndex = new Date(charge.date).getDay();
                drivesByDayOfWeek[dayIndex].value += charge.distanceDriven;
            }
        });

        let mostFrequentDriveDay = { dayName: '-', avgDistance: 0 };
        if (charges.some(c => c.distanceDriven && c.distanceDriven > 0)) {
            let maxDistance = -1;
            let mostDrivingDayIndex = -1;
            let driveCountByDay = Array(7).fill(0);
            charges.forEach(c => { if(c.distanceDriven && c.distanceDriven > 0) driveCountByDay[new Date(c.date).getDay()]++ });

            drivesByDayOfWeek.forEach((dayData, index) => {
                if (dayData.value > maxDistance) {
                    maxDistance = dayData.value;
                    mostDrivingDayIndex = index;
                }
            });

            if(mostDrivingDayIndex !== -1) {
                const dayData = drivesByDayOfWeek[mostDrivingDayIndex];
                const driveCount = driveCountByDay[mostDrivingDayIndex];
                mostFrequentDriveDay = {
                    dayName: daysOfWeekLong[mostDrivingDayIndex],
                    avgDistance: driveCount > 0 ? dayData.value / driveCount : 0
                };
            }
        }

        let totalCo2Saved = 0;
        if (totalDistance > 0 && settings.gasolineCarConsumption > 0) {
            const totalLitersGasoline = (totalDistance / 100) * settings.gasolineCarConsumption;
            totalCo2Saved = totalLitersGasoline * CO2_PER_LITER_GASOLINE;
        }

        const co2SavedByYear: { [key: string]: number } = {};
        if (settings.gasolineCarConsumption > 0) {
            charges.forEach(charge => {
                if (charge.distanceDriven && charge.distanceDriven > 0) {
                    const year = new Date(charge.date).getFullYear().toString();
                    const litersForTrip = (charge.distanceDriven / 100) * settings.gasolineCarConsumption;
                    const co2ForTrip = litersForTrip * CO2_PER_LITER_GASOLINE;
                    co2SavedByYear[year] = (co2SavedByYear[year] || 0) + co2ForTrip;
                }
            });
        }


        return {
            totalCost,
            totalDistance,
            avgConsumption,
            lastCharge,
            savings,
            avgCostPer100km,
            gasCostPer100km,
            totalMaintenanceCost,
            avgCostPer100kmWithMaintenance,
            totalKwh,
            avgKwhCost,
            ...breakdown,
            avgDistancePerDay,
            avgKwhPerDay,
            avgDistancePerMonth,
            avgKwhPerMonth,
            avgSavingsPerMonth,
            avgMaintenanceCostPerMonth,
            totalCharges,
            avgChargesPerMonth,
            avgStartPercentage,
            avgEndPercentage,
            lowestStartPercentage,
            mostFrequentChargeDay,
            mostFrequentDriveDay,
            chargesByDayOfWeek,
            drivesByDayOfWeek,
            totalCo2Saved,
            co2SavedByYear,
        };
    }, [charges, settings, maintenanceEntries]);
    
    // Stats for current month
    const { currentMonthStats, weeklyStats } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysPassed = now.getDate();

        const chargesThisMonth = charges.filter(c => {
            const chargeDate = new Date(c.date);
            return chargeDate.getMonth() === currentMonth && chargeDate.getFullYear() === currentYear;
        });

        const weeklyStats = generateStats(chargesThisMonth, 'weekly', settings, activeVehicle);
        
        const initialStats = {
            totalDistance: 0, totalKwh: 0, avgConsumption: 0, totalSavings: 0, totalCost: 0,
            costHpHc: 0, costTempo: 0, costQuickCharge: 0, kwhHpHc: 0, kwhTempo: 0, kwhQuickCharge: 0,
            avgKwhCost: 0,
            avgDistancePerDay: 0,
            avgKwhPerDay: 0,
            co2Saved: 0,
        };

        if (chargesThisMonth.length === 0) return { currentMonthStats: initialStats, weeklyStats: [] };

        const monthStats = generateStats(chargesThisMonth, 'monthly', settings, activeVehicle)[0] || initialStats;

        const breakdown = chargesThisMonth.reduce((acc, c) => {
             if ([TariffType.PEAK, TariffType.OFF_PEAK].includes(c.tariff)) {
                acc.costHpHc += c.cost; acc.kwhHpHc += c.kwhAdded;
            } else if (c.tariff.startsWith('Tempo')) {
                acc.costTempo += c.cost; acc.kwhTempo += c.kwhAdded;
            } else if (c.tariff === TariffType.QUICK_CHARGE) {
                acc.costQuickCharge += c.cost; acc.kwhQuickCharge += c.kwhAdded;
            }
            return acc;
        }, { costHpHc: 0, kwhHpHc: 0, costTempo: 0, kwhTempo: 0, costQuickCharge: 0, kwhQuickCharge: 0 });

        const avgDistancePerDay = monthStats.totalDistance > 0 && daysPassed > 0 ? monthStats.totalDistance / daysPassed : 0;
        const avgKwhPerDay = monthStats.totalKwh > 0 && daysPassed > 0 ? monthStats.totalKwh / daysPassed : 0;

        const currentMonthStats = {
            ...monthStats,
            ...breakdown,
            avgDistancePerDay,
            avgKwhPerDay,
        };

        return { currentMonthStats, weeklyStats };
    }, [charges, settings, activeVehicle]);

    const monthlyStatsChart = useMemo(() => {
        const stats = generateStats(charges, 'monthly', settings, activeVehicle);
        return stats;
    }, [charges, settings, activeVehicle]);

    const existingTariffs = useMemo(() => {
        const allTariffs = new Set<TariffType>();
        monthlyStatsChart.forEach(stat => {
            if (stat.kwhPerTariff) {
                (Object.keys(stat.kwhPerTariff) as TariffType[]).forEach(tariff => {
                    allTariffs.add(tariff);
                });
            }
        });
        return Array.from(allTariffs);
    }, [monthlyStatsChart]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
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
                    {(payload.length > 1 && total > 0 && !payload.some((p:any) => p.name === 'Conso. Moyenne')) && (
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
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        event.target.value = ''; // Allow re-uploading the same file

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null });

            if (jsonData.length === 0) {
                alert("Le fichier est vide ou n'a pas pu être lu.");
                return;
            }

            const headerMapping: { [key: string]: string } = {
                'date': 'date',
                'kilométrage (km)': 'odometer',
                'kilométrage': 'odometer',
                'batterie avant (%)': 'startPercentage',
                'batterie après (%)': 'endPercentage',
                'batterie': 'batteryCombined',
                'tarif': 'tariff',
                'prix/kwh (€)': 'customPrice',
                'prix/kwh': 'customPrice',
            };

            const chargesToImport: Omit<Charge, 'id' | 'vehicleId'>[] = [];
            const errors: string[] = [];
            const validTariffs = Object.values(TariffType) as string[];

            jsonData.forEach((rawRow, index) => {
                const row: any = {};
                for(const key in rawRow) {
                    const cleanKey = key.toLowerCase().trim();
                    if (headerMapping[cleanKey]) {
                        row[headerMapping[cleanKey]] = rawRow[key];
                    }
                }

                let { date, odometer, startPercentage, endPercentage, tariff, customPrice, batteryCombined } = row;
                
                if (batteryCombined != null && startPercentage == null && endPercentage == null) {
                    const parts = String(batteryCombined).match(/(\d+)\s*%\s*→\s*(\d+)\s*%/);
                    if (parts && parts.length === 3) {
                        startPercentage = parts[1];
                        endPercentage = parts[2];
                    } else {
                        errors.push(`Ligne ${index + 2}: Format de 'Batterie' invalide. Attendu "X% → Y%", mais reçu "${batteryCombined}".`);
                        return;
                    }
                }

                if (date == null || odometer == null || startPercentage == null || endPercentage == null || tariff == null) {
                    return; // Skips empty or incomplete rows
                }

                let chargeDateStr: string;
                if (typeof date === 'number' && date > 25569) { 
                    const excelEpoch = new Date(1899, 11, 30);
                    const tempDate = new Date(excelEpoch.getTime() + date * 86400000);
                    chargeDateStr = tempDate.toISOString().split('T')[0];
                } else if (date instanceof Date) {
                    const tempDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                    chargeDateStr = tempDate.toISOString().split('T')[0];
                } else {
                    const parsedDate = new Date(date);
                    if (!isNaN(parsedDate.getTime())) {
                        chargeDateStr = parsedDate.toISOString().split('T')[0];
                    } else {
                        errors.push(`Ligne ${index + 2}: Format de date invalide. Attendu une date, reçu : ${date}`);
                        return;
                    }
                }
                
                const odoNum = parseInt(odometer, 10);
                const startNum = parseInt(startPercentage, 10);
                const endNum = parseInt(endPercentage, 10);

                if (isNaN(odoNum) || isNaN(startNum) || isNaN(endNum)) {
                    errors.push(`Ligne ${index + 2}: Le kilométrage et les pourcentages doivent être des nombres.`);
                    return;
                }

                if (!validTariffs.includes(tariff)) {
                    errors.push(`Ligne ${index + 2}: Le tarif "${tariff}" n'est pas valide.`);
                    return;
                }
                
                const newCharge: Omit<Charge, 'id' | 'vehicleId'> = {
                    date: chargeDateStr,
                    odometer: odoNum,
                    startPercentage: startNum,
                    endPercentage: endNum,
                    tariff: tariff as TariffType,
                    status: 'completed',
                };

                if (newCharge.tariff === TariffType.QUICK_CHARGE) {
                    const priceNum = customPrice ? parseFloat(String(customPrice).replace(',', '.')) : NaN;
                    if (isNaN(priceNum) || priceNum <= 0) {
                        errors.push(`Ligne ${index + 2}: Prix/kWh invalide pour recharge rapide.`);
                        return;
                    }
                    newCharge.customPrice = priceNum;
                }

                chargesToImport.push(newCharge);
            });

            if (errors.length > 0) {
                alert(`Erreurs lors de l'importation :\n\n- ${errors.join('\n- ')}`);
                return;
            }

            if (chargesToImport.length > 0) {
                const { addedCount, skippedCount } = await importCharges(chargesToImport);
                let message = `${addedCount} recharge(s) importée(s) avec succès.`;
                if (skippedCount > 0) {
                    message += ` ${skippedCount} recharge(s) ignorée(s) car déjà présente(s) (basé sur le kilométrage).`;
                }
                alert(message);
            } else {
                alert("Aucune nouvelle recharge à importer n'a été trouvée dans le fichier.");
            }

        } catch (error) {
            console.error("Erreur d'importation :", error);
            alert("Une erreur est survenue lors de la lecture du fichier. Assurez-vous qu'il est au format XLSX ou CSV.");
        }
    };

    const vehicleInfoText = useMemo(() => {
        if (!activeVehicle) return '';

        const namePart = activeVehicle.name ? `de ${activeVehicle.name}` : '';

        const vehicleDetails = [
            activeVehicle.model,
            activeVehicle.registrationNumber ? `(${activeVehicle.registrationNumber})` : ''
        ].filter(Boolean).join(' ');

        return [namePart, vehicleDetails].filter(Boolean).join(' - ');
    }, [activeVehicle]);

    if (vehicles.length === 0) {
        return (
            <Card>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 md:p-10">
                    <div className="flex-shrink-0">
                        <Mascot />
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">
                            Bonjour ! Je suis Volty, votre copilote électrique.
                        </h1>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-lg mx-auto md:mx-0">
                            Je suis là pour vous aider à suivre vos recharges, analyser vos coûts et optimiser votre conduite. Pour commencer, configurons ensemble votre premier véhicule.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                            <button 
                                onClick={() => setActiveView('settings')}
                                className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform hover:scale-105 duration-300"
                            >
                                <Car size={20} />
                                Configurer mon premier véhicule
                            </button>
                            <button 
                                onClick={() => setActiveView('user-guide')}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Lire la notice d'utilisation
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }
    
    if (charges.length < 2) {
        return (
            <div className="space-y-8">
                <PendingCharges />
                <PendingTrips />
                <Card>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 md:p-10">
                        <div className="flex-shrink-0">
                            <Mascot />
                        </div>
                        <div className="flex-grow text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">
                                Prêt à démarrer !
                            </h1>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-lg mx-auto md:mx-0">
                                Votre véhicule est configuré. Pour que je puisse analyser votre consommation, j'ai besoin d'au moins deux recharges. Enregistrons la première !
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                                <button
                                    onClick={() => setActiveView('add-charge')}
                                    className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform hover:scale-105 duration-300"
                                >
                                    <PlusCircle size={20} />
                                    Ajouter ma première recharge
                                </button>
                                <button
                                    onClick={handleImportClick}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    <Upload size={14} />
                                    Importer un historique
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <PendingCharges />
            <PendingTrips />

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-x-4 flex-wrap">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 dashboard-title">
                        Tableau de bord
                    </h1>
                    {vehicleInfoText && <p className="text-xl font-semibold text-slate-500 dark:text-slate-400 dashboard-subtitle">{vehicleInfoText}</p>}
                </div>
                <div className="flex items-center gap-4">
                    {vehicles.length > 1 && (
                         <button 
                            onClick={() => setActiveView('fleet-overview')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <Car size={18} />
                            Vue de la Flotte
                        </button>
                    )}
                     {activeVehicle?.imageUrl && (
                        <img
                            src={activeVehicle.imageUrl}
                            alt={activeVehicle.name}
                            className="w-28 h-auto max-h-20 object-cover rounded-lg border-2 border-white dark:border-slate-700 shadow-sm hidden sm:block"
                        />
                    )}
                </div>
            </div>


            {/* Quick Add Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                    onClick={() => setActiveView('add-charge')}
                    className="flex items-center justify-center gap-3 p-2.5 bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold rounded-lg shadow-sm hover:bg-blue-200 dark:hover:bg-blue-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-200"
                >
                    <PlusCircle size={18} />
                    <span>Ajouter une recharge</span>
                </button>
                <button
                    onClick={() => setActiveView('add-trip')}
                    className="flex items-center justify-center gap-3 p-2.5 bg-green-100 dark:bg-green-900/50 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 font-semibold rounded-lg shadow-sm hover:bg-green-200 dark:hover:bg-green-800/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-all duration-200"
                >
                    <MapPin size={18} />
                    <span>Ajouter un trajet</span>
                </button>
                <button
                    onClick={() => setActiveView('add-maintenance')}
                    className="flex items-center justify-center gap-3 p-2.5 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 font-semibold rounded-lg shadow-sm hover:bg-orange-200 dark:hover:bg-orange-800/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-75 transition-all duration-200"
                >
                    <Wrench size={18} />
                    <span>Enregistrer un entretien</span>
                </button>
            </div>

            {/* Fun Stats - NEW DESIGN */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 p-6 overflow-hidden">
                <div className="flex flex-col lg:flex-row items-center gap-6">
                    <div className="flex-shrink-0 flex flex-col items-center">
                        <Mascot />
                        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mt-4 flex items-center justify-center gap-2">
                            <Sparkles size={20} className="text-yellow-400"/>
                            Statistiques Amusantes
                        </h2>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400">Votre copilote a analysé vos habitudes !</p>
                    </div>
                    <div className="flex-grow w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                             <Trophy size={28} className="text-blue-500 mb-2"/>
                             <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Maître de la Recharge</h3>
                             <Counter value={summary.totalCharges} decimals={0} className="text-5xl font-bold text-blue-600 dark:text-blue-400"/>
                             <p className="text-xs text-slate-500 dark:text-slate-400">{summary.avgChargesPerMonth.toFixed(1)} recharges / mois</p>
                        </div>
                         <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center mb-1">Votre Routine Batterie</h3>
                            <div className="flex justify-around">
                                <Gauge percentage={summary.avgStartPercentage} label="Départ" colorClass="stroke-orange-500" />
                                <Gauge percentage={summary.avgEndPercentage} label="Arrivée" colorClass="stroke-green-500" />
                            </div>
                            {summary.lowestStartPercentage !== null && (
                                <div className="text-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Recharge la plus basse à</p>
                                    <p className="text-xl font-bold text-orange-500">{summary.lowestStartPercentage}%</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Le Jour du Plein est le <span className="text-purple-600 dark:text-purple-400 font-bold">{summary.mostFrequentChargeDay.dayName}</span></h3>
                            <DayChart data={summary.chargesByDayOfWeek} highlightColorClass="bg-purple-500" unit="" />
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">En Route surtout le <span className="text-cyan-600 dark:text-cyan-400 font-bold">{summary.mostFrequentDriveDay.dayName}</span></h3>
                             <DayChart data={summary.drivesByDayOfWeek} highlightColorClass="bg-cyan-500" unit="km" />
                        </div>
                        <div className="sm:col-span-2 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl flex flex-col justify-between">
                            <div>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50">
                                        <Footprints className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Émissions de CO₂ Évitées</p>
                                        <div className="flex items-baseline gap-1">
                                            <Counter value={summary.totalCo2Saved} decimals={0} className="text-3xl font-bold text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-lg font-medium text-emerald-600 dark:text-emerald-400">kg</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">vs. un véhicule thermique équivalent.</p>
                                    </div>
                                </div>
                            </div>
                            {Object.keys(summary.co2SavedByYear).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1 max-h-24 overflow-y-auto">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs mb-1">Détail par année :</p>
                                    {Object.entries(summary.co2SavedByYear)
                                        .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
                                        .map(([year, co2]) => (
                                        <div key={year} className="flex justify-between">
                                            <span className="text-slate-500 dark:text-slate-400">{year}:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{co2.toFixed(0)} kg CO₂</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Last Charge Info */}
            {summary.lastCharge && (
                <Card>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">Dernière recharge</h3>
                        <div className="flex-grow flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                            <p><strong>Date:</strong> {new Date(summary.lastCharge.date).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Coût:</strong> {summary.lastCharge.cost.toFixed(2)} €</p>
                            <p><strong>Énergie:</strong> {summary.lastCharge.kwhAdded.toFixed(2)} kWh</p>
                        </div>
                        <button onClick={() => setActiveView('journal')} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 flex-shrink-0">
                            Voir le journal
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </Card>
            )}

            {/* Current Month Summary */}
            <Card>
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Résumé du mois en cours</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoCard
                        icon={<Route />}
                        title="Distance parcourue"
                        value={currentMonthStats.totalDistance}
                        unit="km"
                        subtext={currentMonthStats.avgDistancePerDay > 0 ? `${currentMonthStats.avgDistancePerDay.toFixed(1)} km / jour` : ''}
                        color="orange"
                    />
                    <InfoCard
                        icon={<Euro />}
                        title="Coût des recharges"
                        value={currentMonthStats.totalCost}
                        unit="€"
                        decimals={2}
                        color="indigo"
                        breakdown={[
                            { label: 'HP / HC', value: currentMonthStats.costHpHc, unit: '€' },
                            { label: 'Tempo', value: currentMonthStats.costTempo, unit: '€' },
                            { label: 'Borne Rapide', value: currentMonthStats.costQuickCharge, unit: '€' },
                        ]}
                    />
                    <InfoCard
                        icon={<Zap />}
                        title="Énergie rechargée"
                        value={currentMonthStats.totalKwh}
                        unit="kWh"
                        decimals={2}
                        subtext={currentMonthStats.avgKwhPerDay > 0 ? `${currentMonthStats.avgKwhPerDay.toFixed(1)} kWh / jour` : ''}
                        color="yellow"
                        breakdown={[
                            { label: 'HP / HC', value: currentMonthStats.kwhHpHc, unit: 'kWh' },
                            { label: 'Tempo', value: currentMonthStats.kwhTempo, unit: 'kWh' },
                            { label: 'Borne Rapide', value: currentMonthStats.kwhQuickCharge, unit: 'kWh' },
                        ]}
                    />
                    <InfoCard
                        icon={<BarChart3 />}
                        title="Consommation"
                        value={currentMonthStats.avgConsumption}
                        unit="kWh/100km"
                        decimals={2}
                        color="sky"
                    />
                    <InfoCard
                        icon={<Leaf />}
                        title="Économies réalisées"
                        value={currentMonthStats.totalSavings}
                        unit="€"
                        decimals={2}
                        color="green"
                    />
                    <InfoCard
                        icon={<TrendingUp />}
                        title="Coût Moyen kWh"
                        value={currentMonthStats.avgKwhCost}
                        unit="€"
                        decimals={2}
                        color="cyan"
                    />
                </div>
            </Card>

            {/* Global Stats Card */}
            <Card>
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Résumé global total des statistiques du véhicule</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoCard
                        icon={<Route />}
                        title="Distance Totale"
                        value={summary.totalDistance}
                        unit="km"
                        subtext={[
                            summary.avgDistancePerDay > 0 ? `${summary.avgDistancePerDay.toFixed(1)} km/j` : '',
                            summary.avgDistancePerMonth > 0 ? `${Math.round(summary.avgDistancePerMonth).toLocaleString('fr-FR')} km/mois` : ''
                        ].filter(Boolean).join(' | ')}
                        color="orange"
                    />
                    <InfoCard
                        icon={<Euro />}
                        title="Coût Total Recharges"
                        value={summary.totalCost}
                        unit="€"
                        decimals={2}
                        color="indigo"
                        breakdown={[
                            { label: 'HP / HC', value: summary.costHpHc, unit: '€' },
                            { label: 'Tempo', value: summary.costTempo, unit: '€' },
                            { label: 'Borne Rapide', value: summary.costQuickCharge, unit: '€' },
                        ]}
                    />
                    <InfoCard
                        icon={<Zap />}
                        title="Énergie Totale Rechargée"
                        value={summary.totalKwh}
                        unit="kWh"
                        decimals={2}
                        subtext={[
                            summary.avgKwhPerDay > 0 ? `${summary.avgKwhPerDay.toFixed(1)} kWh/j` : '',
                            summary.avgKwhPerMonth > 0 ? `${summary.avgKwhPerMonth.toFixed(1)} kWh/mois` : ''
                        ].filter(Boolean).join(' | ')}
                        color="yellow"
                        breakdown={[
                            { label: 'HP / HC', value: summary.kwhHpHc, unit: 'kWh' },
                            { label: 'Tempo', value: summary.kwhTempo, unit: 'kWh' },
                            { label: 'Borne Rapide', value: summary.kwhQuickCharge, unit: 'kWh' },
                        ]}
                    />
                    <InfoCard
                        icon={<Wrench />}
                        title="Coût d'Entretien Total"
                        value={summary.totalMaintenanceCost}
                        unit="€"
                        decimals={2}
                        subtext={summary.avgMaintenanceCostPerMonth > 0 ? `${summary.avgMaintenanceCostPerMonth.toFixed(2)} €/mois` : ''}
                        color="purple"
                    />
                    <InfoCard
                        icon={<BarChart3 />}
                        title="Conso. Moyenne"
                        value={summary.avgConsumption}
                        unit="kWh/100km"
                        decimals={2}
                        color="sky"
                    />
                    <InfoCard
                        icon={<TrendingUp />}
                        title="Coût Moyen / 100km"
                        value={summary.avgCostPer100km}
                        unit="€"
                        decimals={2}
                        subtext={summary.gasCostPer100km ? `vs ${summary.gasCostPer100km.toFixed(2)}€ thermique` : undefined}
                        color="cyan"
                    />
                     <InfoCard
                        icon={<TrendingUp />}
                        title="Coût / 100km (avec entretien)"
                        value={summary.avgCostPer100kmWithMaintenance}
                        unit="€"
                        decimals={2}
                        subtext="hors lavage"
                        color="teal"
                    />
                    <InfoCard
                        icon={<Leaf />}
                        title="Économies Totales"
                        value={summary.savings ?? 0}
                        unit="€"
                        decimals={2}
                        subtext={summary.avgSavingsPerMonth > 0 ? `${summary.avgSavingsPerMonth.toFixed(2)} €/mois` : ''}
                        color="green"
                    />
                     <InfoCard
                        icon={<Euro />}
                        title="Coût Moyen kWh"
                        value={summary.avgKwhCost}
                        unit="€"
                        decimals={2}
                        color="emerald"
                    />
                </div>
            </Card>
            
            {/* Monthly Energy Chart */}
            <Card>
                <h2 className="text-xl font-bold mb-4">Évolution Mensuelle de l'Énergie Rechargée</h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={monthlyStatsChart} margin={{ top: 40, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" kWh" />
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
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Évolution Mensuelle de la Distance Parcourue</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={monthlyStatsChart} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" km" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="totalDistance" name="Distance" unit=" km" fill="#2563eb" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="totalDistance" position="top" formatter={(value: number) => value > 0 ? Math.round(value) : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card>
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Évolution Mensuelle de la Consommation Moyenne</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={monthlyStatsChart} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" kWh/100km" domain={['dataMin - 1', 'dataMax + 1']} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="avgConsumption" name="Conso. Moyenne" unit=" kWh/100km" stroke="#ea580c" strokeWidth={2}>
                                    <LabelList dataKey="avgConsumption" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                                </Line>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <Card>
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Évolution Mensuelle des Dépenses d'Électricité</h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={monthlyStatsChart} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} unit="€" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="totalCost" name="Coût" unit="€" fill="#16a34a" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="totalCost" position="top" formatter={(value: number) => value > 0 ? value.toFixed(2) + '€' : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            
            <Card>
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Leaf size={22} className="text-green-500" />
                    Évolution Mensuelle des Économies de CO₂
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Comparaison par rapport à un véhicule thermique de référence ({settings.gasolineCarConsumption} L/100km).
                </p>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={monthlyStatsChart} margin={{ top: 30, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" kg" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="co2Saved" name="CO₂ évité" unit="kg" fill="#10b981" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="co2Saved" position="top" formatter={(value: number) => value > 0 ? Math.round(value) : ''} fontSize={12} className="fill-slate-600 dark:fill-slate-300" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

        </div>
    );
};

export default Dashboard;