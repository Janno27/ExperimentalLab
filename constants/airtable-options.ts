// Options exactes d'Airtable pour éviter les erreurs de validation

// Options pour le champ MDE (singleSelect)
export const MDE_OPTIONS = [
  '+ 1%',
  '+ 2%',
  '+ 3%',
  '+ 4%',
  '+ 5%',
  '+ 6%',
  '+ 7%',
  '+ 8%',
  '+ 9%',
  '+ 10%'
] as const;

// Options pour le champ Statistical Confidence (singleSelect)
export const STATISTICAL_CONFIDENCE_OPTIONS = [
  '85%',
  '90%',
  '95%',
  '99%'
] as const;

// Options pour le champ Traffic allocation (singleSelect)
export const TRAFFIC_ALLOCATION_OPTIONS = [
  '100%',
  '90%',
  '80%',
  '70%',
  '60%',
  '50%',
  '40%',
  '30%',
  '20%',
  '10%'
] as const;

// Options pour le champ Devices (singleSelect)
export const DEVICES_OPTIONS = [
  'Desktop',
  'Mobile',
  'All Devices',
  'Tablet'
] as const;

// Options pour le champ Type (singleSelect)
export const TYPE_OPTIONS = [
  'A/B-Test',
  'Personalization',
  'Fix/Patch'
] as const;

// Options pour le champ Role (singleSelect)
export const ROLE_OPTIONS = [
  'Checkout Core',
  'Country Team',
  'CRM',
  'CRO',
  'E-Commerce',
  'Product Success',
  'Shopping Journey',
  'Webshop Foundations'
] as const;

// Options pour le champ Tool (singleSelect)
export const TOOL_OPTIONS = [
  'A/B Tasty',
  'Trbo',
  'Insider',
  'Paid Search'
] as const;

// Options pour le champ Scope (singleSelect)
export const SCOPE_OPTIONS = [
  'Market Specificity',
  'Global Initiative'
] as const;

// Options pour le champ Status (singleSelect)
export const STATUS_OPTIONS = [
  'To be prioritized',
  'Denied',
  'Open',
  'Refinement',
  'Design & Development',
  'Setup',
  'Running',
  'Ready for Analysis',
  'Analysing',
  'Done'
] as const;

// Types pour la validation
export type MDEValue = typeof MDE_OPTIONS[number];
export type StatisticalConfidenceValue = typeof STATISTICAL_CONFIDENCE_OPTIONS[number];
export type TrafficAllocationValue = typeof TRAFFIC_ALLOCATION_OPTIONS[number];
export type DevicesValue = typeof DEVICES_OPTIONS[number];
export type TypeValue = typeof TYPE_OPTIONS[number];
export type RoleValue = typeof ROLE_OPTIONS[number];
export type ToolValue = typeof TOOL_OPTIONS[number];
export type ScopeValue = typeof SCOPE_OPTIONS[number];
export type StatusValue = typeof STATUS_OPTIONS[number]; 