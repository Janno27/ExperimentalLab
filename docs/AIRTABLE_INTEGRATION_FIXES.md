# Corrections d'Intégration Airtable

## 🔍 **Problèmes identifiés et résolus**

### 1. **Champ "Name" calculé**
- **Problème** : Le champ "Name" est un champ calculé (formula) dans Airtable
- **Solution** : Suppression de l'envoi de ce champ, utilisation uniquement de "Short Name"

### 2. **Champ "Audience" numérique**
- **Problème** : Le champ "Audience" attend un nombre, pas une chaîne
- **Solution** : Conversion automatique avec `parseFloat(formData.audience)`

### 3. **Champ "Traffic allocation"**
- **Problème** : Nom incorrect dans le code ("Traffic Allocation" vs "Traffic allocation")
- **Solution** : Utilisation du nom exact d'Airtable : `'Traffic allocation'`

### 4. **Validation des valeurs de sélection**
- **Problème** : Envoi de valeurs non autorisées pour les champs singleSelect
- **Solution** : Création d'un système de validation avec fallback automatique

## ✅ **Structure de la table Airtable**

### **Champs principaux**
- `Short Name` : singleLineText (obligatoire)
- `Role` : singleSelect avec options prédéfinies
- `Owner` : multipleRecordLinks vers table Owner
- `Market` : multipleRecordLinks vers table Market
- `Scope` : singleSelect avec options prédéfinies
- `Tool:` : singleSelect avec options prédéfinies
- `Test Type` : multipleRecordLinks vers table Test Type

### **Champs de définition**
- `Type` : singleSelect avec options prédéfinies
- `Hypothesis` : multilineText
- `Context` : multilineText
- `Description` : multilineText

### **Champs de timeline**
- `Audience` : number
- `Conversion` : number
- `MDE` : singleSelect avec options prédéfinies
- `Traffic allocation` : singleSelect avec options prédéfinies
- `Statistical Confidence` : singleSelect avec options prédéfinies
- `Start Date` : date
- `Estimated Time` : number (calculé automatiquement)

### **Champs d'audience**
- `Devices` : singleSelect avec options prédéfinies
- `Page` : multipleRecordLinks vers table Page
- `Product` : multipleRecordLinks vers table Product
- `Main KPI` : multipleRecordLinks vers table KPI
- `KPI #2` : multipleRecordLinks vers table KPI
- `KPI #3` : multipleRecordLinks vers table KPI

### **Critères de succès**
- `Success Criteria #1` : singleLineText
- `Success Criteria #2` : singleLineText
- `Success Criteria #3` : singleLineText

## 🚀 **Fonctionnalités ajoutées**

### **Validation automatique**
- Vérification des valeurs selon les options autorisées
- Fallback automatique vers des valeurs valides
- Logs d'avertissement pour les valeurs non autorisées

### **Gestion des erreurs améliorée**
- Logs détaillés des erreurs Airtable
- Affichage des champs envoyés en cas d'erreur
- Messages d'erreur plus informatifs

### **Nettoyage des données**
- Suppression automatique des champs vides
- Conversion automatique des types de données
- Validation des références (linked records)

## 📋 **Options autorisées par champ**

### **Role**
- Checkout Core, Country Team, CRM, CRO, E-Commerce, Product Success, Shopping Journey, Webshop Foundations

### **Tool**
- A/B Tasty, Trbo, Insider, Paid Search

### **Scope**
- Market Specificity, Global Initiative

### **Type**
- A/B-Test, Personalization, Fix/Patch

### **MDE**
- + 1%, + 2%, + 3%, + 4%, + 5%, + 6%, + 7%, + 8%, + 9%, + 10%

### **Statistical Confidence**
- 85%, 90%, 95%, 99%

### **Traffic allocation**
- 100%, 90%, 80%, 70%, 60%, 50%, 40%, 30%, 20%, 10%

### **Devices**
- Desktop, Mobile, All Devices, Tablet

### **Status**
- To be prioritized, Denied, Open, Refinement, Design & Development, Setup, Running, Ready for Analysis, Analysing, Done

## 🔧 **Utilisation**

```typescript
import { createExperimentationRecord } from '@/lib/airtable'

// Créer un nouveau record
const result = await createExperimentationRecord(formData)
```

## 📝 **Notes importantes**

1. **Champs calculés** : Ne pas envoyer de valeurs pour les champs formula
2. **Linked records** : Toujours envoyer des tableaux d'IDs
3. **Validation** : Les valeurs non autorisées sont automatiquement remplacées
4. **Types de données** : Respecter les types attendus par Airtable (number, date, etc.)

## 🐛 **Dépannage**

Si vous rencontrez encore des erreurs :
1. Vérifiez les logs de la console pour les avertissements
2. Assurez-vous que les IDs des linked records sont valides
3. Vérifiez que les dates sont au format ISO
4. Consultez la réponse d'erreur d'Airtable pour plus de détails 