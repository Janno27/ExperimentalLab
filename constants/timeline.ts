// constants/timeline.ts
export const TIMELINE_CONSTANTS = {
    MIN_DAY_WIDTH: 20,
    MAX_DAY_WIDTH: 50,
    DEFAULT_DAY_WIDTH: 30,
    DEFAULT_ROW_HEIGHT: 48,
    SIDEBAR_WIDTH: 280,
    HEADER_HEIGHT: 80,
    SCROLL_DEBOUNCE_MS: 16,
    TOOLTIP_DELAY_MS: 300,
  } as const
  
  export const STATUS_COLORS = {
    'To be prioritized': {
      bg: 'bg-gray-200',
      hover: 'hover:bg-gray-300',
      light: 'bg-gray-50',
      text: 'text-gray-700'
    },
    'Denied': {
      bg: 'bg-red-400',
      hover: 'hover:bg-red-500',
      light: 'bg-red-50',
      text: 'text-white'
    },
    'Open': {
      bg: 'bg-gray-200',
      hover: 'hover:bg-gray-300',
      light: 'bg-gray-50',
      text: 'text-gray-700'
    },
    'Refinement': {
      bg: 'bg-blue-300',
      hover: 'hover:bg-blue-400',
      light: 'bg-blue-50',
      text: 'text-blue-800'
    },
    'Design & Development': {
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-600', 
      light: 'bg-blue-100',
      text: 'text-white'
    },
    'Setup': {
      bg: 'bg-blue-700',
      hover: 'hover:bg-blue-800',
      light: 'bg-blue-200',
      text: 'text-white'
    },
    'Running': {
      bg: 'bg-green-300',
      hover: 'hover:bg-green-400',
      light: 'bg-green-50',
      text: 'text-green-800'
    },
    'Ready for Analysis': {
      bg: 'bg-green-500',
      hover: 'hover:bg-green-600',
      light: 'bg-green-100',
      text: 'text-white'
    },
    'Analysing': {
      bg: 'bg-green-700',
      hover: 'hover:bg-green-800',
      light: 'bg-green-200',
      text: 'text-white'
    },
    'Done': {
      bg: 'bg-gray-600',
      hover: 'hover:bg-gray-700',
      light: 'bg-gray-100',
      text: 'text-white'
    }
  } as const
  
  export const ARIA_LABELS = {
    timeline: 'Project timeline and gantt chart',
    sidebar: 'Project hierarchy navigation',
    projectBar: 'Project bar for {title}',
    expandButton: 'Expand {country} projects',
    collapseButton: 'Collapse {country} projects',
    tooltip: 'Project details for {title}'
  } as const
  