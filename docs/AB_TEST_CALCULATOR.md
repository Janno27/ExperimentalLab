# AB Test Calculator - Documentation Technique

## 📊 Vue d'ensemble

Le calculateur AB Test est un module indépendant qui permet d'estimer la durée nécessaire pour un test A/B statistiquement significatif. Il utilise des méthodes statistiques robustes basées sur la théorie des tests d'hypothèses.

## 🎯 Objectif

Calculer la taille d'échantillon minimale et la durée estimée pour détecter un effet minimal donné (MDE) avec un niveau de confiance et une puissance statistique spécifiés.

## 📈 Types de données

### ABTestParams
```typescript
type ABTestParams = {
  audiencePerDay: number;   // Audience totale par jour
  conversionsPerDay: number; // Conversions par jour
  mde: number;              // Minimal Detectable Effect (en % relatif, ex: 0.05 = +5%)
  trafficExposed: number;   // Part du trafic envoyée au test (0-1)
  alpha?: number;           // Niveau de risque (défaut = 0.05 pour 95% confiance)
  power?: number;           // Puissance cible (défaut = 0.8 pour 80%)
};
```

### ABTestResult
```typescript
type ABTestResult = {
  baselineRate: number;     // p0 - Taux de conversion de base
  delta: number;            // Différence absolue détectable
  samplePerGroup: number;   // n par groupe
  totalSample: number;      // n total (2 groupes)
  durationDays: number;     // Durée estimée en jours (avec min 7)
};
```

## 🔢 Formules et calculs

### 1. Taux de conversion de base
```
p0 = conversionsPerDay / audiencePerDay
```

### 2. Différence absolue détectable
```
delta = p0 * mde
```
Où `mde` est exprimé en proportion relative (ex: 0.05 pour +5%)

### 3. Taux de conversion du groupe de traitement
```
p1 = p0 (groupe contrôle)
p2 = p0 + delta (groupe traitement)
```

### 4. Taux de conversion moyen
```
pBar = (p1 + p2) / 2
```

### 5. Z-scores critiques
```typescript
zAlpha = zQuantile(1 - alpha / 2)  // Pour le niveau de confiance
zBeta = zQuantile(power)           // Pour la puissance
```

### 6. Taille d'échantillon par groupe
```
numerator = zAlpha * √(2 * pBar * (1 - pBar)) + zBeta * √(p1 * (1 - p1) + p2 * (1 - p2))
nPerGroup = ceil((numerator²) / (delta²))
```

### 7. Nombre de visiteurs par jour par groupe
```
visitorsPerGroupPerDay = (audiencePerDay * trafficExposed) / 2
```

### 8. Durée estimée
```
durationDays = max(7, ceil(nPerGroup / visitorsPerGroupPerDay))
```

## 🎲 Fonction zQuantile

La fonction `zQuantile` implémente l'approximation d'Abramowitz-Stegun pour l'inverse de la fonction de répartition normale standard.

### Algorithme
1. **Cas p < 0.02425** : Utilise une approximation pour les queues de distribution
2. **Cas 0.02425 ≤ p ≤ 0.97575** : Utilise l'approximation principale
3. **Cas p > 0.97575** : Utilise la symétrie de la distribution normale

### Coefficients utilisés
- **a1-a6, b1-b5** : Coefficients pour l'approximation principale
- **c1-c6, d1-d4** : Coefficients pour les queues de distribution

## 📋 Exemple d'utilisation

```typescript
const params = {
  audiencePerDay: 1000,
  conversionsPerDay: 100,
  mde: 0.05,        // +5%
  trafficExposed: 0.5,  // 50% du trafic
  alpha: 0.05,      // 95% confiance
  power: 0.8        // 80% puissance
};

const result = estimateABTestDuration(params);
// Résultat attendu :
// {
//   baselineRate: 0.1,        // 10%
//   delta: 0.005,             // 0.5%
//   samplePerGroup: 15708,    // ~15k par groupe
//   totalSample: 31416,       // ~31k total
//   durationDays: 63          // ~2 mois
// }
```

## ⚠️ Contraintes et limitations

### Contraintes de durée
- **Durée minimale** : 7 jours (pour un cycle complet)
- **Calcul** : `max(7, ceil(nPerGroup / visitorsPerGroupPerDay))`

### Validation des paramètres
- **Audience** : Doit être > 0
- **Conversions** : Doit être > 0 et ≤ audience
- **MDE** : Doit être > 0 et < 1
- **Traffic exposé** : Doit être entre 0 et 1
- **Alpha** : Doit être entre 0 et 1
- **Power** : Doit être entre 0 et 1

## 🔍 Interprétation des résultats

### baselineRate
Le taux de conversion actuel du site/app. C'est la référence pour mesurer l'amélioration.

### delta
La différence absolue minimale que le test peut détecter. Ex: 0.005 signifie que le test peut détecter une amélioration de 0.5 point de pourcentage.

### samplePerGroup
Nombre de visiteurs nécessaires dans chaque groupe (contrôle et traitement) pour atteindre la puissance statistique souhaitée.

### totalSample
Nombre total de visiteurs nécessaires pour l'ensemble du test (contrôle + traitement).

### durationDays
Durée estimée en jours pour collecter suffisamment de données, avec un minimum de 7 jours.

## 🎯 Cas d'usage typiques

### Test de conversion
- **MDE** : 5-10% (0.05-0.10)
- **Confiance** : 95% (alpha = 0.05)
- **Puissance** : 80% (power = 0.8)

### Test de revenus
- **MDE** : 2-5% (0.02-0.05)
- **Confiance** : 95% (alpha = 0.05)
- **Puissance** : 90% (power = 0.9)

### Test exploratoire
- **MDE** : 10-20% (0.10-0.20)
- **Confiance** : 90% (alpha = 0.10)
- **Puissance** : 70% (power = 0.7)

## 🔧 Intégration dans l'interface

Le calculateur est intégré dans `StepTimeline.tsx` avec :
- **CTA "Run Estimation"** : Lance le calcul
- **Validation** : Vérifie que tous les champs requis sont remplis
- **Mise à jour automatique** : Met à jour la date de fin basée sur la durée calculée
- **Affichage des résultats** : Montre la durée estimée et les tailles d'échantillon

## 📚 Références

- Abramowitz, M. and Stegun, I. A. (1964) Handbook of Mathematical Functions
- Cohen, J. (1988) Statistical Power Analysis for the Behavioral Sciences
- van Belle, G. (2008) Statistical Rules of Thumb 