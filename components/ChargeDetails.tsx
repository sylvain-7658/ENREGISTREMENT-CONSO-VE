import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Download, Upload, Mail, FileDown, ChevronLeft, ChevronRight, Zap, Loader2, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Charge, ProcessedCharge, TariffType, Settings, UserVehicle } from '../types';
import ChargeInvoice from './ChargeInvoice';

const ITEMS_PER_PAGE = 10;

// MonthlyStats type for the invoice
interface MonthlyStats {
    totalDistance: number;
    totalKwh: number;
    avgConsumption: number;
    totalSavings: number;
    totalCost: number;
}

const modalBackdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalContentVariants = {
    hidden: { scale: 0.9, y: 20, opacity: 0 },
    visible: { scale: 1, y: 0, opacity: 1 },
};

const EmailPromptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={modalBackdropVariants.hidden}
                    animate={modalBackdropVariants.visible}
                    exit={modalBackdropVariants.hidden}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 no-print"
                >
                    <motion.div
                        initial={modalContentVariants.hidden}
                        animate={modalContentVariants.visible}
                        exit={modalContentVariants.hidden}
                        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 text-center"
                    >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            Relevé PDF téléchargé !
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Le fichier est prêt. Cliquez ci-dessous pour ouvrir votre messagerie. N'oubliez pas de joindre manuellement le PDF téléchargé.
                        </p>
                        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                            >
                                <Send size={16} />
                                Ouvrir l'e-mail pour envoyer
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


