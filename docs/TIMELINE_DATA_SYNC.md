# Synchronisation des Données de la Timeline

## Vue d'ensemble

Ce document décrit le système de synchronisation invisible des données de la timeline, permettant aux utilisateurs de continuer à naviguer pendant que les données sont mises à jour en arrière-plan.

## Architecture du Système

### 1. Hook `useTimelineData`

**Fichier** : `components/timeline/hooks/useTimelineData.ts`

#### Fonctions principales

```typescript
// Chargement initial avec spinner
const loadData = async () => {
  await processData(true)
}

// Rafraîchissement complet avec spinner
const refreshData = async () => {
  await loadData()
}

// Rafraîchissement invisible (utilisé pour les mises à jour)
const refreshDataSilent = async () => {
  await processData(false)
}
```

#### Fonction helper `processData`

```typescript
const processData = async (showLoading = true) => {
  // Paramètre showLoading contrôle l'affichage du spinner
  // true = affiche le spinner, false = rafraîchissement invisible
}
```

**Paramètres** :
- `showLoading` (boolean) : Contrôle l'affichage du spinner de chargement

### 2. Flux des Données

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Airtable      │    │  useTimelineData │    │   TimelineView  │
│                 │    │                  │    │                 │
│ - Experimentations│◄──┤  processData()   │◄──┤  refreshDataSilent│
│ - Markets       │    │  - fetchData()   │    │                 │
│ - Pages         │    │  - filterData()  │    │                 │
│ - Owners        │    │  - transformData()│    │                 │
│ - KPIs          │    │  - setData()     │    │                 │
│ - TestTypes     │    │                  │    │                 │
│ - Products      │    └──────────────────┘    └─────────────────┘
└─────────────────┘
```

### 3. Composants Utilisateurs

#### TimelineView
**Fichier** : `components/timeline/index.tsx`

```typescript
const { data, state, toggleCountry, loading, refreshDataSilent } = useTimelineData()

// Passe la fonction au TicketOverlay
<TicketOverlay 
  project={selectedProject}
  isOpen={isOverlayOpen}
  onClose={handleCloseOverlay}
  onDataRefresh={refreshDataSilent} // ← Fonction silencieuse
/>
```

#### TicketOverlay
**Fichier** : `components/timeline/TicketOverlay/index.tsx`

```typescript
interface TicketOverlayProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onDataRefresh?: () => Promise<void> // ← Prop optionnelle
}

// Utilisation dans handleMarkAsDone
const handleMarkAsDone = async () => {
  // ... mise à jour Airtable
  if (onDataRefresh) {
    await onDataRefresh() // ← Rafraîchissement invisible
  }
}
```

#### TicketOverlayResults
**Fichier** : `components/timeline/TicketOverlay/TicketOverlayResults.tsx`

```typescript
interface TicketOverlayResultsProps {
  project: Project
  expanded: boolean
  onToggleExpanded: () => void
  onConfetti?: () => void
  onDataRefresh?: () => Promise<void> // ← Prop optionnelle
}

// Utilisation dans toutes les fonctions de mise à jour
const handleConclusiveChange = async (value: string) => {
  // ... mise à jour Airtable
  if (onDataRefresh) {
    await onDataRefresh() // ← Rafraîchissement invisible
  }
}
```

## Fonctions de Mise à Jour Supportées

### 1. Changement de Statut
- **Fonction** : `handleMarkAsDone`
- **Champ Airtable** : `Status`
- **Valeur** : `"Done"`
- **Comportement** : Ferme l'overlay après mise à jour

### 2. Dropdown Conclusive
- **Fonction** : `handleConclusiveChange`
- **Champ Airtable** : `Conclusive vs Non Conclusive`
- **Valeurs** : `"Conclusive"`, `"Non Conclusive"`
- **Comportement** : Déclenche confettis si Win + Conclusive

### 3. Dropdown Win/Loss
- **Fonction** : `handleWinLossChange`
- **Champ Airtable** : `Win vs Loss`
- **Valeurs** : `"Win"`, `"Loss"`
- **Comportement** : Déclenche confettis si Win + Conclusive

### 4. Champ Learnings
- **Fonction** : `handleLearningsChange`
- **Champ Airtable** : `Learnings`
- **Type** : Texte libre

### 5. Champ Next Steps
- **Fonction** : `handleNextStepsChange`
- **Champ Airtable** : `Next Steps`
- **Type** : Texte libre

### 6. Met Threshold Checkboxes
- **Fonction** : `handleToggleThreshold`
- **Champs Airtable** : 
  - `Met Threshold - Success Criteria #1`
  - `Met Threshold - Success Criteria #2`
  - `Met Threshold - Success Criteria #3`
