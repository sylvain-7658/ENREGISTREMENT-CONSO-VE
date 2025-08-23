import React, { useState, useMemo, useRef } from 'react';
import ChargeList from './ChargeList';
import ChargeDetails from './ChargeDetails';
import { useAppContext } from '../context/AppContext';
import Card from './Card';
import { FileDown, Loader2 } from 'lucide-react';
import MonthlyReport from './MonthlyReport';
import AnnualReport from './AnnualReport';
import LifetimeReport from './LifetimeReport';
import { generateStats } from '../utils/calculations';
import { ProcessedCharge, Settings, StatsData, TariffType, MaintenanceEntry, UserVehicle } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SubViewButton = ({ view, label, activeView, setView }: { view: 'summary' | 'details', label: string, activeView: 'summary' | 'details', setView: (v: 'summary' | 'details') => void }) => {
    const isDetailsView = view === 'details';
    
    const baseClasses = "whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors duration-200";
    
    let activeColorClasses, inactiveColorClasses;

    if (isDetailsView) {
        // Classes pour "Détail des recharges" en rouge
        activeColorClasses = 'border-red-500 text-red-600 dark:text-red-500';
        inactiveColorClasses = 'border-transparent text-red-600 dark:text-red-500 hover:border-red-300 dark:hover:border-red-600 hover:text-red-700 dark:hover:text-red-400';
    } else {
        // Classes par défaut pour "Résumés"
        activeColorClasses = 'border-blue-500 text-blue-600 dark:text-blue-400';
        inactiveColorClasses = 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600';
    }

    return (
        <button
            onClick={() => setView(view)}
            className={`${baseClasses} ${activeView === view ? activeColorClasses : inactiveColorClasses}`}
            aria-current={activeView === view ? 'page' : undefined}
        >
            {label}
        </button>
    );
};

interface MonthlyReportData {
  month: number;
  year: number;
  monthlyCharges: ProcessedCharge[];
  monthlyMaintenance: MaintenanceEntry[];
  monthlyStats: StatsData;
  hpHcStats?: StatsData;
  tempoStats?: StatsData;
  quickChargeStats?: StatsData;
  settings: Settings;
  vehicle: UserVehicle;
}

interface AnnualReportData {
  year: number;
  annualCharges: ProcessedCharge[];
  annualMaintenance: MaintenanceEntry[];
  annualStats: StatsData;
  monthlyBreakdown: StatsData[];
  settings: Settings;
  vehicle: UserVehicle;
}

