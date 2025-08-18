
import React, { useState } from 'react';
import TripForm from './TripForm';
import TripList from './TripList';
import TripSummary from './TripSummary';
import TripStats from './TripStats';
import Card from './Card';
import { useAppContext } from '../context/AppContext';

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


const TripJournal: React.FC = () => {
    const [subView, setSubView] = useState<SubView>('details');
    const { trips } = useAppContext();

     if (trips.length === 0) {
        return (
            <div className="space-y-8">
                <TripForm />
                <Card>
                    <TripList />
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <TripForm />
            <Card className="p-0">
                 <div className="px-6 border-b border-slate-200 dark:border-slate-700">
                    <nav className="flex space-x-8 -mb-px" aria-label="Trip journal sections">
                        <SubViewButton view="details" label="Détail des trajets" activeView={subView} setView={setSubView} />
                        <SubViewButton view="summary" label="Résumés" activeView={subView} setView={setSubView} />
                        <SubViewButton view="stats" label="Statistiques" activeView={subView} setView={setSubView} />
                    </nav>
                </div>
                {subView === 'details' && <TripList />}
                {subView === 'summary' && <TripSummary />}
                {subView === 'stats' && <TripStats />}
            </Card>
        </div>
    );
};

export default TripJournal;