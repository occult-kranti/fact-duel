-- Generated from the reviewed canonical JHK schema. Additive upgrade; immutable active decks remain intact.

-- Created with Supabase CLI migration new; stored beside this app’s other migrations.

begin;

create table if not exists jhk_private.question_seen (
 session_id uuid not null references jhk_private.sessions(id), family_key text not null,
 seen_at timestamptz not null, primary key(session_id,family_key)
);

alter table jhk_private.question_seen enable row level security;
revoke all on jhk_private.question_seen from public, anon, authenticated;
grant all on jhk_private.question_seen to service_role;

create or replace function jhk_private.question_family(q jsonb) returns text language sql immutable set search_path='' as $$
 select coalesce(nullif(q->>'familyKey',''),nullif(q->>'familyId',''),case q->>'id'
  when 'cr042' then 'cricket-ipl-suspension-seasons-2016-17' when 'cr473' then 'cricket-ipl-suspension-seasons-2016-17'
  when 'cr056' then 'cricket-yuvraj-broad-six-sixes-2007' when 'cr291' then 'cricket-yuvraj-broad-six-sixes-2007'
  when 'cr244' then 'cricket-afridi-chennai-141-1999' when 'cr566' then 'cricket-afridi-chennai-141-1999' else q->>'id' end)
$$;

create or replace function jhk_private.make_rotated_deck(p_file text,p_players uuid[],p_now timestamptz) returns jsonb language plpgsql set search_path='' as $$
declare q jsonb; shuffled jsonb; options jsonb; correct integer; result jsonb:='[]'::jsonb;
begin
 for q in
  with candidates as (
   select payload,jhk_private.question_family(payload) family from jhk_private.questions
   where p_file='all' or (payload->'files') ? p_file
  ), families as (
   select distinct on (family) family,payload from candidates order by family,random()
  ), ranked as (
   select f.payload,(select max(h.seen_at) from jhk_private.question_seen h where h.family_key=f.family and h.session_id=any(p_players)) seen_at from families f
  ) select payload from ranked order by seen_at nulls first,random() limit 5
 loop
  select jsonb_agg(jsonb_build_object('option',value,'original',ordinality-1) order by random()) into shuffled from jsonb_array_elements(q->'options') with ordinality;
  select jsonb_agg(value->'option' order by ordinality),max((ordinality-1)::int) filter(where (value->>'original')::int=(q->>'correctIndex')::int) into options,correct from jsonb_array_elements(shuffled) with ordinality;
  result:=result||jsonb_build_array(q||jsonb_build_object('options',options,'correctIndex',correct));
 end loop;
 return result;
end $$;

create or replace function jhk_private.make_deck(p_file text default 'all',p_now timestamptz default now()) returns jsonb language sql set search_path='' as $$
 select jhk_private.make_rotated_deck(p_file,array[]::uuid[],p_now)
$$;

create or replace function jhk_private.human_road(p_self uuid) returns jsonb language sql stable set search_path='' as $$
 with totals as (
  select count(*)::int matches,coalesce(sum(x.correct),0)::int correct,
   coalesce(sum((select count(*) from jhk_private.answers a where a.room_id=x.room_id and a.session_id=x.session_id)),0)::int answered
  from jhk_private.results x where x.session_id=p_self
 ), road as (select *,answered*4+correct*2 trophies from totals)
 select jsonb_build_object('trophies',trophies,'level',case when trophies>=180 then 3 when trophies>=60 then 2 else 1 end,
  'stadiumId',case when trophies>=180 then 'crown' when trophies>=60 then 'riverside' else 'gully' end,
  'answeredRounds',answered,'correctAnswers',correct,'eligibleMatches',matches,'source','server-human-results') from road
$$;

create or replace function jhk_private.profile_json(p jhk_private.sessions,p_now timestamptz) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('id',p.id,'nickname',p.nickname,'email',p.email,'avatar',p.avatar,'locale',p.locale,'preferences',p.preferences,'adultConfirmed',p.adult_confirmed,'termsVersion',p.terms_version,'profileComplete',jhk_private.profile_complete(p),'expiresAt',jhk_private.ms(p.expires_at),'onlineXp',(select coalesce(sum(a.xp),0) from jhk_private.answers a where a.session_id=p.id))||jhk_private.wallet(p.id)||jsonb_build_object('title',jhk_private.current_title(p.id,p_now),'humanRoad',jhk_private.human_road(p.id))
$$;

