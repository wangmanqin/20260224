// 快速测试 Supabase 上传功能
// 在浏览器控制台中运行此脚本

async function testSupabaseUpload() {
  console.log('=== Supabase 上传功能测试 ===');
  
  // 检查 Supabase 客户端
  if (!window.supabase) {
    console.error('错误: Supabase 客户端未加载');
    console.log('请先加载 Supabase 客户端:');
    console.log('https://unpkg.com/@supabase/supabase-js@2');
    return;
  }
  
  // 配置
  const supabaseUrl = 'https://ptdutdjpifyjypmqnedc.supabase.co';
  const supabaseKey = 'sb_publishable_CyYwl1ZvWRxMi32Mb2G_Lg_Ai4cQrN4';
  const bucketName = 'temp_1';
  
  // 创建客户端
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. 检查认证状态
    console.log('1. 检查用户认证状态...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('认证检查失败:', authError);
      return;
    }
    
    if (!user) {
      console.warn('用户未登录，尝试匿名上传...');
    } else {
      console.log('用户已登录:', user.email);
    }
    
    // 2. 检查存储桶
    console.log('2. 检查存储桶...');
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from(bucketName)
      .list();
    
    if (bucketError) {
      console.error('存储桶访问错误:', bucketError);
      
      if (bucketError.message.includes('bucket')) {
        console.log('建议: 检查存储桶是否存在且为公开');
        console.log('在 Supabase Dashboard 中: Storage → Create new bucket → 名称: temp_1 → Public');
      }
      return;
    }
    
    console.log('存储桶访问成功，文件数量:', bucketData.length);
    
    // 3. 创建测试文件
    console.log('3. 创建测试文件...');
    const testContent = '这是一个测试文件，用于验证 Supabase 上传功能。\n时间: ' + new Date().toISOString();
    const testFile = new File([testContent], `test_${Date.now()}.txt`, {
      type: 'text/plain'
    });
    
    console.log('测试文件:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    // 4. 尝试上传
    console.log('4. 尝试上传文件...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFile.name, testFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('上传失败:', uploadError);
      
      // 错误分析
      console.log('\n=== 错误分析 ===');
      
      if (uploadError.message.includes('row-level security')) {
        console.log('问题: RLS（行级安全）策略阻止上传');
        console.log('解决方案:');
        console.log('1. 在 Supabase SQL 编辑器中运行 RLS 修复脚本');
        console.log('2. 或完全禁用 RLS（仅测试）:');
        console.log('   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
      } else if (uploadError.message.includes('bucket')) {
        console.log('问题: 存储桶访问问题');
        console.log('解决方案:');
        console.log('1. 确认存储桶 "temp_1" 存在');
        console.log('2. 确认存储桶为 Public（公开）');
        console.log('3. 检查存储桶权限设置');
      } else if (uploadError.message.includes('permission')) {
        console.log('问题: 权限不足');
        console.log('解决方案:');
        console.log('1. 确保用户已登录');
        console.log('2. 检查存储桶的 INSERT 策略');
      } else {
        console.log('未知错误，请检查错误详情');
      }
      
      return;
    }
    
    // 5. 上传成功
    console.log('5. 上传成功!');
    console.log('上传详情:', uploadData);
    
    // 6. 验证文件存在
    console.log('6. 验证文件存在...');
    const { data: verifyData, error: verifyError } = await supabase.storage
      .from(bucketName)
      .list('', {
        search: testFile.name
      });
    
    if (verifyError) {
      console.error('验证失败:', verifyError);
    } else if (verifyData.length > 0) {
      console.log('验证成功: 文件已存在于存储桶中');
      console.log('文件信息:', verifyData[0]);
    } else {
      console.warn('警告: 文件未在列表中找到（可能需要刷新）');
    }
    
    // 7. 清理测试文件（可选）
    console.log('7. 清理测试文件...');
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testFile.name]);
    
    if (deleteError) {
      console.warn('清理失败（可忽略）:', deleteError);
    } else {
      console.log('清理成功: 测试文件已删除');
    }
    
    console.log('\n=== 测试完成 ===');
    console.log('所有步骤已完成，请根据结果进行相应调整');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 运行测试
console.log('要运行测试，请在控制台中输入: testSupabaseUpload()');
console.log('或直接调用: await testSupabaseUpload()');

// 导出函数
window.testSupabaseUpload = testSupabaseUpload;