import React, { useState, useMemo, useRef } from 'react';
import ChargeList from './ChargeList';
import ChargeDetails from './ChargeDetails';
import { useAppContext } from '../context/AppContext';
import Card from './Card';
import Accordion from './Accordion';
import { FileDown, Loader2 } from 'lucide-react';
import MonthlyReport from './MonthlyReport';
import AnnualReport from './AnnualReport';
import { generateStats } from '../utils/calculations';
import { ProcessedCharge, Settings, StatsData, TariffType, MaintenanceEntry } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SubViewButton = ({ view, label, activeView, setView }: { view: 'summary' | 'details', label: string, activeView: 'summary' | 'details', setView: (v: 'summary' | 'details') => void }) => (
    <button
        onClick={() => setView(view)}
        className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors duration-200 ${
            activeView === view
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
        }`}
        aria-current={activeView === view ? 'page' : undefined}
    >
        {label}
    </button>
);

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
}

interface AnnualReportData {
  year: number;
  annualCharges: ProcessedCharge[];
  annualMaintenance: MaintenanceEntry[];
  annualStats: StatsData;
  monthlyBreakdown: StatsData[];
  settings: Settings;
}

const ChargeJournal: React.FC = () => {
    const [subView, setSubView] = useState<'summary' | 'details'>('summary');
    const { charges, settings, maintenanceEntries } = useAppContext();
    const monthlyReportRef = useRef<HTMLDivElement>(null);
    const annualReportRef = useRef<HTMLDivElement>(null);

    const [selectedMonthYear, setSelectedMonthYear] = useState('');
    const [isGeneratingMonthly, setIsGeneratingMonthly] = useState(false);
    const [monthlyReportData, setMonthlyReportData] = useState<MonthlyReportData | null>(null);

    const [selectedYear, setSelectedYear] = useState('');
    const [isGeneratingAnnual, setIsGeneratingAnnual] = useState(false);
    const [annualReportData, setAnnualReportData] = useState<AnnualReportData | null>(null);

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
        if (!selectedMonthYear) return;
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
        
        const monthlyStats = generateStats(chargesForMonth, 'monthly', settings)[0];
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
            hpHcStats: generateStats(chargesForMonth.filter(c => hpHcTariffs.includes(c.tariff)), 'monthly', settings)[0],
            tempoStats: generateStats(chargesForMonth.filter(c => tempoTariffs.includes(c.tariff)), 'monthly', settings)[0],
            quickChargeStats: generateStats(chargesForMonth.filter(c => quickChargeTariffs.includes(c.tariff)), 'monthly', settings)[0],
            settings,
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
        if (!selectedYear) return;
        setIsGeneratingAnnual(true);
        const year = parseInt(selectedYear, 10);
    
        const chargesForYear = charges.filter(c => new Date(c.date).getFullYear() === year);
        const maintenanceForYear = maintenanceEntries.filter(m => new Date(m.date).getFullYear() === year);
        const annualStats = generateStats(chargesForYear, 'yearly', settings)[0];
    
        if (!annualStats && maintenanceForYear.length === 0) {
            alert("Aucune donnée trouvée pour l'année sélectionnée.");
            setIsGeneratingAnnual(false);
            return;
        }
    
        const monthlyBreakdown = generateStats(chargesForYear, 'monthly', settings);
    
        const data: AnnualReportData = {
            year,
            annualCharges: chargesForYear,
            annualMaintenance: maintenanceForYear,
            annualStats,
            monthlyBreakdown,
            settings,
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

    if (charges.length === 0) {
        return (
            <Card>
                <ChargeDetails />
            </Card>
        );
    }

    return (
        <>
            <Card className="p-0">
                <div className="px-6 no-print space-y-2">
                    <Accordion title={<span className="text-red-600 dark:text-red-500">Générer un rapport mensuel</span>} icon={<FileDown size={20} />}>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <select
                                value={selectedMonthYear}
                                onChange={(e) => setSelectedMonthYear(e.target.value)}
                                className="block w-full sm:w-auto p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="">-- Sélectionner un mois --</option>
                                {availableMonths.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleGenerateMonthlyReport}
                                disabled={!selectedMonthYear || isGeneratingMonthly}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                {isGeneratingMonthly ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />}
                                {isGeneratingMonthly ? 'Génération...' : 'Générer PDF'}
                            </button>
                        </div>
                    </Accordion>
                     <Accordion title={<span className="text-red-600 dark:text-red-500">Générer un rapport annuel</span>} icon={<FileDown size={20} />}>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="block w-full sm:w-auto p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="">-- Sélectionner une année --</option>
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleGenerateAnnualReport}
                                disabled={!selectedYear || isGeneratingAnnual}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                {isGeneratingAnnual ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />}
                                {isGeneratingAnnual ? 'Génération...' : 'Générer PDF'}
                            </button>
                        </div>
                    </Accordion>
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

            {(isGeneratingMonthly || isGeneratingAnnual) && (
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
                 </div>
            )}
        </>
    );
};

export default ChargeJournal;