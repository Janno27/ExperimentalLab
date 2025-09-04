# Analysis API Integration

Ce module fournit l'intégration avec le backend FastAPI pour l'analyse A/B test.

## Configuration

### Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Démarrage du Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Utilisation

### Import de l'API

```typescript
import { analysisAPI } from '@/lib/api/analysis-api'
```

### Démarrer une Analyse

```typescript
const config = analysisAPI.transformConfig(
  data,                    // Données CSV/JSON
  metrics,                 // Configuration des métriques
  'variation',            // Colonne de variation
  'user_id',             // Colonne utilisateur (optionnel)
  95,                     // Niveau de confiance
  'frequentist',          // Méthode statistique
  'none'                  // Correction tests multiples
)

const response = await analysisAPI.startAnalysis(config)
const jobId = response.job_id
```

### Vérifier le Statut

```typescript
const status = await analysisAPI.checkStatus(jobId)
console.log(status.status) // 'queued' | 'processing' | 'completed' | 'failed'
```

### Récupérer les Résultats

```typescript
const results = await analysisAPI.getResults(jobId)
console.log(results.overall_results)
console.log(results.metric_results)
```

## Composant RunScript

Le composant `RunScript` gère automatiquement :

- ✅ Démarrage de l'analyse
- ✅ Polling du statut (500ms)
- ✅ Barre de progression
- ✅ Gestion des erreurs
- ✅ Redirection automatique

### Props Requises

```typescript
interface RunScriptProps {
  onBackStep?: () => void
  data: any[]                    // Données importées
  metrics: any[]                 // Métriques configurées
  variationColumn: string        // Colonne variation
  userColumn?: string           // Colonne utilisateur
  confidenceLevel: number       // Niveau confiance (80-99)
  statisticalMethod: 'frequentist' | 'bayesian' | 'bootstrap'
  multipleTestingCorrection: 'none' | 'bonferroni' | 'fdr'
}
```

## Types de Métriques Supportés

- **conversion** : Taux de conversion, CTR
- **revenue** : Chiffre d'affaires, AOV, LTV
- **count** : Nombre de clics, vues, achats
- **ratio** : Métriques calculées (revenue/user)

## Méthodes Statistiques

- **frequentist** : Tests t, Chi-carré (par défaut)
- **bayesian** : Inférence probabiliste
- **bootstrap** : Rééchantillonnage

## Corrections de Tests Multiples

- **none** : Aucune correction
- **bonferroni** : Très conservateur
- **fdr** : False Discovery Rate (recommandé)

## Exemple Complet

```typescript
import { RunScript } from '@/components/app-bar/data-analysis/RunScript'

function AnalysisFlow() {
  const [showRunScript, setShowRunScript] = useState(false)
  
  return (
    <div>
      {showRunScript && (
        <RunScript
          onBackStep={() => setShowRunScript(false)}
          data={importedData}
          metrics={selectedMetrics}
          variationColumn="variation"
          userColumn="user_id"
          confidenceLevel={95}
          statisticalMethod="frequentist"
          multipleTestingCorrection="fdr"
        />
      )}
    </div>
  )
}
```

## Gestion des Erreurs

L'API gère automatiquement :

- ❌ Erreurs réseau
- ❌ Erreurs de validation
- ❌ Timeouts
- ❌ Erreurs serveur

## Performance

- **Polling** : Toutes les 500ms
- **Cache** : Résultats en mémoire
- **Optimisation** : Traitement vectorisé
- **Scalabilité** : Jobs asynchrones

## Débogage

### Vérifier la Connexion

```typescript
try {
  const health = await analysisAPI.healthCheck()
  console.log('API Status:', health.status)
} catch (error) {
  console.error('API Connection Failed:', error)
}
```

### Logs de Développement

```typescript
// Dans le composant RunScript
console.log('Starting analysis with config:', config)
console.log('Job ID:', jobId)
console.log('Current status:', currentStep)
```

## Support

Pour questions ou problèmes :

1. Vérifiez que le backend est démarré
2. Contrôlez les variables d'environnement
3. Vérifiez la console pour les erreurs
4. Testez l'endpoint `/health` du backend 