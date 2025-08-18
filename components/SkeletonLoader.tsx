import React from 'react';

const SkeletonLine = ({ width, height = 'h-4' }: { width: string; height?: string }) => (
  <div className={`bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${width} ${height}`}></div>
);

const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-6 space-y-4 border border-slate-200/50 dark:border-slate-700/50">
        <SkeletonLine width="w-1/3" />
        <div className="grid grid-cols-2 gap-4">
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-full" />
        </div>
    </div>
)

const SkeletonLoader: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <SkeletonLine width="w-32" height="h-6" />
                            <SkeletonLine width="w-24" height="h-8" />
                        </div>
                        <div className="hidden sm:flex items-center space-x-2">
                             <SkeletonLine width="w-32" height="h-9" />
                             <SkeletonLine width="w-24" height="h-9" />
                             <SkeletonLine width="w-28" height="h-9" />
                             <SkeletonLine width="w-28" height="h-9" />
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                <SkeletonLine width="w-48" height="h-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-6 h-24 border border-slate-200/50 dark:border-slate-700/50"><SkeletonLine width="w-full" /></div>
                    <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-6 h-24 border border-slate-200/50 dark:border-slate-700/50"><SkeletonLine width="w-full" /></div>
                    <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-6 h-24 border border-slate-200/50 dark:border-slate-700/50"><SkeletonLine width="w-full" /></div>
                    <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl p-6 h-24 border border-slate-200/50 dark:border-slate-700/50"><SkeletonLine width="w-full" /></div>
                </div>
                 <SkeletonCard />
            </main>
        </div>
    )
}

export default SkeletonLoader;
