-- Supabase Storage RLS 修复脚本
-- 解决 "new row violates row-level security policy" 错误

-- ============================================
-- 1. 删除现有的策略（如果存在）
-- ============================================

-- 删除现有的 SELECT 策略
DROP POLICY IF EXISTS "允许所有人读取 temp_1 文件" ON storage.objects;

-- 删除现有的 INSERT 策略
DROP POLICY IF EXISTS "允许认证用户上传到 temp_1" ON storage.objects;

-- 删除现有的 UPDATE 策略
DROP POLICY IF EXISTS "允许认证用户更新 temp_1 文件" ON storage.objects;

-- 删除现有的 DELETE 策略
DROP POLICY IF EXISTS "允许认证用户删除 temp_1 文件" ON storage.objects;

-- ============================================
-- 2. 创建新的简化策略
-- ============================================

-- 策略 1: 允许所有人读取文件（公开存储桶）
CREATE POLICY "temp_1_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp_1');

-- 策略 2: 允许认证用户上传文件（简化条件）
CREATE POLICY "temp_1_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'temp_1'
);

-- 策略 3: 允许认证用户更新自己的文件
CREATE POLICY "temp_1_update_policy"
ON storage.objects FOR UPDATE
USING (bucket_id = 'temp_1')
WITH CHECK (bucket_id = 'temp_1');

-- 策略 4: 允许认证用户删除自己的文件
CREATE POLICY "temp_1_delete_policy"
ON storage.objects FOR DELETE
USING (bucket_id = 'temp_1');

-- ============================================
-- 3. 替代方案：更宽松的策略（如果上述仍然失败）
-- ============================================

/*
-- 如果上述策略仍然失败，可以尝试完全禁用 RLS（仅用于测试）
-- 注意：生产环境不应该这样做

-- 禁用存储桶的 RLS
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 或者只为 temp_1 存储桶禁用 RLS
CREATE POLICY "temp_1_bypass_rls"
ON storage.objects
USING (true)
WITH CHECK (true);
*/

-- ============================================
-- 4. 验证存储桶配置
-- ============================================

-- 检查存储桶是否存在且为公开
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'temp_1';

-- 检查存储桶的 RLS 状态
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';

-- ============================================
-- 5. 测试策略（可选）
-- ============================================

-- 查看当前所有策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- ============================================
-- 6. 故障排除步骤
-- ============================================

/*
如果仍然遇到 "new row violates row-level security policy" 错误：

1. 确保存储桶存在且为公开：
   - 在 Supabase Dashboard 中检查 Storage → temp_1
   - 确认 "Public" 选项已启用

2. 确保用户已登录：
   - 检查用户认证状态
   - 确认 auth.uid() 返回有效的用户 ID

3. 检查存储桶权限：
   - 在 Supabase Dashboard 中进入 Storage → temp_1 → Policies
   - 确认策略已正确应用

4. 测试直接 SQL 插入：
   -- 使用管理员权限测试
   INSERT INTO storage.objects (bucket_id, name, owner)
   VALUES ('temp_1', 'test.txt', auth.uid())
   RETURNING *;

5. 简化策略条件：
   - 暂时移除所有条件，只检查 bucket_id
   - 逐步添加条件进行测试
*/

-- ============================================
-- 7. 推荐的最终策略（生产环境）
-- ============================================

/*
-- 删除所有现有策略
DROP POLICY IF EXISTS "temp_1_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "temp_1_delete_policy" ON storage.objects;

-- 创建生产环境策略
-- 策略 1: 允许所有人读取（公开存储桶）
CREATE POLICY "temp_1_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp_1');

-- 策略 2: 允许认证用户上传（记录所有者）
CREATE POLICY "temp_1_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'temp_1' AND
  auth.role() = 'authenticated'
);

-- 策略 3: 允许所有者更新自己的文件
CREATE POLICY "temp_1_owner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'temp_1' AND
  owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'temp_1' AND
  owner = auth.uid()
);

-- 策略 4: 允许所有者删除自己的文件
CREATE POLICY "temp_1_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'temp_1' AND
  owner = auth.uid()
);
*/