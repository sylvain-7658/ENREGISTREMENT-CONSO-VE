import React from 'react';
import Card from './Card';
import Accordion from './Accordion';
import { Rocket, BatteryCharging, Map, Wrench, BarChart3, DownloadCloud, FileDown, Camera, Car, Sparkles } from 'lucide-react';

const UserGuide: React.FC = () => {
    return (
        <Card>
            <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">Notice d'utilisation</h2>
            <p className="mb-8 text-slate-600 dark:text-slate-400">
                Bienvenue ! Ce guide vous aidera à tirer le meilleur parti de l'application de suivi de consommation pour votre véhicule électrique.
            </p>
            <div className="space-y-2">
                <Accordion title="Démarrage Rapide" icon={<Rocket size={20} />} startOpen={true}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <p>Pour commencer, suivez ces trois étapes simples :</p>
                        <ol className="list-decimal list-inside space-y-2 pl-4">
                            <li>
                                <strong>Configurez votre premier véhicule :</strong> Allez dans <strong>Paramètres &gt; Gestion des Véhicules</strong>. La configuration la plus importante est la <strong>capacité de votre batterie</strong>. Vous pourrez ajouter d'autres véhicules plus tard.
                            </li>
                            <li>
                                <strong>Ajoutez une recharge :</strong> Depuis le <strong>Tableau de bord</strong> ou l'onglet <strong>Journal</strong>, cliquez sur "Ajouter une recharge". Vous pouvez aussi démarrer une recharge en cours et la compléter plus tard.
                            </li>
                            <li>
                                <strong>Analysez vos données :</strong> Ajoutez au moins <strong>deux recharges complètes</strong> pour que l'application puisse calculer la distance parcourue entre elles et commencer à générer des statistiques sur votre consommation et vos coûts.
                            </li>
                        </ol>
                    </div>
                </Accordion>

                <Accordion title="Gestion Multi-Véhicules" icon={<Car size={20} />}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <p>L'application vous permet de gérer plusieurs véhicules électriques au sein du même compte.</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>
                                <strong>Ajouter un véhicule :</strong> Rendez-vous dans <strong>Paramètres &gt; Gestion des Véhicules</strong> et cliquez sur "Ajouter un véhicule". Remplissez les informations, notamment le nom, le modèle et la capacité de la batterie.
                            </li>
                            <li>
                                <strong>Recherche intelligente (<Sparkles size={16} className="inline-block text-blue-500" />) :</strong> Lorsque vous ajoutez un véhicule "Autre / Personnalisé", vous pouvez taper son nom complet puis cliquer sur l'icône étoile pour que l'IA recherche et remplisse automatiquement la capacité de la batterie pour vous.
                            </li>
                            <li>
                                <strong>Changer de véhicule :</strong> Utilisez le sélecteur de véhicule situé en haut à droite de l'écran (dans l'en-tête) pour passer d'un véhicule à l'autre.
                            </li>
                            <li>
                                <strong>Données spécifiques :</strong> Toutes les données que vous enregistrez (recharges, trajets, entretien) sont automatiquement associées au véhicule actuellement sélectionné.
                            </li>
                             <li>
                                <strong>Protéger l'accès :</strong> Lors de la configuration d'un véhicule, vous pouvez définir un code PIN à 4 chiffres. Ce code sera demandé à chaque fois que vous tenterez de sélectionner ce véhicule, ajoutant une couche de sécurité.
                            </li>
                            <li>
                                <strong>Vue d'ensemble :</strong> Depuis le <strong>Tableau de bord</strong>, le bouton "Vue de la Flotte" vous donne un résumé comparatif des statistiques clés de tous vos véhicules sur un seul écran.
                            </li>
                        </ul>
                    </div>
                </Accordion>

                <Accordion title="Gestion des Recharges" icon={<BatteryCharging size={20} />}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <p>Le formulaire d'ajout de recharge propose deux options :</p>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li><strong>Ajouter (complète) :</strong> Idéal pour enregistrer une recharge déjà terminée. Vous devez renseigner toutes les informations (début, fin, etc.).</li>
                            <li><strong>Démarrer la recharge :</strong> Utilisez ce bouton lorsque vous commencez une nouvelle recharge. Elle apparaîtra sur le <strong>Tableau de bord</strong> comme une "Recharge en cours", que vous pourrez compléter plus tard.</li>
                            <li><strong>Scan par Caméra (<Camera size={16} className="inline-block" />) :</strong> Gagnez du temps ! Cliquez sur l'icône de caméra pour scanner votre tableau de bord. L'intelligence artificielle extraira automatiquement le kilométrage et le pourcentage de batterie.</li>
                            <li><strong>Import/Export :</strong> Dans l'onglet <strong>Journal</strong>, sous-section "Détail des recharges", vous pouvez importer un historique depuis un fichier (XLSX, CSV) ou exporter toutes vos données.</li>
                        </ul>
                    </div>
                </Accordion>

                <Accordion title="Gestion des Trajets" icon={<Map size={20} />}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <p>Cette section vous permet de suivre des trajets spécifiques pour des raisons professionnelles ou personnelles. Elle est utile pour :</p>
                         <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>Calculer la consommation et le coût d'un trajet précis.</li>
                            <li>Comparer le coût du trajet par rapport à un véhicule thermique équivalent.</li>
                            <li>Générer des montants de facturation pour vos clients (si la case "Facturer ce trajet" est cochée). Les montants sont basés sur les forfaits et le barème kilométrique définis dans les <strong>Paramètres</strong>.</li>
                        </ul>
                        <p className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                           <strong>Important :</strong> Les calculs de coût des trajets se basent sur l'historique de vos recharges. L'application trouve la dernière recharge effectuée avant le début du trajet pour déterminer le prix du kWh utilisé.
                        </p>
                    </div>
                </Accordion>
                
                 <Accordion title="Journal d'Entretien" icon={<Wrench size={20} />}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                       <p>Conservez un historique de toutes les dépenses liées à l'entretien de votre véhicule (lavage, pneus, réparations, etc.).</p>
                       <p>Le coût total de l'entretien (hors lavages) est utilisé pour calculer la statistique <strong>"Coût / 100km (avec entretien)"</strong> sur le tableau de bord, vous donnant une vision complète du coût réel de votre véhicule.</p>
                    </div>
                </Accordion>

                <Accordion title="Statistiques et Rapports" icon={<BarChart3 size={20} />}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>L'onglet <strong>Statistiques</strong> offre une vue graphique de vos données (coûts, consommation, énergie par tarif) par semaine, mois ou année.</li>
                            <li>Les onglets <strong>Journal</strong> et <strong>Trajets</strong> contiennent des sous-sections "Résumés" et "Détails" pour une analyse tabulaire.</li>
                            <li><strong>Génération de rapports PDF (<FileDown size={16} className="inline-block" />) :</strong> Dans les sections <strong>Journal</strong> et <strong>Trajets</strong>, vous pouvez générer des rapports mensuels ou annuels détaillés au format PDF, parfaits pour vos archives ou notes de frais.</li>
                        </ul>
                    </div>
                </Accordion>
                
                <Accordion title="Installation de l'Application (PWA)" icon={<DownloadCloud size={20} />}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                       <p>Pour une expérience optimale, vous pouvez installer cette application sur votre téléphone ou ordinateur.</p>
                       <p>Rendez-vous dans les <strong>Paramètres</strong>, section "Application". Si votre navigateur est compatible, un bouton "Installer l'application" sera disponible. Cela ajoutera une icône sur votre écran d'accueil et vous permettra d'utiliser l'application même hors ligne.</p>
                    </div>
                </Accordion>
            </div>
        </Card>
    );
};

export default UserGuide;