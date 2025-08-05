// types/timeline.ts

// Types de base sans validation Zod pour l'instant
export interface TimelineConfig {
  dayWidth: number
  rowHeight: number
  daysBuffer: {
    before: number
    after: number
  }
  virtualScrolling: {
    enabled: boolean
    overscan: number
  }
  accessibility: {
    announceStatusChanges: boolean
    highContrast: boolean
  }
}

export type ProjectStatus = 
  | 'Refinement'
  | 'Design & Development' 
  | 'Setup'
  | 'Running'
  | 'Ready for Analysis'
  | 'Analysing'
  | 'Open'

export interface Project {
  id: string
  country: string
  section: string
  title: string
  status: ProjectStatus
  startDate: Date
  endDate: Date
  progress: number
  priority?: 'low' | 'medium' | 'high'
  assignee?: string
  tags?: string[]
}

export interface TimelineData {
  projects: Project[]
  countries: string[]
  sections: string[]
  timeline: {
    months: Array<{
      name: string
      startDate: Date
      endDate: Date
    }>
    days: Date[]
    dateRange: {
      start: Date
      end: Date
    }
    todayIndex: number
  }
}

export interface TimelineState {
  expandedCountries: Set<string>
  selectedProjects?: Set<string>
  filters?: {
    status?: ProjectStatus[]
    countries?: string[]
    dateRange?: {
      start?: Date
      end?: Date
    }
  }
}

export interface ProjectRow {
  type: 'country' | 'section'
  country: string
  section?: string
  projects?: Project[]
  isExpanded?: boolean
  level: number
}

export interface TimelineMetrics {
  totalProjects: number
  projectsByStatus: Record<string, number>
  averageDuration: number
  onTimeProjects: number
  overdueProjects: number
}

export interface TimelineError {
  code: 'FETCH_ERROR' | 'VALIDATION_ERROR' | 'PARSE_ERROR'
  message: string
  details?: unknown
}

// Schemas Zod simplifiés pour la validation
export const TimelineConfigSchema = {
  parse: (config: any) => config as TimelineConfig
}

export const ProjectSchema = {
  parse: (project: any) => project as Project
} 