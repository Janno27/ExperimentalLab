# 📊 A/B Test Analysis Tool

Solution complète d'analyse post-test A/B avec interface React/Next.js et backend FastAPI pour analyses statistiques avancées.

## 🚀 Fonctionnalités Principales

### Interface Utilisateur
- **Import de données flexible** : CSV, Excel, BigQuery/GA4 (à venir)
- **Détection automatique** des métriques et colonnes
- **Configuration guidée** en étapes progressives
- **Visualisation des résultats** avec graphiques interactifs
- **Export des analyses** en PDF/Excel

### Analyses Statistiques
- **Méthodes multiples** : Frequentist, Bayesian, Bootstrap
- **Types de métriques** : Conversion, Revenue, Count, Ratio
- **Corrections multiples** : Bonferroni, FDR
- **Intervalles de confiance** : 80-99%
- **Détection automatique** : MDE, puissance statistique

### Intégration
- **Airtable** : Import direct des tests configurés
- **API REST** : Backend FastAPI asynchrone
- **Real-time** : Suivi du statut en temps réel
- **Cache** : Optimisation des performances

## 🏗 Architecture

```
myApp/
├── app/
│   └── data-analysis/          # Page principale
│       └── page.tsx           # Point d'entrée
├── components/
│   └── app-bar/
│       └── data-analysis/     # Composants UI
│           ├── DataImport.tsx
│           ├── SelectAnalysis.tsx
│           ├── configure-analysis/
│           │   ├── SelectColumns.tsx
│           │   ├── TestConfiguration.tsx
│           │   ├── SuggestedMetrics.tsx
│           │   └── StatisticConfiguration.tsx
│           ├── RunScript.tsx
│           └── ResultsView.tsx
├── lib/
│   ├── api/                  # Intégration API
│   │   ├── analysis-api.ts
│   │   └── analysis-api-transformer.ts
│   └── analysis/             # Utilitaires
│       └── metric-detector.ts
├── types/
│   └── analysis.ts           # Types TypeScript
└── backend/
    └── app/                  # Backend FastAPI
        ├── main.py
        ├── models.py
        ├── analysis/         # Logique d'analyse
        └── utils/           # Validation données
```

## 📋 Prérequis

- **Node.js** 18+
- **Python** 3.8+
- **npm** ou **pnpm**
- **pip**

## 🛠 Installation

### 1. Configuration de l'Environnement

```bash
# Créer .env.local à la racine
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" >> .env.local
```

### 2. Installation Frontend

```bash
# Installation des dépendances
npm install
# ou
pnpm install

# Démarrage du serveur de développement
npm run dev
# ou
pnpm dev
```

### 3. Installation Backend

```bash
# Naviguer vers le backend
cd backend

# Créer environnement virtuel (optionnel mais recommandé)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Installer les dépendances
pip install -r requirements.txt

# Démarrer le serveur FastAPI
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🎯 Guide d'Utilisation

### Workflow Complet

#### 1. **Sélection du Test**
```
- Naviguer vers /app/data-analysis
- Choisir un test depuis Airtable
- Ou créer une analyse "from scratch"
```

#### 2. **Import des Données**
```
- Glisser-déposer un fichier CSV/Excel
- Ou connecter BigQuery/GA4 (à venir)
- Aperçu automatique des données
```

#### 3. **Configuration de l'Analyse**
```
a. Sélection des colonnes
b. Configuration du test (variation, utilisateurs)
c. Sélection/création des métriques
d. Configuration statistique
```

#### 4. **Exécution**
```
- Lancement automatique de l'analyse
- Barre de progression en temps réel
- Gestion des erreurs automatique
```

#### 5. **Résultats**
```
- Tableaux de résultats détaillés
- Intervalles de confiance
- Recommandations automatiques
```

### Exemple de Données CSV

```csv
variation,user_id,conversion,revenue,sessions
control,user_001,1,25.99,3
treatment,user_002,0,0,1
control,user_003,1,45.50,2
treatment,user_004,1,32.00,4
```

### Création de Métriques Personnalisées

```javascript
// Métrique de conversion
{
  name: "Conversion Rate",
  type: "binary",
  numerator: "conversion",
  denominator: "users",
  description: "Taux de conversion global"
}

