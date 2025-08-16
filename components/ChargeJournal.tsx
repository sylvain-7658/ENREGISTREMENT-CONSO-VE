
import React, { useState } from 'react';
import ChargeForm from './ChargeForm';
import ChargeList from './ChargeList';
import ChargeDetails from './ChargeDetails';
import { useAppContext } from '../context/AppContext';

const SubViewButton = ({ view, label, activeView, setView }: { view: 'summary' | 'details', label: string, activeView: 'summary' | 'details', setView: (v: 'summary' | 'details') => void }) => (
    <button
        onClick={() => setView(view)}
        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
            activeView === view
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
        }`}
        aria-current={activeView === view ? 'page' : undefined}
    >
        {label}
    </button>
);

const ChargeJournal: React.FC = () => {
    const [subView, setSubView] = useState<'summary' | 'details'>('summary');
    const { charges } = useAppContext();

    if (charges.length === 0) {
        return (
            <div className="space-y-8">
                <div className="no-print">
                    <ChargeForm />
                </div>
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden">
                    <ChargeDetails />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="no-print">
                <ChargeForm />
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden">
                <div className="px-6 border-b border-slate-200 dark:border-slate-700 no-print">
                    <nav className="flex space-x-8" aria-label="Journal sections">
                        <SubViewButton view="summary" label="Résumés" activeView={subView} setView={setSubView} />
                        <SubViewButton view="details" label="Détail des recharges" activeView={subView} setView={setSubView} />
                    </nav>
                </div>
                
                {subView === 'summary' && <ChargeList />}
                {subView === 'details' && <ChargeDetails />}
            </div>
        </div>
    );
};

export default ChargeJournal;
