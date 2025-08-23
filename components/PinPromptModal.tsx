import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Lock } from 'lucide-react';

const modalBackdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalContentVariants = {
    hidden: { scale: 0.9, y: 20, opacity: 0 },
    visible: { scale: 1, y: 0, opacity: 1 },
};

const PinPromptModal: React.FC = () => {
    const { vehicleToUnlock, setVehicleToUnlock, setActiveVehicleId, logout } = useAppContext();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (vehicleToUnlock) {
            // Focus the input when the modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [vehicleToUnlock]);

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 4) {
            setPin(value);
            setError('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleToUnlock) return;

        if (pin === vehicleToUnlock.accessPin) {
            setActiveVehicleId(vehicleToUnlock.id);
            handleClose();
        } else {
            setError('Code PIN incorrect. Veuillez réessayer.');
            setPin('');
            inputRef.current?.focus();
        }
    };

    const handleForgotPin = () => {
        const confirmed = window.confirm("Un code PIN ne peut pas être récupéré. Pour votre sécurité, vous allez être déconnecté. Après vous être reconnecté, allez dans 'Paramètres' > 'Gestion des Véhicules' pour modifier ou supprimer le code PIN de ce véhicule. Continuer ?");
        if (confirmed) {
            // FIX: Close the modal *before* initiating logout to prevent a race condition
            // where the component tree is unmounted before the modal can close itself.
            handleClose();
            logout().catch(err => {
                console.error("Logout failed:", err);
                // The modal is already closed. An alert might be disruptive here,
                // but a more robust notification system could handle this.
            });
        }
    };

    const handleClose = () => {
        setVehicleToUnlock(null);
        setPin('');
        setError('');
    };

    if (!vehicleToUnlock) return null;

    return (
        <motion.div
            initial={modalBackdropVariants.hidden}
            animate={modalBackdropVariants.visible}
            exit={modalBackdropVariants.hidden}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
        >
            <motion.div
                initial={modalContentVariants.hidden}
                animate={modalContentVariants.visible}
                exit={modalContentVariants.hidden}
                className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
                        <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        Accès au véhicule
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Saisissez le code PIN pour <strong>{vehicleToUnlock.name}</strong>.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <input
                        ref={inputRef}
                        type="password"
                        value={pin}
                        onChange={handlePinChange}
                        maxLength={4}
                        className="block w-full text-center text-2xl tracking-[1em] p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="••••"
                        autoComplete="off"
                        pattern="\d{4}"
                        inputMode="numeric"
                    />
                    {error && <p className="text-sm text-red-500 text-center font-semibold">{error}</p>}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleForgotPin}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            Code PIN oublié ?
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full px-4 py-2 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                        >
                            Déverrouiller
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default PinPromptModal;