// Métrique de revenue
{
  name: "Revenue per User",
  type: "continuous",
  valueColumn: "revenue",
  unit: "currency",
  currency: "€",
  decimals: 2
}

// Métrique de ratio
{
  name: "AOV",
  type: "continuous",
  valueColumn: "revenue",      // Numérateur
  valueColumn2: "conversion",  // Dénominateur
  description: "Average Order Value"
}
```

## 🔍 Types de Métriques

### Binary (Conversion)
- **Usage** : Taux de conversion, CTR, signup rate
- **Calcul** : Proportion d'événements positifs
- **Test** : Chi-carré, Fisher exact

### Continuous (Revenue/Count)
- **Usage** : Revenue, AOV, pages vues
- **Calcul** : Moyenne/somme des valeurs
- **Test** : T-test, Mann-Whitney

### Ratio
- **Usage** : Métriques calculées (revenue/user)
- **Calcul** : Division de deux colonnes
- **Test** : T-test sur ratios

## ⚙️ Configuration Statistique

### Niveaux de Confiance
- **80-85%** : Tests exploratoires (rapide)
- **90-95%** : Standard (équilibré)
- **99%** : Haute confiance (conservateur)

### Méthodes Statistiques
- **Frequentist** : Tests classiques (défaut)
- **Bayesian** : Inférence probabiliste
- **Bootstrap** : Rééchantillonnage

### Corrections Multiples
- **None** : Aucune correction
- **Bonferroni** : Très conservateur
- **FDR** : Équilibré (recommandé)

## 📊 API Endpoints

### Frontend → Backend

```typescript
// Démarrer analyse
POST /api/analyze
{
  data: [...],
  metrics_config: [...],
  variation_column: "variation",
  confidence_level: 95,
  statistical_method: "frequentist"
}

// Vérifier statut
GET /api/status/{job_id}

// Récupérer résultats
GET /api/results/{job_id}
```

### Structure des Résultats

```javascript
{
  overall_results: {
    total_users: 10000,
    total_variations: 2,
    significant_metrics: 3,
    data_quality_score: 0.95
  },
  metric_results: [
    {
      metric_name: "Conversion Rate",
      variation_stats: [...],
      pairwise_comparisons: [...],
      is_significant: true,
      p_value: 0.003
    }
  ],
  recommendations: [...]
}
```

## 🚨 Troubleshooting

### Problèmes Communs

#### Backend ne démarre pas
```bash
# Vérifier Python version
python --version  # Doit être >= 3.8

# Réinstaller dépendances
pip install --upgrade -r requirements.txt
```

#### Erreur de connexion API
```bash
# Vérifier que le backend est actif
curl http://localhost:8000/health

# Vérifier variable d'environnement
echo $NEXT_PUBLIC_API_URL
```

#### Données non reconnues
- Vérifier encodage UTF-8
- Colonnes sans caractères spéciaux
- Pas d'espaces en début/fin

### Logs de Debug

```javascript
// Frontend (console navigateur)
localStorage.setItem('debug', 'true')

// Backend (terminal)
uvicorn app.main:app --reload --log-level debug
```

## 📈 Performance

### Limites Recommandées
- **Lignes** : < 1M pour performances optimales
- **Colonnes** : < 100 colonnes
- **Métriques** : < 20 simultanément

### Optimisations
- Cache côté client (5 minutes)
- Traitement vectorisé (pandas/numpy)
- Jobs asynchrones (> 10K lignes)


## 📝 Roadmap

- [x] Import CSV/Excel
- [x] Analyses statistiques de base
- [x] Métriques personnalisées
- [ ] Connexion BigQuery/GA4
- [ ] Export PDF des résultats
- [ ] Tests A/B/n (multi-variations)
- [ ] Analyses séquentielles
- [ ] Dashboard temps réel
- [ ] API webhooks
- [ ] Machine Learning predictions