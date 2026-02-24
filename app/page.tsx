import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = createClient()

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-3xl font-semibold mb-8">Todos</h1>
        <ul className="w-full">
          {todos?.map((todo) => (
            <li key={todo.id} className="mb-4 p-4 border border-zinc-200 rounded-lg dark:border-zinc-800">
              {JSON.stringify(todo)}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
