# Supabase 待办事项应用

这是一个使用 Next.js 和 Supabase 构建的实时待办事项管理应用。

## 功能特性

- ✅ 添加、编辑、删除待办事项
- ✅ 标记待办事项为完成/未完成
- ✅ 实时数据同步（使用 Supabase 实时订阅）
- ✅ 响应式 UI 设计
- ✅ 待办事项统计信息
- ✅ 数据持久化存储

## 项目结构

```
app/
├── supabase/
│   ├── page.tsx          # /supabase 页面
│   └── TodoApp.tsx       # 待办事项应用组件
utils/
└── supabase/
    ├── server.ts         # 服务器端 Supabase 客户端
    └── client.ts         # 客户端 Supabase 客户端
```

## 数据库表结构

### todos 表

```sql
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 安装和设置

1. **安装依赖**：
   ```bash
   npm install @supabase/ssr @supabase/supabase-js
   ```

2. **配置环境变量**：
   在 `.env.local` 文件中添加：
   ```
   NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=你的Supabase发布密钥
   ```

3. **创建数据库表**：
   在 Supabase 控制台的 SQL 编辑器中运行 `todo_table_sql.sql` 文件中的 SQL 语句。

4. **运行开发服务器**：
   ```bash
   npm run dev
   ```

5. **访问应用**：
   打开浏览器访问 `http://localhost:3001/supabase`

## 使用方法

### 1. 添加待办事项
- 在 "添加新待办事项" 区域输入标题和描述
- 点击 "添加待办事项" 按钮

### 2. 管理待办事项
- **标记完成**：点击待办事项左侧的圆圈
- **编辑**：点击待办事项右侧的 "编辑" 按钮
- **删除**：点击待办事项右侧的 "删除" 按钮

### 3. 实时功能
- 应用使用 Supabase 实时订阅功能，当数据发生变化时会自动更新界面
- 多个用户同时使用时会看到实时更新的数据

## API 接口

应用使用 Supabase 客户端直接与数据库交互：

- **获取所有待办事项**：`supabase.from('todos').select('*')`
- **添加待办事项**：`supabase.from('todos').insert([{...}])`
- **更新待办事项**：`supabase.from('todos').update({...}).eq('id', id)`
- **删除待办事项**：`supabase.from('todos').delete().eq('id', id)`

## 安全设置

SQL 文件中包含了行级安全策略（RLS），允许所有用户：
- 读取所有待办事项
- 插入新待办事项
- 更新现有待办事项
- 删除待办事项

在生产环境中，建议根据实际需求调整安全策略。

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI 库**：React 19
- **数据库**：Supabase (PostgreSQL)
- **样式**：Tailwind CSS
- **实时功能**：Supabase 实时订阅
- **类型安全**：TypeScript

## 扩展功能建议

1. **用户认证**：添加 Supabase 认证功能，让每个用户只能看到自己的待办事项
2. **分类标签**：为待办事项添加分类标签功能
3. **截止日期**：添加截止日期和提醒功能
4. **搜索过滤**：添加搜索和过滤功能
5. **数据导出**：添加导出待办事项为 CSV 或 PDF 的功能
6. **移动应用**：使用 React Native 构建移动应用版本

## 故障排除

### 常见问题

1. **无法连接到 Supabase**：
   - 检查环境变量是否正确设置
   - 确认 Supabase 项目是否正常运行

2. **数据库表不存在**：
   - 运行 `todo_table_sql.sql` 文件中的 SQL 语句创建表

3. **实时订阅不工作**：
   - 检查 Supabase 项目是否启用了实时功能
   - 确认数据库表是否启了行级安全策略

4. **页面无法加载**：
   - 检查开发服务器是否正常运行
   - 查看浏览器控制台和终端错误信息

### 调试技巧

1. 在浏览器开发者工具中查看网络请求
2. 检查 Supabase 控制台的日志
3. 使用 `console.log` 调试数据流
4. 验证环境变量是否正确加载

## 部署

### Vercel 部署
1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署应用

### 其他部署选项
- Netlify
- Railway
- Supabase Edge Functions
- 自定义服务器部署

## 许可证

MIT