# A/B Test Analysis API Backend

FastAPI backend optimisé pour l'analyse post-test A/B. Ce backend fournit une API robuste pour analyser les résultats de tests A/B avec des méthodes statistiques avancées.

## 🚀 Fonctionnalités

### Analyses Statistiques
- **Méthodes statistiques multiples** : Frequentist, Bayesian, Bootstrap
- **Types de métriques** : Conversion, Revenue, Count, Ratio
- **Corrections de tests multiples** : Bonferroni, FDR (False Discovery Rate)
- **Niveaux de confiance configurables** : 80-99%

### Gestion des Données
- **Validation automatique** des données d'entrée
- **Nettoyage intelligent** : gestion des NaN, outliers, doublons
- **Filtrage avancé** : filtres par plage, liste, exclusion
- **Rapport de qualité** des données avec recommandations

### API Asynchrone
- **Jobs en arrière-plan** pour analyses longues
- **Suivi du statut** en temps réel
- **Gestion d'erreurs** robuste
- **CORS configuré** pour intégration frontend

## 📁 Structure du Projet

```
backend/
├── app/
│   ├── main.py                 # Application FastAPI principale
│   ├── models.py              # Modèles Pydantic (requêtes/réponses)
│   ├── analysis/
│   │   ├── analyzer.py        # Orchestrateur principal d'analyse
│   │   ├── metrics.py         # Calculs par type de métrique
│   │   └── corrections.py     # Corrections tests multiples
│   └── utils/
│       └── data_validator.py  # Validation et nettoyage des données
├── requirements.txt           # Dépendances Python
└── README.md                 # Cette documentation
```

## 🛠 Installation

### Prérequis
- Python 3.8+
- pip

### Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

### Démarrage du serveur

```bash
# Mode développement
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Mode production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

L'API sera accessible sur `http://localhost:8000`

## 📚 Documentation API

### Endpoints Principaux

#### `POST /api/analyze`
Lance une analyse A/B test et retourne un job_id pour le suivi.

**Paramètres :**
```json
{
  "data": [
    {"user_id": "user1", "variation": "control", "conversion": 1, "revenue": 25.99},
    {"user_id": "user2", "variation": "treatment", "conversion": 0, "revenue": 0}
  ],
  "metrics_config": [
    {
      "name": "Conversion Rate",
      "column": "conversion",
      "type": "conversion"
    }
  ],
  "variation_column": "variation",
  "user_column": "user_id",
  "confidence_level": 95.0,
  "statistical_method": "frequentist",
  "multiple_testing_correction": "none"
}
```

**Réponse :**
```json
{
  "job_id": "uuid-string",
  "status": "queued",
  "message": "Analysis started successfully"
}
```

#### `GET /api/status/{job_id}`
Récupère le statut d'une analyse en cours.

**Réponse :**
```json
{
  "job_id": "uuid-string",
  "status": "processing",
  "created_at": "2024-01-01T12:00:00Z",
  "started_at": "2024-01-01T12:00:01Z"
}
```

#### `GET /api/results/{job_id}`
Récupère les résultats complets d'une analyse terminée.

**Réponse :**
```json
{
  "job_id": "uuid-string",
  "status": "completed",
  "results": {
    "overall_results": {
      "total_users": 10000,
      "control_users": 5000,
      "variation_users": 5000,
      "significant_metrics": 1,
      "total_metrics": 2
    },
    "metric_results": [
      {
        "metric_name": "Conversion Rate",
        "absolute_uplift": 0.025,
        "relative_uplift": 12.5,
        "is_significant": true,
        "p_value": 0.003
      }
    ]
  }
}
```

#### `POST /api/analyze/filter`
Re-calcule une analyse avec des filtres appliqués.

**Paramètres :**
```json
{
  "job_id": "original-job-uuid",
  "filters": {
    "country": "US",
    "age": {"min": 18, "max": 65}
  }
}
```

### Statuts des Jobs

- `queued` : Job en attente de traitement
- `processing` : Analyse en cours
- `completed` : Analyse terminée avec succès
- `failed` : Analyse échouée (voir champ `error`)

## 🔧 Configuration

### Variables d'Environnement

```bash
# Optionnel : Configuration CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optionnel : Configuration de logging
LOG_LEVEL=INFO
```

### Configuration des Méthodes Statistiques

#### Frequentist (Par défaut)
- Tests t de Student/Welch pour métriques continues
- Tests Chi-carré pour métriques de conversion
- Intervalles de confiance basés sur la distribution normale

#### Bayesian
- Priors conjugués (Beta-Binomial pour conversions)
- Simulation Monte Carlo pour calcul des probabilités
- Interprétation probabiliste des résultats

#### Bootstrap
- Rééchantillonnage avec remise
- Tests de permutation pour hypothèse nulle
- Robuste aux distributions non-normales

## 📊 Types de Métriques Supportées

### Conversion
- **Usage** : Taux de conversion, CTR, taux de signup
- **Calcul** : Proportion d'événements positifs
- **Test** : Chi-carré, Test exact de Fisher

