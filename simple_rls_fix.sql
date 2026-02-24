-- 简单的 RLS 修复脚本
-- 解决 "new row violates row-level security policy" 错误

-- ============================================
-- 方法 1: 完全禁用 RLS（最简单，仅用于测试）
-- ============================================

-- 禁用所有存储对象的 RLS
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 注意：测试完成后，可以重新启用 RLS
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 方法 2: 创建最简单的策略
-- ============================================

-- 先删除所有现有策略
DROP POLICY IF EXISTS "temp_1_select" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_insert" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_update" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_delete" ON storage.objects;

-- 创建最简单的策略（允许所有操作）
CREATE POLICY "temp_1_all_access"
ON storage.objects
FOR ALL
USING (bucket_id = 'temp_1')
WITH CHECK (bucket_id = 'temp_1');

-- ============================================
-- 方法 3: 分别创建策略（推荐）
-- ============================================

-- 删除所有现有策略
DROP POLICY IF EXISTS "temp_1_all_access" ON storage.objects;

-- 1. 允许所有人读取（公开存储桶）
CREATE POLICY "temp_1_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp_1');

-- 2. 允许任何人上传（简化测试）
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

-- ============================================
-- 方法 4: 使用认证用户策略
-- ============================================

-- 删除所有现有策略
DROP POLICY IF EXISTS "temp_1_read" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_write" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_update" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_delete" ON storage.objects;

-- 1. 允许所有人读取
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

-- ============================================
-- 验证和测试
-- ============================================

-- 查看当前策略
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

-- 测试插入（使用服务角色）
-- 注意：这需要服务角色密钥
/*
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES ('temp_1', 'test.txt', auth.uid(), '{"size": 123, "mimetype": "text/plain"}')
RETURNING *;
*/

-- ============================================
-- 故障排除
-- ============================================

-- 如果仍然失败，尝试：

-- 1. 检查存储桶是否存在且为公开
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'temp_1';

-- 2. 检查 RLS 是否启用
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. 重置所有策略（最彻底的方法）
-- 注意：这会删除所有存储桶的策略
/*
DO $$ 
BEGIN
  -- 删除 storage.objects 表的所有策略
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON storage.objects;', ' ')
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  );
END $$;

-- 然后重新创建策略
*/

-- ============================================
-- 最终建议
-- ============================================

/*
对于测试环境，建议使用：
1. 方法 1：完全禁用 RLS（最简单）
2. 方法 2：创建最简单的策略

对于生产环境，建议使用：
1. 方法 4：使用认证用户策略
2. 添加更严格的权限控制
3. 记录所有者信息
*/