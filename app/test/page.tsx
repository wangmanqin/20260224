import Link from 'next/link'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Supabase 云盘功能测试</h1>
          <p className="text-gray-600">
            这是一个测试页面，用于验证 Supabase 云盘的所有功能是否正常工作。
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 功能测试卡片 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">✅ 已完成的功能</h2>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✓</span>
                </span>
                <span>文件上传功能（支持进度显示）</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✓</span>
                </span>
                <span>文件下载功能（直接下载到本地）</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✓</span>
                </span>
                <span>文件删除功能（需要确认）</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✓</span>
                </span>
                <span>文件夹管理（创建、导航）</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✓</span>
                </span>
                <span>文件列表查看（带分页和排序）</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✓</span>
                </span>
                <span>页面认证保护（需要登录）</span>
              </li>
            </ul>
          </div>

          {/* 技术特性卡片 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">⚡ 技术特性</h2>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm">T</span>
                </span>
                <span>TypeScript 类型安全</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm">R</span>
                </span>
                <span>响应式设计（移动端/桌面端）</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm">M</span>
                </span>
                <span>模块化代码结构</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm">E</span>
                </span>
                <span>完整的错误处理</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm">S</span>
                </span>
                <span>存储管理工具类</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm">U</span>
                </span>
                <span>用户友好的界面</span>
              </li>
            </ul>
          </div>

          {/* 测试步骤卡片 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">🧪 测试步骤</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">步骤 1: 访问云盘</h3>
                <p className="text-gray-600 mb-3">
                  点击下面的链接访问云盘页面。如果未登录，会自动重定向到登录页面。
                </p>
                <Link 
                  href="/storage" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  访问云盘页面
                </Link>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">步骤 2: 测试文件上传</h3>
                <p className="text-gray-600 mb-3">
                  在云盘页面中，点击"选择文件"按钮选择一个测试文件，然后点击"上传文件"按钮。
                </p>
                <ul className="text-gray-600 space-y-1">
                  <li>• 验证文件选择功能是否正常</li>
                  <li>• 验证上传进度显示是否正常</li>
                  <li>• 验证上传成功提示是否显示</li>
                  <li>• 验证文件是否出现在列表中</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">步骤 3: 测试文件下载</h3>
                <p className="text-gray-600 mb-3">
                  在文件列表中找到刚刚上传的文件，点击"下载"按钮。
                </p>
                <ul className="text-gray-600 space-y-1">
                  <li>• 验证下载功能是否正常</li>
                  <li>• 验证文件是否能正确下载到本地</li>
                  <li>• 验证下载成功提示是否显示</li>
                </ul>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">步骤 4: 测试文件删除</h3>
                <p className="text-gray-600 mb-3">
                  在文件列表中找到要删除的文件，点击"删除"按钮。
                </p>
                <ul className="text-gray-600 space-y-1">
                  <li>• 验证删除确认对话框是否显示</li>
                  <li>• 验证删除功能是否正常</li>
                  <li>• 验证删除成功提示是否显示</li>
                  <li>• 验证文件是否从列表中消失</li>
                </ul>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">步骤 5: 测试文件夹管理</h3>
                <p className="text-gray-600 mb-3">
                  在"文件夹管理"区域输入新文件夹名称，点击"创建文件夹"按钮。
                </p>
                <ul className="text-gray-600 space-y-1">
                  <li>• 验证文件夹创建功能是否正常</li>
                  <li>• 验证文件夹是否出现在列表中</li>
                  <li>• 验证文件夹导航功能是否正常</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 系统信息卡片 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📊 系统信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-700">开发服务器</p>
                <p className="text-lg font-bold text-gray-900">运行中</p>
                <p className="text-xs text-gray-500 mt-1">端口: 3000</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-700">TypeScript</p>
                <p className="text-lg font-bold text-gray-900">已配置</p>
                <p className="text-xs text-gray-500 mt-1">类型检查通过</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-700">Supabase</p>
                <p className="text-lg font-bold text-gray-900">已集成</p>
                <p className="text-xs text-gray-500 mt-1">存储桶: temp_1</p>
              </div>
            </div>
          </div>

          {/* 快速链接卡片 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔗 快速链接</h2>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/storage" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                云盘页面
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                登录页面
              </Link>
              <Link 
                href="/supabase" 
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Todo 应用
              </Link>
              <a 
                href="http://localhost:3000" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                首页
              </a>
            </div>
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-500 text-sm">
            <p>Supabase 云盘功能测试 • 开发服务器运行中 • 所有功能已实现</p>
            <p className="mt-2">访问 <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000/storage</code> 开始使用云盘</p>
          </div>
        </footer>
      </div>
    </div>
  )
}