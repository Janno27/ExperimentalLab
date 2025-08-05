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
    'Refinement': {
      bg: 'bg-gray-500',
      hover: 'hover:bg-gray-600',
      light: 'bg-gray-100',
      text: 'text-gray-800'
    },
    'Design & Development': {
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-600', 
      light: 'bg-blue-100',
      text: 'text-blue-800'
    },
    'Setup': {
      bg: 'bg-yellow-500',
      hover: 'hover:bg-yellow-600',
      light: 'bg-yellow-100', 
      text: 'text-yellow-800'
    },
    'Running': {
      bg: 'bg-violet-500',
      hover: 'hover:bg-violet-600',
      light: 'bg-violet-100',
      text: 'text-violet-800'
    },
    'Ready for Analysis': {
      bg: 'bg-orange-500',
      hover: 'hover:bg-orange-600',
      light: 'bg-orange-100',
      text: 'text-orange-800'
    },
    'Analysing': {
      bg: 'bg-purple-500',
      hover: 'hover:bg-purple-600',
      light: 'bg-purple-100',
      text: 'text-purple-800'
    },
    'Open': {
      bg: 'bg-green-500',
      hover: 'hover:bg-green-600',
      light: 'bg-green-100',
      text: 'text-green-800'
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
  