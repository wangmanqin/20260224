-- 直接可用的 RLS 修复脚本
-- 在 Supabase SQL 编辑器中直接运行此脚本

-- ============================================
-- 方法 1: 完全禁用 RLS（立即生效）
-- ============================================

-- 执行这一行即可完全禁用 RLS
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 验证 RLS 已禁用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- ============================================
-- 方法 2: 创建允许所有操作的策略
-- ============================================

-- 如果方法1不起作用，先重新启用RLS，然后创建策略
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 删除所有现有策略
DO $$ 
BEGIN
  -- 删除 storage.objects 表的所有策略
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

-- ============================================
-- 方法 3: 分别创建简单策略
-- ============================================

-- 如果上述方法都不行，尝试这个
-- 先删除所有策略
DROP POLICY IF EXISTS "allow_all_temp_1" ON storage.objects;

-- 创建最简单的策略
CREATE POLICY "temp_1_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp_1');

CREATE POLICY "temp_1_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'temp_1');

CREATE POLICY "temp_1_update_policy"
ON storage.objects FOR UPDATE
USING (bucket_id = 'temp_1')
WITH CHECK (bucket_id = 'temp_1');

CREATE POLICY "temp_1_delete_policy"
ON storage.objects FOR DELETE
USING (bucket_id = 'temp_1');

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

-- 检查存储桶配置
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'temp_1';

-- 如果没有 temp_1 存储桶，创建它
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp_1', 'temp_1', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- ============================================
-- 快速测试
-- ============================================

-- 测试是否可以插入（需要服务角色密钥）
-- 注意：这只是一个测试，实际使用应用上传
/*
INSERT INTO storage.objects (bucket_id, name, owner)
VALUES ('temp_1', 'test_file.txt', auth.uid())
RETURNING *;
*/

-- ============================================
-- 故障排除
-- ============================================

-- 如果仍然失败，检查以下内容：

-- 1. 检查存储桶是否存在且为公开
SELECT * FROM storage.buckets WHERE id = 'temp_1';

-- 2. 检查是否有其他表级限制
SELECT * FROM information_schema.table_privileges 
WHERE table_schema = 'storage' AND table_name = 'objects';

-- 3. 重置整个存储桶（极端情况）
/*
-- 删除存储桶（会删除所有文件）
DELETE FROM storage.objects WHERE bucket_id = 'temp_1';

-- 重新创建存储桶
DELETE FROM storage.buckets WHERE id = 'temp_1';
INSERT INTO storage.buckets (id, name, public) VALUES ('temp_1', 'temp_1', true);
*/

-- ============================================
-- 最终解决方案
-- ============================================

/*
如果所有方法都失败，可以：

1. 创建新的存储桶：
   - 在 Supabase Dashboard 中进入 Storage
   - 点击 "Create new bucket"
   - 名称: temp_1_new
   - 权限: Public
   - 然后更新应用代码中的存储桶名称

2. 使用服务角色密钥：
   - 在环境变量中使用 SUPABASE_SERVICE_ROLE_KEY
   - 服务角色密钥绕过所有 RLS 策略

3. 联系 Supabase 支持：
   - 提供错误详情
   - 请求帮助配置存储桶权限
*/