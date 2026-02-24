'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  storageManager, 
  formatFileSize, 
  formatDate, 
  getFileIcon,
  getFileType,
  type StorageFile 
} from '@/utils/supabase/storage'

export default function StorageApp() {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentFolder, setCurrentFolder] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [bucketInfo, setBucketInfo] = useState<{
    bucketName: string
    fileCount: number
    totalSize: number
    isPublic: boolean
  } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchFiles()
  }, [currentFolder])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError('')
      
      const fileList = await storageManager.listFiles(currentFolder)
      setFiles(fileList)
      
      // 获取存储桶信息
      const info = await storageManager.getBucketInfo()
      setBucketInfo(info)
    } catch (error: any) {
      console.error('获取文件列表失败:', error)
      setError('获取文件列表失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    
    if (file) {
      setError('')
      setSuccess('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('请选择要上传的文件')
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')
      setUploadProgress(0)

      // 尝试使用客户端上传，如果失败则自动切换到服务器端 API
      await storageManager.uploadFile(
        selectedFile,
        currentFolder,
        (progress) => {
          setUploadProgress(Math.round(progress.percentage))
        }
      )
      
      setSuccess(`文件 "${selectedFile.name}" 上传成功！`)
      setSelectedFile(null)
      setUploadProgress(0)
      
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // 刷新文件列表
      fetchFiles()
    } catch (error: any) {
      console.error('上传文件失败:', error)
      setError('上传文件失败: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (fileName: string) => {
    try {
      setError('')
      setSuccess('')
      
      const filePath = currentFolder ? `${currentFolder}/${fileName}` : fileName
      const blob = await storageManager.downloadFile(filePath)
      
      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSuccess(`文件 "${fileName}" 下载开始`)
    } catch (error: any) {
      console.error('下载文件失败:', error)
      setError('下载文件失败: ' + error.message)
    }
  }

  const handleDelete = async (fileName: string) => {
    if (!confirm(`确定要删除文件 "${fileName}" 吗？`)) {
      return
    }

    try {
      setError('')
      setSuccess('')
      
      const filePath = currentFolder ? `${currentFolder}/${fileName}` : fileName
      await storageManager.deleteFile(filePath)
      
      setSuccess(`文件 "${fileName}" 删除成功`)
      fetchFiles()
    } catch (error: any) {
      console.error('删除文件失败:', error)
      setError('删除文件失败: ' + error.message)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('请输入文件夹名称')
      return
    }

    try {
      setCreatingFolder(true)
      setError('')
      setSuccess('')
      
      await storageManager.createFolder(newFolderName, currentFolder)
      
      setSuccess(`文件夹 "${newFolderName}" 创建成功`)
      setNewFolderName('')
      fetchFiles()
    } catch (error: any) {
      console.error('创建文件夹失败:', error)
      setError('创建文件夹失败: ' + error.message)
    } finally {
      setCreatingFolder(false)
    }
  }



  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* 错误和成功提示 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* 文件上传区域 */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">上传文件</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? `上传中... ${uploadProgress}%` : '上传文件'}
            </button>
          </div>
          
          {selectedFile && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                已选择文件: <span className="font-medium">{selectedFile.name}</span> • 
                大小: <span className="font-medium">{formatFileSize(selectedFile.size)}</span> • 
                类型: <span className="font-medium">{selectedFile.type || '未知'}</span>
              </p>
            </div>
          )}
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* 文件夹管理 */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">文件夹管理</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="输入新文件夹名称"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creatingFolder ? '创建中...' : '创建文件夹'}
            </button>
          </div>
          
          {currentFolder && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const parts = currentFolder.split('/')
                  parts.pop()
                  setCurrentFolder(parts.join('/'))
                }}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← 返回上级
              </button>
              <span className="text-gray-600">当前路径: {currentFolder || '根目录'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 文件列表 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">文件列表</h2>
            <p className="text-sm text-gray-500 mt-1">
              Bucket: {bucketInfo?.bucketName || 'temp_1'} • 共 {files.length} 个文件
              {bucketInfo && ` • 总大小: ${formatFileSize(bucketInfo.totalSize)}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchFiles}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {loading ? '刷新中...' : '刷新列表'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载文件列表中...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-600">暂无文件，上传一个开始使用吧！</p>
            <p className="text-sm text-gray-500 mt-2">Bucket: {bucketInfo?.bucketName || 'temp_1'} • 当前路径: {currentFolder || '根目录'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 border-b">文件</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 border-b">大小</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 border-b">修改时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 border-b">类型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 border-b">操作</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 border-b">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getFileIcon(file.name, file.metadata.mimetype)}</span>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">ID: {file.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatFileSize(file.metadata.size)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(file.updated_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {file.metadata.mimetype.split('/')[1] || file.metadata.mimetype}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(file.name)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          下载
                        </button>
                        <button
                          onClick={() => handleDelete(file.name)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 存储统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl">
          <p className="text-sm text-blue-700">文件总数</p>
          <p className="text-2xl font-bold text-blue-900">{files.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl">
          <p className="text-sm text-green-700">总大小</p>
          <p className="text-2xl font-bold text-green-900">
            {formatFileSize(bucketInfo?.totalSize || files.reduce((total, file) => total + file.metadata.size, 0))}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl">
          <p className="text-sm text-purple-700">存储桶</p>
          <p className="text-2xl font-bold text-purple-900">{bucketInfo?.bucketName || 'temp_1'}</p>
          <p className="text-xs text-purple-600 mt-1">
            {bucketInfo?.isPublic ? '公开访问' : '私有访问'}
          </p>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-yellow-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">使用说明</h3>
        <ul className="space-y-2 text-sm text-yellow-700">
          <li>• 上传文件：选择文件后点击"上传文件"按钮</li>
          <li>• 下载文件：点击文件对应的"下载"按钮</li>
          <li>• 删除文件：点击文件对应的"删除"按钮</li>
          <li>• 创建文件夹：输入文件夹名称后点击"创建文件夹"按钮</li>
          <li>• 刷新列表：点击"刷新列表"按钮更新文件列表</li>
          <li>• 存储桶：{bucketInfo?.bucketName || 'temp_1'} ({bucketInfo?.isPublic ? 'public - 公开访问' : 'private - 私有访问'})</li>
        </ul>
      </div>
    </div>
  )
}