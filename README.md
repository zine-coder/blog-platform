# Blog Platform

Une plateforme de blog moderne et complète, construite avec la stack MERN (MongoDB, Express, React, Node.js).

## 🌟 Fonctionnalités

### Pour les utilisateurs
- **Authentification** - Inscription, connexion et gestion de profil
- **Articles** - Création, édition et suppression d'articles avec support multi-paragraphes et images
- **Interactions sociales** - Commentaires, likes, bookmarks et partage
- **Recherche avancée** - Recherche par mot-clé, hashtag, auteur, date avec suggestions dynamiques
- **Flux personnalisé** - Contenu recommandé basé sur vos intérêts et interactions
- **Notifications** - Alertes en temps réel pour les interactions avec votre contenu
- **Profils utilisateurs** - Pages personnalisables avec photo de profil et bannière

### Aspects techniques
- **Design responsive** - Expérience optimisée sur tous les appareils
- **Performance optimisée** - Lazy loading, mémorisation et virtualisation
- **API RESTful** - Architecture backend structurée et documentée
- **Sécurité renforcée** - Protection contre XSS, CSRF et injections

## 🚀 Démarrage rapide

### Prérequis
- Node.js (v14+)
- MongoDB
- npm ou yarn

### Installation

#### Backend
```bash
# Cloner le dépôt
git clone https://github.com/zine-coder/blog-platform.git
cd blog-platform/backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer le fichier .env avec vos configurations

# Démarrer le serveur en mode développement
npm run dev
```

#### Frontend
```bash
# Dans un nouveau terminal
cd ../frontend

# Installer les dépendances
npm install

# Démarrer l'application en mode développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173` et l'API sur `http://localhost:5000`.

## 🏗️ Structure du projet

### Backend
```
backend/
├── config/         # Configuration de la base de données et autres services
├── controllers/    # Logique métier des routes
├── middleware/     # Middleware personnalisés (auth, validation, etc.)
├── models/         # Modèles Mongoose
├── routes/         # Définition des routes API
├── tests/          # Tests unitaires et d'intégration
├── utils/          # Utilitaires et helpers
└── server.js       # Point d'entrée de l'application
```

### Frontend
```
frontend/
├── public/         # Ressources statiques
├── src/
│   ├── components/ # Composants React réutilisables
│   ├── contexts/   # Contextes React (auth, etc.)
│   ├── pages/      # Composants de pages
│   ├── services/   # Services API et utilitaires
│   ├── models/     # Types et interfaces TypeScript
│   └── App.tsx     # Composant racine
└── index.html      # Point d'entrée HTML
```

## 🔌 API

La documentation complète de l'API est disponible à l'adresse `/api-docs` une fois le serveur démarré.

Endpoints principaux :
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/posts` - Récupérer les articles
- `POST /api/posts` - Créer un article
- `GET /api/search` - Rechercher du contenu

## 🧪 Tests

```bash
# Exécuter les tests backend
cd backend
npm test

# Exécuter les tests frontend
cd frontend
npm test
```

## 🛠️ Technologies utilisées

### Backend
- **Node.js & Express** - Serveur API
- **MongoDB & Mongoose** - Base de données et ODM
- **JWT** - Authentification
- **Multer** - Gestion des uploads
- **Swagger** - Documentation API

### Frontend
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **TailwindCSS** - Framework CSS
- **React Router** - Routage
- **Lucide React** - Icônes
- **Jest & Testing Library** - Tests

## 🔒 Sécurité

- Hachage des mots de passe avec bcrypt
- Protection contre les attaques XSS
- Validation des entrées utilisateur
- Tokens JWT sécurisés
- Sanitization des données

## 🚧 Roadmap

- [ ] Mode hors ligne avec PWA
- [ ] Support multilingue
- [ ] Éditeur de texte riche
- [ ] Système de modération de contenu
- [ ] Analytics avancées pour les auteurs

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

1. Forkez le projet
2. Créez votre branche (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add some amazing feature'`)
4. Poussez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Contact

zine coder - zinecoder.dev@gmail.com

Lien du projet: [https://github.com/zine-coder/blog-platform.git](https://github.com/zine-coder/blog-platform.git)
