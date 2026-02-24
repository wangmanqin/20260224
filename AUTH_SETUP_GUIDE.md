# Supabase 认证集成指南

## 已完成的功能

### 1. 用户认证系统
- ✅ 邮箱/密码登录和注册
- ✅ Google OAuth 登录
- ✅ GitHub OAuth 登录
- ✅ 邮箱验证（通过 Supabase 自动发送验证邮件）
- ✅ 用户会话管理

### 2. 页面保护
- ✅ `/supabase` 页面需要登录才能访问
- ✅ 未登录用户自动重定向到 `/login` 页面
- ✅ 登录后自动跳转到待办事项页面

### 3. 用户界面
- ✅ 美观的登录/注册页面
- ✅ 用户头像显示（基于邮箱首字母）
- ✅ 登出功能
- ✅ 响应式设计

### 4. 数据库安全
- ✅ 更新 `todos` 表添加 `user_id` 字段
- ✅ 行级安全策略（RLS）
- ✅ 用户只能访问自己的待办事项
- ✅ 用户只能操作自己的数据

## 设置步骤

### 1. 更新数据库表
在 Supabase 控制台的 SQL 编辑器中运行更新后的 `todo_table_sql.sql` 文件：

1. 添加 `user_id` 字段到 `todos` 表
2. 更新行级安全策略（RLS）
3. 用户只能访问和操作自己的数据

### 2. 配置 Supabase 认证
在 Supabase 控制台中：

1. 进入 **Authentication** → **Providers**
2. 启用 **Email** 提供商
3. 配置 **Google** 和 **GitHub** OAuth（可选）：
   - 添加重定向 URL: `http://localhost:3001/auth/callback`
   - 在生产环境中更新为您的域名

### 3. 环境变量
确保 `.env.local` 文件包含正确的 Supabase 凭据：
```
NEXT_PUBLIC_SUPABASE_URL=https://ptdutdjpifyjypmqnedc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_CyYwl1ZvWRxMi32Mb2G_Lg_Ai4cQrN4
```

## 使用流程

### 1. 新用户注册
1. 访问 `http://localhost:3001/login`
2. 点击"没有账户？立即注册"
3. 输入邮箱和密码
4. 点击"注册"
5. 检查邮箱并点击验证链接
6. 返回登录页面使用注册的账户登录

### 2. 用户登录
1. 访问 `http://localhost:3001/login`
2. 输入邮箱和密码
3. 点击"登录"
4. 成功登录后自动跳转到 `/supabase` 页面

### 3. 社交登录（可选）
1. 点击"Google"或"GitHub"按钮
2. 授权应用访问您的账户
3. 自动创建账户并登录

### 4. 访问受保护页面
- 未登录用户访问 `/supabase` 会自动重定向到 `/login`
- 已登录用户可以正常访问所有功能

### 5. 登出
1. 在 `/supabase` 页面点击"退出登录"按钮
2. 清除用户会话
3. 重定向到登录页面

## 技术实现

### 文件结构
```
app/
├── login/
│   └── page.tsx              # 登录/注册页面
├── auth/
│   └── callback/
│       └── route.ts          # OAuth 回调处理
├── supabase/
│   ├── page.tsx              # 受保护的待办事项页面
│   └── TodoApp.tsx           # 待办事项应用组件
utils/
└── supabase/
    ├── server.ts             # 服务器端客户端
    ├── client.ts             # 客户端客户端
    └── auth.ts               # 认证工具函数
```

### 关键组件

#### 1. 认证检查 (`utils/supabase/auth.ts`)
```typescript
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

#### 2. 页面保护 (`app/supabase/page.tsx`)
```typescript
export default async function SupabasePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // 渲染受保护的内容
}
```

#### 3. 登录页面 (`app/login/page.tsx`)
- 邮箱/密码登录和注册
- 社交登录按钮
- 表单验证和错误处理

#### 4. 数据库操作 (`app/supabase/TodoApp.tsx`)
- 所有数据库操作都包含 `user_id` 检查
- 用户只能访问自己的数据
- 实时数据同步

## 安全特性

### 1. 行级安全策略（RLS）
```sql
-- 用户只能读取自己的 todos
CREATE POLICY "用户只能读取自己的 todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);
```

### 2. 会话管理
- 使用 Supabase 内置的会话管理
- 安全的 Cookie 处理
- 自动会话刷新

### 3. 输入验证
- 邮箱格式验证
- 密码强度检查
- 表单防重复提交

## 故障排除

### 常见问题

#### 1. "Auth session missing!" 错误
- 检查 Supabase 项目配置
- 验证环境变量是否正确
- 清除浏览器 Cookie 并重试

#### 2. 社交登录不工作
- 检查 Supabase 中的 OAuth 配置
- 验证重定向 URL 是否正确
- 确保已启用相应的提供商

#### 3. 数据库权限错误
- 运行更新后的 SQL 文件
- 检查 RLS 策略是否正确应用
- 验证用户是否已登录

#### 4. 页面重定向循环
- 检查认证逻辑是否正确
- 验证会话状态
- 清除本地存储并重试

### 调试技巧

1. **浏览器开发者工具**
   - 检查网络请求
   - 查看控制台错误
   - 检查本地存储和 Cookie

2. **Supabase 控制台**
   - 查看认证日志
   - 检查数据库查询
   - 监控实时订阅

3. **应用日志**
   - 检查终端输出
   - 查看错误消息
   - 验证数据流

## 生产部署

### 1. 更新环境变量
- 使用生产环境的 Supabase 项目
- 更新重定向 URL 为生产域名
- 配置 HTTPS

### 2. 数据库迁移
- 在生产数据库中运行 SQL 迁移
- 测试数据隔离
- 验证安全策略

### 3. 监控和日志
- 设置错误监控
- 记录用户活动
- 监控性能指标

### 4. 安全加固
- 启用双因素认证（可选）
- 配置密码策略
- 设置会话超时

## 扩展功能建议

### 1. 用户资料管理
- 允许用户更新个人信息
- 上传头像功能
- 修改密码

### 2. 高级权限
- 管理员角色
- 团队协作功能
- 数据共享权限

### 3. 通知系统
- 邮箱通知
- 应用内通知
- 待办事项提醒

### 4. 数据分析
- 用户活动统计
- 待办事项完成率
- 使用趋势分析

## 支持

如有问题，请参考：
1. [Supabase 官方文档](https://supabase.com/docs)
2. [Next.js 认证指南](https://nextjs.org/docs/authentication)
3. 项目中的代码注释和文档