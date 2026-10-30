-- JHK team cricket. Additive, service-only authority; existing two-seat rooms stay intact.
create table if not exists jhk_private.teams (
 id uuid primary key default gen_random_uuid(), name text not null check(char_length(name) between 2 and 32),
 tag text not null unique, invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)),
 capacity integer not null check(capacity in (5,11)), captain_id uuid not null references jhk_private.sessions(id),
 emblem text not null default 'bat' check(emblem in ('bat','bolt','crown','star')),
 palette text not null default 'teal' check(palette in ('teal','saffron','berry','blue')),
 join_open boolean not null default true, created_at timestamptz not null default now(), archived_at timestamptz
);
create table if not exists jhk_private.team_members (
 team_id uuid not null references jhk_private.teams(id), session_id uuid not null unique references jhk_private.sessions(id),
 joined_at timestamptz not null default now(), primary key(team_id,session_id)
);
create table if not exists jhk_private.team_tournaments (
 id uuid primary key default gen_random_uuid(), owner_team_id uuid not null references jhk_private.teams(id),
 name text not null check(char_length(name) between 2 and 40), code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)),
 capacity integer not null check(capacity in (5,11)), format text not null check(format in ('mini','full')),
 status text not null default 'open' check(status in ('open','active','finished','cancelled')),
 created_at timestamptz not null default now(), started_at timestamptz, finished_at timestamptz,
 winner_team_id uuid references jhk_private.teams(id)
);
create table if not exists jhk_private.team_tournament_entries (
 tournament_id uuid not null references jhk_private.team_tournaments(id), team_id uuid not null references jhk_private.teams(id),
 seed integer not null check(seed between 1 and 4), joined_at timestamptz not null default now(),
 primary key(tournament_id,team_id), unique(tournament_id,seed)
);
create table if not exists jhk_private.team_fixtures (
 id uuid primary key default gen_random_uuid(), home_team_id uuid not null references jhk_private.teams(id),
 away_team_id uuid not null references jhk_private.teams(id), created_by uuid not null references jhk_private.sessions(id),
 capacity integer not null check(capacity in (5,11)), format text not null check(format in ('mini','full')),
 round_count integer not null check(round_count in (3,6)), deck jsonb not null default '[]',
 status text not null default 'pending' check(status in ('pending','active','finished','declined')),
 created_at timestamptz not null default now(), accepted_at timestamptz, deadline_at timestamptz, finished_at timestamptz,
 tournament_id uuid references jhk_private.team_tournaments(id), stage text not null default 'friendly' check(stage in ('friendly','semifinal','final')),
 slot integer not null default 1, winner_team_id uuid references jhk_private.teams(id), tie_break text check(tie_break='lower-seed'),
 check(home_team_id<>away_team_id), unique(tournament_id,stage,slot)
);
create index if not exists jhk_team_fixtures_teams on jhk_private.team_fixtures(home_team_id,away_team_id,status);
create table if not exists jhk_private.team_lineups (
 fixture_id uuid not null references jhk_private.team_fixtures(id), team_id uuid not null references jhk_private.teams(id),
 session_id uuid not null references jhk_private.sessions(id), nickname_snapshot text not null,
 primary key(fixture_id,session_id)
);
create table if not exists jhk_private.team_runs (
 fixture_id uuid not null references jhk_private.team_fixtures(id), session_id uuid not null references jhk_private.sessions(id),
 round integer not null default 1 check(round between 1 and 6), phase text not null default 'question' check(phase in ('question','result','finished')),
 started_at timestamptz not null, issued_at timestamptz not null, deadline_at timestamptz not null,
 next_at timestamptz, finished_at timestamptz, primary key(fixture_id,session_id),
 foreign key(fixture_id,session_id) references jhk_private.team_lineups(fixture_id,session_id)
);
create table if not exists jhk_private.team_answers (
 fixture_id uuid not null, session_id uuid not null, round integer not null check(round between 1 and 6),
 request_id uuid, choice integer check(choice between 0 and 3), correct boolean not null, elapsed_ms integer not null check(elapsed_ms between 0 and 30000),
 received_at timestamptz not null, primary key(fixture_id,session_id,round), unique(session_id,request_id),
 foreign key(fixture_id,session_id) references jhk_private.team_runs(fixture_id,session_id)
);
create table if not exists jhk_private.team_awards (
 team_id uuid not null references jhk_private.teams(id), fixture_id uuid not null references jhk_private.team_fixtures(id),
 points integer not null check(points>=0), awarded_at timestamptz not null, primary key(team_id,fixture_id)
);

create or replace function jhk_private.team_level(p_team uuid) returns integer language sql stable set search_path='' as $$
 select case when coalesce(sum(points),0)>=700 then 4 when coalesce(sum(points),0)>=300 then 3 when coalesce(sum(points),0)>=100 then 2 else 1 end from jhk_private.team_awards where team_id=p_team
$$;
create or replace function jhk_private.team_summary(p_team uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',t.id,'name',t.name,'tag',t.tag,'capacity',t.capacity,'emblem',t.emblem,'palette',t.palette,
  'memberCount',(select count(*) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=t.id and not s.deleted)) from jhk_private.teams t where t.id=p_team
$$;
create or replace function jhk_private.team_view(p_self uuid) returns jsonb language sql stable set search_path='' as $$
 select jhk_private.team_summary(t.id)||jsonb_build_object('captainId',t.captain_id,'role',case when t.captain_id=p_self then 'captain' else 'member' end,
  'joinOpen',t.join_open,'inviteCode',t.invite_code,'level',jhk_private.team_level(t.id),'points',(select coalesce(sum(points),0) from jhk_private.team_awards where team_id=t.id),
  'benefits',jsonb_build_array('Shared team tag','Private squad roster','Team matches and four-team cups','Earned cosmetic banners'),
  'members',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'nickname',s.nickname,'isCaptain',s.id=t.captain_id) order by m.joined_at,s.id) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=t.id and not s.deleted),'[]'::jsonb))
 from jhk_private.teams t join jhk_private.team_members own on own.team_id=t.id where own.session_id=p_self and t.archived_at is null
