-- ========================================================
-- 🌱 心情与能量小打卡 - Supabase 数据表与安全策略初始化
-- 适用项目：https://github.com/li-xiao-kun/psychological-test
-- ========================================================

-- 1. 创建打卡记录数据表
create table if not exists public.quiz_records (
    id text primary key,
    name text not null,
    class_group text,
    total_score integer not null,
    battery_level integer default 100,
    status_tag text,
    headline text,
    is_alert boolean default false,
    secret_note text,
    submit_time text,
    answers jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. 启用行级安全（Row Level Security, RLS）
alter table public.quiz_records enable row level security;

-- 3. 允许匿名/访客提交答卷（任何人测试完成后写入数据）
drop policy if exists "允许匿名提交" on public.quiz_records;
create policy "允许匿名提交" on public.quiz_records
    for insert
    to anon, authenticated, service_role
    with check (true);

-- 4. 允许读取所有答卷（供管理后台汇聚统计与查看详情）
drop policy if exists "允许读取记录" on public.quiz_records;
create policy "允许读取记录" on public.quiz_records
    for select
    to anon, authenticated, service_role
    using (true);

-- 5. 允许管理后台删除指定答卷
drop policy if exists "允许删除记录" on public.quiz_records;
create policy "允许删除记录" on public.quiz_records
    for delete
    to anon, authenticated, service_role
    using (true);

-- ========================================================
-- 操作提示：
-- 1. 打开 Supabase 项目后台：https://supabase.com/dashboard/project/nshrxfsceujjvpkysbmm/sql/new
-- 2. 将以上 SQL 脚本全选复制并粘贴到 SQL Editor 中
-- 3. 点击右下角绿色的 "Run" 按钮即可完成建表！
-- ========================================================
