import { createClient } from './client'

const BUCKET_NAME = 'temp_1'

export interface StorageFile {
  name: string
  id: string
  created_at: string
  updated_at: string
  last_accessed_at: string
  metadata: {
    size: number
    mimetype: string
    cacheControl: string
    lastModified: string
    contentLength: number
    httpStatusCode: number
  }
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export class StorageManager {
  private supabase = createClient()

  // 获取文件列表
  async listFiles(folderPath: string = ''): Promise<StorageFile[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) throw error

      return (data || []).filter(item => item.name).map(item => {
        const metadata = item.metadata as Record<string, any> || {}
        return {
          name: item.name,
          id: item.id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          last_accessed_at: item.last_accessed_at,
          metadata: {
            size: metadata.size || 0,
            mimetype: metadata.mimetype || 'application/octet-stream',
            cacheControl: metadata.cacheControl || '',
            lastModified: metadata.lastModified || '',
            contentLength: metadata.contentLength || 0,
            httpStatusCode: metadata.httpStatusCode || 200
          }
        }
      })
    } catch (error) {
      console.error('获取文件列表失败:', error)
      throw error
    }
  }

  // 上传文件
  async uploadFile(
    file: File,
    folderPath: string = '',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ path: string }> {
    try {
      // 检查用户认证状态
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError) {
        console.error('认证检查失败:', authError)
        throw new Error(`认证失败: ${authError.message}`)
      }
      
      if (!user) {
        throw new Error('用户未登录，请先登录')
      }

      console.log('上传文件信息:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        user: user.email,
        folderPath
      })

      const filePath = folderPath ? `${folderPath}/${file.name}` : file.name
      
      console.log('开始上传到路径:', filePath)
      
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Supabase 上传错误详情:', {
          message: error.message,
          // 注意：StorageError 类型可能没有这些属性
          // details: error.details,
          // hint: error.hint,
          // code: error.code
        })
        
        // 提供更友好的错误信息
        let friendlyMessage = error.message
        if (error.message.includes('row-level security')) {
          friendlyMessage = '权限错误: 行级安全策略阻止了上传。请检查存储桶的 RLS 策略设置。'
        } else if (error.message.includes('bucket')) {
          friendlyMessage = `存储桶错误: 无法访问存储桶 "${BUCKET_NAME}"。请确认存储桶存在且为公开。`
        } else if (error.message.includes('permission')) {
          friendlyMessage = '权限不足: 当前用户没有上传文件的权限。请检查用户认证状态。'
        }
        
        throw new Error(friendlyMessage)
      }

      console.log('上传成功:', data)

      // 模拟进度更新（因为 Supabase 可能不支持 onUploadProgress）
      if (onProgress) {
        // 模拟进度更新
        let progress = 0
        const interval = setInterval(() => {
          progress += 10
          if (progress >= 100) {
            progress = 100
            clearInterval(interval)
          }
          onProgress({
            loaded: (file.size * progress) / 100,
            total: file.size,
            percentage: progress
          })
        }, 100)
      }

      return { path: data.path }
    } catch (error) {
      console.error('上传文件失败:', error)
      throw error
    }
  }

  // 下载文件
  async downloadFile(filePath: string): Promise<Blob> {
    try {
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .download(filePath)

      if (error) throw error

      return data
    } catch (error) {
      console.error('下载文件失败:', error)
      throw error
    }
  }

  // 删除文件
  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])

      if (error) throw error
    } catch (error) {
      console.error('删除文件失败:', error)
      throw error
    }
  }

  // 获取文件URL (公开访问)
  getFileUrl(filePath: string): string {
    const { data } = this.supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  // 创建文件夹 (通过上传空文件)
  async createFolder(folderName: string, parentPath: string = ''): Promise<void> {
    try {
      const folderPath = parentPath ? `${parentPath}/${folderName}/.keep` : `${folderName}/.keep`
      
      const { error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .upload(folderPath, new Blob([]), {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error
    } catch (error) {
      console.error('创建文件夹失败:', error)
      throw error
    }
  }

  // 获取存储桶信息
  async getBucketInfo() {
    try {
      // 获取文件列表来计算总大小
      const files = await this.listFiles()
      const totalSize = files.reduce((sum, file) => sum + file.metadata.size, 0)
      const fileCount = files.length

      return {
        bucketName: BUCKET_NAME,
        fileCount,
        totalSize,
        isPublic: true // temp_1 是公开的
      }
    } catch (error) {
      console.error('获取存储桶信息失败:', error)
      throw error
    }
  }

  // 批量删除文件
  async deleteFiles(filePaths: string[]): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths)

      if (error) throw error
    } catch (error) {
      console.error('批量删除文件失败:', error)
      throw error
    }
  }

  // 复制文件
  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      // 先下载文件
      const blob = await this.downloadFile(sourcePath)
      
      // 再上传到新位置
      const file = new File([blob], destinationPath.split('/').pop() || 'copy')
      await this.uploadFile(file, destinationPath.split('/').slice(0, -1).join('/'))
    } catch (error) {
      console.error('复制文件失败:', error)
      throw error
    }
  }

  // 重命名文件
  async renameFile(oldPath: string, newName: string): Promise<void> {
    try {
      // 获取文件所在目录
      const directory = oldPath.split('/').slice(0, -1).join('/')
      const newPath = directory ? `${directory}/${newName}` : newName
      
      // 复制到新位置
      await this.copyFile(oldPath, newPath)
      
      // 删除原文件
      await this.deleteFile(oldPath)
    } catch (error) {
      console.error('重命名文件失败:', error)
      throw error
    }
  }

  // 搜索文件
  async searchFiles(query: string, folderPath: string = ''): Promise<StorageFile[]> {
    try {
      const allFiles = await this.listFiles(folderPath)
      const searchTerm = query.toLowerCase()
      
      return allFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm) ||
        file.metadata.mimetype.toLowerCase().includes(searchTerm)
      )
    } catch (error) {
      console.error('搜索文件失败:', error)
      throw error
    }
  }

  // 获取文件信息
  async getFileInfo(filePath: string): Promise<StorageFile | null> {
    try {
      // 获取文件所在目录
      const directory = filePath.split('/').slice(0, -1).join('/')
      const fileName = filePath.split('/').pop() || ''
      
      const files = await this.listFiles(directory)
      return files.find(file => file.name === fileName) || null
    } catch (error) {
      console.error('获取文件信息失败:', error)
      throw error
    }
  }
}

// 工具函数
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(dateString: string): string {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleString('zh-CN')
}

export function getFileIcon(fileName: string, mimeType: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  
  if (mimeType.includes('image')) return '🖼️'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('video')) return '🎬'
  if (mimeType.includes('audio')) return '🎵'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦'
  
  switch (extension) {
    case 'txt': return '📄'
    case 'js': case 'ts': case 'jsx': case 'tsx': return '⚡'
    case 'html': case 'htm': return '🌐'
    case 'css': return '🎨'
    case 'json': return '📋'
    case 'md': return '📝'
    default: return '📎'
  }
}

export function getFileType(mimeType: string): string {
  if (mimeType.includes('image')) return '图片'
  if (mimeType.includes('pdf')) return 'PDF文档'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word文档'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel表格'
  if (mimeType.includes('video')) return '视频'
  if (mimeType.includes('audio')) return '音频'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '压缩文件'
  if (mimeType.includes('text')) return '文本文件'
  return '其他文件'
}

// 创建默认实例
export const storageManager = new StorageManager()