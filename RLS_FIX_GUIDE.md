# RLS（行级安全）策略修复指南

## 问题描述
上传文件时出现错误：`new row violates row-level security policy`

## 根本原因
Supabase Storage 使用 RLS（行级安全）来控制对存储对象的访问。当尝试上传文件时，插入操作被 RLS 策略阻止。

## 解决方案

### 方案 1：完全禁用 RLS（最简单，仅用于测试）

在 **Supabase SQL 编辑器** 中运行：

```sql
-- 完全禁用 RLS（测试环境）
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 测试完成后重新启用（如果需要）
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

**优点**：
- 最简单直接
- 立即解决问题
- 适合开发和测试环境

**缺点**：
- 不安全，不适合生产环境
- 所有用户都可以访问所有文件

### 方案 2：创建简化策略

在 **Supabase SQL 编辑器** 中运行：

```sql
-- 1. 删除所有现有策略
DROP POLICY IF EXISTS "temp_1_select" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_insert" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_update" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_delete" ON storage.objects;

-- 2. 创建最简单的策略
CREATE POLICY "temp_1_all_access"
ON storage.objects
FOR ALL
USING (bucket_id = 'temp_1')
WITH CHECK (bucket_id = 'temp_1');
```

### 方案 3：分别创建策略（推荐）

```sql
-- 删除所有现有策略
DROP POLICY IF EXISTS "temp_1_all_access" ON storage.objects;

-- 1. 允许所有人读取
CREATE POLICY "temp_1_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp_1');

-- 2. 允许任何人上传
CREATE POLICY "temp_1_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'temp_1');

-- 3. 允许任何人更新
CREATE POLICY "temp_1_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'temp_1')
WITH CHECK (bucket_id = 'temp_1');

-- 4. 允许任何人删除
CREATE POLICY "temp_1_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'temp_1');
```

### 方案 4：使用认证用户策略（生产环境）

```sql
-- 删除所有现有策略
DROP POLICY IF EXISTS "temp_1_read" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_write" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_update" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_delete" ON storage.objects;

-- 1. 允许所有人读取（公开存储桶）
CREATE POLICY "所有人可读"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp_1');

-- 2. 允许认证用户上传
CREATE POLICY "认证用户可上传"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'temp_1' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- 3. 允许认证用户更新
CREATE POLICY "认证用户可更新"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'temp_1' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role')
)
WITH CHECK (
  bucket_id = 'temp_1' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- 4. 允许认证用户删除
CREATE POLICY "认证用户可删除"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'temp_1' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);
```

## 操作步骤

### 步骤 1：访问 Supabase 控制台
1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**

### 步骤 2：运行修复脚本
1. 复制上述任一方案的 SQL 代码
2. 粘贴到 SQL 编辑器中
3. 点击 **Run** 执行

### 步骤 3：验证修复
1. 返回你的应用
2. 尝试上传文件
3. 检查是否仍然出现 RLS 错误

## 验证脚本

在 SQL 编辑器中运行以下脚本验证策略：

```sql
-- 查看当前所有策略
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- 检查存储桶配置
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'temp_1';

-- 检查 RLS 状态
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';
```

## 故障排除

### 问题 1：策略仍然不生效
**可能原因**：策略条件过于严格
**解决方案**：
1. 使用方案 1（完全禁用 RLS）测试
2. 如果方案 1 有效，说明是策略条件问题
3. 逐步简化策略条件

### 问题 2：存储桶不存在
**解决方案**：
1. 在 Supabase Dashboard 中创建存储桶
2. 进入 **Storage** → **Create new bucket**
3. 名称: `temp_1`
4. 权限: **Public**（公开）
5. 点击 **Create bucket**

### 问题 3：用户未认证
**解决方案**：
1. 确保用户已登录
2. 检查认证流程
3. 使用方案 2 或 3（允许匿名上传）

### 问题 4：其他错误
**检查步骤**：
1. 查看浏览器控制台错误详情
2. 检查网络请求响应
3. 验证环境变量配置
4. 确认 Supabase 项目状态

## 测试工具

### 1. 网页测试工具
打开 `test_upload.html` 文件进行测试：
- 测试用户认证状态
- 测试存储桶访问
- 测试文件上传

### 2. 控制台测试脚本
在浏览器控制台中运行 `quick_test.js`：
```javascript
// 加载测试脚本
const script = document.createElement('script');
script.src = '/quick_test.js';
document.head.appendChild(script);

// 运行测试
await testSupabaseUpload();
```

### 3. 应用内测试
访问 `http://localhost:3000/test` 进行完整功能测试。

## 预防措施

### 1. 开发环境
- 使用方案 1 或 2 简化策略
- 定期备份策略设置
- 记录策略变更

### 2. 生产环境
- 使用方案 4 认证用户策略
- 定期审查策略安全性
- 监控存储访问日志
- 设置适当的文件大小限制

### 3. 最佳实践
1. **最小权限原则**：只授予必要的权限
2. **分离环境**：开发、测试、生产使用不同策略
3. **定期审计**：检查策略是否符合安全要求
4. **文档记录**：记录所有策略变更和原因

## 相关文件

1. `simple_rls_fix.sql` - 简单的 RLS 修复脚本
2. `storage_fix_rls.sql` - 详细的 RLS 修复脚本
3. `test_upload.html` - 网页测试工具
4. `quick_test.js` - 控制台测试脚本
5. `STORAGE_GUIDE.md` - 完整的使用指南

## 支持资源

- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase 社区](https://github.com/orgs/supabase/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

## 更新日志

### 2024-02-24
- 创建完整的 RLS 修复指南
- 提供多种解决方案
- 添加测试工具和验证脚本
- 包含故障排除步骤

### 下一步
1. 运行修复脚本
2. 测试上传功能
3. 根据测试结果调整策略
4. 部署到生产环境（如果需要）