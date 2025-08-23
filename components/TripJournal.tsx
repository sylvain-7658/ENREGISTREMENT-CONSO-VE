import React, { useState, useMemo, useRef } from 'react';
import TripList from './TripList';
import TripSummary from './TripSummary';
import TripStats from './TripStats';
import Card from './Card';
import { useAppContext } from '../context/AppContext';
import { PlusCircle, FileDown, Loader2 } from 'lucide-react';
import Accordion from './Accordion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import MonthlyTripReport from './MonthlyTripReport';
import AnnualTripReport from './AnnualTripReport';
import { generateTripStats, generateClientStats, generateDestinationStats } from '../utils/calculations';
import { ProcessedTrip, Settings, TripStatsData, ClientStats, DestinationStats, UserVehicle } from '../types';

type SubView = 'details' | 'summary' | 'stats';

const SubViewButton = ({ view, label, activeView, setView }: { view: SubView, label: string, activeView: SubView, setView: (v: SubView) => void }) => (
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
  monthlyTrips: ProcessedTrip[];
  monthlyStats: TripStatsData;
  clientStats: ClientStats[];
  destinationStats: DestinationStats[];
  settings: Settings;
  vehicle: UserVehicle;
}

interface AnnualReportData {
  year: number;
  annualTrips: ProcessedTrip[];
  annualStats: TripStatsData;
  monthlyBreakdown: TripStatsData[];
  clientStats: ClientStats[];
  destinationStats: DestinationStats[];
  settings: Settings;
  vehicle: UserVehicle;
}

const TripJournal: React.FC = () => {
    const [subView, setSubView] = useState<SubView>('details');
    const { trips, setActiveView, settings, activeVehicle } = useAppContext();
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
        trips.forEach(t => {
            const date = new Date(t.date);
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
    }, [trips]);

    const availableYears = useMemo(() => {
        const yearSet = new Set<number>();
        trips.forEach(t => yearSet.add(new Date(t.date).getFullYear()));
        return Array.from(yearSet).sort((a, b) => b - a);
    }, [trips]);

    const handleGenerateMonthlyReport = async () => {
        if (!selectedMonthYear || !activeVehicle) return;
        setIsGeneratingMonthly(true);

        const [year, month] = selectedMonthYear.split('-').map(Number);

        const tripsForMonth = trips.filter(t => {
            const tripDate = new Date(t.date);
            return tripDate.getFullYear() === year && tripDate.getMonth() === month;
        });
        
        const monthlyStats = generateTripStats(tripsForMonth, 'monthly')[0];
        if (!monthlyStats) {
             alert("Aucune donnée de trajet trouvée pour le mois sélectionné.");
             setIsGeneratingMonthly(false);
             return;
        }

        const data: MonthlyReportData = {
            month,
            year,
            monthlyTrips: tripsForMonth.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            monthlyStats,
            clientStats: generateClientStats(tripsForMonth),
            destinationStats: generateDestinationStats(tripsForMonth),
            settings,
            vehicle: activeVehicle,
        };
        
        setMonthlyReportData(data);

        setTimeout(async () => {
            const reportElement = monthlyReportRef.current?.querySelector('#pdf-trip-report');
            if (!reportElement) { return; }
            try {
                const canvas = await html2canvas(reportElement as HTMLElement, { scale: 1.5, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                pdf.save(`rapport-trajets-${year}-${String(month + 1).padStart(2, '0')}.pdf`);
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
    
        const tripsForYear = trips.filter(t => new Date(t.date).getFullYear() === year);
        const annualStats = generateTripStats(tripsForYear, 'yearly')[0];
    
        if (!annualStats) {
            alert("Aucune donnée de trajet trouvée pour l'année sélectionnée.");
            setIsGeneratingAnnual(false);
            return;
        }
    
        const data: AnnualReportData = {
            year,
            annualTrips: tripsForYear,
            annualStats,
            monthlyBreakdown: generateTripStats(tripsForYear, 'monthly'),
            clientStats: generateClientStats(tripsForYear),
            destinationStats: generateDestinationStats(tripsForYear),
            settings,
            vehicle: activeVehicle,
        };
    
        setAnnualReportData(data);
    
        setTimeout(async () => {
            const reportElement = annualReportRef.current?.querySelector('#pdf-annual-trip-report');
            if (!reportElement) { return; }
            try {
                const canvas = await html2canvas(reportElement as HTMLElement, { scale: 1.5, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                pdf.save(`rapport-annuel-trajets-${year}.pdf`);
            } catch (error) {
                console.error("Failed to generate annual PDF:", error);
            } finally {
                setIsGeneratingAnnual(false);
                setAnnualReportData(null);
            }
        }, 250);
    };

    return (
        <Card className="p-0">
             <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center no-print">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        Journal des trajets
                    </h2>
                </div>
                <button
                    onClick={() => setActiveView('add-trip')}
                    className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors no-pdf"
                >
                    <PlusCircle size={18} />
                    Nouveau trajet
                </button>
            </div>

            {trips.length > 0 && (
                 <div className="px-6 no-print space-y-2">
                    <Accordion title={<span className="text-red-600 dark:text-red-500">Générer un rapport de trajet mensuel</span>} icon={<FileDown size={20} />}>
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
                    <Accordion title={<span className="text-red-600 dark:text-red-500">Générer un rapport de trajet annuel</span>} icon={<FileDown size={20} />}>
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
            )}

            {trips.length > 0 ? (
                <>
                    <div className="px-6 border-b border-slate-200 dark:border-slate-700 no-print">
                        <nav className="flex space-x-8 -mb-px" aria-label="Trip journal sections">
                            <SubViewButton view="details" label="Détail des trajets" activeView={subView} setView={setSubView} />
                            <SubViewButton view="summary" label="Résumés" activeView={subView} setView={setSubView} />
                            <SubViewButton view="stats" label="Statistiques" activeView={subView} setView={setSubView} />
                        </nav>
                    </div>
                    {subView === 'details' && <TripList />}
                    {subView === 'summary' && <TripSummary />}
                    {subView === 'stats' && <TripStats />}
                </>
            ) : (
                <div className="p-6">
                    <TripList />
                </div>
            )}

             {(isGeneratingMonthly || isGeneratingAnnual) && (
                 <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
                    {isGeneratingMonthly && monthlyReportData && (
                        <div ref={monthlyReportRef}>
                            <MonthlyTripReport data={monthlyReportData} />
                        </div>
                    )}
                    {isGeneratingAnnual && annualReportData && (
                        <div ref={annualReportRef}>
                            <AnnualTripReport data={annualReportData} />
                        </div>
                    )}
                 </div>
            )}
        </Card>
    );
};

export default TripJournal;