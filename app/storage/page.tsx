import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/utils/supabase/auth'
import StorageApp from './StorageApp'

export default async function StoragePage() {
  const user = await getCurrentUser()
  
  // 如果用户未登录，重定向到登录页面
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Supabase 云盘
              </h1>
              <p className="text-gray-600">
                使用 Supabase Storage 构建的个人文件管理应用 • Bucket: temp_1
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">个人云盘</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <StorageApp />
        </div>
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>使用 Next.js 和 Supabase Storage 构建 • Bucket: temp_1 (public) • 用户: {user.email}</p>
        </footer>
      </div>
    </div>
  )
}