$$;
create or replace function jhk_private.team_score(p_fixture uuid,p_team uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('correct',(select count(*) from jhk_private.team_answers a join jhk_private.team_lineups l on l.fixture_id=a.fixture_id and l.session_id=a.session_id where a.fixture_id=f.id and l.team_id=p_team and a.correct),
  'elapsedMs',f.capacity*f.round_count*30000-coalesce((select sum(case when a.correct then 30000-a.elapsed_ms else 0 end) from jhk_private.team_answers a join jhk_private.team_lineups l on l.fixture_id=a.fixture_id and l.session_id=a.session_id where a.fixture_id=f.id and l.team_id=p_team),0),
  'completed',(select count(*) from jhk_private.team_runs r join jhk_private.team_lineups l on l.fixture_id=r.fixture_id and l.session_id=r.session_id where r.fixture_id=f.id and l.team_id=p_team and r.phase='finished' and (select count(*) from jhk_private.team_answers a where a.fixture_id=r.fixture_id and a.session_id=r.session_id and a.choice is not null)=f.round_count),
  'rosterSize',f.capacity) from jhk_private.team_fixtures f where f.id=p_fixture
$$;
create or replace function jhk_private.team_fixture_view(p_fixture uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',f.id,'status',f.status,'homeTeam',jhk_private.team_summary(f.home_team_id),'awayTeam',jhk_private.team_summary(f.away_team_id),
  'format',f.format,'roundCount',f.round_count,'capacity',f.capacity,'createdAt',jhk_private.ms(f.created_at),'acceptedAt',jhk_private.ms(f.accepted_at),'deadlineAt',jhk_private.ms(f.deadline_at),
  'tournamentId',f.tournament_id,'stage',f.stage,'homeScore',jhk_private.team_score(f.id,f.home_team_id),'awayScore',jhk_private.team_score(f.id,f.away_team_id),
  'winnerTeamId',f.winner_team_id,'tieBreak',f.tie_break) from jhk_private.team_fixtures f where f.id=p_fixture
$$;
create or replace function jhk_private.team_run_view(p_fixture uuid,p_self uuid) returns jsonb language plpgsql stable set search_path='' as $$
declare r jhk_private.team_runs; f jhk_private.team_fixtures; a jhk_private.team_answers; q jsonb; receipt jsonb;
begin
 select * into r from jhk_private.team_runs where fixture_id=p_fixture and session_id=p_self;
 if r.session_id is null then return null; end if;
 select * into f from jhk_private.team_fixtures where id=p_fixture;
 select * into a from jhk_private.team_answers where fixture_id=p_fixture and session_id=p_self and round=r.round;
 q:=f.deck->(r.round-1);
 if a.session_id is not null then receipt:=jsonb_build_object('choice',a.choice,'correct',a.correct,'correctIndex',(q->>'correctIndex')::integer,'elapsedMs',a.elapsed_ms,'explanation',q->'explanation','sourceUrl',q->>'sourceUrl'); end if;
 return jsonb_build_object('fixtureId',f.id,'phase',r.phase,'round',r.round,'roundCount',f.round_count,'startsAt',jhk_private.ms(r.issued_at),'deadlineAt',jhk_private.ms(r.deadline_at),'nextAt',jhk_private.ms(r.next_at),
  'question',case when q is null then null else q-'correctIndex'-'explanation'-'sourceUrl' end,'receipt',receipt,
  'correct',(select count(*) from jhk_private.team_answers where fixture_id=f.id and session_id=p_self and correct),
  'elapsedMs',coalesce((select sum(case when correct then elapsed_ms else 30000 end) from jhk_private.team_answers where fixture_id=f.id and session_id=p_self),0));
end $$;
create or replace function jhk_private.team_tournament_view(p_tournament uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',t.id,'name',t.name,'code',t.code,'capacity',t.capacity,'format',t.format,'status',t.status,'ownerTeamId',t.owner_team_id,'createdAt',jhk_private.ms(t.created_at),'winnerTeamId',t.winner_team_id,
  'tieRule','Correct answers, then lower total time. An exact tie advances the lower original seed; seeds follow entry order.',
  'entries',coalesce((select jsonb_agg(jsonb_build_object('team',jhk_private.team_summary(e.team_id),'seed',e.seed) order by e.seed) from jhk_private.team_tournament_entries e where e.tournament_id=t.id),'[]'::jsonb),
  'fixtures',coalesce((select jsonb_agg(jhk_private.team_fixture_view(f.id) order by f.created_at,f.slot) from jhk_private.team_fixtures f where f.tournament_id=t.id),'[]'::jsonb))
 from jhk_private.team_tournaments t where id=p_tournament
$$;
-- Membership freezes for the whole active cup, including the interval before its final.
create or replace function jhk_private.team_locked(p_team uuid) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from jhk_private.team_fixtures where status='active' and p_team in(home_team_id,away_team_id))
 or exists(select 1 from jhk_private.team_tournament_entries e join jhk_private.team_tournaments t on t.id=e.tournament_id where e.team_id=p_team and t.status='active')
