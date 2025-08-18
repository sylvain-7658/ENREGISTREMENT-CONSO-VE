
import React, { useRef, useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, MapPin, Mail, Upload, Download, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProcessedTrip, Trip } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ITEMS_PER_PAGE = 10;

const TripList: React.FC = () => {
    const { trips, deleteTrip, settings, importTrips } = useAppContext();
    const { currentUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    
    const totalPages = Math.ceil(trips.length / ITEMS_PER_PAGE);
    const paginatedTrips = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return trips.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, trips]);

    const handleSendInvoiceEmail = (trip: ProcessedTrip) => {
        if (!settings.recapEmail || !/^\S+@\S+\.\S+$/.test(settings.recapEmail)) {
            alert("Veuillez configurer une adresse e-mail valide dans les Paramètres pour envoyer une facture.");
            return;
        }
        if (!currentUser) {
            alert("Utilisateur non trouvé.");
            return;
        }

        const subject = `Facture pour trajet du ${new Date(trip.date).toLocaleDateString('fr-FR')}${trip.client ? ` pour ${trip.client}` : ''}`;
        const body = `
Bonjour,

Veuillez trouver ci-joint les détails de la facture pour le déplacement professionnel.
${trip.client ? `\nClient : ${trip.client}` : ''}

Informations sur le trajet :
- Date : ${new Date(trip.date).toLocaleDateString('fr-FR')}
- Destination : ${trip.destination}
- Distance parcourue : ${trip.distance} km
- Kilométrage : ${trip.startOdometer.toLocaleString('fr-FR')} km → ${trip.endOdometer.toLocaleString('fr-FR')} km

Informations sur le véhicule :
- Modèle : ${settings.vehicleModel}
- Immatriculation : ${settings.registrationNumber || 'N/A'}

Montant de la facturation :
- Total : ${trip.billingAmount?.toFixed(2)} €

Cordialement,
${currentUser.displayName || currentUser.email}
        `.trim().replace(/^\s+/gm, '');

        const mailtoLink = `mailto:${settings.recapEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;
    };

    const handleDownload = () => {
        if (trips.length === 0) return;

        const worksheetData = trips.map(trip => ({
            "Date": new Date(trip.date).toLocaleDateString('fr-FR'),
            "Destination": trip.destination,
            "Client": trip.client || '',
            "KM Départ": trip.startOdometer,
            "KM Arrivée": trip.endOdometer,
            "Distance (km)": trip.distance,
            "Batterie Départ (%)": trip.startPercentage,
            "Batterie Arrivée (%)": trip.endPercentage,
            "kWh Consommés": trip.kwhConsumed,
            "Coût (€)": trip.cost,
            "Conso. (kWh/100km)": trip.consumptionKwh100km,
            "Économie (€)": trip.savings,
            "Facturé": trip.isBilled ? 'Oui' : 'Non',
            "Montant Facturé (€)": trip.billingAmount != null ? trip.billingAmount : '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Trajets");

        const cols = Object.keys(worksheetData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...worksheetData.map(row => String(row[key as keyof typeof row] ?? '').length))
        }));
        worksheet['!cols'] = cols;

        XLSX.writeFile(workbook, "historique-trajets.xlsx");
    };
    
    const handleExportPdf = async () => {
        const elementToExport = document.getElementById('trip-list-details');
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
            pdf.save('historique-trajets.pdf');
    
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Une erreur est survenue lors de l'export PDF.");
        } finally {
            document.body.classList.remove('is-exporting-pdf');
            setIsExportingPdf(false);
        }
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
                'destination': 'destination',
                'client': 'client',
                'km départ': 'startOdometer',
                'km arrivee': 'endOdometer',
                'km arrivée': 'endOdometer',
                'batterie depart (%)': 'startPercentage',
                'batterie départ (%)': 'startPercentage',
                'batterie arrivee (%)': 'endPercentage',
                'batterie arrivée (%)': 'endPercentage',
                'facture': 'isBilled',
                'facturé': 'isBilled'
            };

            const tripsToImport: Omit<Trip, 'id'>[] = [];
            const errors: string[] = [];
            
            jsonData.forEach((rawRow, index) => {
                const row: any = {};
                for(const key in rawRow) {
                    const cleanKey = String(key).toLowerCase().trim();
                    if (headerMapping[cleanKey]) {
                        row[headerMapping[cleanKey]] = rawRow[key];
                    }
                }

                const { date, destination, client, startOdometer, endOdometer, startPercentage, endPercentage } = row;

                if (date == null || destination == null || startOdometer == null || endOdometer == null || startPercentage == null || endPercentage == null) {
                    return; // Skips empty or incomplete rows
                }

                let tripDateStr: string;
                if (typeof date === 'number' && date > 25569) { 
                    const excelEpoch = new Date(1899, 11, 30);
                    const tempDate = new Date(excelEpoch.getTime() + date * 86400000);
                    tripDateStr = tempDate.toISOString().split('T')[0];
                } else {
                    const parsedDate = new Date(date);
                    if (!isNaN(parsedDate.getTime())) {
                        tripDateStr = parsedDate.toISOString().split('T')[0];
                    } else {
                        errors.push(`Ligne ${index + 2}: Format de date invalide: ${date}`);
                        return;
                    }
                }
                
                const startOdoNum = parseInt(startOdometer, 10);
                const endOdoNum = parseInt(endOdometer, 10);
                const startPercNum = parseInt(startPercentage, 10);
                const endPercNum = parseInt(endPercentage, 10);

                if (isNaN(startOdoNum) || isNaN(endOdoNum) || isNaN(startPercNum) || isNaN(endPercNum)) {
                    errors.push(`Ligne ${index + 2}: Le kilométrage et les pourcentages doivent être des nombres.`);
                    return;
                }

                let isBilled = false;
                const billedValue = String(row.isBilled || 'non').toLowerCase().trim();
                if (['true', 'vrai', 'oui', 'yes', '1'].includes(billedValue)) {
                    isBilled = true;
                }

                const newTrip: Omit<Trip, 'id'> = {
                    date: tripDateStr,
                    destination: String(destination),
                    startOdometer: startOdoNum,
                    endOdometer: endOdoNum,
                    startPercentage: startPercNum,
                    endPercentage: endPercNum,
                    isBilled,
                };

                if (client) {
                    (newTrip as Partial<Trip>).client = String(client);
                }

                tripsToImport.push(newTrip);
            });

            if (errors.length > 0) {
                alert(`Erreurs lors de l'importation :\n\n- ${errors.join('\n- ')}`);
                return;
            }

            if (tripsToImport.length > 0) {
                const { addedCount, skippedCount } = await importTrips(tripsToImport);
                let message = `${addedCount} trajet(s) importé(s) avec succès.`;
                if (skippedCount > 0) {
                    message += ` ${skippedCount} trajet(s) ignoré(s) car déjà présent(s) (basé sur la date et le kilométrage).`;
                }
                alert(message);
            } else {
                alert("Aucun nouveau trajet à importer n'a été trouvé dans le fichier.");
            }

        } catch (error) {
            console.error("Erreur d'importation :", error);
            alert("Une erreur est survenue lors de la lecture du fichier. Assurez-vous qu'il est au format XLSX ou CSV.");
        }
    };


    if (trips.length === 0) {
        return (
             <div className="text-center py-16 px-6">
                <MapPin size={48} className="mx-auto text-slate-400" />
                <h3 className="text-xl font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100">Aucun trajet enregistré</h3>
                <p className="text-slate-500 dark:text-slate-400">Ajoutez un trajet pour commencer le suivi.</p>
                 <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
                 <button onClick={handleImportClick} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <Upload size={16} /> Importer un fichier
                </button>
            </div>
        );
    }

    return (
        <div id="trip-list-details">
            <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        Journal des trajets
                    </h2>
                </div>
                 <div className="flex items-center gap-2 mt-4 sm:mt-0 no-print">
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
                    <button onClick={handleImportClick} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Importer depuis un fichier (XLSX, CSV)">
                        <Upload size={20} />
                    </button>
                    <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Exporter en Excel">
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
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Destination</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Client</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Trajet (KM)</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Énergie / Coût</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Consommation</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Économie</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Facturation</th>
                            <th scope="col" className="relative px-6 py-3 no-print">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedTrips.map(trip => (
                            <tr key={trip.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{new Date(trip.date).toLocaleDateString('fr-FR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{trip.destination}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{trip.client || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                    <div>{trip.startOdometer.toLocaleString('fr-FR')} → {trip.endOdometer.toLocaleString('fr-FR')}</div>
                                    <div className="font-semibold text-slate-800 dark:text-slate-100">{trip.distance} km</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                    <div className="font-semibold text-slate-800 dark:text-slate-100">{trip.kwhConsumed.toFixed(2)} kWh</div>
                                    <div>{trip.cost.toFixed(2)} €</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                    <span className="text-blue-600 dark:text-blue-400">{trip.consumptionKwh100km.toFixed(2)} kWh/100km</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                    {trip.savings >= 0 ? (
                                        <span className="text-green-600 dark:text-green-400">+{trip.savings.toFixed(2)} €</span>
                                    ) : (
                                        <span className="text-red-600 dark:text-red-500">{trip.savings.toFixed(2)} €</span>
                                    )}
                                    <div className="text-xs text-slate-400 font-normal">vs {trip.gasolineEquivalentCost.toFixed(2)} €</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                    {trip.billingAmount != null ? (
                                        <span className="text-indigo-600 dark:text-indigo-400">{trip.billingAmount.toFixed(2)} €</span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium no-print">
                                    <div className="flex items-center justify-end space-x-1">
                                         {trip.billingAmount != null && (
                                            <button onClick={() => handleSendInvoiceEmail(trip)} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Envoyer la facture par e-mail">
                                                <Mail size={16} />
                                            </button>
                                        )}
                                        <button onClick={() => window.confirm('Êtes-vous sûr de vouloir supprimer ce trajet ?') && deleteTrip(trip.id)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Supprimer">
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
        </div>
    );
};

export default TripList;