create or replace function jhk_private.snapshot(p_room uuid,p_self uuid,p_now timestamptz) returns jsonb language plpgsql set search_path='' as $$
declare r jhk_private.rooms; q jsonb; own jhk_private.answers; receipt jsonb; verdict jsonb; players jsonb; winner uuid; a record; b record; issued timestamptz; released integer;
begin
 select * into r from jhk_private.rooms where id=p_room;
 q:=r.deck->(r.round-1);
 if q is not null and ((r.phase='question' and p_now>=r.starts_at and p_now<r.deadline_at) or r.phase in ('result','finished')) then
  insert into jhk_private.releases(room_id,round,session_id,issued_at) values(r.id,r.round,p_self,greatest(r.starts_at,clock_timestamp())) on conflict do nothing;
  get diagnostics released = row_count;
  if released=1 then
   insert into jhk_private.question_seen(session_id,family_key,seen_at) values(p_self,jhk_private.question_family(q),p_now)
   on conflict(session_id,family_key) do update set seen_at=greatest(jhk_private.question_seen.seen_at,excluded.seen_at);
  end if;
 end if;
 select issued_at into issued from jhk_private.releases where room_id=r.id and round=r.round and session_id=p_self;
 select * into own from jhk_private.answers where room_id=r.id and round=r.round and session_id=p_self;
 if own.session_id is not null then receipt:=jsonb_build_object('choice',own.choice,'correct',own.correct,'correctIndex',(q->>'correctIndex')::int,'elapsedMs',own.elapsed_ms,'xp',own.xp,'explanation',q->'explanation','sourceUrl',q->>'sourceUrl'); end if;
 if r.phase in ('result','finished') then
  select m.session_id,coalesce(x.correct,false) correct,coalesce(x.elapsed_ms,30000) elapsed into a from jhk_private.members m left join jhk_private.answers x on x.room_id=m.room_id and x.session_id=m.session_id and x.round=r.round where m.room_id=r.id order by m.joined_at,m.session_id limit 1;
  select m.session_id,coalesce(x.correct,false) correct,coalesce(x.elapsed_ms,30000) elapsed into b from jhk_private.members m left join jhk_private.answers x on x.room_id=m.room_id and x.session_id=m.session_id and x.round=r.round where m.room_id=r.id and m.session_id<>a.session_id limit 1;
  winner:=case when a.correct and not b.correct then a.session_id when b.correct and not a.correct then b.session_id when not a.correct or abs(a.elapsed-b.elapsed)<=120 then null when a.elapsed<b.elapsed then a.session_id else b.session_id end;
  select jsonb_build_object('winnerId',winner,'correctIndex',(q->>'correctIndex')::int,'explanation',q->'explanation','sourceUrl',q->>'sourceUrl','answers',jsonb_agg(jsonb_build_object('playerId',m.session_id,'choice',x.choice,'correct',coalesce(x.correct,false),'elapsedMs',coalesce(x.elapsed_ms,30000),'xp',coalesce(x.xp,0)) order by m.joined_at,m.session_id)) into verdict from jhk_private.members m left join jhk_private.answers x on x.room_id=m.room_id and x.session_id=m.session_id and x.round=r.round where m.room_id=r.id;
 end if;
 select jsonb_agg(jsonb_build_object('id',s.id,'nickname',s.nickname,'ready',m.ready,'answered',exists(select 1 from jhk_private.answers x where x.room_id=r.id and x.round=r.round and x.session_id=s.id),'score',(select count(*) from jhk_private.answers x where x.room_id=r.id and x.session_id=s.id and x.correct and (x.round<r.round or r.phase in ('result','finished') or s.id=p_self))) order by m.joined_at,m.session_id) into players from jhk_private.members m join jhk_private.sessions s on s.id=m.session_id where m.room_id=r.id;
 return jsonb_build_object('id',r.id,'code',case when r.mode='private' then r.code else null end,'mode',r.mode,'phase',case when r.phase='question' and p_now<r.starts_at then 'countdown' else r.phase end,'round',r.round,'roundCount',5,'startsAt',jhk_private.ms(coalesce(issued,r.starts_at)),'deadlineAt',jhk_private.ms(r.deadline_at),'nextAt',jhk_private.ms(r.next_at),'serverNow',jhk_private.ms(p_now),'selfId',p_self,'players',coalesce(players,'[]'::jsonb),'reactionsEnabled',true,'reactions',coalesce((select jsonb_agg(m.last_reaction order by m.last_reaction->>'at') from jhk_private.members m where m.room_id=r.id and m.last_reaction is not null and (m.last_reaction->>'at')::bigint>=jhk_private.ms(p_now)-12000),'[]'::jsonb),'question',case when r.round>0 and r.phase not in ('waiting','cancelled') and (r.phase<>'question' or p_now>=r.starts_at) then q-'correctIndex'-'explanation'-'sourceUrl' else null end,'receipt',receipt,'result',verdict,'winnerId',r.winner_id,'reason',r.reason,'file',r.file,'stake',r.stake,'rewardMultiplier',r.reward_multiplier,'economy',jsonb_build_object('status',case when r.economy_state='pending' and exists(select 1 from jhk_private.escrows where room_id=r.id and session_id=p_self) then 'reserved' else r.economy_state end,'balance',(select balance from jhk_private.wallets where session_id=p_self),'savings',(jhk_private.wallet(p_self)->'savings'),'reserved',coalesce((select amount from jhk_private.escrows where room_id=r.id and session_id=p_self and state='reserved'),0),'payout',coalesce((select sum(amount) from jhk_private.wallet_entries where room_id=r.id and session_id=p_self and kind in ('payout','refund')),0),'reward',coalesce((select amount from jhk_private.reward_claims where room_id=r.id and session_id=p_self),0)));