$$;
create or replace function jhk_private.team_activate(p_fixture uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare f jhk_private.team_fixtures; d jsonb; n integer;
begin
 select * into f from jhk_private.team_fixtures where id=p_fixture for update;
 if f.status<>'pending' then return; end if;
 if (select count(*) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=f.home_team_id and not s.deleted)<>f.capacity
 or (select count(*) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=f.away_team_id and not s.deleted)<>f.capacity then raise exception using errcode='P0001',message='TEAM_ROSTER_REQUIRED'; end if;
 d:=jhk_private.make_rotated_deck('cricket',(select array_agg(session_id) from jhk_private.team_members where team_id in(f.home_team_id,f.away_team_id)),p_now,f.round_count);
 if jsonb_array_length(d)<f.round_count then raise exception using errcode='P0001',message='NO_QUESTIONS'; end if;
 insert into jhk_private.team_lineups(fixture_id,team_id,session_id,nickname_snapshot)
 select f.id,m.team_id,s.id,s.nickname from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id in(f.home_team_id,f.away_team_id) and not s.deleted on conflict do nothing;
 update jhk_private.team_fixtures set status='active',deck=d,accepted_at=p_now,deadline_at=p_now+interval '24 hours' where id=f.id;
end $$;

create or replace function jhk_private.team_advance_tournament(p_tournament uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare t jhk_private.team_tournaments; a uuid; b uuid; f uuid; captain uuid;
begin
 if p_tournament is null then return; end if;
 select * into t from jhk_private.team_tournaments where id=p_tournament for update;
 if t.status<>'active' then return; end if;
 select winner_team_id into a from jhk_private.team_fixtures where tournament_id=t.id and stage='final' and status='finished';
 if a is not null then update jhk_private.team_tournaments set status='finished',winner_team_id=a,finished_at=p_now where id=t.id; return; end if;
 if exists(select 1 from jhk_private.team_fixtures where tournament_id=t.id and stage='final') then return; end if;
 if (select count(*) from jhk_private.team_fixtures where tournament_id=t.id and stage='semifinal' and status='finished')<>2 then return; end if;
 select winner_team_id into a from jhk_private.team_fixtures where tournament_id=t.id and stage='semifinal' and slot=1;
 select winner_team_id into b from jhk_private.team_fixtures where tournament_id=t.id and stage='semifinal' and slot=2;
 select captain_id into captain from jhk_private.teams where id=a;
 insert into jhk_private.team_fixtures(home_team_id,away_team_id,created_by,capacity,format,round_count,tournament_id,stage,slot,created_at)
 values(a,b,captain,t.capacity,t.format,case when t.format='mini' then 3 else 6 end,t.id,'final',1,p_now) on conflict(tournament_id,stage,slot) do nothing returning id into f;
 if f is not null then
  -- Final eligibility uses the original frozen semifinal rosters, even after a deactivated profile.
  insert into jhk_private.team_lineups(fixture_id,team_id,session_id,nickname_snapshot)
   select f,l.team_id,l.session_id,l.nickname_snapshot from jhk_private.team_lineups l where l.fixture_id in(select id from jhk_private.team_fixtures where tournament_id=t.id and stage='semifinal') and l.team_id in(a,b) on conflict do nothing;
  update jhk_private.team_fixtures set status='active',accepted_at=p_now,deadline_at=p_now+interval '24 hours',
   deck=jhk_private.make_rotated_deck('cricket',(select array_agg(session_id) from jhk_private.team_lineups where fixture_id=f),p_now,case when t.format='mini' then 3 else 6 end) where id=f;
 end if;
end $$;
create or replace function jhk_private.team_settle(p_fixture uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare f jhk_private.team_fixtures; r record; a jsonb; b jsonb; winner uuid; seed_a integer; seed_b integer; v_tie text; team uuid; completed integer;
begin
 select * into f from jhk_private.team_fixtures where id=p_fixture for update;
 if f.status='pending' and f.created_at<p_now-interval '48 hours' then update jhk_private.team_fixtures set status='declined',finished_at=p_now where id=f.id; return; end if;
 if f.status<>'active' then return; end if;
 for r in select * from jhk_private.team_runs where fixture_id=f.id and phase='question' and deadline_at<=p_now loop
  insert into jhk_private.team_answers(fixture_id,session_id,round,choice,correct,elapsed_ms,received_at) values(f.id,r.session_id,r.round,null,false,30000,r.deadline_at) on conflict do nothing;
  update jhk_private.team_runs set phase=case when r.round=f.round_count then 'finished' else 'result' end,next_at=r.deadline_at,finished_at=case when r.round=f.round_count then p_now else null end where fixture_id=f.id and session_id=r.session_id;
 end loop;
 if p_now<f.deadline_at and (select count(*) from jhk_private.team_runs where fixture_id=f.id and phase='finished')<f.capacity*2 then return; end if;
 update jhk_private.team_runs set phase='finished',finished_at=coalesce(finished_at,p_now) where fixture_id=f.id;
 a:=jhk_private.team_score(f.id,f.home_team_id); b:=jhk_private.team_score(f.id,f.away_team_id);
 winner:=case when (a->>'correct')::int>(b->>'correct')::int then f.home_team_id when (b->>'correct')::int>(a->>'correct')::int then f.away_team_id
  when (a->>'elapsedMs')::bigint<(b->>'elapsedMs')::bigint then f.home_team_id when (b->>'elapsedMs')::bigint<(a->>'elapsedMs')::bigint then f.away_team_id else null end;
 if winner is null and f.tournament_id is not null then
  select seed into seed_a from jhk_private.team_tournament_entries where tournament_id=f.tournament_id and team_id=f.home_team_id;
  select seed into seed_b from jhk_private.team_tournament_entries where tournament_id=f.tournament_id and team_id=f.away_team_id;
  winner:=case when seed_a<seed_b then f.home_team_id else f.away_team_id end; v_tie:='lower-seed';
 end if;
 update jhk_private.team_fixtures set status='finished',winner_team_id=winner,tie_break=v_tie,finished_at=p_now where id=f.id;
 foreach team in array array[f.home_team_id,f.away_team_id] loop
  completed:=(case when team=f.home_team_id then a else b end->>'completed')::integer;
  insert into jhk_private.team_awards(team_id,fixture_id,points,awarded_at) values(team,f.id,case when completed>0 then completed*10+case when winner is null then 15 when winner=team then 30 else 0 end else 0 end,p_now) on conflict do nothing;
 end loop;
 perform jhk_private.team_advance_tournament(f.tournament_id,p_now);
end $$;

-- Additive public identity fields; join codes are deliberately absent from every profile projection.
create or replace function jhk_private.profile_json(p jhk_private.sessions,p_now timestamptz) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',p.id,'nickname',p.nickname,'email',p.email,'avatar',p.avatar,'locale',p.locale,'preferences',p.preferences,'adultConfirmed',p.adult_confirmed,'termsVersion',p.terms_version,'profileComplete',jhk_private.profile_complete(p),'expiresAt',jhk_private.ms(p.expires_at),'onlineXp',(select coalesce(sum(a.xp),0) from jhk_private.answers a where a.session_id=p.id)+(select coalesce(sum(amount),0) from jhk_private.over_xp where session_id=p.id))
 ||jhk_private.wallet(p.id)||jsonb_build_object('title',jhk_private.current_title(p.id,p_now),'humanRoad',jhk_private.human_road(p.id))
 ||coalesce((select jsonb_build_object('teamTag',t.tag,'teamName',t.name,'teamSize',t.capacity) from jhk_private.teams t join jhk_private.team_members m on m.team_id=t.id where m.session_id=p.id and t.archived_at is null),jsonb_build_object('teamTag',null,'teamName',null,'teamSize',null))
$$;
create or replace function jhk_private.team_reconcile(p_team uuid,p_now timestamptz,p_self uuid default null) returns void language plpgsql set search_path='' as $$
declare f record;
begin
 update jhk_private.team_tournaments t set status='cancelled',finished_at=p_now where t.status='open' and t.created_at<p_now-interval '48 hours' and exists(select 1 from jhk_private.team_tournament_entries e where e.tournament_id=t.id and e.team_id=p_team);
 for f in select distinct x.id from jhk_private.team_fixtures x where (p_team in(x.home_team_id,x.away_team_id) or exists(select 1 from jhk_private.team_lineups l where l.fixture_id=x.id and l.session_id=p_self) or exists(select 1 from jhk_private.team_tournament_entries e where e.tournament_id=x.tournament_id and e.team_id=p_team)) and x.status in('active','pending') order by x.id loop perform jhk_private.team_settle(f.id,p_now); end loop;
end $$;
create or replace function jhk_private.team_retire_open_entries(p_team uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare cup record; entry record; n integer;
begin
 for cup in select t.id,t.owner_team_id from jhk_private.team_tournaments t join jhk_private.team_tournament_entries e on e.tournament_id=t.id where e.team_id=p_team and t.status='open' order by t.id loop
  if cup.owner_team_id=p_team then update jhk_private.team_tournaments set status='cancelled',finished_at=p_now where id=cup.id;
  else
   delete from jhk_private.team_tournament_entries where tournament_id=cup.id and team_id=p_team;
   n:=0; for entry in select team_id from jhk_private.team_tournament_entries where tournament_id=cup.id order by seed loop n:=n+1; update jhk_private.team_tournament_entries set seed=n where tournament_id=cup.id and team_id=entry.team_id; end loop;
  end if;
 end loop;
end $$;
create or replace function jhk_private.team_dashboard(p_self uuid,p_now timestamptz,p_fixture uuid default null) returns jsonb language plpgsql set search_path='' as $$
declare team uuid;
begin
 select team_id into team from jhk_private.team_members where session_id=p_self;
 perform jhk_private.team_reconcile(team,p_now,p_self);
 return jsonb_build_object('ok',true,'serverNow',jhk_private.ms(p_now),'session',(select jhk_private.profile_json(s,p_now) from jhk_private.sessions s where s.id=p_self),
  'team',jhk_private.team_view(p_self),
  'fixtures',coalesce((select jsonb_agg(jhk_private.team_fixture_view(x.id) order by x.created_at desc) from (select f2.id,f2.created_at from jhk_private.team_fixtures f2 where team in(f2.home_team_id,f2.away_team_id) or exists(select 1 from jhk_private.team_lineups l where l.fixture_id=f2.id and l.session_id=p_self) order by f2.created_at desc limit 30) x),'[]'::jsonb),
  'tournaments',coalesce((select jsonb_agg(jhk_private.team_tournament_view(x.id) order by x.created_at desc) from (select distinct t.id,t.created_at from jhk_private.team_tournaments t join jhk_private.team_tournament_entries e on e.tournament_id=t.id where e.team_id=team order by t.created_at desc limit 10) x),'[]'::jsonb),
  'run',case when p_fixture is not null then jhk_private.team_run_view(p_fixture,p_self) else null end,
  'catalog',jsonb_build_object('emblems',jsonb_build_array(jsonb_build_object('id','bat','minLevel',1),jsonb_build_object('id','bolt','minLevel',1),jsonb_build_object('id','star','minLevel',2),jsonb_build_object('id','crown','minLevel',3)),
   'palettes',jsonb_build_array('teal','saffron','berry','blue'),'levels',jsonb_build_array(0,100,300,700)));
end $$;

create or replace function jhk_private.team_command(p_self uuid,p_payload jsonb,p_now timestamptz) returns jsonb language plpgsql set search_path='' as $$
declare op text:=coalesce(p_payload->>'op','dashboard'); own jhk_private.teams; other jhk_private.teams; f jhk_private.team_fixtures; cup jhk_private.team_tournaments;
 run jhk_private.team_runs; ans jhk_private.team_answers; n integer; v_capacity integer; v_format text; v_name text; v_emblem text; v_palette text; v_tag text; prefix text;
 target uuid; fid uuid; tid uuid; member uuid; winner uuid; q jsonb; v_choice integer; v_round integer; rid uuid; elapsed integer; is_correct boolean; rows integer; entry record;
begin
 -- The beta serializes short team transactions, never the 30-second thinking window.
 perform pg_advisory_xact_lock(726482942);
 select t.* into own from jhk_private.teams t join jhk_private.team_members m on m.team_id=t.id where m.session_id=p_self and t.archived_at is null for update of t;
 -- Reconcile deadlines before any lock/readiness decision, including the other cup semifinal.
 perform jhk_private.team_reconcile(own.id,p_now,p_self);
 if op='dashboard' then return jhk_private.team_dashboard(p_self,p_now); end if;
 if op='create' then
  if own.id is not null then return jhk_private.fail('ALREADY_IN_TEAM','Leave your current team before creating another.'); end if;
  v_name:=regexp_replace(btrim(p_payload->>'name'),'[[:cntrl:]]','','g'); v_capacity:=(p_payload->>'capacity')::integer;
  v_emblem:=coalesce(p_payload->>'emblem','bat'); v_palette:=coalesce(p_payload->>'palette','teal');
  if v_name is null or char_length(v_name) not between 2 and 32 or v_capacity not in(5,11) or v_capacity is null then return jhk_private.fail('BAD_TEAM','Choose a 2–32 character name and a team of 5 or 11.'); end if;
  if v_emblem not in('bat','bolt') then return jhk_private.fail('BANNER_LOCKED','Start with bat or bolt. Earn team marks to unlock more banners.'); end if;
  if v_palette not in('teal','saffron','berry','blue') then return jhk_private.fail('BAD_PALETTE','Choose an available team palette.'); end if;
  prefix:=left(regexp_replace(upper(v_name),'[^A-Z0-9]','','g'),4); if prefix='' then prefix:='JHK'; end if;
  for n in 1..8 loop
   v_tag:=prefix||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
   exit when not exists(select 1 from jhk_private.teams where tag=v_tag);
  end loop;
  insert into jhk_private.teams(name,tag,capacity,captain_id,emblem,palette,created_at) values(v_name,v_tag,v_capacity,p_self,v_emblem,v_palette,p_now) returning * into own;
  insert into jhk_private.team_members(team_id,session_id,joined_at) values(own.id,p_self,p_now);
  return jhk_private.team_dashboard(p_self,p_now);
 elsif op='join' then
  select * into other from jhk_private.teams where invite_code=upper(p_payload->>'code') and archived_at is null for update;
  if other.id is null then return jhk_private.fail('TEAM_NOT_FOUND','Check the private team invite code.'); end if;
  perform jhk_private.team_reconcile(other.id,p_now);
  if own.id=other.id then return jhk_private.team_dashboard(p_self,p_now); end if;
  if own.id is not null then return jhk_private.fail('ALREADY_IN_TEAM','You can belong to one team at a time.'); end if;
  if not other.join_open then return jhk_private.fail('TEAM_CLOSED','This captain has closed team invites.'); end if;
  if jhk_private.team_locked(other.id) then return jhk_private.fail('TEAM_LOCKED','This roster is locked until its active match or cup ends.'); end if;
  if (select count(*) from jhk_private.team_members where team_id=other.id)>=other.capacity then return jhk_private.fail('TEAM_FULL','This team is full.'); end if;
  insert into jhk_private.team_members(team_id,session_id,joined_at) values(other.id,p_self,p_now);
  return jhk_private.team_dashboard(p_self,p_now);
 end if;
 if own.id is null and op not in('fixture','play','answer','next') then return jhk_private.fail('TEAM_REQUIRED','Create or join a team first.'); end if;
 if op in('settings','rotateInvite','transfer','kick','challenge','accept','decline','tournamentCreate','tournamentStart','tournamentLeave') and own.captain_id<>p_self then return jhk_private.fail('CAPTAIN_REQUIRED','Only the team captain can do that.'); end if;
 if op='settings' then
  v_name:=coalesce(regexp_replace(btrim(p_payload->>'name'),'[[:cntrl:]]','','g'),own.name); v_emblem:=coalesce(p_payload->>'emblem',own.emblem); v_palette:=coalesce(p_payload->>'palette',own.palette);
  if char_length(v_name) not between 2 and 32 then return jhk_private.fail('BAD_TEAM','Use 2–32 characters for the team name.'); end if;
  if v_emblem not in('bat','bolt','crown','star') or v_palette not in('teal','saffron','berry','blue') then return jhk_private.fail('BAD_BANNER','Choose a supported emblem and palette.'); end if;
  if (v_emblem='star' and jhk_private.team_level(own.id)<2) or (v_emblem='crown' and jhk_private.team_level(own.id)<3) then return jhk_private.fail('BANNER_LOCKED','Earn more team marks to unlock this emblem.'); end if;
  if p_payload ? 'joinOpen' and jsonb_typeof(p_payload->'joinOpen')<>'boolean' then return jhk_private.fail('BAD_TEAM','Choose whether invites are open.'); end if;
  update jhk_private.teams set name=v_name,emblem=v_emblem,palette=v_palette,join_open=case when p_payload ? 'joinOpen' then (p_payload->>'joinOpen')::boolean else join_open end where id=own.id;
 elsif op='rotateInvite' then
  update jhk_private.teams set invite_code=upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)) where id=own.id;
 elsif op='transfer' then
  member:=(p_payload->>'memberId')::uuid;
  if not exists(select 1 from jhk_private.team_members where team_id=own.id and session_id=member) then return jhk_private.fail('MEMBER_NOT_FOUND','Choose a member of this team.'); end if;
  update jhk_private.teams set captain_id=member where id=own.id;
 elsif op in('kick','leave') then
  if jhk_private.team_locked(own.id) then return jhk_private.fail('TEAM_LOCKED','This roster is locked until its active match or cup ends.'); end if;
  member:=case when op='leave' then p_self else (p_payload->>'memberId')::uuid end;
  if member=own.captain_id and (op='kick' or (select count(*) from jhk_private.team_members where team_id=own.id)>1) then return jhk_private.fail('TRANSFER_REQUIRED','Pass captaincy to a teammate before leaving.'); end if;
  if not exists(select 1 from jhk_private.team_members where team_id=own.id and session_id=member) then return jhk_private.fail('MEMBER_NOT_FOUND','That player is not on this roster.'); end if;
  delete from jhk_private.team_members where team_id=own.id and session_id=member;
  if not exists(select 1 from jhk_private.team_members where team_id=own.id) then update jhk_private.teams set archived_at=p_now,join_open=false where id=own.id; perform jhk_private.team_retire_open_entries(own.id,p_now); end if;
 elsif op='challenge' then
  select * into other from jhk_private.teams where tag=upper(btrim(p_payload->>'targetTag')) and archived_at is null;
  if other.id is null then return jhk_private.fail('TEAM_NOT_FOUND','Check the other team’s public tag.'); end if;
  perform jhk_private.team_reconcile(other.id,p_now);
  if other.id=own.id then return jhk_private.fail('SAME_TEAM','Choose another team.'); end if;
  if own.capacity<>other.capacity then return jhk_private.fail('TEAM_SIZE_MISMATCH','Both teams must have the same squad size.'); end if;
  if jhk_private.team_locked(own.id) or jhk_private.team_locked(other.id) then return jhk_private.fail('TEAM_LOCKED','A team is already playing an active match or cup.'); end if;
  v_format:=coalesce(p_payload->>'format','mini'); if v_format not in('mini','full') then return jhk_private.fail('BAD_FORMAT','Choose Mini over or Full over.'); end if;
  if (select count(*) from jhk_private.team_fixtures where status='pending' and own.id in(home_team_id,away_team_id) and created_at>p_now-interval '48 hours')>=5 then return jhk_private.fail('TEAM_INVITE_LIMIT','Finish or decline a pending challenge before sending more.'); end if;
  select id into fid from jhk_private.team_fixtures where status='pending' and ((home_team_id=own.id and away_team_id=other.id) or(home_team_id=other.id and away_team_id=own.id)) and created_at>p_now-interval '48 hours' limit 1;
  if fid is null then insert into jhk_private.team_fixtures(home_team_id,away_team_id,created_by,capacity,format,round_count,created_at) values(own.id,other.id,p_self,own.capacity,v_format,case when v_format='mini' then 3 else 6 end,p_now) returning id into fid; end if;
 elsif op in('accept','decline') then
  fid:=(p_payload->>'fixtureId')::uuid; select * into f from jhk_private.team_fixtures where id=fid for update;
  if f.id is null or own.id<>f.away_team_id or f.tournament_id is not null then return jhk_private.fail('FORBIDDEN','Only the challenged captain can respond to this invitation.'); end if;
  if f.status='active' and op='accept' then return jhk_private.team_dashboard(p_self,p_now,fid); end if;
  if f.status<>'pending' then return jhk_private.fail('FIXTURE_CLOSED','This invitation is no longer open.'); end if;
  if op='decline' then update jhk_private.team_fixtures set status='declined',finished_at=p_now where id=fid;
  else
   if jhk_private.team_locked(f.home_team_id) or jhk_private.team_locked(f.away_team_id) then return jhk_private.fail('TEAM_LOCKED','A team is already playing an active match or cup.'); end if;
   perform jhk_private.team_activate(fid,p_now);
  end if;
 elsif op in('fixture','play','answer','next') then
  fid:=(p_payload->>'fixtureId')::uuid; select * into f from jhk_private.team_fixtures where id=fid for update;
  if f.id is null or not exists(select 1 from jhk_private.team_lineups where fixture_id=fid and session_id=p_self) and (own.id is null or own.id not in(f.home_team_id,f.away_team_id)) then return jhk_private.fail('FORBIDDEN','This is not your team fixture.'); end if;
  perform jhk_private.team_settle(fid,p_now); select * into f from jhk_private.team_fixtures where id=fid;
  if op='fixture' then return jhk_private.team_dashboard(p_self,p_now,fid); end if;
  if not exists(select 1 from jhk_private.team_lineups where fixture_id=fid and session_id=p_self) then return jhk_private.fail('NOT_IN_LINEUP','Only this match’s frozen roster can contribute.'); end if;
  select * into run from jhk_private.team_runs where fixture_id=fid and session_id=p_self for update;
  if op='play' then
   if run.session_id is null and f.status='active' then
    insert into jhk_private.team_runs(fixture_id,session_id,round,phase,started_at,issued_at,deadline_at) values(fid,p_self,1,'question',p_now,p_now,least(p_now+interval '30 seconds',f.deadline_at));
    q:=f.deck->0; insert into jhk_private.question_seen(session_id,family_key,seen_at) values(p_self,jhk_private.question_family(q),p_now) on conflict(session_id,family_key) do update set seen_at=greatest(jhk_private.question_seen.seen_at,excluded.seen_at);
   elsif run.session_id is null then return jhk_private.fail('FIXTURE_CLOSED','This match is no longer accepting contributions.'); end if;
  elsif op='answer' then
   v_round:=(p_payload->>'round')::integer; v_choice:=(p_payload->>'choice')::integer; rid:=(p_payload->>'requestId')::uuid;
   if v_round is null or v_round not between 1 and f.round_count or v_choice is null or v_choice not between 0 and 3 or rid is null then return jhk_private.fail('BAD_ANSWER','Choose one answer for the current ball.'); end if;
   select * into ans from jhk_private.team_answers where session_id=p_self and request_id=rid;
   if ans.session_id is not null and (ans.fixture_id<>fid or ans.round<>v_round) then return jhk_private.fail('REQUEST_REUSED','That answer request belongs to another ball.'); end if;
   if exists(select 1 from jhk_private.team_answers where fixture_id=fid and session_id=p_self and round=v_round) then return jhk_private.team_dashboard(p_self,p_now,fid); end if;
   if f.status<>'active' or run.session_id is null or run.phase<>'question' or run.round<>v_round then return jhk_private.fail('BAD_ROUND','Resume the current ball before answering.'); end if;
   q:=f.deck->(v_round-1); is_correct:=v_choice=(q->>'correctIndex')::integer; elapsed:=greatest(0,least(30000,jhk_private.ms(p_now)-jhk_private.ms(run.issued_at)));
   insert into jhk_private.team_answers(fixture_id,session_id,round,request_id,choice,correct,elapsed_ms,received_at) values(fid,p_self,v_round,rid,v_choice,is_correct,elapsed,p_now);
   update jhk_private.team_runs set phase=case when v_round=f.round_count then 'finished' else 'result' end,next_at=p_now,finished_at=case when v_round=f.round_count then p_now else null end where fixture_id=fid and session_id=p_self;
  elsif op='next' then
   if f.status='active' and run.phase='result' and p_now>=run.next_at then
    update jhk_private.team_runs set round=round+1,phase='question',issued_at=p_now,deadline_at=least(p_now+interval '30 seconds',f.deadline_at),next_at=null where fixture_id=fid and session_id=p_self returning * into run;
    q:=f.deck->(run.round-1); insert into jhk_private.question_seen(session_id,family_key,seen_at) values(p_self,jhk_private.question_family(q),p_now) on conflict(session_id,family_key) do update set seen_at=greatest(jhk_private.question_seen.seen_at,excluded.seen_at);
   end if;
  end if;
  perform jhk_private.team_settle(fid,p_now);
 elsif op='tournamentCreate' then
  if jhk_private.team_locked(own.id) then return jhk_private.fail('TEAM_LOCKED','Finish the current match or cup first.'); end if;
  if exists(select 1 from jhk_private.team_tournament_entries e join jhk_private.team_tournaments t on t.id=e.tournament_id where e.team_id=own.id and t.status in('open','active')) then return jhk_private.fail('TOURNAMENT_EXISTS','Your team already has an open or active cup.'); end if;
  v_name:=btrim(p_payload->>'name'); v_format:=coalesce(p_payload->>'format','mini');
  if v_name is null or char_length(v_name) not between 2 and 40 or v_format not in('mini','full') then return jhk_private.fail('BAD_TOURNAMENT','Choose a 2–40 character cup name and over format.'); end if;
  insert into jhk_private.team_tournaments(owner_team_id,name,capacity,format,created_at) values(own.id,v_name,own.capacity,v_format,p_now) returning id into tid;
  insert into jhk_private.team_tournament_entries(tournament_id,team_id,seed,joined_at) values(tid,own.id,1,p_now);
 elsif op='tournamentJoin' then
  select * into cup from jhk_private.team_tournaments where code=upper(p_payload->>'code') for update;
  if cup.id is null then return jhk_private.fail('TOURNAMENT_NOT_FOUND','Check the cup invite code.'); end if;
  if exists(select 1 from jhk_private.team_tournament_entries where tournament_id=cup.id and team_id=own.id) then return jhk_private.team_dashboard(p_self,p_now); end if;
  if own.captain_id<>p_self then return jhk_private.fail('CAPTAIN_REQUIRED','Your captain enters the team into a cup.'); end if;
  if cup.status<>'open' then return jhk_private.fail('TOURNAMENT_CLOSED','This cup has already started.'); end if;
  if cup.capacity<>own.capacity then return jhk_private.fail('TEAM_SIZE_MISMATCH','This cup needs the same squad size as your team.'); end if;
  if jhk_private.team_locked(own.id) or exists(select 1 from jhk_private.team_tournament_entries e join jhk_private.team_tournaments t on t.id=e.tournament_id where e.team_id=own.id and t.status in('open','active')) then return jhk_private.fail('TOURNAMENT_EXISTS','Finish or leave your current cup first.'); end if;
  select count(*) into n from jhk_private.team_tournament_entries where tournament_id=cup.id;
  if n>=4 then return jhk_private.fail('TOURNAMENT_FULL','Four teams have already entered this cup.'); end if;
  insert into jhk_private.team_tournament_entries(tournament_id,team_id,seed,joined_at) values(cup.id,own.id,n+1,p_now);
 elsif op='tournamentStart' then
  tid:=(p_payload->>'tournamentId')::uuid; select * into cup from jhk_private.team_tournaments where id=tid for update;
  if cup.id is null or cup.owner_team_id<>own.id then return jhk_private.fail('FORBIDDEN','Only the host team’s captain can start this cup.'); end if;
  if cup.status='active' then return jhk_private.team_dashboard(p_self,p_now); end if;
  if cup.status<>'open' then return jhk_private.fail('TOURNAMENT_CLOSED','This cup has ended.'); end if;
  if (select count(*) from jhk_private.team_tournament_entries where tournament_id=tid)<>4 then return jhk_private.fail('FOUR_TEAMS_REQUIRED','Invite four teams before starting the cup.'); end if;
  if exists(select 1 from jhk_private.team_tournament_entries e join jhk_private.teams t on t.id=e.team_id where e.tournament_id=tid and (t.archived_at is not null or (select count(*) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=t.id and not s.deleted)<>cup.capacity)) then return jhk_private.fail('TEAM_ROSTER_REQUIRED','Every team needs a complete roster before the cup starts.'); end if;
  if exists(select 1 from jhk_private.team_tournament_entries e where e.tournament_id=tid and jhk_private.team_locked(e.team_id)) then return jhk_private.fail('TEAM_LOCKED','An entered team is still in another match or cup.'); end if;
  for n in 1..2 loop
   select team_id into target from jhk_private.team_tournament_entries where tournament_id=tid and seed=n;
   select team_id into member from jhk_private.team_tournament_entries where tournament_id=tid and seed=5-n;
   insert into jhk_private.team_fixtures(home_team_id,away_team_id,created_by,capacity,format,round_count,tournament_id,stage,slot,created_at) values(target,member,p_self,cup.capacity,cup.format,case when cup.format='mini' then 3 else 6 end,tid,'semifinal',n,p_now) returning id into fid;
   perform jhk_private.team_activate(fid,p_now);
  end loop;
  update jhk_private.team_tournaments set status='active',started_at=p_now where id=tid;
 elsif op='tournamentLeave' then
  tid:=(p_payload->>'tournamentId')::uuid; select * into cup from jhk_private.team_tournaments where id=tid for update;
  if cup.id is null or not exists(select 1 from jhk_private.team_tournament_entries where tournament_id=tid and team_id=own.id) then return jhk_private.fail('FORBIDDEN','This is not your team’s cup.'); end if;
  if cup.status<>'open' then return jhk_private.fail('TOURNAMENT_LOCKED','Only an open cup can be left or cancelled.'); end if;
  if cup.owner_team_id=own.id then update jhk_private.team_tournaments set status='cancelled',finished_at=p_now where id=tid;
  else
   delete from jhk_private.team_tournament_entries where tournament_id=tid and team_id=own.id;
   n:=0; for entry in select team_id from jhk_private.team_tournament_entries where tournament_id=tid order by seed loop
    n:=n+1; update jhk_private.team_tournament_entries set seed=n where tournament_id=tid and team_id=entry.team_id;
   end loop;
  end if;
 else return jhk_private.fail('BAD_TEAM_ACTION','Choose a supported team action.');
 end if;
 return jhk_private.team_dashboard(p_self,p_now,fid);
exception when raise_exception then
 if sqlerrm='TEAM_ROSTER_REQUIRED' then return jhk_private.fail('TEAM_ROSTER_REQUIRED','Both teams need a complete roster before this match starts.'); end if;
 if sqlerrm='NO_QUESTIONS' then return jhk_private.fail('NO_QUESTIONS','The cricket bank cannot supply this format right now.'); end if;
 raise;
when invalid_text_representation or numeric_value_out_of_range or check_violation or not_null_violation or unique_violation then return jhk_private.fail('BAD_INPUT','Check the team details and try again.');
end $$;

create or replace function jhk_private.team_delete_profile(p_self uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare team uuid; replacement uuid;
begin
 perform pg_advisory_xact_lock(726482942);
 select team_id into team from jhk_private.team_members where session_id=p_self;
 update jhk_private.team_lineups set nickname_snapshot='Deleted player' where session_id=p_self;
 if team is null then return; end if;
 delete from jhk_private.team_members where session_id=p_self;
 select m.session_id into replacement from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=team and not s.deleted order by m.joined_at,m.session_id limit 1;
 if replacement is null then update jhk_private.teams set archived_at=p_now,join_open=false where id=team; perform jhk_private.team_retire_open_entries(team,p_now);
 else update jhk_private.teams set captain_id=case when captain_id=p_self then replacement else captain_id end where id=team; end if;
end $$;

-- Preserve the installed command body exactly once, so upgrades retain current solo behavior.
do $$ begin
 if to_regprocedure('public.jhk_command_before_teams(text,text,jsonb,text)') is null then
  alter function public.jhk_command(text,text,jsonb,text) rename to jhk_command_before_teams;
 end if;
end $$;
create or replace function public.jhk_command(p_session_hash text,p_action text,p_payload jsonb default '{}'::jsonb,p_network_hash text default '') returns jsonb
language plpgsql security invoker set search_path='' as $$
declare answer jsonb; s jhk_private.sessions; t timestamptz:=clock_timestamp();
begin
 if p_action='team' then
  -- Reuse exactly the existing bearer, expiry, rate-limit and profile checks.
  answer:=public.jhk_command_before_teams(p_session_hash,'profile','{}'::jsonb,p_network_hash);
  if not coalesce((answer->>'ok')::boolean,false) then return answer; end if;
  select * into s from jhk_private.sessions where token_hash=p_session_hash and not deleted;
  if not jhk_private.profile_complete(s) then return jhk_private.fail('PROFILE_REQUIRED','Complete your player profile before joining a team.'); end if;
  return jhk_private.team_command(s.id,p_payload,t);
 end if;
 answer:=public.jhk_command_before_teams(p_session_hash,p_action,p_payload,p_network_hash);
 if p_action='deleteSession' and coalesce((answer->>'ok')::boolean,false) then
  select * into s from jhk_private.sessions where token_hash=p_session_hash;
  perform jhk_private.team_delete_profile(s.id,t);
 elsif p_action='exportProfile' and coalesce((answer->>'ok')::boolean,false) then
  select * into s from jhk_private.sessions where token_hash=p_session_hash and not deleted;
  answer:=answer||jsonb_build_object('team',jhk_private.team_view(s.id),'teamContributions',coalesce((select jsonb_agg(jsonb_build_object('fixtureId',a.fixture_id,'round',a.round,'choice',a.choice,'correct',a.correct,'elapsedMs',a.elapsed_ms,'receivedAt',a.received_at) order by a.received_at) from jhk_private.team_answers a where session_id=s.id),'[]'::jsonb));
 end if;
 return answer;
end $$;

do $$ declare name text; begin
 foreach name in array array['teams','team_members','team_tournaments','team_tournament_entries','team_fixtures','team_lineups','team_runs','team_answers','team_awards'] loop
  execute format('alter table jhk_private.%I enable row level security',name);
  execute format('revoke all on jhk_private.%I from public,anon,authenticated',name);
  execute format('grant all on jhk_private.%I to service_role',name);
 end loop;
end $$;
revoke all on all functions in schema jhk_private from public,anon,authenticated;
grant execute on all functions in schema jhk_private to service_role;
revoke all on function public.jhk_command(text,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.jhk_command_before_teams(text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.jhk_command(text,text,jsonb,text) to service_role;
grant execute on function public.jhk_command_before_teams(text,text,jsonb,text) to service_role;