### Revenue
- **Usage** : Chiffre d'affaires, AOV, LTV
- **Calcul** : Moyenne des valeurs numériques
- **Test** : Test t, Mann-Whitney U

### Count
- **Usage** : Nombre de pages vues, clics, achats
- **Calcul** : Somme ou moyenne des compteurs
- **Test** : Test t, Test de Poisson

### Ratio
- **Usage** : Métriques calculées (revenue/user, pages/session)
- **Calcul** : Ratio de deux colonnes
- **Test** : Test t sur les ratios calculés

## 🧮 Corrections de Tests Multiples

### Bonferroni
- **Méthode** : Divise α par le nombre de tests
- **Avantage** : Contrôle strict du taux d'erreur familial
- **Inconvénient** : Très conservateur, peut manquer des vrais effets

### FDR (False Discovery Rate)
- **Méthode** : Contrôle la proportion de fausses découvertes
- **Avantage** : Moins conservateur que Bonferroni
- **Inconvénient** : Permet quelques faux positifs

### Recommandations
- **1 métrique** : Pas de correction nécessaire
- **2-5 métriques** : FDR recommandé
- **>5 métriques** : Bonferroni si faux positifs critiques, sinon FDR

## 🔍 Validation des Données

### Nettoyage Automatique
- **Valeurs manquantes** : Conversion des représentations nulles
- **Outliers** : Détection et traitement des valeurs extrêmes (>5σ)
- **Types de données** : Conversion automatique vers types appropriés
- **Doublons** : Suppression des lignes identiques

### Filtrage Avancé
```json
{
  "age": {"min": 18, "max": 65},           // Filtre par plage
  "country": ["US", "UK", "CA"],          // Filtre par liste
  "device": "!mobile",                    // Filtre d'exclusion
  "segment": "premium"                    // Filtre exact
}
```

### Rapport de Qualité
- Score de qualité global (0-1)
- Statistiques par colonne
- Pourcentage de données manquantes
- Recommandations d'amélioration

## 🚨 Gestion d'Erreurs

### Erreurs Courantes

#### 400 Bad Request
- Données manquantes ou invalides
- Configuration de métriques incorrecte
- Colonnes requises absentes

#### 404 Not Found
- Job ID inexistant
- Ressource non trouvée

#### 500 Internal Server Error
- Erreur durant l'analyse statistique
- Problème de traitement des données
- Erreur système

### Messages d'Erreur Détaillés
```json
{
  "detail": "Variation column 'treatment' not found in data",
  "error_type": "ValidationError",
  "suggestions": [
    "Check column names in your data",
    "Ensure variation_column matches exactly"
  ]
}
```

## 📈 Métriques de Performance

### Temps de Traitement Typiques
- **<1K lignes** : <1 seconde
- **1K-10K lignes** : 1-5 secondes
- **10K-100K lignes** : 5-30 secondes
- **>100K lignes** : 30+ secondes

### Optimisations
- Traitement vectorisé avec pandas/numpy
- Jobs asynchrones pour analyses longues
- Cache en mémoire pour jobs récents
- Validation précoce des données

## 🧪 Tests et Développement

### Lancement des Tests
```bash
# Tests unitaires
pytest tests/ -v

# Tests d'intégration
pytest tests/integration/ -v

# Coverage
pytest --cov=app tests/
```

### Structure des Tests
```
tests/
├── test_models.py          # Tests des modèles Pydantic
├── test_analyzer.py        # Tests de l'orchestrateur
├── test_metrics.py         # Tests des calculs métriques
├── test_corrections.py     # Tests des corrections
├── test_validator.py       # Tests de validation
└── integration/
    └── test_api.py         # Tests d'intégration API
```

## 🚀 Déploiement

### Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/
EXPOSE 8000

CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### Variables d'Environnement de Production
```bash
ENV=production
LOG_LEVEL=INFO
CORS_ORIGINS=https://your-frontend-domain.com
```

## 📝 Logs et Monitoring

### Structure des Logs
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "INFO",
  "job_id": "uuid-string",
  "event": "analysis_started",
  "metrics_count": 3,
  "sample_size": 10000
}
```

### Métriques à Surveiller
- Temps de traitement moyen
- Taux d'erreur par endpoint
- Utilisation mémoire/CPU
- Nombre de jobs actifs

## 🤝 Contribution

### Standards de Code
- **PEP 8** : Style guide Python
- **Type hints** : Annotations de type obligatoires
- **Docstrings** : Documentation des fonctions
- **Tests** : Couverture >90%

### Pull Requests
1. Fork le projet
2. Créer une branche feature
3. Ajouter tests pour nouvelles fonctionnalités
4. Vérifier que tous les tests passent
5. Créer la pull request

## 📞 Support

Pour questions ou problèmes :
- **Issues** : Créer une issue GitHub
- **Documentation** : Swagger UI disponible sur `/docs`
- **API Schema** : OpenAPI spec sur `/openapi.json`

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2024 