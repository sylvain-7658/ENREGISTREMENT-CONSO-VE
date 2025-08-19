import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, Wrench } from 'lucide-react';

const MaintenanceList: React.FC = () => {
    const { maintenanceEntries, deleteMaintenanceEntry } = useAppContext();

    if (maintenanceEntries.length === 0) {
        return (
             <div className="text-center py-16 px-6">
                <Wrench size={48} className="mx-auto text-slate-400" />
                <h3 className="text-xl font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100">Aucune dépense d'entretien</h3>
                <p className="text-slate-500 dark:text-slate-400">Ajoutez une dépense pour commencer le suivi.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                     <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Kilométrage</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Détails</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Coût</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {maintenanceEntries.map(entry => (
                            <tr key={entry.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{entry.odometer.toLocaleString('fr-FR')} km</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{entry.type}</td>
                                <td className="px-6 py-4 whitespace-normal text-sm text-slate-500 dark:text-slate-300 max-w-xs">{entry.details || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.cost.toFixed(2)} €</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end">
                                        <button onClick={() => window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?') && deleteMaintenanceEntry(entry.id)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Supprimer">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MaintenanceList;