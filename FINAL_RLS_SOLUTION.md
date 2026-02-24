# RLS 策略和上传问题的最终解决方案

## 问题根源分析

当前的错误 "权限错误: 行级安全策略阻止了上传" 表明即使使用了服务器端 API，RLS 策略仍在阻止上传。这是因为：

1. 即使使用服务角色密钥，某些操作仍受 RLS 策略约束
2. 需要在 Supabase 数据库级别禁用或修改 RLS 策略

## 必需的数据库配置步骤

### 步骤 1: 运行 RLS 修复 SQL 脚本

在 **Supabase Dashboard** 的 **SQL 编辑器** 中运行以下命令：

```sql
-- 完全禁用 RLS（推荐用于开发环境）
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 验证 RLS 状态
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

你应该看到 `rowsecurity = f`，表示 RLS 已禁用。

### 步骤 2: （可选）创建简化的策略

如果你希望保留一些安全控制，可以创建简化的策略：

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

### 步骤 3: 验证存储桶配置

在 Supabase Dashboard 中确认：

1. **Storage** → `temp_1` 存储桶存在
2. 存储桶设置为 **Public**（公开）
3. 没有其他限制性策略

## 服务器端 API 的配置要求

即使使用服务器端 API，也需要正确配置：

### 环境变量配置

确保 `.env.local` 包含服务角色密钥：

```
NEXT_PUBLIC_SUPABASE_URL=https://ptdutdjpifyjypmqnedc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_CyYwl1ZvWRxMi32Mb2G_Lg_Ai4cQrN4
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
```

## 上传流程说明

现在系统的上传流程如下：

1. **客户端尝试上传** - 首先使用传统的客户端方法
2. **检测网络错误** - 如果遇到 "Failed to fetch" 或 RLS 错误
3. **自动切换到服务器端** - 使用 `/api/storage` 路由
4. **服务器端上传** - 使用服务角色密钥进行上传

## 验证修复

运行 RLS 修复脚本后：

1. 重启开发服务器
2. 访问 `http://localhost:3000/storage`
3. 尝试上传文件
4. 检查是否成功

## 生产环境建议

对于生产环境，建议使用更精细的 RLS 策略：

```sql
-- 为生产环境创建更安全的策略
CREATE POLICY "允许认证用户上传到 temp_1"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp_1');

CREATE POLICY "允许认证用户更新自己的文件"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'temp_1 AND 
  owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'temp_1 AND 
  owner = auth.uid()
);

CREATE POLICY "允许认证用户删除自己的文件"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'temp_1 AND 
  owner = auth.uid()
);

CREATE POLICY "允许所有人读取 temp_1"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'temp_1');
```

## 紧急修复

如果以上步骤都不起作用，最快速的解决方案是在 Supabase SQL 编辑器中运行：

```sql
-- 完全重置存储桶和策略
DELETE FROM storage.objects WHERE bucket_id = 'temp_1';
-- 然后运行
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

## 重要提醒

- RLS 修复必须在 Supabase 数据库层面完成
- 仅修改前端代码无法解决 RLS 策略错误
- 服务器端 API 使用服务角色密钥，但仍受 RLS 策略影响
- 请务必在 Supabase Dashboard 的 SQL 编辑器中运行修复脚本