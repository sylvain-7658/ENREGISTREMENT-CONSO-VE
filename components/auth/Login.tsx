import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, login } = useAuth();

    useEffect(() => {
        document.body.classList.add('dashboard-background');
        return () => {
            document.body.classList.remove('dashboard-background');
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
        } catch (err: any) {
            switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError('E-mail ou mot de passe incorrect.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Cette adresse e-mail est déjà utilisée.');
                    break;
                case 'auth/weak-password':
                    setError('Le mot de passe doit comporter au moins 6 caractères.');
                    break;
                default:
                    setError('Une erreur est survenue. Veuillez réessayer.');
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 space-y-6 border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-center">
                    <div className="flex justify-center items-center mb-4">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 dark:text-blue-400">
                           <path d="M13 3V9H18L10 21V15H5L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                        {isLogin ? 'Connexion' : 'Inscription'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {isLogin ? "Heureux de vous revoir !" : "Créez un compte pour commencer."}
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Adresse e-mail</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Adresse e-mail"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Mot de passe</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Mot de passe"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center font-semibold">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:focus:ring-offset-slate-800"
                        >
                            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
                        </button>
                    </div>
                </form>

                <div className="text-sm text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-medium text-blue-600 hover:text-blue-500">
                        {isLogin ? 'Pas encore de compte ? Inscription' : 'Déjà un compte ? Connexion'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;