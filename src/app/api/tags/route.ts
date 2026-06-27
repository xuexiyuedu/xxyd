import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";

export async function GET() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", session.user.id)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tags: data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("tags")
    .insert({ ...body, user_id: session.user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tag: data });
}