const ChargeDetails: React.FC = () => {
    const { charges, deleteCharge, importCharges, settings, setNotification, activeVehicle } = useAppContext();
    const { currentUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
    const [invoiceData, setInvoiceData] = useState<{ charge: ProcessedCharge; monthlyStats: MonthlyStats; settings: Settings, vehicle: UserVehicle } | null>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [showEmailPrompt, setShowEmailPrompt] = useState(false);
    const [emailLink, setEmailLink] = useState('');

    const reversedCharges = useMemo(() => [...charges].reverse(), [charges]);
    const vehicleInfoText = useMemo(() => {
        if (!activeVehicle) return '';
        if (activeVehicle.registrationNumber) {
            return `${activeVehicle.name} (${activeVehicle.registrationNumber})`;
        }
        return activeVehicle.name;
    }, [activeVehicle]);

    const totalPages = Math.ceil(reversedCharges.length / ITEMS_PER_PAGE);
    const paginatedCharges = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return reversedCharges.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, reversedCharges]);

    useEffect(() => {
        if (!invoiceData) return;

        const generatePdf = async () => {
            const reportElement = invoiceRef.current?.querySelector('#pdf-invoice');
            if (!reportElement) {
                console.error("Invoice element not found for PDF generation.");
                setNotification({
                    type: 'warning',
                    message: "Erreur lors de la préparation du relevé. Veuillez réessayer."
                });
                setIsGeneratingInvoice(false);
                setInvoiceData(null);
                return;
            }

            try {
                const canvas = await html2canvas(reportElement as HTMLElement, { scale: 1.5 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasHeight / canvasWidth;
                const imgHeight = pdfWidth * ratio;
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                
                const chargeDate = new Date(invoiceData.charge.date).toISOString().split('T')[0];
                pdf.save(`releve-recharge-${chargeDate}.pdf`);

                // Prepare mailto link but DO NOT open it yet
                const subject = `Relevé de votre recharge du ${new Date(invoiceData.charge.date).toLocaleDateString('fr-FR')}`;
                const body = `Bonjour,

Veuillez trouver en pièce jointe le relevé de la recharge.

Cordialement,
Votre application Volty-Conso`.trim().replace(/^\s+/gm, '');
                
                const mailtoLink = `mailto:${settings.recapEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                setEmailLink(mailtoLink);
                setShowEmailPrompt(true); // Show the confirmation modal instead of navigating

            } catch (error) {
                console.error("Failed to generate PDF:", error);
                setNotification({
                    type: 'warning',
                    message: "Une erreur est survenue lors de la génération du PDF."
                });
            } finally {
                setIsGeneratingInvoice(false);
                setInvoiceData(null); // Clear data after preparing
            }
        };

        const timer = setTimeout(generatePdf, 250); // a small delay to ensure invoiceRef is rendered
        return () => clearTimeout(timer);

    }, [invoiceData, settings.recapEmail, setNotification]);

    const handleConfirmSendEmail = () => {
        if (emailLink) {
            window.location.href = emailLink;
        }
        setShowEmailPrompt(false);
        setEmailLink('');
    };

    const handleGenerateInvoice = (charge: ProcessedCharge) => {
        if (isGeneratingInvoice || !activeVehicle) return;
        if (!settings.recapEmail || !/^\S+@\S+\.\S+$/.test(settings.recapEmail)) {
            setNotification({
                type: 'warning',
                message: "Veuillez configurer une adresse e-mail valide dans les Paramètres."
            });
            return;
        }

        setIsGeneratingInvoice(true);
        
        // Calculate current month stats from dashboard
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const chargesThisMonth = charges.filter(c => {
            const chargeDate = new Date(c.date);
            return chargeDate.getMonth() === currentMonth && chargeDate.getFullYear() === currentYear;
        });
        
        const initialStats = { totalDistance: 0, totalKwh: 0, avgConsumption: 0, totalSavings: 0, totalCost: 0 };

        const statsForMonth = chargesThisMonth.reduce((acc, c) => {
            acc.totalDistance += (c.distanceDriven || 0);
            acc.totalKwh += c.kwhAdded;
            acc.totalCost += c.cost;
            return acc;
        }, initialStats);

        statsForMonth.avgConsumption = statsForMonth.totalDistance > 0 ? (statsForMonth.totalKwh / statsForMonth.totalDistance) * 100 : 0;

        if (statsForMonth.totalDistance > 0 && settings.gasolineCarConsumption > 0 && settings.gasolinePricePerLiter > 0) {
            const totalGasolineCost = (statsForMonth.totalDistance / 100) * settings.gasolineCarConsumption * settings.gasolinePricePerLiter;
            statsForMonth.totalSavings = totalGasolineCost - statsForMonth.totalCost;
        }

        statsForMonth.totalDistance = Math.round(statsForMonth.totalDistance);

        setInvoiceData({
            charge,
            monthlyStats: statsForMonth,
            settings,
            vehicle: activeVehicle
        });
    };

    const handleDownload = () => {
        if (!charges.length) return;

        const headers = [
            "Date", "Kilométrage", "Batterie", "kWh Ajoutés", "Coût", "Tarif", "Prix/kWh", "Conso. (kWh/100km)", "Coût (€/100km)", "Équivalent Thermique (km)"
        ];

        const escapeCsvCell = (cell: any): string => {
            const cellStr = String(cell ?? '').replace(/"/g, '""');
            return `"${cellStr}"`;
        };
        
        const rows = reversedCharges.map(c => [
            c.date.split('T')[0],
            c.odometer,
            `${c.startPercentage}% → ${c.endPercentage}%`,
            c.kwhAdded.toFixed(2),
            c.cost.toFixed(2),
            c.tariff,
            c.pricePerKwh.toFixed(2),
            c.consumptionKwh100km !== null ? c.consumptionKwh100km.toFixed(2) : '',
            c.costPer100km !== null ? c.costPer100km.toFixed(2) : '',
            c.gasolineEquivalentKm !== null ? c.gasolineEquivalentKm : ''
        ].map(escapeCsvCell).join(';'));

        const csvContent = [headers.map(escapeCsvCell).join(';'), ...rows].join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "historique-recharges.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleExportPdf = async () => {
        const elementToExport = document.getElementById('charge-list-details');
        if (!elementToExport) return;
    
        setIsExportingPdf(true);
        document.body.classList.add('is-exporting-pdf');
    
        try {
            const canvas = await html2canvas(elementToExport, {
                scale: 1.5,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                hotfixes: ["px_scaling"],
            });
    
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('historique-recharges.pdf');
    
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Une erreur est survenue lors de l'export PDF.");
        } finally {
            document.body.classList.remove('is-exporting-pdf');
            setIsExportingPdf(false);
        }
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

    if (charges.length === 0) {
        return (
             <div className="text-center py-16 px-6">
                <Zap size={48} className="mx-auto text-slate-400" />
                <h3 className="text-xl font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100">Aucune recharge enregistrée</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Ajoutez une recharge pour commencer à suivre vos données.</p>
                <div className="flex justify-center items-center gap-4 no-print">
                    <button onClick={handleImportClick} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        <Upload size={16} /> Importer un fichier
                    </button>
                    <p>ou ajoutez-la manuellement ci-dessus.</p>
                </div>
                 <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
            </div>
        );
    }

    return (
        <div id="charge-list-details">
            <EmailPromptModal 
                isOpen={showEmailPrompt}
                onClose={() => setShowEmailPrompt(false)}
                onConfirm={handleConfirmSendEmail}
            />
            <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        Détail des recharges
                    </h2>
                     <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 space-x-2">
                        {currentUser && <span>Compte: <span className="font-semibold text-slate-600 dark:text-slate-300">{currentUser.displayName || currentUser.email}</span></span>}
                        {currentUser && vehicleInfoText && <span className="text-slate-400">&bull;</span>}
                        {vehicleInfoText && <span>Véhicule: <span className="font-semibold text-slate-600 dark:text-slate-300">{vehicleInfoText}</span></span>}
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0 no-print">
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
                    <button onClick={handleImportClick} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Importer depuis un fichier (XLSX, CSV)">
                        <Upload size={20} />
                    </button>
                    <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Exporter en CSV">
                        <Download size={20} />
                    </button>
                     <button onClick={handleExportPdf} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Exporter en PDF" disabled={isExportingPdf}>
                        <FileDown size={20} />
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                     <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Kilométrage</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Batterie</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Énergie / Coût</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Tarif</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Consommation</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Coût trajet</th>
                            <th scope="col" className="relative px-6 py-3 no-print">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedCharges.map(charge => (
                            <tr key={charge.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{new Date(charge.date).toLocaleDateString('fr-FR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{charge.odometer.toLocaleString('fr-FR')} km</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{charge.startPercentage}% → {charge.endPercentage}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                    <div className="font-semibold text-slate-800 dark:text-slate-100">{charge.kwhAdded.toFixed(2)} kWh</div>
                                    <div>{charge.cost.toFixed(2)} €</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                    {charge.tariff}
                                    <div className="text-xs text-slate-400">{charge.pricePerKwh.toFixed(2)} €/kWh</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                    {charge.consumptionKwh100km !== null ? (
                                        <span className="text-blue-600 dark:text-blue-400">{charge.consumptionKwh100km.toFixed(2)} kWh/100km</span>
                                    ) : <span className="text-slate-400">-</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                     {charge.costPer100km !== null ? (
                                        <span className="text-orange-600 dark:text-orange-400">{charge.costPer100km.toFixed(2)} €/100km</span>
                                    ) : <span className="text-slate-400">-</span>}
                                    {charge.gasolineEquivalentKm != null && <div className="text-xs text-slate-400 font-normal">Équiv. {charge.gasolineEquivalentKm} km</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium no-print">
                                    <div className="flex items-center justify-end space-x-1">
                                         <button onClick={() => handleGenerateInvoice(charge)} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Générer le relevé PDF pour e-mail" disabled={isGeneratingInvoice}>
                                            {isGeneratingInvoice ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                        </button>
                                        <button onClick={() => window.confirm('Êtes-vous sûr de vouloir supprimer cette recharge ?') && deleteCharge(charge.id)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Supprimer">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {totalPages > 1 && (
                <div className="px-6 py-4 flex justify-between items-center border-t border-slate-200 dark:border-slate-700 no-print">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                        <ChevronLeft size={16} />
                        Précédent
                    </button>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        Page {currentPage} sur {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                        Suivant
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
            {isGeneratingInvoice && invoiceData && (
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
                    <div ref={invoiceRef}>
                        <ChargeInvoice data={invoiceData} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChargeDetails;