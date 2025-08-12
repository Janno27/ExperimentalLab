# Analysis File Management System

## Overview

This document describes the implementation of the analysis file upload/delete system in the TicketOverlay component. The system provides a seamless way to manage PDF analysis files with proper state management and user feedback.

## Architecture

### Data Flow
```
User Action → Supabase Storage → Airtable → Local State → UI Update
```

1. **File Selection**: User selects a file via browser file picker
2. **Supabase Upload**: File uploaded to Supabase Storage bucket
3. **Airtable Update**: File URL stored in Airtable "Results - Deepdive" field
4. **Local State Update**: UI immediately reflects changes
5. **Cache Invalidation**: Airtable cache cleared for data consistency

## Implementation Details

### 1. File Upload Process

#### Frontend State Management
```typescript
// State variables for upload management
const [resultsDeepdive, setResultsDeepdive] = useState(project.resultsDeepdive || null)
const [showUpload, setShowUpload] = useState(false)
const [isUploading, setIsUploading] = useState(false)
const fileInputRef = useRef<HTMLInputElement>(null)
```

#### Upload Flow
```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    try {
      // 1. Upload to Supabase Storage
      const result = await uploadAnalysisFile(file, project.title)
      
      if (result.success && result.url) {
        // 2. Update Airtable with file URL
        await updateAnalysisFile(project.id, result.url, result.fileName || file.name)
        
        // 3. Update local state immediately
        const newAnalysisFile = {
          url: result.url,
          name: result.fileName || file.name,
          type: file.type,
          size: file.size
        }
        setResultsDeepdive([newAnalysisFile])
        
        toast.success('Analysis uploaded successfully!')
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed')
    }
  }
}
```

### 2. File Deletion Process

#### State Management
```typescript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
const [isDeleting, setIsDeleting] = useState(false)
```

#### Deletion Flow
```typescript
const handleDeleteAnalysis = async () => {
  if (!canEdit) return
  
  setIsDeleting(true)
  try {
    // 1. Delete from Airtable
    await deleteAnalysisFile(project.id)
    
    // 2. Update local state immediately
    setResultsDeepdive(null)
    setShowDeleteConfirm(false)
    
    toast.success('Analysis deleted successfully!')
  } catch (error) {
    toast.error(error.message || 'Failed to delete analysis')
  } finally {
    setIsDeleting(false)
  }
}
```

### 3. State Synchronization Strategy

#### Key Principles
1. **Immediate Local Updates**: UI updates instantly after successful operations
2. **No Automatic Refresh**: Avoid overwriting local state with stale data
3. **Cache Invalidation**: Clear Airtable cache to ensure data consistency
4. **Error Handling**: Graceful error handling with user feedback

#### State Initialization
```typescript
React.useEffect(() => {
  // Handle different data formats from Airtable
  if (project.resultsDeepdive) {
    if (Array.isArray(project.resultsDeepdive) && project.resultsDeepdive.length > 0) {
      // Format: Airtable attachment array
      const analysisData = project.resultsDeepdive[0]
      setResultsDeepdive([{
        url: analysisData.url,
        name: analysisData.filename || analysisData.name || 'Analysis Document',
        type: analysisData.type || 'application/pdf',
        size: analysisData.size
      }])
    } else {
      // Format: Direct object
      setResultsDeepdive([project.resultsDeepdive])
    }
  } else {
    setResultsDeepdive(null)
  }
}, [project])
```

## Backend Services

### 1. Supabase Storage

#### Configuration
- **Bucket**: `analysis-files`
- **File Size Limit**: 10MB
- **Allowed Types**: PDF, Word, Excel, TXT
- **Access**: Public read, authenticated upload

#### Functions
```typescript
// Upload file to Supabase Storage
export async function uploadAnalysisFile(
  file: File, 
  projectName: string
): Promise<UploadResult>

// Delete file from Supabase Storage
export async function deleteAnalysisFile(
  fileName: string
): Promise<{ success: boolean; error?: string }>
```

### 2. Airtable Integration

#### Functions
```typescript
// Update analysis file URL in Airtable
export async function updateAnalysisFile(
  id: string, 
  fileUrl: string, 
  fileName: string
): Promise<any>

// Delete analysis file from Airtable
export async function deleteAnalysisFile(
  id: string
): Promise<any>
```

#### Field Format
```typescript
// Airtable "Results - Deepdive" field format
{
  fields: {
    'Results - Deepdive': [
      {
        url: "https://supabase-url.com/file.pdf",
        filename: "project_analysis_2024-01-01.pdf"
      }
    ]
  }
}
```

## UI Components

### 1. File Upload Interface
- **Direct File Picker**: No intermediate drag & drop step
- **Progress Indication**: Visual feedback during upload
- **Error Handling**: Clear error messages
- **Permission Checks**: Only authorized users can upload

### 2. File Display Interface
- **Preview Toggle**: Expandable PDF preview
- **Full Viewer**: Modal PDF viewer
- **File Information**: Name, size, type
- **Action Buttons**: Preview, Open Full, Delete

### 3. Delete Confirmation Modal
- **Confirmation Required**: Prevents accidental deletion
- **Loading States**: Visual feedback during deletion
- **Error Handling**: Graceful error display

## Best Practices

### 1. State Management
- **Single Source of Truth**: Local state reflects current file status
- **Immediate Updates**: UI updates instantly after successful operations
- **Error Recovery**: Clear error states and recovery options

### 2. User Experience
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Responsive Design**: Works on all screen sizes

### 3. Performance
- **Lazy Loading**: PDF previews load on demand
- **Cache Management**: Proper cache invalidation
- **File Size Optimization**: Client-side file validation

## Error Handling

### 1. Upload Errors
- **File Size**: Clear size limit messaging
- **File Type**: Supported format indication
- **Network**: Retry mechanisms and offline handling
- **Permissions**: Clear permission requirement messaging

### 2. Deletion Errors
- **Confirmation**: Prevents accidental deletion
- **Network**: Graceful error recovery
- **Permissions**: Clear access control messaging

## Security Considerations

### 1. File Upload Security
- **Type Validation**: Server-side MIME type checking
- **Size Limits**: Client and server-side validation
- **Access Control**: Role-based upload permissions
- **Virus Scanning**: Consider implementing file scanning

### 2. Access Control
- **User Permissions**: Role-based access (Member, Admin, Super_Admin)
- **File Access**: Public read access for analysis files
- **Audit Trail**: Consider logging file operations

## Future Enhancements

### 1. File Management
- **File Versioning**: Support for multiple file versions
- **File Replacement**: Replace existing files
- **Bulk Operations**: Upload/delete multiple files

### 2. User Experience
- **Drag & Drop**: Enhanced file selection interface
- **Progress Tracking**: Detailed upload progress
- **File Preview**: Thumbnail generation for various file types

### 3. Integration
- **External Storage**: Support for other storage providers
- **File Processing**: Automatic file processing and analysis
- **Notifications**: Email notifications for file operations

## Troubleshooting

### Common Issues
1. **File Not Appearing**: Check Airtable field format and cache
2. **Upload Fails**: Verify Supabase bucket configuration and permissions
3. **Delete Fails**: Check Airtable permissions and field access
4. **State Sync Issues**: Verify local state initialization logic

### Debug Steps
1. Check browser console for error messages
2. Verify Supabase bucket and RLS policies
3. Confirm Airtable field configuration
4. Test with different file types and sizes 