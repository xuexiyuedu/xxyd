import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";

/**
 * 文件列表 API - 支持分页、筛选、排序
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const favoriteOnly = searchParams.get("favorite") === "true";

    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("files")
      .select("*, category:categories(*), tags:file_tags(tag:tags(*))", { count: "exact" })
      .eq("user_id", session.user.id);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (search) {
      query = query.or(`original_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (favoriteOnly) {
      query = query.eq("is_favorite", true);
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      files: data,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 创建文件记录
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { data, error } = await supabase
      .from("files")
      .insert({ ...body, user_id: session.user.id })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ file: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
