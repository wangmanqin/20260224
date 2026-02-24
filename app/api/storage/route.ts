import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // 直接使用服务角色密钥创建 Supabase 客户端（绕过认证检查，因为服务器端 API 会验证）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' }, 
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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

    // 确定文件名 - 对于 Blob 类型，我们需要特殊处理
    const fileName = (file as File).name || `upload_${Date.now()}`;
    // 创建文件路径
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
      return NextResponse.json(
        { error: error.message }, 
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
      { error: (error as Error).message || 'Upload failed' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // 使用服务角色密钥获取文件列表
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' }, 
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 获取文件列表
    const { data, error } = await supabase.storage
      .from('temp_1')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('List error:', error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('List API error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to get files' }, 
      { status: 500 }
    );
  }
}