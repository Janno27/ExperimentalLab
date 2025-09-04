# Correction de la Résolution des Données Airtable

## Problème Initial

Les informations des tests dans `SelectAnalysis.tsx` et `ResultsView.tsx` affichaient "Unknown" pour :
- **Owner** : Propriétaire du test
- **Main KPI** : KPI principal du test  
- **Market** : Marché/Pays du test
- **Page** : Page concernée par le test
- **Product** : Produit concerné par le test

## Cause Racine

Les champs liés (linked records) dans Airtable retournent des **tableaux d'IDs** mais pas les **noms résolus**. L'ancien code tentait d'accéder directement aux noms sans résoudre les IDs :

```typescript
// ❌ AVANT - Accès direct aux noms (incorrect)
owner: exp.fields?.Owner?.[0]?.name || 'Unknown',
mainKPI: exp.fields?.['Main KPI']?.[0]?.name || 'Unknown',
market: exp.fields?.Market?.[0]?.name || 'Unknown',
```

## Solution Implémentée

### ✅ **1. Récupération des Tables de Référence**

```typescript
// Récupération de toutes les données de référence en parallèle
const [experimentations, markets, owners, kpis, pages, products] = await Promise.all([
  fetchExperimentations(),
  fetchMarkets(),
  fetchOwners(),
  fetchKPIs(),
  fetchPages(),
  fetchProducts()
])
```

### ✅ **2. Fonction de Résolution des Champs Liés**

```typescript
// Helper pour résoudre les IDs en noms
const getLinkedRecordName = (ids: string[] | undefined, referenceData: {id: string, name: string}[]) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) return 'Unknown'
  const record = referenceData.find(r => r.id === ids[0])
  return record?.name || 'Unknown'
}
```

### ✅ **3. Mapping Corrigé des Données**

```typescript
// ✅ APRÈS - Résolution correcte des IDs
owner: getLinkedRecordName(exp.fields?.Owner, owners),
mainKPI: getLinkedRecordName(exp.fields?.['Main KPI'], kpis),
market: getLinkedRecordName(exp.fields?.Market, markets),
page: getLinkedRecordName(exp.fields?.Page, pages),
product: getLinkedRecordName(exp.fields?.Product, products),
```

### ✅ **4. Interface TypeScript Mise à Jour**

L'interface `ReadyForAnalysisTest` dans `SelectAnalysis.tsx` a été synchronisée avec celle de `data-analysis.tsx` :

```typescript
interface ReadyForAnalysisTest {
  id: string
  name: string
  type: string
  owner: string
  startDate: string
  endDate: string
  mainKPI: string
  status: string
  // ✅ AJOUTÉ - Propriétés manquantes
  market?: string
  page?: string
  product?: string
  // ... autres propriétés
}
```

### ✅ **5. Affichage Amélioré dans SelectAnalysis.tsx**

```typescript
// Affichage conditionnel des informations
<div className="flex items-center gap-1 flex-wrap">
  {test.owner && test.owner !== 'Unknown' && (
    <span className="bg-violet-100 text-violet-700 rounded px-2 py-0.5">
      {test.owner}
    </span>
  )}
  {test.market && test.market !== 'Unknown' && (
    <span className="bg-blue-100 text-blue-700 rounded px-2 py-0.5">
      {test.market}
    </span>
  )}
</div>

<div className="space-y-1 text-[10px] text-zinc-500">
  {test.mainKPI && test.mainKPI !== 'Unknown' && (
    <div><span className="font-medium">KPI:</span> {test.mainKPI}</div>
  )}
  {test.page && test.page !== 'Unknown' && (
    <div><span className="font-medium">Page:</span> {test.page}</div>
  )}
  {test.product && test.product !== 'Unknown' && (
    <div><span className="font-medium">Product:</span> {test.product}</div>
  )}
</div>
```

## Masquage du Stepper

### ✅ **Problème** : Le stepper restait visible dans `ResultsView`

### ✅ **Solution** : Condition mise à jour dans `app/data-analysis/page.tsx`

```typescript
// ✅ AVANT
{currentStep >= 2 && (
  <AnalysisStepper currentStep={currentStep} />
)}

// ✅ APRÈS - Masqué quand on arrive aux résultats (step 6)
{currentStep >= 2 && currentStep < 6 && (
  <AnalysisStepper currentStep={currentStep} />
)}
```

## Structure des Données Airtable

### **Champs Directs** (string, number, date)
```json
{
  "fields": {
    "Name": "Test Homepage Checkout",
    "Type": "A/B-Test", 
    "Status": "Ready for Analysis",
    "Start Date": "2024-01-15"
  }
}
```

### **Champs Liés** (linked records - array of IDs)
```json
{
  "fields": {
    "Owner": ["recABC123"],           // ← Array d'IDs
    "Main KPI": ["recDEF456"],        // ← Array d'IDs  
    "Market": ["recGHI789"],          // ← Array d'IDs
    "Page": ["recJKL012"],            // ← Array d'IDs
    "Product": ["recMNO345"]          // ← Array d'IDs
  }
}
```

### **Tables de Référence** (pour résoudre les IDs)
```json
// Table Markets
[
  { "id": "recGHI789", "name": "France" },
  { "id": "recPQR678", "name": "Germany" }
]

// Table Owners  
[
  { "id": "recABC123", "name": "Jean Rosset" },
  { "id": "recSTU901", "name": "Marie Dupont" }
]
```

## Résultat Final

### **AVANT** (Données manquantes)
```
Test Homepage Checkout                    [A/B-Test]
Owner: Unknown | KPI: Unknown | Market: Unknown
Start: 2024-01-15 | End: 2024-01-30
```

### **APRÈS** (Données résolues)
```
Test Homepage Checkout                    [A/B-Test]
[Jean Rosset] [France]
Start: 2024-01-15 | End: 2024-01-30
KPI: Purchase Conversion Rate
Page: Homepage Checkout
Product: Premium Subscription
```

## Avantages de la Solution

### ✅ **Performance Optimisée**
- **Requêtes parallèles** avec `Promise.all()`
- **Cache Airtable** préservé pour éviter les appels répétés
- **Résolution unique** au moment du fetch

### ✅ **Maintenabilité**
- **Fonction helper réutilisable** pour tous les champs liés
- **Interface TypeScript cohérente** entre composants
- **Gestion d'erreur robuste** avec fallback sur 'Unknown'

### ✅ **Expérience Utilisateur**
- **Informations complètes** sur chaque test
- **Affichage conditionnel** (masque les valeurs 'Unknown')
- **Codes couleur** pour différencier les types d'information
- **Stepper masqué** dans la vue des résultats

La correction assure maintenant une **récupération fiable** de toutes les données Airtable avec une **interface utilisateur informative** ! 🚀