- **Type** : Boolean

## Avantages du Système

### ✅ Expérience Utilisateur
- **Navigation continue** : L'utilisateur peut continuer à utiliser la timeline
- **Aucune interruption** : Pas de spinner ou de flash
- **Feedback immédiat** : Les changements sont visibles instantanément

### ✅ Performance
- **Rafraîchissement ciblé** : Seules les données nécessaires sont rechargées
- **Gestion d'erreurs** : Les erreurs sont capturées sans perturber l'interface
- **Code optimisé** : Réutilisation de la logique via `processData`

### ✅ Maintenabilité
- **Architecture claire** : Séparation des responsabilités
- **Fonctions réutilisables** : `refreshDataSilent` peut être utilisée partout
- **Documentation complète** : Ce guide et les commentaires dans le code

## Utilisation pour de Nouvelles Fonctionnalités

### Ajouter une nouvelle fonction de mise à jour

1. **Dans TicketOverlayResults** :
```typescript
const handleNewFieldChange = async (value: string) => {
  setNewField(value)
  setNewFieldLoading(true)
  try {
    await updateExperimentationFields(project.id, {
      'New Field': value
    })
    toast.success('Field updated')
    
    // ← Ajouter cette ligne pour la synchronisation
    if (onDataRefresh) {
      await onDataRefresh()
    }
  } catch (error) {
    console.error('Error updating field:', error)
    toast.error('Error updating field')
  } finally {
    setNewFieldLoading(false)
  }
}
```

2. **Passer la prop** :
```typescript
// Dans TicketOverlay/index.tsx
<TicketOverlayResults 
  project={currentProject}
  expanded={resultsExpanded}
  onToggleExpanded={() => setResultsExpanded(!resultsExpanded)}
  onConfetti={handleConfetti}
  onDataRefresh={onDataRefresh} // ← S'assurer que cette prop est passée
/>
```

### Ajouter un nouveau composant avec synchronisation

1. **Créer l'interface** :
```typescript
interface NewComponentProps {
  project: Project
  onDataRefresh?: () => Promise<void>
}
```

2. **Utiliser dans les fonctions de mise à jour** :
```typescript
const handleUpdate = async () => {
  // ... logique de mise à jour
  if (onDataRefresh) {
    await onDataRefresh()
  }
}
```

3. **Passer la prop depuis TimelineView** :
```typescript
<NewComponent 
  project={selectedProject}
  onDataRefresh={refreshDataSilent}
/>
```

## Dépannage

### Problème : Les changements ne se reflètent pas
**Solution** : Vérifier que `onDataRefresh` est appelé après la mise à jour Airtable

### Problème : Spinner s'affiche quand il ne devrait pas
**Solution** : S'assurer d'utiliser `refreshDataSilent` et non `refreshData`

### Problème : Erreur dans la console
**Solution** : Vérifier que la fonction `onDataRefresh` est bien passée en prop

## Tests

### Test de synchronisation
1. Ouvrir un projet dans le TicketOverlay
2. Modifier un champ (ex: Conclusive → "Conclusive")
3. Vérifier que le changement est immédiatement visible dans la timeline
4. Vérifier qu'aucun spinner n'apparaît

### Test de navigation continue
1. Commencer à naviguer dans la timeline
2. Modifier un statut dans l'overlay
3. Vérifier que la navigation continue sans interruption
4. Vérifier que les données se mettent à jour

## Notes Techniques

- **Statuts valides pour la timeline** : `["Refinement", "Design & Development", "Setup", "Running", "Ready for Analysis", "Analysing", "Open"]`
- **Statut "Done"** : N'apparaît pas dans la timeline (filtrage automatique)
- **Gestion d'erreurs** : Les erreurs sont loggées mais n'interrompent pas l'interface
- **Performance** : Les données sont mises en cache et rechargées uniquement quand nécessaire 