# 🧬 Lab'IA - Analyseur d'Analyses Médicales

Lab'IA est une plateforme web intelligente qui permet aux utilisateurs de saisir leurs analyses médicales de laboratoire et d'obtenir des explications claires et personnalisées grâce à l'intelligence artificielle de Mistral.

## 📋 Table des matières
- [À propos du projet](#à-propos-du-projet)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Technologies utilisées](#technologies-utilisées)
- [Architecture du projet](#architecture-du-projet)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Organisation de l'équipe](#organisation-de-léquipe)

## 🎯 À propos du projet

Lab'IA a pour mission de rendre les analyses médicales de laboratoire accessibles et compréhensibles pour tous. Souvent complexes et difficiles à interpréter, les résultats d'analyses médicales peuvent être sources d'inquiétude ou de confusion pour les patients.

Notre plateforme utilise l'IA de Mistral pour :
- 📊 Analyser automatiquement les résultats médicaux
- 💡 Fournir des explications simplifiées et vulgarisées
- 🎯 Proposer des conseils pratiques pour améliorer les résultats

> **⚠️ Avertissement médical** : Lab'IA est un outil d'information et ne remplace en aucun cas l'avis d'un professionnel de santé. Consultez toujours votre médecin pour une interprétation médicale approfondie.

## ✨ Fonctionnalités principales

- **Saisie des analyses** : Interface intuitive pour entrer manuellement les résultats d'analyses
- **Upload de documents** : Importation directe de PDF ou images d'analyses
- **Analyse IA** : Interprétation automatique des résultats via l'API Mistral
- **Visualisation claire** : Présentation des résultats avec codes couleur (normal/anormal)
- **Explications détaillées** : Descriptions accessibles de chaque paramètre médical
- **Conseils personnalisés** : Recommandations pour améliorer les résultats

## 🛠 Technologies utilisées

### Frontend
- **React.js** - Framework JavaScript pour l'interface utilisateur
- **React Router** - Navigation entre les pages
- **Axios** - Requêtes HTTP vers le backend
- **Tailwind CSS** - Framework CSS utilitaire pour le styling

### Backend
- **Node.js** - Environnement d'exécution JavaScript
- **Express.js** - Framework web pour l'API REST
- **Supabase Auth** - Authentification des utilisateurs
- **Supabase Postgres** - Base de données hébergée
- **Drizzle ORM** - Requêtes SQL métier typées
- **Mistral AI API** - Intelligence artificielle pour l'analyse des résultats

### DevOps
- **Docker** - Conteneurisation
- **GitHub Actions** ou **GitLab CI** - Intégration continue
- **Vercel** ou **Render** - Déploiement frontend
- **Railway** ou **Heroku** - Déploiement backend

## 🏗 Architecture du projet

```
ProjetLabTech/
├── frontend/                # Application React.js
│   ├── public/             
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Fonctions utilitaires
│   │   ├── styles/         # Styles globaux
│   │   └── App.js          # Composant principal
│   ├── package.json

│
├── backend/                 # API Express.js
│   ├── src/
│   │   ├── controllers/    # Logique métier
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services de traitement du PDF
│   │   └── server.js       # Point d'entrée
│   ├── package.json
│
└── README.md                # Documentation
```

## 🚀 Installation

### Prérequis
- Node.js (v20+)
- npm ou yarn
- Compte Mistral AI (pour la clé API)
- Projet Supabase (Auth + Postgres)

### Installation du Backend

```bash
# Cloner le repository
git clone <repository-url>
cd ProjetLabTech/backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Démarrer le serveur de développement
npm run dev

# Créer/mettre à jour les tables users avec Drizzle
npm run db:push
```

### Installation du Frontend

```bash
cd ProjetLabTech/frontend

# Installer les dépendances
npm install

# Démarrer l'application
npm start
```

L'application sera accessible sur `http://localhost:3000`

## 🧪 Tests

Le frontend utilise **Vitest** + **Testing Library** pour les tests unitaires et d'intégration.

### Structure des tests

```
FRONT/src/test/
├── setup.ts                        # Configuration globale (jest-dom)
├── unit/                           # Tests unitaires — composants isolés
│   ├── UiButton.test.tsx
│   ├── Card.test.tsx
│   ├── Header.test.tsx
│   ├── Footer.test.tsx
│   └── TestValueCard.test.tsx
└── integration/                    # Tests d'intégration — flux complets
    ├── Upload.test.tsx
    ├── Manual.test.tsx
    ├── ManualValues.test.tsx
    └── LabResultsPage.test.tsx
```

### Lancer les tests

```bash
cd FRONT

# Lancer tous les tests une fois (mode CI)
npm run test

# Lancer en mode watch (développement)
npm run test:watch

# Générer un rapport de couverture (HTML dans FRONT/coverage/)
npm run test:coverage

# Tout vérifier d'un coup : lint + tests + build
npm run ci
```

### CI/CD — GitHub Actions

À chaque `push` ou `pull request`, la pipeline `.github/workflows/ci.yml` exécute automatiquement :

1. **Lint** (`eslint`) — vérifie la qualité du code TypeScript
2. **Tests** (49 tests) — unitaires et intégration
3. **Build** (`vite build`) — vérifie que la production compile

> Le déploiement Vercel ne se déclenche qu'après que ces 3 étapes soient passées avec succès.

---

## 🚀 Déploiement

### Frontend — Vercel

Le fichier `vercel.json` à la racine configure le déploiement :

```json
{
  "buildCommand": "cd FRONT && npm install && npm run build",
  "outputDirectory": "FRONT/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

**Variables d'environnement Vercel** (Project Settings → Environment Variables) :

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL du backend (ex: `https://ton-backend.up.railway.app`) |

### Backend — Railway / Render

Le backend Express (`backend/`) ne peut pas tourner sur Vercel (serverless). Déployer sur Railway ou Render :

```bash
# Démarrage
cd backend && npm start
```

---

## 📱 Utilisation

1. **Nouvelle analyse** : Cliquer sur "Nouvelle analyse" et saisir les résultats ou uploader un fichier PDF
2. **Analyser** : L'IA de Mistral génère une analyse détaillée
3. **Consulter les résultats** : Visualiser les explications et conseils


## 👥 Organisation de l'équipe

### Frontend
- **Lorsold Pradon Alyssia** - Développement React.js
- **Camara Diangou** - Développement React.js

### Backend et DevOps
- **Charlery Malcolm** - Développement Express.js

### Product Owner
- **Intsorou Samentah** - Vision produit, Définition des fonctionnalités

### SCRUM Master
- **Sfez Noah** - Gestion agile, Coordination de l'équipe

## 🔐 Sécurité

- Validation des entrées avec express-validator
- Rate limiting pour prévenir les abus
- CORS configuré pour les domaines autorisés
- HTTPS en production

## 📄 Licence

Ce projet est réalisé dans le cadre d'un projet académique.

## 📞 Contact

Pour toute question ou suggestion, contactez l'équipe Lab'IA.

---

**Note** : Ce projet est en cours de développement. Les fonctionnalités peuvent évoluer.
