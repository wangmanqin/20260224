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

  // 上传文件 - 使用服务器端 API（推荐用于解决网络问题）
  async uploadFileViaAPI(
    file: File,
    folderPath: string = '',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ path: string }> {
    try {
      console.log('使用服务器端 API 上传文件:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        folderPath
      });

      // 创建表单数据
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderPath', folderPath);

      // 通过服务器端 API 上传
      const response = await fetch('/api/storage', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed via server API');
      }

      const result = await response.json();
      
      console.log('服务器端上传成功:', result);

      // 模拟进度更新
      if (onProgress) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
          }
          onProgress({
            loaded: (file.size * progress) / 100,
            total: file.size,
            percentage: progress
          });
        }, 100);
      }

      return { path: result.data.path };
    } catch (error) {
      console.error('服务器端上传失败:', error);
      throw error;
    }
  }

  // 上传文件 - 使用客户端（保留原有方法用于对比）
  async uploadFile(
    file: File,
    folderPath: string = '',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ path: string }> {
    try {
      console.log('⚠️ 尝试使用客户端上传（可能遇到网络问题）');
      
      console.log('上传文件信息:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        folderPath
      });

      const filePath = folderPath ? `${folderPath}/${file.name}` : file.name
      
      console.log('开始上传到路径:', filePath)
      console.log('存储桶:', BUCKET_NAME)
      
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('客户端上传失败，切换到服务器端 API:', error.message);
        
        // 如果客户端上传失败，尝试使用服务器端 API
        if (error.message.includes('fetch') || error.message.includes('network')) {
          console.log('检测到网络错误，使用服务器端 API 重试...');
          return await this.uploadFileViaAPI(file, folderPath, onProgress);
        }
        
        // 提供更友好的错误信息和解决方案
        let friendlyMessage = error.message;
        let solution = '';
        
        if (error.message.includes('row-level security')) {
          friendlyMessage = '权限错误: 行级安全策略阻止了上传。';
          solution = `
立即解决方案:
1. 在 Supabase SQL 编辑器中运行:
   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
   
2. 或运行 direct_rls_fix.sql 中的脚本
   
3. 测试后记得重新启用 RLS:
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
          `;
        } else if (error.message.includes('bucket')) {
          friendlyMessage = `存储桶错误: 无法访问存储桶 "${BUCKET_NAME}"。`;
          solution = `
解决方案:
1. 检查存储桶是否存在
2. 确认存储桶为 Public（公开）
3. 在 Supabase Dashboard 中创建存储桶
          `;
        } else if (error.message.includes('permission')) {
          friendlyMessage = '权限不足: 当前用户没有上传文件的权限。';
          solution = `
解决方案:
1. 检查用户认证状态
2. 确保用户已登录
3. 检查存储桶的 INSERT 策略
          `;
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          friendlyMessage = '网络错误: 无法连接到 Supabase。';
          solution = `
解决方案:
1. 检查网络连接
2. 确保 Supabase 项目在线
3. 使用服务器端 API 上传（已自动切换）
4. 检查 .env.local 配置
          `;
        }
        
        console.error('解决方案:', solution);
        throw new Error(friendlyMessage + '\n\n' + solution);
      }

      console.log('客户端上传成功:', data);

      // 模拟进度更新（因为 Supabase 可能不支持 onUploadProgress）
      if (onProgress) {
        // 模拟进度更新
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
          }
          onProgress({
            loaded: (file.size * progress) / 100,
            total: file.size,
            percentage: progress
          });
        }, 100);
      }

      return { path: data.path };
    } catch (error) {
      console.error('上传文件失败:', error);
      throw error;
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