interface LifetimeReportData {
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

export const ChargeJournal: React.FC = () => {
    const [subView, setSubView] = useState<'summary' | 'details'>('summary');
    const { charges, settings, maintenanceEntries, activeVehicle } = useAppContext();
    const monthlyReportRef = useRef<HTMLDivElement>(null);
    const annualReportRef = useRef<HTMLDivElement>(null);
    const lifetimeReportRef = useRef<HTMLDivElement>(null);

    const [selectedMonthYear, setSelectedMonthYear] = useState('');
    const [isGeneratingMonthly, setIsGeneratingMonthly] = useState(false);
    const [monthlyReportData, setMonthlyReportData] = useState<MonthlyReportData | null>(null);

    const [selectedYear, setSelectedYear] = useState('');
    const [isGeneratingAnnual, setIsGeneratingAnnual] = useState(false);
    const [annualReportData, setAnnualReportData] = useState<AnnualReportData | null>(null);
    
    const [isGeneratingLifetime, setIsGeneratingLifetime] = useState(false);
    const [lifetimeReportData, setLifetimeReportData] = useState<LifetimeReportData | null>(null);

    const availableMonths = useMemo(() => {
        const monthYearSet = new Set<string>();
        charges.forEach(c => {
            const date = new Date(c.date);
            monthYearSet.add(`${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`);
        });

        return Array.from(monthYearSet)
            .map(my => {
                const [year, month] = my.split('-').map(Number);
                return {
                    value: my,
                    label: new Date(year, month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
                };
            })
            .sort((a, b) => b.value.localeCompare(a.value));
    }, [charges]);

     const availableYears = useMemo(() => {
        const yearSet = new Set<number>();
        charges.forEach(c => yearSet.add(new Date(c.date).getFullYear()));
        return Array.from(yearSet).sort((a, b) => b - a);
    }, [charges]);

    const handleGenerateMonthlyReport = async () => {
        if (!selectedMonthYear || !activeVehicle) return;
        setIsGeneratingMonthly(true);

        const [year, month] = selectedMonthYear.split('-').map(Number);

        const chargesForMonth = charges.filter(c => {
            const chargeDate = new Date(c.date);
            return chargeDate.getFullYear() === year && chargeDate.getMonth() === month;
        });
        
        const maintenanceForMonth = maintenanceEntries.filter(m => {
            const maintenanceDate = new Date(m.date);
            return maintenanceDate.getFullYear() === year && maintenanceDate.getMonth() === month;
        });
        
        const monthlyStats = generateStats(chargesForMonth, 'monthly', settings, activeVehicle)[0];
        if (!monthlyStats && maintenanceForMonth.length === 0) {
             alert("Aucune donnée trouvée pour le mois sélectionné.");
             setIsGeneratingMonthly(false);
             return;
        }

        const hpHcTariffs = [TariffType.PEAK, TariffType.OFF_PEAK];
        const tempoTariffs = [TariffType.TEMPO_BLUE_PEAK, TariffType.TEMPO_BLUE_OFFPEAK, TariffType.TEMPO_WHITE_PEAK, TariffType.TEMPO_WHITE_OFFPEAK, TariffType.TEMPO_RED_PEAK, TariffType.TEMPO_RED_OFFPEAK];
        const quickChargeTariffs = [TariffType.QUICK_CHARGE];

        const data: MonthlyReportData = {
            month,
            year,
            monthlyCharges: chargesForMonth.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            monthlyMaintenance: maintenanceForMonth.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            monthlyStats,
            hpHcStats: generateStats(chargesForMonth.filter(c => hpHcTariffs.includes(c.tariff)), 'monthly', settings, activeVehicle)[0],
            tempoStats: generateStats(chargesForMonth.filter(c => tempoTariffs.includes(c.tariff)), 'monthly', settings, activeVehicle)[0],
            quickChargeStats: generateStats(chargesForMonth.filter(c => quickChargeTariffs.includes(c.tariff)), 'monthly', settings, activeVehicle)[0],
            settings,
            vehicle: activeVehicle
        };
        
        setMonthlyReportData(data);

        setTimeout(async () => {
            const reportElement = monthlyReportRef.current?.querySelector('#pdf-report');
            if (!reportElement) {
                console.error("Report element not found");
                setIsGeneratingMonthly(false);
                setMonthlyReportData(null);
                return;
            }

            try {
                const canvas = await html2canvas(reportElement as HTMLElement, { scale: 1.5, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                pdf.save(`rapport-recharges-${year}-${String(month + 1).padStart(2, '0')}.pdf`);
            } catch (error) {
                console.error("Failed to generate PDF:", error);
            } finally {
                setIsGeneratingMonthly(false);
                setMonthlyReportData(null);
            }
        }, 250);
    };
    
    const handleGenerateAnnualReport = async () => {
        if (!selectedYear || !activeVehicle) return;
        setIsGeneratingAnnual(true);
        const year = parseInt(selectedYear, 10);
    
        const chargesForYear = charges.filter(c => new Date(c.date).getFullYear() === year);
        const maintenanceForYear = maintenanceEntries.filter(m => new Date(m.date).getFullYear() === year);
        const annualStats = generateStats(chargesForYear, 'yearly', settings, activeVehicle)[0];
    
        if (!annualStats && maintenanceForYear.length === 0) {
            alert("Aucune donnée trouvée pour l'année sélectionnée.");
            setIsGeneratingAnnual(false);
            return;
        }
    
        const monthlyBreakdown = generateStats(chargesForYear, 'monthly', settings, activeVehicle);
    
        const data: AnnualReportData = {
            year,
            annualCharges: chargesForYear,
            annualMaintenance: maintenanceForYear,
            annualStats,
            monthlyBreakdown,
            settings,
            vehicle: activeVehicle,
        };
    
        setAnnualReportData(data);
    
        setTimeout(async () => {
            const reportElement = annualReportRef.current?.querySelector('#pdf-annual-report');
            if (!reportElement) {
                console.error("Annual report element not found");
                setIsGeneratingAnnual(false);
                setAnnualReportData(null);
                return;
            }
    
            try {
                const canvas = await html2canvas(reportElement as HTMLElement, { scale: 1.5, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                pdf.save(`rapport-annuel-recharges-${year}.pdf`);
            } catch (error) {
                console.error("Failed to generate annual PDF:", error);
            } finally {
                setIsGeneratingAnnual(false);
                setAnnualReportData(null);
            }
        }, 250);
    };

    const handleGenerateLifetimeReport = async () => {
        if (!activeVehicle) return;
        setIsGeneratingLifetime(true);

        // 1. Recharge Summary by Year
        const rechargeSummaryByYear: LifetimeReportData['rechargeSummaryByYear'] = {};
        charges.forEach(charge => {
            const year = new Date(charge.date).getFullYear().toString();
            if (!rechargeSummaryByYear[year]) {
                rechargeSummaryByYear[year] = {
                    hpc: { kwh: 0, cost: 0 },
                    tempo: { kwh: 0, cost: 0 },
                    quick: { kwh: 0, cost: 0 },
                    free: { kwh: 0, cost: 0 },
                    total: { kwh: 0, cost: 0 },
                };
            }

            let category: 'hpc' | 'tempo' | 'quick' | 'free' | null = null;
            if ([TariffType.PEAK, TariffType.OFF_PEAK].includes(charge.tariff)) {
                category = 'hpc';
            } else if (charge.tariff.startsWith('Tempo')) {
                category = 'tempo';
            } else if (charge.tariff === TariffType.QUICK_CHARGE) {
                category = 'quick';
            } else if (charge.tariff === TariffType.FREE_CHARGE) {
                category = 'free';
            }

            if (category) {
                rechargeSummaryByYear[year][category].kwh += charge.kwhAdded;
                rechargeSummaryByYear[year][category].cost += charge.cost;
                rechargeSummaryByYear[year].total.kwh += charge.kwhAdded;
                rechargeSummaryByYear[year].total.cost += charge.cost;
            }
        });

        // 2. Consumption and Savings Data by Year
        const yearlyStats = generateStats(charges, 'yearly', settings, activeVehicle);
        const yearlyConsumptionData = yearlyStats.map(stat => ({
            year: stat.name,
            totalDistance: stat.totalDistance,
            avgConsumption: stat.avgConsumption,
            avgCostPer100km: stat.avgCostPer100km,
        }));

        // 2a. Consumption Grand Total
        const grandTotalDistance = yearlyStats.reduce((sum, stat) => sum + stat.totalDistance, 0);
        const totalCostOfTrips = charges.reduce((sum, charge) => sum + charge.cost, 0);

        const consumptionGrandTotal = {
            totalDistance: grandTotalDistance,
            avgConsumption: grandTotalDistance > 0 ? (charges.reduce((sum, charge) => sum + charge.kwhAddedToBattery, 0) / grandTotalDistance) * 100 : 0,
            avgCostPer100km: grandTotalDistance > 0 ? (totalCostOfTrips / grandTotalDistance) * 100 : 0,
        };

        // 2b. Savings Data by Year
        const yearlySavingsData = yearlyStats.map(stat => ({
            year: stat.name,
            savings: stat.totalGasolineCost - stat.totalCost,
        }));
        const savingsGrandTotal = yearlySavingsData.reduce((sum, item) => sum + item.savings, 0);

        // 3. Maintenance Summary by Year
        const maintenanceSummaryByYear: LifetimeReportData['maintenanceSummaryByYear'] = {};
        maintenanceEntries.forEach(entry => {
            const year = new Date(entry.date).getFullYear().toString();
            if (!maintenanceSummaryByYear[year]) {
                maintenanceSummaryByYear[year] = { entries: [], subtotal: 0 };
            }
            maintenanceSummaryByYear[year].entries.push(entry);
            maintenanceSummaryByYear[year].subtotal += entry.cost;
        });

        // 4. Yearly Charge Distribution (Slow vs. Fast)
        const yearlyChargeDistribution: LifetimeReportData['yearlyChargeDistribution'] = {};
        
        charges.forEach(charge => {
            const year = new Date(charge.date).getFullYear().toString();
            if (!yearlyChargeDistribution[year]) {
                yearlyChargeDistribution[year] = {
                    slowKwh: 0,
                    fastKwh: 0,
                    totalKwh: 0,
                    slowPercent: 0,
                    fastPercent: 0,
                };
            }

            if (charge.tariff === TariffType.QUICK_CHARGE) {
                yearlyChargeDistribution[year].fastKwh += charge.kwhAdded;
            } else {
                yearlyChargeDistribution[year].slowKwh += charge.kwhAdded;
            }
        });

        Object.values(yearlyChargeDistribution).forEach(yearData => {
            yearData.totalKwh = yearData.slowKwh + yearData.fastKwh;
            if (yearData.totalKwh > 0) {
                yearData.slowPercent = (yearData.slowKwh / yearData.totalKwh) * 100;
                yearData.fastPercent = (yearData.fastKwh / yearData.totalKwh) * 100;
            }
        });
        
        const grandTotalChargeDistribution = Object.values(yearlyChargeDistribution).reduce((acc, yearData) => {
            acc.slowKwh += yearData.slowKwh;
            acc.fastKwh += yearData.fastKwh;
            return acc;
        }, { slowKwh: 0, fastKwh: 0, totalKwh: 0, slowPercent: 0, fastPercent: 0 });

        grandTotalChargeDistribution.totalKwh = grandTotalChargeDistribution.slowKwh + grandTotalChargeDistribution.fastKwh;
        if (grandTotalChargeDistribution.totalKwh > 0) {
            grandTotalChargeDistribution.slowPercent = (grandTotalChargeDistribution.slowKwh / grandTotalChargeDistribution.totalKwh) * 100;
            grandTotalChargeDistribution.fastPercent = (grandTotalChargeDistribution.fastKwh / grandTotalChargeDistribution.totalKwh) * 100;
        }

        const data: LifetimeReportData = {
            rechargeSummaryByYear,
            yearlyConsumptionData,
            consumptionGrandTotal,
            yearlySavingsData,
            savingsGrandTotal,
            maintenanceSummaryByYear,
            yearlyChargeDistribution,
            grandTotalChargeDistribution,
            settings,
            vehicle: activeVehicle
        };
        
        setLifetimeReportData(data);

        setTimeout(async () => {
            const reportElement = lifetimeReportRef.current?.querySelector('#pdf-lifetime-report');
            if (!reportElement) {
                console.error("Lifetime report element not found");
                setIsGeneratingLifetime(false);
                setLifetimeReportData(null);
                return;
            }
            try {
                const canvas = await html2canvas(reportElement as HTMLElement, { scale: 1.5, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`rapport-complet-vehicule.pdf`);
            } catch (error) {
                console.error("Failed to generate lifetime PDF:", error);
            } finally {
                setIsGeneratingLifetime(false);
                setLifetimeReportData(null);
            }
        }, 250);
    };

    if (charges.length === 0) {
        return (
            <Card>
                <ChargeDetails />
            </Card>
        );
    }

    const selectClasses = "block w-full sm:w-auto p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
    const buttonClasses = "flex items-center gap-1.5 p-2 rounded-lg text-sm font-semibold text-blue-800 dark:text-blue-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent";

    return (
        <>
            <Card className="p-0">
                <div className="px-6 py-4 no-print bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-3">
                            <select
                                id="monthly-report-select"
                                value={selectedMonthYear}
                                onChange={(e) => setSelectedMonthYear(e.target.value)}
                                className={selectClasses}
                                aria-label="Sélectionner un mois"
                            >
                                <option value="">-- Rapport mensuel --</option>
                                {availableMonths.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleGenerateMonthlyReport}
                                disabled={!selectedMonthYear || isGeneratingMonthly}
                                className={buttonClasses}
                                title="Générer le PDF mensuel"
                            >
                                {isGeneratingMonthly ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                                <span>Générer</span>
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <select
                                id="annual-report-select"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className={selectClasses}
                                aria-label="Sélectionner une année"
                            >
                                <option value="">-- Rapport annuel --</option>
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleGenerateAnnualReport}
                                disabled={!selectedYear || isGeneratingAnnual}
                                className={buttonClasses}
                                title="Générer le PDF annuel"
                            >
                                {isGeneratingAnnual ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                                <span>Générer</span>
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                             <button
                                onClick={handleGenerateLifetimeReport}
                                disabled={isGeneratingLifetime}
                                className={buttonClasses}
                                title="Générer le rapport complet"
                            >
                                {isGeneratingLifetime ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                                <span>Rapport complet du véhicule</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 border-b border-slate-200 dark:border-slate-700 no-print">
                    <nav className="flex space-x-8 -mb-px" aria-label="Journal sections">
                        <SubViewButton view="summary" label="Résumés" activeView={subView} setView={setSubView} />
                        <SubViewButton view="details" label="Détail des recharges" activeView={subView} setView={setSubView} />
                    </nav>
                </div>
                
                {subView === 'summary' && <ChargeList />}
                {subView === 'details' && <ChargeDetails />}
            </Card>

            {(isGeneratingMonthly || isGeneratingAnnual || isGeneratingLifetime) && (
                 <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
                    {isGeneratingMonthly && monthlyReportData && (
                        <div ref={monthlyReportRef}>
                            <MonthlyReport data={monthlyReportData} />
                        </div>
                    )}
                    {isGeneratingAnnual && annualReportData && (
                        <div ref={annualReportRef}>
                            <AnnualReport data={annualReportData} />
                        </div>
                    )}
                    {isGeneratingLifetime && lifetimeReportData && (
                        <div ref={lifetimeReportRef}>
                            <LifetimeReport data={lifetimeReportData} />
                        </div>
                    )}
                 </div>
            )}
        </>
    );
};