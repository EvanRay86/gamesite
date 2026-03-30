-- ============================================================================
-- Daily Login Credits & Streaks
-- Tracks daily logins, awards 10 credits per day, and bonus credits for streaks.
-- ============================================================================

-- Daily login records
create table if not exists daily_logins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id) on delete cascade not null,
  login_date date not null default current_date,
  credits_awarded integer not null default 10,
  streak_day integer not null default 1,
  streak_bonus integer not null default 0,
  created_at timestamptz default now(),
  unique(user_id, login_date)
);

create index if not exists idx_daily_logins_user on daily_logins(user_id);
create index if not exists idx_daily_logins_user_date on daily_logins(user_id, login_date desc);

-- RLS
alter table daily_logins enable row level security;

create policy "Users read own daily logins"
  on daily_logins for select using (auth.uid() = user_id);

-- Claim daily login credits with streak tracking
-- Returns JSON: { claimed: bool, credits_awarded: int, streak_bonus: int, current_streak: int, total_days: int }
create or replace function claim_daily_login(p_user_id uuid)
returns jsonb as $$
declare
  v_today date := current_date;
  v_already_claimed boolean;
  v_last_login date;
  v_current_streak integer;
  v_base_credits integer := 10;
  v_streak_bonus integer := 0;
  v_total_credits integer;
  v_total_days integer;
begin
  -- Check if already claimed today
  select exists(
    select 1 from daily_logins where user_id = p_user_id and login_date = v_today
  ) into v_already_claimed;

  if v_already_claimed then
    -- Return current streak info without awarding
    select streak_day into v_current_streak
      from daily_logins where user_id = p_user_id and login_date = v_today;
    select count(*) into v_total_days
      from daily_logins where user_id = p_user_id;
    return jsonb_build_object(
      'claimed', false,
      'credits_awarded', 0,
      'streak_bonus', 0,
      'current_streak', v_current_streak,
      'total_days', v_total_days
    );
  end if;

  -- Get last login date to calculate streak
  select login_date into v_last_login
    from daily_logins
    where user_id = p_user_id
    order by login_date desc
    limit 1;

  -- Calculate streak
  if v_last_login = v_today - interval '1 day' then
    -- Consecutive day
    select streak_day + 1 into v_current_streak
      from daily_logins where user_id = p_user_id and login_date = v_last_login;
  else
    -- Streak broken or first login
    v_current_streak := 1;
  end if;

  -- Calculate streak bonus
  -- 3-day streak: +5 bonus
  -- 7-day streak: +15 bonus
  -- 14-day streak: +30 bonus
  -- 30-day streak: +50 bonus
  -- Every 7 days after that: +15 bonus
  if v_current_streak >= 30 and (v_current_streak % 7 = 0) then
    v_streak_bonus := 50;
  elsif v_current_streak = 30 then
    v_streak_bonus := 50;
  elsif v_current_streak = 14 then
    v_streak_bonus := 30;
  elsif v_current_streak = 7 then
    v_streak_bonus := 15;
  elsif v_current_streak = 3 then
    v_streak_bonus := 5;
  else
    v_streak_bonus := 0;
  end if;

  v_total_credits := v_base_credits + v_streak_bonus;

  -- Insert login record
  insert into daily_logins (user_id, login_date, credits_awarded, streak_day, streak_bonus)
  values (p_user_id, v_today, v_base_credits, v_current_streak, v_streak_bonus);

  -- Award credits
  update user_profiles
    set credits = credits + v_total_credits, updated_at = now()
    where id = p_user_id;

  -- Log the transaction
  insert into credit_transactions (user_id, amount, reason)
  values (p_user_id, v_total_credits, 'daily_login_day_' || v_current_streak);

  select count(*) into v_total_days
    from daily_logins where user_id = p_user_id;

  return jsonb_build_object(
    'claimed', true,
    'credits_awarded', v_base_credits,
    'streak_bonus', v_streak_bonus,
    'current_streak', v_current_streak,
    'total_days', v_total_days
  );
end;
$$ language plpgsql security definer;
