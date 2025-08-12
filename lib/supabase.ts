import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour l'upload de fichiers
export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  fileName?: string
}

export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
}

// Configuration du bucket d'analyse
const ANALYSIS_BUCKET = 'analysis-files'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

// Vérifier si l'utilisateur a les permissions d'upload
export async function checkUploadPermissions(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No user found')
      return false
    }
    
    // Vérifier le rôle dans la table organization_members
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
    
    if (memberError) {
      console.error('Error fetching member role:', memberError)
      return false
    }
    
    if (!memberData || memberData.length === 0) {
      return false
    }
    
    const userRole = memberData[0]?.role
    return ['member', 'admin', 'super_admin'].includes(userRole)
  } catch (error) {
    console.error('Error checking upload permissions:', error)
    return false
  }
}

// Uploader un fichier d'analyse
export async function uploadAnalysisFile(
  file: File, 
  projectName: string
): Promise<UploadResult> {
  try {
    // Vérifier les permissions
    const hasPermission = await checkUploadPermissions()
    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to upload files'
      }
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File is too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }
    }

    // Vérifier le type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'File type not allowed. Accepted formats: PDF, Word, Excel, TXT'
      }
    }

    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_')
    const fileExtension = file.name.split('.').pop()
    const fileName = `${sanitizedProjectName}_analysis_${timestamp}.${fileExtension}`

    // Upload vers Supabase Storage
          const { error } = await supabase.storage
      .from(ANALYSIS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: `Upload error: ${error.message}`
      }
    }

    // Générer l'URL publique
    const { data: urlData } = supabase.storage
      .from(ANALYSIS_BUCKET)
      .getPublicUrl(fileName)

    return {
      success: true,
      url: urlData.publicUrl,
      fileName: fileName
    }

  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Supprimer un fichier d'analyse
export async function deleteAnalysisFile(fileName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const hasPermission = await checkUploadPermissions()
    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to delete files'
      }
    }

    const { error } = await supabase.storage
      .from(ANALYSIS_BUCKET)
      .remove([fileName])

    if (error) {
      return {
        success: false,
        error: `Delete error: ${error.message}`
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Obtenir l'URL publique d'un fichier
export function getAnalysisFileUrl(fileName: string): string {
  const { data } = supabase.storage
    .from(ANALYSIS_BUCKET)
    .getPublicUrl(fileName)
  
  return data.publicUrl
} 