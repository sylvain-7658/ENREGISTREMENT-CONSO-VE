import React from 'react';
import MaintenanceList from './MaintenanceList';
import Card from './Card';
import { useAppContext } from '../context/AppContext';
import { PlusCircle } from 'lucide-react';

const MaintenanceJournal: React.FC = () => {
    const { setActiveView } = useAppContext();

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Journal d'entretien
                </h2>
                <button
                    onClick={() => setActiveView('add-maintenance')}
                    className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                >
                    <PlusCircle size={18} />
                    Nouvel entretien
                </button>
            </div>
            <MaintenanceList />
        </Card>
    );
};

export default MaintenanceJournal;