end $$;

create or replace function public.jhk_command(p_session_hash text,p_action text,p_payload jsonb default '{}'::jsonb,p_network_hash text default '') returns jsonb
language plpgsql security invoker set search_path='' as $$
declare t timestamptz:=clock_timestamp(); s jhk_private.sessions; r jhk_private.rooms; c jhk_private.circles;
 n integer; room uuid; q jsonb; deck jsonb; choice integer; elapsed integer; correct boolean; board jsonb; v_mode text; op text; nick text; v_email text; v_recovery text; issued_recovery boolean:=false; old_answer jhk_private.answers; issued timestamptz; circle_ids uuid[]; v_file text; v_stake integer; cancelled record;
begin
 -- Anonymous aggregate read: no identity is created, refreshed or returned.
 if p_action='presence' then
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'presence',jsonb_build_object('activeHumans',(select count(*) from jhk_private.sessions where not deleted and expires_at>t and last_seen>t-interval '2 minutes'),'windowSeconds',120,'expiresAt',jhk_private.ms(t)+30000));
 end if;
 if p_session_hash !~ '^[a-f0-9]{64}$' then return jhk_private.fail('UNAUTHORIZED','A valid online profile is required.'); end if;
 if p_action='session' then
  nick:=btrim(p_payload->>'nickname');
  if nick is null or char_length(nick) not between 2 and 24 then return jhk_private.fail('BAD_NICKNAME','Use 2–24 characters.'); end if;
  insert into jhk_private.network_limits(network_hash,window_start) values(p_network_hash,date_trunc('hour',t)) on conflict(network_hash,window_start) do update set count=jhk_private.network_limits.count+1 returning count into n;
  if n>20 then return jhk_private.fail('RATE_LIMIT','Too many new profiles. Try again later.'); end if;
  delete from jhk_private.network_limits where window_start<t-interval '2 days';
  v_email:=nullif(lower(btrim(p_payload->>'email')),''); v_recovery:=p_payload->>'_recoveryHash';
  if v_email is not null and (char_length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then return jhk_private.fail('BAD_EMAIL','Enter a valid email address.'); end if;
  if (p_payload->>'adultConfirmed') is distinct from 'true' then return jhk_private.fail('AGE_CONFIRMATION_REQUIRED','Confirm that you are at least 18.'); end if;
  if p_payload->>'termsVersion' is distinct from 'beta-1' then return jhk_private.fail('TERMS_REQUIRED','Accept the current beta terms.'); end if;
  if v_recovery !~ '^[a-f0-9]{64}$' or v_recovery is null then return jhk_private.fail('BAD_RECOVERY','A recovery credential is required.'); end if;
  if p_payload ? 'avatar' and p_payload->>'avatar' not in ('spark','shield','bolt','star','book','compass') then return jhk_private.fail('BAD_AVATAR','Choose a supported avatar.'); end if;
  if p_payload ? 'locale' and p_payload->>'locale' not in ('en','hi') then return jhk_private.fail('BAD_LOCALE','Choose a supported language.'); end if;
  insert into jhk_private.sessions(token_hash,nickname,email,recovery_hash,adult_confirmed,terms_version,avatar,locale,preferences,profile_completed_at,created_at,expires_at,last_seen)
  values(p_session_hash,nick,v_email,v_recovery,true,'beta-1',p_payload->>'avatar',p_payload->>'locale',coalesce(p_payload->'preferences','{}'::jsonb),t,t,t+interval '30 days',t) returning * into s;
  perform jhk_private.ensure_wallet(s.id);
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'session',jhk_private.profile_json(s,t));
 end if;
 if p_action='recover' then
  -- A wrong code and a deleted account are indistinguishable. The bearer rotates atomically on this row.
  insert into jhk_private.network_limits(network_hash,window_start) values(p_network_hash,date_trunc('hour',t)) on conflict(network_hash,window_start) do update set count=jhk_private.network_limits.count+1 returning count into n;
  if n>60 then return jhk_private.fail('RATE_LIMIT','Too many attempts. Try again later.'); end if;
  v_recovery:=p_payload->>'_recoveryHash';
  if v_recovery !~ '^[a-f0-9]{64}$' or v_recovery is null then return jhk_private.fail('BAD_RECOVERY','The recovery code is invalid.'); end if;
  select * into s from jhk_private.sessions where recovery_hash=v_recovery and not deleted for update;
  if s.id is null then return jhk_private.fail('BAD_RECOVERY','The recovery code is invalid.'); end if;
  update jhk_private.sessions set token_hash=p_session_hash,expires_at=t+interval '30 days',last_seen=t,rate_start=t,rate_count=0 where id=s.id returning * into s;
  perform jhk_private.ensure_wallet(s.id);
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'session',jhk_private.profile_json(s,t));
 end if;
 select * into s from jhk_private.sessions where token_hash=p_session_hash for no key update;
 if s.id is null or s.deleted then return jhk_private.fail('UNAUTHORIZED','Your online profile was not found.'); end if;
 perform jhk_private.ensure_wallet(s.id);
 perform jhk_private.expire_rooms(t);
 if s.expires_at<=t and p_action<>'deleteSession' then return jhk_private.fail('SESSION_EXPIRED','Session expired. Restore this profile with its recovery code.'); end if;
 update jhk_private.sessions set last_seen=t,rate_start=case when rate_start<t-interval '1 minute' then t else rate_start end,rate_count=case when rate_start<t-interval '1 minute' then 1 else rate_count+1 end where id=s.id returning rate_count into n;
 if n>240 then return jhk_private.fail('RATE_LIMIT','Slow down and try again shortly.'); end if;
 if p_action='deleteSession' then
  for cancelled in select x.id from jhk_private.rooms x join jhk_private.members m on m.room_id=x.id where m.session_id=s.id and x.phase not in ('finished','cancelled') order by x.id for update of x loop
   update jhk_private.rooms set phase='cancelled',reason=case when phase in ('question','result') then 'profile-deleted-forfeit' else 'profile-deleted' end,winner_id=case when phase in ('question','result') then (select session_id from jhk_private.members where room_id=cancelled.id and session_id<>s.id limit 1) else null end,finished_at=t where id=cancelled.id;
   perform jhk_private.settle_economy(cancelled.id,t);
  end loop;
  with locked as (select c2.id from jhk_private.circles c2 join jhk_private.circle_members cm on cm.circle_id=c2.id where cm.session_id=s.id order by c2.id for update of c2) select array_agg(id) into circle_ids from locked;
  delete from jhk_private.circle_members where session_id=s.id;
  delete from jhk_private.circles cc where cc.id=any(circle_ids) and not exists(select 1 from jhk_private.circle_members m where m.circle_id=cc.id);
  delete from jhk_private.results where session_id=s.id;
  delete from jhk_private.question_seen where session_id=s.id;
  update jhk_private.sessions set deleted=true,nickname='Deleted player',email=null,recovery_hash=null,adult_confirmed=false,terms_version=null,avatar=null,locale=null,preferences='{}'::jsonb,profile_completed_at=null,expires_at=t where id=s.id;
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'deleted',true);
 elsif p_action='profile' then
  if p_payload ? 'nickname' then nick:=btrim(p_payload->>'nickname'); if char_length(nick) not between 2 and 24 then return jhk_private.fail('BAD_NICKNAME','Use 2–24 characters.'); end if; s.nickname:=nick; end if;
  if p_payload ? 'email' then
   v_email:=nullif(lower(btrim(p_payload->>'email')),'');
   if v_email is not null and (char_length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then return jhk_private.fail('BAD_EMAIL','Enter a valid email address.'); end if;
   s.email:=v_email;
  end if;
  if p_payload ? 'adultConfirmed' then
   if p_payload->>'adultConfirmed' is distinct from 'true' then return jhk_private.fail('AGE_CONFIRMATION_REQUIRED','Confirm that you are at least 18.'); end if;
   s.adult_confirmed:=true;
  end if;
  if p_payload ? 'termsVersion' then
   if p_payload->>'termsVersion' is distinct from 'beta-1' then return jhk_private.fail('TERMS_REQUIRED','Accept the current beta terms.'); end if;
   s.terms_version:='beta-1';
  end if;
  if p_payload ? 'avatar' then
   if p_payload->>'avatar' not in ('spark','shield','bolt','star','book','compass') then return jhk_private.fail('BAD_AVATAR','Choose a supported avatar.'); end if;
   s.avatar:=p_payload->>'avatar';
  end if;
  if p_payload ? 'locale' then
   if p_payload->>'locale' not in ('en','hi') then return jhk_private.fail('BAD_LOCALE','Choose a supported language.'); end if;
   s.locale:=p_payload->>'locale';
  end if;
  if p_payload ? 'preferences' then
   if jsonb_typeof(p_payload->'preferences')<>'object' or (p_payload->'preferences')-array['sound','reducedMotion'] <> '{}'::jsonb or (p_payload->'preferences' ? 'sound' and jsonb_typeof(p_payload->'preferences'->'sound')<>'boolean') or (p_payload->'preferences' ? 'reducedMotion' and jsonb_typeof(p_payload->'preferences'->'reducedMotion')<>'boolean') then return jhk_private.fail('BAD_PREFERENCES','Choose supported preferences.'); end if;
   s.preferences:=p_payload->'preferences';
  end if;
  if s.adult_confirmed and s.terms_version='beta-1' and s.profile_completed_at is null then
   v_recovery:=p_payload->>'_recoveryHash';
   if v_recovery !~ '^[a-f0-9]{64}$' or v_recovery is null then return jhk_private.fail('BAD_RECOVERY','A recovery credential is required.'); end if;
   s.profile_completed_at:=t; s.recovery_hash:=v_recovery; issued_recovery:=true;
  end if;
  update jhk_private.sessions set nickname=s.nickname,email=s.email,adult_confirmed=s.adult_confirmed,terms_version=s.terms_version,avatar=s.avatar,locale=s.locale,preferences=s.preferences,profile_completed_at=s.profile_completed_at,recovery_hash=s.recovery_hash where id=s.id returning * into s;
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'session',jhk_private.profile_json(s,t),'recoveryIssued',issued_recovery);
 elsif p_action='rotateRecovery' then
  v_recovery:=p_payload->>'_recoveryHash';
  if v_recovery !~ '^[a-f0-9]{64}$' or v_recovery is null then return jhk_private.fail('BAD_RECOVERY','A recovery credential is required.'); end if;
  if not jhk_private.profile_complete(s) then return jhk_private.fail('PROFILE_REQUIRED','Complete your profile first.'); end if;
  update jhk_private.sessions set recovery_hash=v_recovery where id=s.id;
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t));
 elsif p_action='exportProfile' then
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'profile',jhk_private.profile_json(s,t),
   'createdAt',s.created_at,'profileCompletedAt',s.profile_completed_at,
   'questionHistory',(select coalesce(jsonb_object_agg(h.family_key,jhk_private.ms(h.seen_at)),'{}'::jsonb) from jhk_private.question_seen h where h.session_id=s.id),
   'answers',(select coalesce(jsonb_agg(jsonb_build_object('roomId',a.room_id,'round',a.round,'choice',a.choice,'correct',a.correct,'elapsedMs',a.elapsed_ms,'xp',a.xp,'receivedAt',a.received_at) order by a.received_at),'[]'::jsonb) from jhk_private.answers a where a.session_id=s.id),
   'results',(select coalesce(jsonb_agg(to_jsonb(res) order by res.completed_at),'[]'::jsonb) from jhk_private.results res where res.session_id=s.id),
   'walletEntries',(select coalesce(jsonb_agg(to_jsonb(w) order by w.created_at),'[]'::jsonb) from jhk_private.wallet_entries w where w.session_id=s.id),
   'circles',jhk_private.circle_list(s.id));
 elsif p_action in ('leaderboards','tournaments') then
  if p_action='tournaments' then
   board:=jhk_private.board(s.id,'tournament',t);
   return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'standings',board,'tournaments',jsonb_build_array(jsonb_build_object('id',board->>'competitionId','name','Weekly Challenge','startsAt',board->'startsAt','endsAt',board->'endsAt','status','open','format','best-five','minimumMatches',3,'minimumOpponents',3)));
  end if;
  v_mode:=coalesce(p_payload->>'period','daily'); if v_mode not in ('daily','weekly','savings') then return jhk_private.fail('BAD_PERIOD','Choose daily, weekly or savings.'); end if;
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t))||case when v_mode='savings' then jhk_private.savings_board(s.id,t) else jhk_private.board(s.id,v_mode,t) end;
 elsif p_action='circles' then
  op:=coalesce(p_payload->>'operation','list');
  if op<>'list' then
   nick:=coalesce(btrim(p_payload->>'nickname'),s.nickname);
   if char_length(nick) not between 2 and 24 then return jhk_private.fail('BAD_NICKNAME','Use 2–24 characters.'); end if;
   if op='create' then
    select count(*) into n from jhk_private.circle_members where session_id=s.id;
    if n>=10 then return jhk_private.fail('CIRCLE_LIMIT','You can join up to 10 circles.'); end if;
    if char_length(btrim(p_payload->>'name')) not between 2 and 40 or coalesce(p_payload->>'kind','friends') not in ('friends','family') then return jhk_private.fail('BAD_CIRCLE','Choose a 2–40 character circle name.'); end if;
    insert into jhk_private.circles(name,kind) values(btrim(p_payload->>'name'),coalesce(p_payload->>'kind','friends')) returning * into c;
    insert into jhk_private.circle_members(circle_id,session_id,nickname) values(c.id,s.id,nick);
   elsif op='join' then
    select * into c from jhk_private.circles where code=upper(p_payload->>'code') for update;
    if c.id is null then return jhk_private.fail('CIRCLE_NOT_FOUND','Check the circle code.'); end if;
    if (select count(*) from jhk_private.circle_members where session_id=s.id)>=10 or (select count(*) from jhk_private.circle_members where circle_id=c.id)>=50 then return jhk_private.fail('CIRCLE_LIMIT','Circle membership limit reached.'); end if;
    insert into jhk_private.circle_members(circle_id,session_id,nickname) values(c.id,s.id,nick) on conflict(circle_id,session_id) do update set nickname=excluded.nickname;
   elsif op in ('rename','leave') then
    perform id from jhk_private.circles where id=(p_payload->>'circleId')::uuid for update;
    if not exists(select 1 from jhk_private.circle_members where circle_id=(p_payload->>'circleId')::uuid and session_id=s.id) then return jhk_private.fail('FORBIDDEN','You are not a member of this circle.'); end if;
    if op='rename' then update jhk_private.circle_members set nickname=nick where circle_id=(p_payload->>'circleId')::uuid and session_id=s.id;
    else delete from jhk_private.circle_members where circle_id=(p_payload->>'circleId')::uuid and session_id=s.id; delete from jhk_private.circles cc where cc.id=(p_payload->>'circleId')::uuid and not exists(select 1 from jhk_private.circle_members m where m.circle_id=cc.id); end if;
   else return jhk_private.fail('BAD_ACTION','Unknown circle action.'); end if;
  end if;
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'circles',jhk_private.circle_list(s.id));
 elsif p_action in ('create','queue','join') then
  if not jhk_private.profile_complete(s) then return jhk_private.fail('PROFILE_REQUIRED','Complete your profile before starting a match.'); end if;
  -- Serializes the small matchmaking transaction, not match play.
  perform pg_advisory_xact_lock(726482941);
  select x.* into r from jhk_private.rooms x join jhk_private.members m on m.room_id=x.id where m.session_id=s.id and x.phase not in ('finished','cancelled') and x.created_at>t-interval '15 minutes' order by x.created_at desc limit 1 for update of x;
  if r.id is not null then return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'match',jhk_private.snapshot(r.id,s.id,t)); end if;
  v_file:=coalesce(p_payload->>'file','all'); v_stake:=coalesce((p_payload->>'stake')::int,0);
  if v_file not in ('all','sports','science','cricket','football','basketball','baseball','formula-1','space','physics','biology','computing') then return jhk_private.fail('BAD_FILE','Choose an available topic.'); end if;
  if v_stake not between 0 and 10000 or (p_payload ? 'stake' and (jsonb_typeof(p_payload->'stake')<>'number' or (p_payload->>'stake') !~ '^[0-9]+$')) then return jhk_private.fail('BAD_STAKE','Choose whole units from 0 to 10,000.'); end if;
  if p_action<>'join' and v_stake>(select balance from jhk_private.wallets where session_id=s.id) then return jhk_private.fail('INSUFFICIENT_BALANCE','Choose a smaller stake or play for 0.'); end if;
  v_mode:=case when p_action='queue' then coalesce(p_payload->>'mode','ranked') else 'private' end;
  if v_mode not in ('private','ranked','tournament') then return jhk_private.fail('BAD_MODE','Choose a supported game mode.'); end if;
  if p_action='join' then
   select * into r from jhk_private.rooms where code=upper(p_payload->>'code') and mode='private' and phase='waiting' and created_at>t-interval '15 minutes' for update;
   if r.id is null then return jhk_private.fail('ROOM_NOT_FOUND','This room has ended or the code is incorrect.'); end if;
   if (select count(*) from jhk_private.members where room_id=r.id)>=2 then return jhk_private.fail('ROOM_FULL','This room already has two players.'); end if;
  elsif p_action='queue' then
   select x.* into r from jhk_private.rooms x where x.mode=v_mode and x.file=v_file and x.stake=v_stake and x.phase='waiting' and x.created_at>t-interval '3 minutes'
    and (select count(*) from jhk_private.members m where m.room_id=x.id)=1
    and exists(select 1 from jhk_private.members m where m.room_id=x.id and m.last_seen>t-interval '20 seconds' and m.session_id<>s.id)
    order by x.created_at for update skip locked limit 1;
  end if;
  if r.id is null then
   deck:=jhk_private.make_deck(v_file,t);
   if jsonb_array_length(deck)<5 or deck is null then return jhk_private.fail('NO_QUESTIONS','This topic is not ready for a five-round duel.'); end if;
   insert into jhk_private.rooms(mode,deck,created_at,file,stake,reward_multiplier) values(v_mode,deck,t,v_file,v_stake,1) returning * into r;
  end if;
  insert into jhk_private.members(room_id,session_id,joined_at,last_seen) values(r.id,s.id,t,t) on conflict do nothing;
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'match',jhk_private.snapshot(r.id,s.id,t));
 elsif p_action in ('snapshot','ready','next','answer','leave','reaction') then
  room:=(p_payload->>'roomId')::uuid;
  -- Membership checked before locking/returning any private state.
  if not exists(select 1 from jhk_private.members where room_id=room and session_id=s.id) then return jhk_private.fail('FORBIDDEN','You are not a player in this room.'); end if;
  select * into r from jhk_private.rooms where id=room for update;
  if p_action='ready' and not jhk_private.profile_complete(s) then return jhk_private.fail('PROFILE_REQUIRED','Complete your profile before starting a match.'); end if;
  update jhk_private.members set last_seen=t where room_id=r.id and session_id=s.id;
  if r.phase not in ('finished','cancelled') and (r.created_at<t-interval '15 minutes' or (r.phase='waiting' and r.mode<>'private' and r.created_at<t-interval '3 minutes')) then update jhk_private.rooms set phase='cancelled',reason='room-expired',finished_at=t where id=r.id; r.phase:='cancelled'; end if;
  if p_action='reaction' then
   if p_payload->>'sticker' is null or p_payload->>'sticker' not in ('all-talk','appeal-rejected','brain-duck','nice-shot','check-replay','too-easy') then return jhk_private.fail('BAD_STICKER','Choose a supported sticker.'); end if;
   if p_payload->>'requestId' is null or p_payload->>'requestId' !~ '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$' then return jhk_private.fail('BAD_INPUT','A sticker request ID is required.'); end if;
   select last_reaction into q from jhk_private.members where room_id=r.id and session_id=s.id;
   -- A retried acknowledged request is idempotent, including after the next countdown begins.
   if q->>'id'=p_payload->>'requestId' then return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'match',jhk_private.snapshot(r.id,s.id,t)); end if;
   if r.phase not in ('waiting','result') or (r.phase='result' and r.next_at<=t) then return jhk_private.fail('BANTER_CLOSED','Stickers are available between rounds.'); end if;
   if (select count(*) from jhk_private.members where room_id=r.id)<>2 then return jhk_private.fail('RIVAL_REQUIRED','Wait for your opponent.'); end if;
   if q is not null and (jhk_private.ms(t)-(q->>'at')::bigint<8000 or (q->>'round')::int=r.round) then return jhk_private.fail('BANTER_COOLDOWN','One sticker per break, at least eight seconds apart.'); end if;
   update jhk_private.members set last_reaction=jsonb_build_object('id',p_payload->>'requestId','playerId',s.id,'sticker',p_payload->>'sticker','at',jhk_private.ms(t),'round',r.round) where room_id=r.id and session_id=s.id;
   return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'match',jhk_private.snapshot(r.id,s.id,t));
  end if;
  if p_action='leave' and r.phase not in ('finished','cancelled') then update jhk_private.rooms set phase='cancelled',reason=case when r.phase in ('question','result') then 'player-left-forfeit' else 'player-left' end,finished_at=t,winner_id=case when r.phase in ('question','result') then (select session_id from jhk_private.members where room_id=r.id and session_id<>s.id limit 1) else null end where id=r.id;
  else
   -- Answer is processed before deadline reconciliation; timestamp came from RPC entry.
   if p_action='answer' then
    select * into old_answer from jhk_private.answers where room_id=r.id and round=(p_payload->>'round')::int and session_id=s.id;
    if old_answer.session_id is null then
     if r.phase<>'question' or (p_payload->>'round')::int<>r.round then return jhk_private.fail('ROUND_CLOSED','This round is already closed.'); end if;
     select issued_at into issued from jhk_private.releases where room_id=r.id and round=r.round and session_id=s.id;
     if issued is null then return jhk_private.fail('QUESTION_NOT_ISSUED','Fetch the current question before answering.'); end if;
     if t<r.starts_at then return jhk_private.fail('TOO_EARLY','Wait for the countdown to finish.'); end if;
     if t<r.deadline_at then
      choice:=(p_payload->>'choice')::int;
      if choice not between 0 and 3 then return jhk_private.fail('BAD_ANSWER','Choose one of the four answers.'); end if;
      q:=r.deck->(r.round-1); elapsed:=greatest(0,least(30000,floor(extract(epoch from(t-issued))*1000)::int)); correct:=choice=(q->>'correctIndex')::int;
      insert into jhk_private.answers(room_id,round,session_id,request_id,choice,correct,elapsed_ms,xp,received_at) values(r.id,r.round,s.id,(p_payload->>'requestId')::uuid,choice,correct,elapsed,case when not correct then 0 when elapsed<8000 then 30 when elapsed<15000 then 20 else 10 end,t) on conflict do nothing;
     end if;
    end if;
   end if;
   perform jhk_private.settle(r.id,t);
   select * into r from jhk_private.rooms where id=r.id;
   if p_action in ('ready','next') and r.phase in ('waiting','result') then
    if r.phase='waiting' then
     if coalesce(p_payload->>'stake','0')<>r.stake::text then return jhk_private.fail('STAKE_CONFIRMATION','Confirm the room stake before getting ready.'); end if;
     if not jhk_private.reserve_stake(r.id,s.id) then return jhk_private.fail('INSUFFICIENT_BALANCE','Choose a smaller stake or play for 0.'); end if;
    end if;
    update jhk_private.members set ready=true where room_id=r.id and session_id=s.id;
   end if;
   if (r.phase='waiting' and (select count(*) from jhk_private.members where room_id=r.id and ready)=2) or (r.phase='result' and r.round<5 and ((select count(*) from jhk_private.members where room_id=r.id and ready)=2 or t>=r.next_at)) then
    if r.phase='waiting' then
     deck:=jhk_private.make_rotated_deck(r.file,(select array_agg(session_id) from jhk_private.members where room_id=r.id),t);
     if jsonb_array_length(deck)<5 then return jhk_private.fail('NO_QUESTIONS','This topic needs more available questions.'); end if;
     r.deck:=deck;
     update jhk_private.rooms set deck=r.deck where id=r.id;
    end if;
    update jhk_private.rooms set phase='question',round=r.round+1,starts_at=t+interval '2500 milliseconds',deadline_at=t+interval '32500 milliseconds',next_at=null where id=r.id;
    update jhk_private.members set ready=false where room_id=r.id;
   end if;
  end if;
  perform jhk_private.settle_economy(r.id,t);
  return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(t),'match',jhk_private.snapshot(r.id,s.id,t));
 end if;
 return jhk_private.fail('BAD_ACTION','Unknown game action.');
exception when invalid_text_representation or numeric_value_out_of_range or check_violation or not_null_violation then
 return jhk_private.fail('BAD_INPUT','Check the supplied values.');
end $$;

-- Idempotent backfill counts only actually issued questions, not unplayed future deck cards.
insert into jhk_private.question_seen(session_id,family_key,seen_at)
 select x.session_id,jhk_private.question_family(r.deck->(x.round-1)),max(x.issued_at)
 from jhk_private.releases x join jhk_private.rooms r on r.id=x.room_id join jhk_private.sessions s on s.id=x.session_id
 where not s.deleted and jhk_private.question_family(r.deck->(x.round-1)) is not null
 group by x.session_id,jhk_private.question_family(r.deck->(x.round-1))
 on conflict(session_id,family_key) do update set seen_at=greatest(jhk_private.question_seen.seen_at,excluded.seen_at);

revoke all on all functions in schema jhk_private from public, anon, authenticated;
grant execute on all functions in schema jhk_private to service_role;
revoke all on function public.jhk_command(text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.jhk_command(text,text,jsonb,text) to service_role;
comment on function public.jhk_command(text,text,jsonb,text) is 'JHK Edge-only command boundary. Custom bearer-token SHA256 required. Never grant anon/authenticated execution.';

commit;
