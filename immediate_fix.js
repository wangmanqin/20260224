// 立即修复 RLS 问题的脚本
// 在浏览器控制台中运行此脚本

async function fixRLSAndTest() {
  console.log('=== Supabase RLS 问题立即修复 ===');
  
  // 步骤 1: 显示修复 SQL
  console.log('\n📋 步骤 1: 运行以下 SQL 在 Supabase 控制台中');
  console.log(`
-- 复制以下代码到 Supabase SQL 编辑器并运行
-- 方法 1: 完全禁用 RLS（最简单）
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 验证 RLS 已禁用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 应该看到 rowsecurity = f
  `);
  
  // 步骤 2: 测试当前配置
  console.log('\n🔧 步骤 2: 测试当前配置');
  
  // 加载 Supabase
  if (!window.supabase) {
    console.log('正在加载 Supabase 客户端...');
    await loadSupabase();
  }
  
  const supabaseUrl = 'https://ptdutdjpifyjypmqnedc.supabase.co';
  const supabaseKey = 'sb_publishable_CyYwl1ZvWRxMi32Mb2G_Lg_Ai4cQrN4';
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  
  // 测试存储桶访问
  console.log('测试存储桶访问...');
  try {
    const { data, error } = await supabase.storage
      .from('temp_1')
      .list();
    
    if (error) {
      console.error('❌ 存储桶访问失败:', error.message);
      
      if (error.message.includes('row-level security')) {
        console.log('💡 确认: RLS 策略正在阻止访问');
        console.log('✅ 请运行上面的 SQL 脚本修复');
      } else if (error.message.includes('bucket')) {
        console.log('💡 问题: 存储桶可能不存在');
        console.log('✅ 请在 Supabase Dashboard 中创建存储桶:');
        console.log('   1. 进入 Storage');
        console.log('   2. 点击 "Create new bucket"');
        console.log('   3. 名称: temp_1');
        console.log('   4. 权限: Public');
      }
    } else {
      console.log('✅ 存储桶访问成功，文件数量:', data.length);
    }
  } catch (err) {
    console.error('测试失败:', err);
  }
  
  // 步骤 3: 测试上传
  console.log('\n🚀 步骤 3: 测试上传功能');
  console.log('要测试上传，请运行: testUpload()');
  
  // 导出测试函数
  window.testUpload = async function() {
    console.log('开始上传测试...');
    
    // 创建测试文件
    const testContent = `测试文件内容
生成时间: ${new Date().toISOString()}
用于验证 Supabase 上传功能`;
    
    const testFile = new File([testContent], `test_${Date.now()}.txt`, {
      type: 'text/plain'
    });
    
    console.log('测试文件:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    try {
      const { data, error } = await supabase.storage
        .from('temp_1')
        .upload(testFile.name, testFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('❌ 上传失败:', error.message);
        
        // 详细错误分析
        console.log('\n🔍 错误分析:');
        if (error.message.includes('row-level security')) {
          console.log('• 问题: RLS 策略阻止上传');
          console.log('• 解决方案: 运行上面的 SQL 脚本禁用 RLS');
        } else if (error.message.includes('bucket')) {
          console.log('• 问题: 存储桶访问问题');
          console.log('• 解决方案: 检查存储桶是否存在且为公开');
        } else if (error.message.includes('permission')) {
          console.log('• 问题: 权限不足');
          console.log('• 解决方案: 检查用户认证状态');
        } else {
          console.log('• 未知错误，请检查错误详情');
        }
      } else {
        console.log('✅ 上传成功!');
        console.log('上传详情:', data);
        
        // 清理测试文件
        console.log('清理测试文件...');
        const { error: deleteError } = await supabase.storage
          .from('temp_1')
          .remove([testFile.name]);
        
        if (deleteError) {
          console.log('⚠️ 清理失败（可忽略）:', deleteError.message);
        } else {
          console.log('✅ 测试文件已清理');
        }
      }
    } catch (err) {
      console.error('上传过程出错:', err);
    }
  };
  
  // 步骤 4: 替代方案
  console.log('\n🔄 步骤 4: 替代方案（如果上述方法失败）');
  console.log(`
方案 A: 创建新存储桶
  1. 在 Supabase Dashboard 中进入 Storage
  2. 点击 "Create new bucket"
  3. 名称: temp_1_new
  4. 权限: Public
  5. 然后更新应用代码中的存储桶名称

方案 B: 使用服务角色密钥
  在 .env.local 文件中添加:
  SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
  
  注意: 服务角色密钥有完全访问权限
  `);
  
  console.log('\n🎯 总结:');
  console.log('1. 运行 SQL 脚本禁用 RLS');
  console.log('2. 测试上传功能');
  console.log('3. 如果失败，尝试替代方案');
  console.log('4. 访问 http://localhost:3000/storage 验证');
}

// 加载 Supabase 库
async function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@supabase/supabase-js@2';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 运行修复
console.log('要运行修复脚本，请在控制台中输入:');
console.log('await fixRLSAndTest()');
console.log('然后运行: await testUpload() 测试上传');

// 导出函数
window.fixRLSAndTest = fixRLSAndTest;