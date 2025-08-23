import React from 'react';
import Card from './Card';
import Accordion from './Accordion';
import { Gavel, Shield, FileText, ShoppingCart } from 'lucide-react';

const LegalInfo: React.FC = () => {
    return (
        <Card>
            <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">Informations Légales</h2>
            <p className="mb-8 text-slate-600 dark:text-slate-400">
                Retrouvez ici toutes les informations légales relatives à l'utilisation de l'application Suivi Conso EV Online.
            </p>
            <div className="space-y-2">
                <p className="p-4 text-sm bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg">
                    <strong>Attention :</strong> Les textes ci-dessous sont des modèles génériques et ne constituent pas un conseil juridique. Ils doivent être adaptés et validés par un professionnel du droit pour correspondre à votre situation spécifique.
                </p>

                <Accordion title="Mentions Légales" icon={<Gavel size={20} />}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Éditeur de l'application</h4>
                        <p><strong>Nom de l'entreprise :</strong> [Nom de votre entreprise/Nom de l'éditeur]</p>
                        <p><strong>Forme juridique :</strong> [Statut juridique, ex: SAS, Auto-entrepreneur...]</p>
                        <p><strong>Adresse du siège social :</strong> [Votre adresse]</p>
                        <p><strong>Numéro SIRET :</strong> [Votre numéro SIRET]</p>
                        <p><strong>Responsable de la publication :</strong> [Votre nom]</p>
                        <p><strong>Contact :</strong> [Votre adresse e-mail de contact]</p>

                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Hébergement des données</h4>
                        <p>L'application et ses données sont hébergées par :</p>
                        <p><strong>Hébergeur :</strong> Google Cloud Platform (Firebase)</p>
                        <p><strong>Société :</strong> Google LLC</p>
                        <p><strong>Adresse :</strong> 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</p>
                    </div>
                </Accordion>

                <Accordion title="Conditions Générales d'Utilisation (CGU)" icon={<FileText size={20} />}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <p>Les présentes CGU régissent l'accès et l'utilisation de l'application "Suivi Conso EV Online".</p>
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Article 1 : Objet</h4>
                        <p>L'application a pour objet de permettre aux utilisateurs de suivre la consommation, les recharges, et les coûts liés à l'utilisation d'un véhicule électrique.</p>
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Article 2 : Accès et Compte Utilisateur</h4>
                        <p>L'accès à l'application nécessite la création d'un compte avec une adresse e-mail valide. L'utilisateur est responsable de la confidentialité de ses identifiants.</p>
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Article 3 : Responsabilité</h4>
                        <p>L'éditeur met tout en œuvre pour fournir des calculs et des données fiables. Cependant, les informations fournies par l'application sont à titre indicatif. L'éditeur ne saurait être tenu responsable des erreurs ou omissions, ni des dommages directs ou indirects résultant de l'utilisation des données de l'application.</p>
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Article 4 : Propriété Intellectuelle</h4>
                        <p>Tous les éléments de l'application (textes, images, logos, code) sont la propriété exclusive de l'éditeur.</p>
                    </div>
                </Accordion>
                
                <Accordion title="Conditions Générales de Vente (CGV)" icon={<ShoppingCart size={20} />}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Article 1 : Objet</h4>
                        <p>L'application "Suivi Conso EV Online" est fournie à titre gratuit. Les présentes CGV ont pour but de préciser qu'il n'y a aucune transaction financière entre l'utilisateur et l'éditeur pour l'utilisation des fonctionnalités de base de l'application.</p>
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Article 2 : Gratuité</h4>
                        <p>L'accès et l'utilisation de l'ensemble des fonctionnalités de l'application sont entièrement gratuits. Aucune souscription payante n'est requise.</p>
                    </div>
                </Accordion>

                <Accordion title="Protection des Données Personnelles" icon={<Shield size={20} />}>
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <p>L'éditeur s'engage à protéger la vie privée de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD).</p>
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">1. Données collectées</h4>
                        <p>Nous collectons les données suivantes :</p>
                        <ul className="list-disc list-inside space-y-1 pl-4">
                            <li><strong>Données de compte :</strong> Adresse e-mail pour l'authentification.</li>
                            <li><strong>Données d'utilisation :</strong> Informations sur votre véhicule (modèle, capacité batterie), vos recharges, vos trajets et votre entretien, que vous saisissez manuellement.</li>
                        </ul>
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">2. Finalité du traitement</h4>
                        <p>Ces données sont collectées dans le but exclusif de fournir le service de suivi de consommation, de réaliser les calculs statistiques, et de permettre la synchronisation de vos données entre vos appareils.</p>
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">3. Partage des données</h4>
                        <p>Vos données sont stockées de manière sécurisée sur les serveurs de notre sous-traitant Firebase (Google) et ne sont partagées avec aucun autre tiers.</p>
                        <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-200">4. Vos droits</h4>
                        <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant à [Votre adresse e-mail de contact]. Vous pouvez également supprimer votre compte et l'ensemble de vos données directement depuis l'application ou en nous contactant.</p>
                    </div>
                </Accordion>
            </div>
        </Card>
    );
};

export default LegalInfo;
