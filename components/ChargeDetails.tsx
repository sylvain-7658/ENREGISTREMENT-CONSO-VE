
import React, { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, Download, Upload, Mail, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Charge, ProcessedCharge, TariffType } from '../types';

const ChargeDetails: React.FC = () => {
    const { charges, deleteCharge, importCharges, settings } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const handleSendEmail = (charge: ProcessedCharge) => {
        if (!settings.recapEmail || !/^\S+@\S+\.\S+$/.test(settings.recapEmail)) {
            alert("Veuillez configurer une adresse e-mail valide dans les Paramètres pour envoyer un récapitulatif.");
            return;
        }

        const subject = `Récapitulatif de votre recharge du ${new Date(charge.date).toLocaleDateString('fr-FR')}`;
        const body = `
Bonjour,

Voici le récapitulatif de votre recharge :

- Date : ${new Date(charge.date).toLocaleDateString('fr-FR')}
- Kilométrage : ${charge.odometer.toLocaleString('fr-FR')} km
- Niveau de batterie : ${charge.startPercentage}% → ${charge.endPercentage}%
- Énergie ajoutée : ${charge.kwhAdded.toFixed(2)} kWh
- Coût total : ${charge.cost.toFixed(2)} €
- Tarif appliqué : ${charge.tariff}
- Prix par kWh : ${charge.pricePerKwh.toFixed(4)} €
- Consommation depuis dernière recharge : ${charge.consumptionKwh100km !== null ? `${charge.consumptionKwh100km.toFixed(2)} kWh/100km` : 'N/A'}
- Coût par 100km : ${charge.costPer100km !== null ? `${charge.costPer100km.toFixed(2)} €/100km` : 'N/A'}
- Équivalent distance thermique : ${charge.gasolineEquivalentKm !== null ? `${charge.gasolineEquivalentKm} km` : 'N/A'}

Cordialement,
Votre application Suivi Conso EV
        `.trim().replace(/^\s+/gm, '');

        const mailtoLink = `mailto:${settings.recapEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;
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
        
        const rows = charges.map(c => [
            c.date.split('T')[0],
            c.odometer,
            `${c.startPercentage}% → ${c.endPercentage}%`,
            c.kwhAdded.toFixed(2),
            c.cost.toFixed(2),
            c.tariff,
            c.pricePerKwh.toFixed(4),
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

            const chargesToImport: Omit<Charge, 'id'>[] = [];
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
                
                const newCharge: Omit<Charge, 'id'> = {
                    date: chargeDateStr,
                    odometer: odoNum,
                    startPercentage: startNum,
                    endPercentage: endNum,
                    tariff: tariff as TariffType,
                };

                if (newCharge.tariff === TariffType.QUICK_CHARGE) {
                    const price = parseFloat(String(customPrice).replace(',', '.'));
                    if (isNaN(price) || price <= 0) {
                        errors.push(`Ligne ${index + 2}: Pour le tarif '${TariffType.QUICK_CHARGE}', un 'Prix/kWh (€)' valide est requis.`);
                        return;
                    }
                    newCharge.customPrice = price;
                }

                chargesToImport.push(newCharge);
            });

            if (errors.length > 0) {
                alert(`Erreurs lors de la validation des données :\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...' : ''}`);
                return;
            }

            if (chargesToImport.length > 0) {
                const { addedCount, skippedCount } = await importCharges(chargesToImport);
                let message = "";
                if (addedCount > 0) message += `${addedCount} nouvelle(s) recharge(s) importée(s).\n`;
                if (skippedCount > 0) message += `${skippedCount} recharge(s) ignorée(s) (doublons basés sur le kilométrage).\n`;
                if (!message) message = "Aucune nouvelle recharge à importer (toutes les entrées existent déjà).";
                alert(message.trim());
            } else {
                alert("Aucune recharge valide trouvée dans le fichier.");
            }

        } catch (error) {
            console.error("Erreur lors de l'importation du fichier :", error);
            alert("Une erreur est survenue lors de la lecture du fichier. Assurez-vous que c'est un fichier .xlsx ou .csv valide avec les bonnes colonnes.");
        }
    };

    if (charges.length === 0) {
        return (
            <div className="text-center py-10 px-6">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">Aucune recharge</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Commencez par ajouter une nouvelle recharge ou importez un historique.</p>
                <div className="no-print">
                    <button
                        onClick={handleImportClick}
                        className="mt-4 flex mx-auto items-center gap-2 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition-colors"
                        aria-label="Importer un historique"
                    >
                        <Upload size={16} />
                        Importer un fichier
                    </button>
                </div>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                />
            </div>
        );
    }
    
    const reversedCharges = [...charges].reverse();

    return (
        <div>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".xlsx, .xls, .csv"
                className="hidden"
            />
            <div className="p-6 flex justify-between items-center flex-wrap gap-4 no-pdf">
                 <div className="flex items-center gap-2 no-print ml-auto">
                     <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition-colors"
                        aria-label="Importer un historique"
                    >
                        <Upload size={16} />
                        Importer
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition-colors"
                        aria-label="Exporter l'historique en CSV"
                    >
                        <Download size={16} />
                        Exporter CSV
                    </button>
                     <button
                        onClick={handleExportPdf}
                        disabled={isExportingPdf}
                        className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition-colors disabled:opacity-50"
                        aria-label="Exporter l'historique en PDF"
                    >
                        <FileDown size={16} />
                        {isExportingPdf ? 'Exportation...' : 'Exporter PDF'}
                    </button>
                 </div>
            </div>

            <div id="charge-list-details" className="border-t border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Kilométrage</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Batterie</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">kWh Ajoutés</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Coût</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Tarif</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Prix/kWh</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Conso. (kWh/100km)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Coût / 100km</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Équiv. Thermique (km)</th>
                                 <th scope="col" className="relative px-6 py-3 no-print no-pdf">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {reversedCharges.map(charge => (
                                <tr key={charge.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{new Date(charge.date).toLocaleDateString('fr-FR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{charge.odometer.toLocaleString('fr-FR')} km</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{charge.startPercentage}% → {charge.endPercentage}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{charge.kwhAdded.toFixed(2)} kWh</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{charge.cost.toFixed(2)} €</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{charge.tariff}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{charge.pricePerKwh.toFixed(4)} €</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                        {charge.consumptionKwh100km !== null 
                                          ? <span className="font-semibold text-blue-600 dark:text-blue-400">{charge.consumptionKwh100km.toFixed(2)}</span> 
                                          : <span className="text-slate-400">-</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                        {charge.costPer100km !== null 
                                            ? <span className="font-semibold text-orange-600 dark:text-orange-400">{charge.costPer100km.toFixed(2)} €</span> 
                                            : <span className="text-slate-400">-</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                        {charge.gasolineEquivalentKm !== null 
                                            ? <span className="font-semibold text-green-600 dark:text-green-400">{charge.gasolineEquivalentKm.toLocaleString('fr-FR')} km</span> 
                                            : <span className="text-slate-400">-</span>
                                        }
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium no-print no-pdf">
                                        <div className="flex items-center justify-end gap-x-4">
                                            <button 
                                                onClick={() => handleSendEmail(charge)} 
                                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500"
                                                title="Envoyer le récapitulatif par e-mail"
                                                aria-label="Envoyer le récapitulatif par e-mail"
                                            >
                                                <Mail size={18} />
                                            </button>
                                            <button 
                                                onClick={() => deleteCharge(charge.id)} 
                                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                                                title="Supprimer la recharge"
                                                aria-label="Supprimer la recharge"
                                            >
                                               <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChargeDetails;