// Réexport des options d'Airtable pour maintenir la compatibilité
export { 
  ROLE_OPTIONS, 
  TOOL_OPTIONS, 
  SCOPE_OPTIONS 
} from './airtable-options';

// Options pour le champ Test Type (Select Unique)
export const TEST_TYPE_OPTIONS = [
  'A/B-Test',
  'Personalization',
  'Fix/Patch'
] 