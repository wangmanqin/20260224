import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File | Blob;
    const folderPath = formData.get('folderPath') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      );
    }

    // 确保服务角色密钥存在
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { 
          error: 'Missing Supabase configuration. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.' 
        }, 
        { status: 500 }
      );
    }

    // 创建 Supabase 客户端（使用服务角色密钥，绕过 RLS 限制）
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 确定文件名
    const fileName = (file as File).name || `upload_${Date.now()}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // 上传文件
    const { data, error } = await supabase.storage
      .from('temp_1')  // 使用你的存储桶名称
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      
      // 检查错误类型并提供具体建议
      let errorMessage = error.message;
      if (error.message.includes('row-level security')) {
        errorMessage += '\n\n重要提示：需要在 Supabase SQL 编辑器中运行 "ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;"';
      }
      
      return NextResponse.json(
        { error: errorMessage }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { 
        error: (error as Error).message || 'Upload failed', 
        details: 'Please check the server logs for more information'
      }, 
      { status: 500 }
    );
  }
}