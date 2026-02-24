'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  created_at: string
  updated_at: string
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTodo, setEditTodo] = useState({ title: '', description: '' })
  
  const supabase = createClient()

  useEffect(() => {
    fetchTodos()
    
    // 设置实时订阅
    const channel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos'
        },
        () => {
          fetchTodos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTodos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error('获取待办事项失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async () => {
    if (!newTodo.title.trim()) return

    try {
      const { error } = await supabase
        .from('todos')
        .insert([{
          title: newTodo.title,
          description: newTodo.description,
          completed: false
        }])

      if (error) throw error
      
      setNewTodo({ title: '', description: '' })
    } catch (error) {
      console.error('添加待办事项失败:', error)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('更新待办事项状态失败:', error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('删除待办事项失败:', error)
    }
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTodo({ title: todo.title, description: todo.description || '' })
  }

  const saveEdit = async () => {
    if (!editingId || !editTodo.title.trim()) return

    try {
      const { error } = await supabase
        .from('todos')
        .update({
          title: editTodo.title,
          description: editTodo.description
        })
        .eq('id', editingId)

      if (error) throw error
      
      setEditingId(null)
      setEditTodo({ title: '', description: '' })
    } catch (error) {
      console.error('更新待办事项失败:', error)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTodo({ title: '', description: '' })
  }

  return (
    <div className="space-y-8">
      {/* 添加待办事项表单 */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">添加新待办事项</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题 *
            </label>
            <input
              type="text"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入待办事项标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述（可选）
            </label>
            <textarea
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入待办事项描述"
              rows={2}
            />
          </div>
          <button
            onClick={addTodo}
            disabled={!newTodo.title.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            添加待办事项
          </button>
        </div>
      </div>

      {/* 待办事项列表 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">待办事项列表</h2>
          <span className="text-sm text-gray-500">
            共 {todos.length} 个待办事项
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-500">暂无待办事项，添加一个吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`p-4 border rounded-xl transition-all ${
                  todo.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {editingId === todo.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTodo.title}
                      onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="标题"
                    />
                    <textarea
                      value={editTodo.description}
                      onChange={(e) => setEditTodo({ ...editTodo, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="描述"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTodo(todo.id, todo.completed)}
                          className={`w-5 h-5 rounded-full border flex-shrink-0 ${
                            todo.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {todo.completed && (
                            <svg className="w-4 h-4 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div>
                          <h3 className={`font-medium ${
                            todo.completed
                              ? 'text-gray-500 line-through'
                              : 'text-gray-900'
                          }`}>
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-gray-600 mt-1">{todo.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            创建于: {new Date(todo.created_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEdit(todo)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl">
          <p className="text-sm text-blue-700">总计</p>
          <p className="text-2xl font-bold text-blue-900">{todos.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl">
          <p className="text-sm text-green-700">已完成</p>
          <p className="text-2xl font-bold text-green-900">
            {todos.filter(t => t.completed).length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl">
          <p className="text-sm text-yellow-700">未完成</p>
          <p className="text-2xl font-bold text-yellow-900">
            {todos.filter(t => !t.completed).length}
          </p>
        </div>
      </div>
    </div>
  )
}