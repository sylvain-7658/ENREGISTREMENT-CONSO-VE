import React from 'react';
import Card from './Card';
import { releaseNotes } from '../data/releaseNotesData';
import { GitCommit } from 'lucide-react';

const ReleaseNotes: React.FC = () => {
    return (
        <Card>
            <h2 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100">Notes de version</h2>
            <div className="relative pl-6 after:absolute after:inset-y-0 after:w-px after:bg-slate-200 dark:after:bg-slate-700 after:left-0">
                {releaseNotes.map((note) => (
                    <div key={note.version} className="relative mb-10 grid grid-cols-[auto_1fr] gap-x-4 items-start">
                         <div className="relative flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full -left-9 top-1 ring-4 ring-white dark:ring-slate-800">
                            <GitCommit size={14} className="text-white" />
                        </div>
                        <div className="pt-1">
                            <div className="flex items-baseline gap-x-3">
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Version {note.version}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {new Date(note.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <ul className="mt-3 list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                                {note.changes.map((change, i) => (
                                    <li key={i}>{change}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default ReleaseNotes;
