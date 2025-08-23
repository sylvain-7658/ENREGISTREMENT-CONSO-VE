import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mascot } from '../Mascot';
import { Car, BarChart3, FileText, Cloud, Users } from 'lucide-react';

const Feature = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white/50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-300">
            {icon}
        </div>
        <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{children}</p>
        </div>
    </div>
);


const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, login } = useAuth();

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
        <div className="min-h-screen bg-blue-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm md:max-w-4xl mx-auto flex flex-col md:flex-row shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                {/* Welcome Section */}
                <div className="hidden md:flex md:w-1/2 p-8 lg:p-12 bg-blue-50 dark:bg-slate-800 border-b md:border-b-0 md:border-r border-blue-100 dark:border-slate-700 flex-col justify-center">
                    <div className="flex justify-center">
                        <Mascot />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100 text-center mt-4">
                        Bienvenue sur Volty-Conso
                    </h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-300 text-center">
                        Je suis Volty, votre copilote électrique intelligent. Prêt à optimiser votre conduite ?
                    </p>
                    <div className="mt-8 space-y-5">
                        <Feature icon={<Car size={20} />} title="Suivi Multi-Véhicules">
                            Gérez toute votre flotte électrique depuis un seul et même endroit.
                        </Feature>
                         <Feature icon={<BarChart3 size={20} />} title="Analyses Détaillées">
                            Visualisez vos coûts, votre consommation et vos économies en un clin d'œil.
                        </Feature>
                         <Feature icon={<FileText size={20} />} title="Rapports PDF Professionnels">
                            Générez des rapports mensuels et annuels pour vos archives ou notes de frais.
                        </Feature>
                         <Feature icon={<Cloud size={20} />} title="Synchronisation Cloud">
                            Accédez à vos données en toute sécurité, où que vous soyez, sur tous vos appareils.
                        </Feature>
                        <Feature icon={<Users size={20} />} title="Application communautaire">
                            Comparez vos données avec les membres de notre communauté.
                        </Feature>
                    </div>
                </div>

                {/* Form Section */}
                <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                     <div className="w-full">
                        <div className="text-center">
                            <div className="flex justify-center items-center mb-4">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 dark:text-blue-400">
                                   <path d="M13 3V9H18L10 21V15H5L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                {isLogin ? 'Connexion' : 'Créez votre compte'}
                            </h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {isLogin ? "Heureux de vous revoir !" : "Rejoignez la communauté et prenez le contrôle."}
                            </p>
                        </div>
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
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
                                        className="appearance-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                        className="appearance-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 placeholder-slate-500 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Mot de passe"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-500 text-center font-semibold">{error}</p>}

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:focus:ring-offset-slate-800 transition-colors"
                                >
                                    {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
                                </button>
                            </div>
                        </form>

                        <div className="text-sm text-center mt-6">
                            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                                {isLogin ? 'Pas encore de compte ? Inscription' : 'Déjà un compte ? Connexion'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;