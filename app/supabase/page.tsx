import TodoApp from './TodoApp'

export default function SupabasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Supabase 待办事项应用
          </h1>
          <p className="text-gray-600">
            使用 Supabase 构建的实时待办事项管理应用
          </p>
        </header>
        
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <TodoApp />
        </div>
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>使用 Next.js 和 Supabase 构建 • 数据实时同步</p>
        </footer>
      </div>
    </div>
  )
}