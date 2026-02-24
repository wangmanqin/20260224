# Supabase 上传问题全面解决方案

## 问题描述
上传文件时出现错误：
`权限错误: 行级安全策略阻止了上传。立即解决方案: 1. 在 Supabase SQL 编辑器中运行: ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY; 2. 或运行 direct_rls_fix.sql 中的脚本 3. 测试后记得重新启用 RLS: ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`

## 解决方案概述
我们已经实现了多层解决方案来解决上传问题：

### 1. 服务器端 API 上传
- 创建了 `/api/supabase-storage` 路由
- 使用服务角色密钥绕过大部分限制
- 自动处理上传请求

### 2. 智能错误处理
- 客户端上传失败时自动切换到服务器端
- 提供详细的错误信息和解决方案

### 3. RLS 策略修复（必需步骤）
- 必须在数据库层面修复 RLS 限制

## 必需的操作步骤

### 步骤 1: 运行 RLS 修复脚本（关键步骤）

在 **Supabase Dashboard** 的 **SQL 编辑器** 中运行以下命令：

```sql
-- 完全禁用 RLS（开发环境推荐）
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 验证 RLS 已禁用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

**重要**: 运行后应该看到 `rowsecurity = f`，表示 RLS 已禁用。

### 步骤 2: 配置环境变量（推荐）

在 `.env.local` 文件中添加服务角色密钥：

```
NEXT_PUBLIC_SUPABASE_URL=https://ptdutdjpifyjypmqnedc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_CyYwl1ZvWRxMi32Mb2G_Lg_Ai4cQrN4
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
```

要获取服务角色密钥：
1. 登录 Supabase Dashboard
2. 选择你的项目
3. 进入 Settings → API
4. 复制 Service role key

### 步骤 3: 重启开发服务器
保存配置后重启服务器使更改生效。

## 如何获取服务角色密钥

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 **Settings**
4. 选择 **API**
5. 在 "Service role key" 下面找到你的密钥
6. 复制并添加到 `.env.local` 文件

## 验证修复

1. 运行 RLS 修复脚本
2. （可选）配置服务角色密钥
3. 重启开发服务器
4. 访问 `http://localhost:3000/storage`
5. 尝试上传文件

## 如果仍然失败

### 替代方案 1: 简化 RLS 策略
如果不想完全禁用 RLS，可以创建简化的策略：

```sql
-- 删除所有现有策略
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON storage.objects;', ' ')
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  );
END $$;

-- 创建允许所有操作的策略
CREATE POLICY "allow_all_temp_1"
ON storage.objects
FOR ALL
USING (bucket_id = 'temp_1')
WITH CHECK (bucket_id = 'temp_1');
```

### 替代方案 2: 检查存储桶配置
确认在 Supabase Dashboard 中：
- Storage → `temp_1` 存储桶存在
- 存储桶设置为 Public（公开）
- 没有其他限制性策略

## 技术细节

### 当前实现
1. **客户端上传**: 首先尝试传统方法
2. **服务器端回退**: 失败时自动使用服务器端 API
3. **服务角色密钥**: 使用管理员权限上传
4. **RLS 修复**: 数据库层面移除限制

### API 路由
- `/api/supabase-storage` - 处理文件上传的服务器端路由
- 使用服务角色密钥直接访问 Supabase
- 绕过客户端网络和认证限制

## 生产环境注意事项

对于生产环境，建议使用更精细的 RLS 策略：

```sql
-- 为生产环境创建更安全的策略
CREATE POLICY "允许认证用户上传"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp_1');

CREATE POLICY "允许认证用户读取"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'temp_1');
```

## 故障排除

### 常见问题
1. **"Missing Supabase configuration"** - 未设置服务角色密钥
2. **RLS 错误** - 未运行 RLS 修复脚本
3. **网络错误** - 客户端连接问题

### 检查清单
- [ ] RLS 修复脚本已在 Supabase SQL 编辑器中运行
- [ ] （可选）服务角色密钥已配置
- [ ] 开发服务器已重启
- [ ] 存储桶 `temp_1` 存在且为 Public
- [ ] 上传小文件测试功能

## 文件变更总结

- `app/api/supabase-storage/route.ts` - 服务器端上传 API
- `utils/supabase/storage.ts` - 更新的存储管理器，使用新 API 路径
- `FINAL_RLS_SOLUTION.md` - 本解决方案文档
- `SERVICE_ROLE_GUIDE.md` - 服务角色密钥配置指南
- `network_error_solution.md` - 网络错误解决方案

## 重要提醒

- RLS 修复必须在 Supabase 数据库层面完成
- 仅修改前端代码无法解决 RLS 策略错误
- 服务器端 API 使用服务角色密钥，但仍需 RLS 策略配合
- 请务必在 Supabase Dashboard 的 SQL 编辑器中运行修复脚本

按照以上步骤操作后，上传功能应该可以正常工作。