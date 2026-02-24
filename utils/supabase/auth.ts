import { createClient } from './server'

export async function getCurrentUser() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('获取用户信息错误:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('认证检查错误:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }
  
  return { user }
}

export async function getSession() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('获取会话错误:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('会话检查错误:', error)
    return null
  }
}