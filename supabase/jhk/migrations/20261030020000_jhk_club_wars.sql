-- Team Pavilion club wars: 22 members, a separate playing side, preparation and battle.
-- Existing active/finished fixtures retain their accepted line-ups and deadlines.
alter table jhk_private.team_members add column if not exists is_selected boolean not null default true;
alter table jhk_private.team_members alter column is_selected set default false;
alter table jhk_private.team_members add column if not exists role_tag text not null default 'member';
alter table jhk_private.team_members add column if not exists fun_badge text not null default 'none';
alter table jhk_private.team_members add column if not exists fun_badge_consent boolean not null default false;
alter table jhk_private.team_members drop constraint if exists club_role_check;
alter table jhk_private.team_members add constraint club_role_check check(role_tag in('member','vice-captain','coach'));
alter table jhk_private.team_members drop constraint if exists club_badge_check;
alter table jhk_private.team_members add constraint club_badge_check check(fun_badge in('none','bottle-boy','analyst','keeper','finisher','cheer-captain') and (fun_badge='none' or fun_badge_consent));
create unique index if not exists jhk_club_one_vc on jhk_private.team_members(team_id) where role_tag='vice-captain';
create unique index if not exists jhk_club_one_coach on jhk_private.team_members(team_id) where role_tag='coach';
alter table jhk_private.team_lineups add column if not exists role_snapshot text not null default 'member';
alter table jhk_private.team_lineups add column if not exists badge_snapshot text not null default 'none';
alter table jhk_private.team_fixtures add column if not exists war_version integer not null default 0;
alter table jhk_private.team_fixtures alter column war_version set default 1;
alter table jhk_private.team_fixtures add column if not exists prep_ends_at timestamptz;
alter table jhk_private.team_fixtures add column if not exists battle_starts_at timestamptz;
alter table jhk_private.team_fixtures add column if not exists home_ready boolean not null default false;
alter table jhk_private.team_fixtures add column if not exists away_ready boolean not null default false;
alter table jhk_private.team_fixtures add column if not exists available_at timestamptz;
alter table jhk_private.team_fixtures add column if not exists recurrence text not null default 'none';
alter table jhk_private.team_fixtures add column if not exists recurrence_confirmed boolean not null default false;
alter table jhk_private.team_fixtures add column if not exists recurrence_stopped boolean not null default false;
alter table jhk_private.team_fixtures add column if not exists series_id uuid;
alter table jhk_private.team_fixtures add column if not exists previous_fixture_id uuid references jhk_private.team_fixtures(id);
alter table jhk_private.team_fixtures add column if not exists next_fixture_id uuid references jhk_private.team_fixtures(id);
alter table jhk_private.team_fixtures add column if not exists settlement_reason text;
alter table jhk_private.team_fixtures add column if not exists draft_sent_at timestamptz;
alter table jhk_private.team_fixtures drop constraint if exists team_fixtures_status_check;
alter table jhk_private.team_fixtures add constraint team_fixtures_status_check check(status in('pending','preparation','active','finished','declined'));
alter table jhk_private.team_fixtures drop constraint if exists club_recurrence_check;
alter table jhk_private.team_fixtures add constraint club_recurrence_check check(recurrence in('none','weekly'));
create unique index if not exists jhk_club_one_next_draft on jhk_private.team_fixtures(previous_fixture_id) where previous_fixture_id is not null;

create or replace function jhk_private.club_permissions(p_team uuid,p_self uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('manageClub',t.captain_id=p_self,'manageLineup',t.captain_id=p_self or m.role_tag in('vice-captain','coach'),'arrangeMatches',t.captain_id=p_self or m.role_tag='vice-captain')
 from jhk_private.teams t join jhk_private.team_members m on m.team_id=t.id and m.session_id=p_self where t.id=p_team
$$;
create or replace function jhk_private.team_summary(p_team uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',t.id,'name',t.name,'tag',t.tag,'capacity',t.capacity,'rosterLimit',22,'emblem',t.emblem,'palette',t.palette,
 'memberCount',(select count(*) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=t.id and not s.deleted),
 'selectedCount',(select count(*) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=t.id and not s.deleted and m.is_selected)) from jhk_private.teams t where t.id=p_team
$$;
create or replace function jhk_private.team_view(p_self uuid) returns jsonb language sql stable set search_path='' as $$
 select jhk_private.team_summary(t.id)||jsonb_build_object('captainId',t.captain_id,'role',case when t.captain_id=p_self then 'captain' else me.role_tag end,
 'permissions',jhk_private.club_permissions(t.id,p_self),'selectedMemberIds',coalesce((select jsonb_agg(m.session_id order by m.joined_at,m.session_id) from jhk_private.team_members m where m.team_id=t.id and m.is_selected),'[]'::jsonb),
 'joinOpen',t.join_open,'inviteCode',t.invite_code,'level',jhk_private.team_level(t.id),'points',(select coalesce(sum(points),0) from jhk_private.team_awards where team_id=t.id),
 'benefits',jsonb_build_array('One club tag and banner','22-member club with a separate playing side','Preparation, substitutions and club wars','Earned cosmetic banners'),
 'members',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'nickname',s.nickname,'isCaptain',s.id=t.captain_id,'role',case when s.id=t.captain_id then 'captain' else m.role_tag end,'funBadge',m.fun_badge,'funBadgeConsent',m.fun_badge_consent,'isSelected',m.is_selected,'isReserve',not m.is_selected) order by m.is_selected desc,m.joined_at,s.id) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=t.id and not s.deleted),'[]'::jsonb))
 from jhk_private.teams t join jhk_private.team_members me on me.team_id=t.id where me.session_id=p_self and t.archived_at is null
$$;
create or replace function jhk_private.club_lineup_json(p_fixture uuid,p_team uuid) returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',session_id,'nickname',nickname_snapshot,'role',role_snapshot,'funBadge',badge_snapshot) order by nickname_snapshot,session_id),'[]'::jsonb) from jhk_private.team_lineups where fixture_id=p_fixture and team_id=p_team
$$;
create or replace function jhk_private.team_fixture_view(p_fixture uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',f.id,'status',f.status,'homeTeam',jhk_private.team_summary(f.home_team_id),'awayTeam',jhk_private.team_summary(f.away_team_id),
 'format',f.format,'roundCount',f.round_count,'capacity',f.capacity,'createdAt',jhk_private.ms(f.created_at),'acceptedAt',jhk_private.ms(f.accepted_at),'deadlineAt',jhk_private.ms(f.deadline_at),
 'warVersion',f.war_version,'prepEndsAt',jhk_private.ms(f.prep_ends_at),'battleStartsAt',jhk_private.ms(f.battle_starts_at),'availableAt',jhk_private.ms(f.available_at),'draftSentAt',jhk_private.ms(f.draft_sent_at),
 'ready',jsonb_build_object('home',f.home_ready,'away',f.away_ready),'lineups',jsonb_build_object('home',jhk_private.club_lineup_json(f.id,f.home_team_id),'away',jhk_private.club_lineup_json(f.id,f.away_team_id)),
 'recurrence',jsonb_build_object('cadence',f.recurrence,'confirmed',f.recurrence_confirmed,'stopped',f.recurrence_stopped,'isDraft',f.previous_fixture_id is not null,'homeConfirmed',f.previous_fixture_id is null or f.draft_sent_at is not null,'nextDraftAt',(select jhk_private.ms(available_at) from jhk_private.team_fixtures where id=f.next_fixture_id),'nextFixtureId',f.next_fixture_id),
 'settlementReason',f.settlement_reason,'tournamentId',f.tournament_id,'stage',f.stage,'homeScore',jhk_private.team_score(f.id,f.home_team_id),'awayScore',jhk_private.team_score(f.id,f.away_team_id),
 'winnerTeamId',f.winner_team_id,'tieBreak',f.tie_break) from jhk_private.team_fixtures f where f.id=p_fixture
$$;
create or replace function jhk_private.club_set_lineup(p_fixture uuid,p_team uuid,p_members uuid[],p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare f jhk_private.team_fixtures; n integer;
begin
 select * into f from jhk_private.team_fixtures where id=p_fixture for update;
 if f.status<>'preparation' or p_now>=f.prep_ends_at then raise exception using errcode='P0001',message='LINEUP_LOCKED'; end if;
 if p_team not in(f.home_team_id,f.away_team_id) then raise exception using errcode='P0001',message='LINEUP_FORBIDDEN'; end if;
 select count(distinct x) into n from unnest(p_members) x;
 if p_members is null or n<>f.capacity or cardinality(p_members)<>f.capacity or exists(select 1 from unnest(p_members) x where not exists(select 1 from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=p_team and m.session_id=x and not s.deleted)) then raise exception using errcode='P0001',message='TEAM_ROSTER_REQUIRED'; end if;
 if exists(select 1 from jhk_private.team_runs where fixture_id=f.id) then raise exception using errcode='P0001',message='LINEUP_LOCKED'; end if;
 delete from jhk_private.team_lineups where fixture_id=f.id and team_id=p_team;
 insert into jhk_private.team_lineups(fixture_id,team_id,session_id,nickname_snapshot,role_snapshot,badge_snapshot)
 select f.id,p_team,s.id,s.nickname,case when t.captain_id=s.id then 'captain' else m.role_tag end,m.fun_badge from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id join jhk_private.teams t on t.id=m.team_id where m.team_id=p_team and m.session_id=any(p_members);
 update jhk_private.team_members set is_selected=session_id=any(p_members) where team_id=p_team;
 update jhk_private.team_fixtures set home_ready=false,away_ready=false where id=f.id;
end $$;
create or replace function jhk_private.club_begin_battle(p_fixture uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare f jhk_private.team_fixtures; d jsonb;
begin
 select * into f from jhk_private.team_fixtures where id=p_fixture for update;
 if f.status<>'preparation' or (p_now<f.prep_ends_at and not(f.home_ready and f.away_ready)) then return; end if;
 if (select count(*) from jhk_private.team_lineups l join jhk_private.sessions s on s.id=l.session_id where l.fixture_id=f.id and l.team_id=f.home_team_id and not s.deleted)<>f.capacity or (select count(*) from jhk_private.team_lineups l join jhk_private.sessions s on s.id=l.session_id where l.fixture_id=f.id and l.team_id=f.away_team_id and not s.deleted)<>f.capacity then
  if p_now>=f.prep_ends_at then
   update jhk_private.team_fixtures set status='declined',finished_at=p_now,settlement_reason='incomplete-lineup' where id=f.id or (f.tournament_id is not null and tournament_id=f.tournament_id and status in('pending','preparation','active'));
   if f.tournament_id is not null then update jhk_private.team_tournaments set status='cancelled',finished_at=p_now where id=f.tournament_id; end if;
  end if;
  return;
 end if;
 d:=jhk_private.make_rotated_deck('cricket',(select array_agg(session_id) from jhk_private.team_lineups where fixture_id=f.id),p_now,f.round_count);
 if jsonb_array_length(d)<>f.round_count then raise exception using errcode='P0001',message='NO_QUESTIONS'; end if;
 update jhk_private.team_fixtures set status='active',deck=d,battle_starts_at=case when p_now>=prep_ends_at then prep_ends_at else p_now end,
  deadline_at=(case when p_now>=prep_ends_at then prep_ends_at else p_now end)+interval '24 hours' where id=f.id;
end $$;
create or replace function jhk_private.team_activate(p_fixture uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare f jhk_private.team_fixtures; d jsonb;
begin
 select * into f from jhk_private.team_fixtures where id=p_fixture for update;
 if f.status<>'pending' then return; end if;
 if f.previous_fixture_id is not null and (f.draft_sent_at is null or (select count(*) from jhk_private.team_lineups l join jhk_private.team_members m on m.team_id=l.team_id and m.session_id=l.session_id join jhk_private.sessions s on s.id=l.session_id where l.fixture_id=f.id and l.team_id=f.home_team_id and not s.deleted)<>f.capacity) then raise exception using errcode='P0001',message='TEAM_ROSTER_REQUIRED'; end if;
 if (select count(*) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=f.home_team_id and m.is_selected and not s.deleted)<>f.capacity or (select count(*) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=f.away_team_id and m.is_selected and not s.deleted)<>f.capacity then raise exception using errcode='P0001',message='TEAM_ROSTER_REQUIRED'; end if;
 insert into jhk_private.team_lineups(fixture_id,team_id,session_id,nickname_snapshot,role_snapshot,badge_snapshot)
 select f.id,m.team_id,s.id,s.nickname,case when t.captain_id=s.id then 'captain' else m.role_tag end,m.fun_badge from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id join jhk_private.teams t on t.id=m.team_id where m.team_id in(f.home_team_id,f.away_team_id) and (f.previous_fixture_id is null or m.team_id<>f.home_team_id) and m.is_selected and not s.deleted on conflict do nothing;
 if f.war_version=0 then
  d:=jhk_private.make_rotated_deck('cricket',(select array_agg(session_id) from jhk_private.team_lineups where fixture_id=f.id),p_now,f.round_count);
  if jsonb_array_length(d)<>f.round_count then raise exception using errcode='P0001',message='NO_QUESTIONS'; end if;
  update jhk_private.team_fixtures set status='active',deck=d,accepted_at=p_now,battle_starts_at=p_now,deadline_at=p_now+interval '24 hours' where id=f.id;
 else
  update jhk_private.team_fixtures set status='preparation',accepted_at=p_now,prep_ends_at=p_now+interval '23 hours',battle_starts_at=p_now+interval '23 hours',deadline_at=p_now+interval '47 hours',home_ready=false,away_ready=false where id=f.id;
 end if;
end $$;
create or replace function jhk_private.club_next_draft(p_fixture uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare f jhk_private.team_fixtures; next_at timestamptz; next_id uuid; captain uuid;
begin
 select * into f from jhk_private.team_fixtures where id=p_fixture for update;
 if f.status<>'finished' or f.stage<>'friendly' or f.recurrence<>'weekly' or not f.recurrence_confirmed or f.recurrence_stopped or f.next_fixture_id is not null then return; end if;
 if exists(select 1 from jhk_private.teams where id in(f.home_team_id,f.away_team_id) and archived_at is not null) then update jhk_private.team_fixtures set recurrence_stopped=true,recurrence_confirmed=false where id=f.id; return; end if;
 next_at:=coalesce(f.accepted_at,f.created_at)+interval '7 days';
 while next_at<=p_now loop next_at:=next_at+interval '7 days'; end loop;
 select captain_id into captain from jhk_private.teams where id=f.home_team_id;
 insert into jhk_private.team_fixtures(home_team_id,away_team_id,created_by,capacity,format,round_count,created_at,available_at,recurrence,series_id,previous_fixture_id)
 values(f.home_team_id,f.away_team_id,captain,f.capacity,f.format,f.round_count,p_now,next_at,'weekly',coalesce(f.series_id,f.id),f.id)
 on conflict(previous_fixture_id) where previous_fixture_id is not null do nothing returning id into next_id;
 if next_id is not null then update jhk_private.team_fixtures set next_fixture_id=next_id where id=f.id; end if;
end $$;

create or replace function jhk_private.team_advance_tournament(p_tournament uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare t jhk_private.team_tournaments; a uuid; b uuid; f uuid; captain uuid; v_version integer;
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
 select coalesce(min(war_version),0) into v_version from jhk_private.team_fixtures where tournament_id=t.id and stage='semifinal';
 insert into jhk_private.team_fixtures(home_team_id,away_team_id,created_by,capacity,format,round_count,tournament_id,stage,slot,created_at,war_version)
 values(a,b,captain,t.capacity,t.format,case when t.format='mini' then 3 else 6 end,t.id,'final',1,p_now,v_version) on conflict(tournament_id,stage,slot) do nothing returning id into f;
 if f is not null and v_version=0 then
  -- Final eligibility uses the original frozen semifinal rosters, even after a deactivated profile.
  insert into jhk_private.team_lineups(fixture_id,team_id,session_id,nickname_snapshot)
   select f,l.team_id,l.session_id,l.nickname_snapshot from jhk_private.team_lineups l where l.fixture_id in(select id from jhk_private.team_fixtures where tournament_id=t.id and stage='semifinal') and l.team_id in(a,b) on conflict do nothing;
  update jhk_private.team_fixtures set status='active',accepted_at=p_now,deadline_at=p_now+interval '24 hours',
   deck=jhk_private.make_rotated_deck('cricket',(select array_agg(session_id) from jhk_private.team_lineups where fixture_id=f),p_now,case when t.format='mini' then 3 else 6 end) where id=f;
 elsif f is not null then
  insert into jhk_private.team_lineups(fixture_id,team_id,session_id,nickname_snapshot,role_snapshot,badge_snapshot)
   select f,m.team_id,s.id,s.nickname,case when s.id=tm.captain_id then 'captain' else m.role_tag end,m.fun_badge from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id join jhk_private.teams tm on tm.id=m.team_id where m.team_id in(a,b) and m.is_selected and not s.deleted;
  update jhk_private.team_fixtures set status='preparation',accepted_at=p_now,prep_ends_at=p_now+interval '23 hours',battle_starts_at=p_now+interval '23 hours',deadline_at=p_now+interval '47 hours' where id=f;
 end if;
end $$;

create or replace function jhk_private.team_settle(p_fixture uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare f jhk_private.team_fixtures; r record; a jsonb; b jsonb; winner uuid; seed_a integer; seed_b integer; v_tie text; team uuid; completed integer;
begin
 select * into f from jhk_private.team_fixtures where id=p_fixture for update;
 if f.status='pending' and greatest(f.created_at,coalesce(f.available_at,f.created_at),coalesce(f.draft_sent_at,f.created_at))<p_now-interval '48 hours' then update jhk_private.team_fixtures set status='declined',finished_at=p_now,settlement_reason='invite-expired' where id=f.id; return; end if;
 if f.status='preparation' then perform jhk_private.club_begin_battle(f.id,p_now); select * into f from jhk_private.team_fixtures where id=f.id; end if;
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
 update jhk_private.team_fixtures set status='finished',winner_team_id=winner,tie_break=v_tie,finished_at=p_now,settlement_reason=case when exists(select 1 from jhk_private.team_answers where fixture_id=f.id and choice is not null) then 'completed' else 'no-contest' end where id=f.id;
 foreach team in array array[f.home_team_id,f.away_team_id] loop
  completed:=(case when team=f.home_team_id then a else b end->>'completed')::integer;
  insert into jhk_private.team_awards(team_id,fixture_id,points,awarded_at) values(team,f.id,case when completed>0 then completed*10+case when winner is null then 15 when winner=team then 30 else 0 end else 0 end,p_now) on conflict do nothing;
 end loop;
 perform jhk_private.team_advance_tournament(f.tournament_id,p_now);
 perform jhk_private.club_next_draft(f.id,p_now);
end $$;


create or replace function jhk_private.team_locked(p_team uuid) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from jhk_private.team_fixtures where status in('preparation','active') and p_team in(home_team_id,away_team_id))
 or exists(select 1 from jhk_private.team_tournament_entries e join jhk_private.team_tournaments t on t.id=e.tournament_id where e.team_id=p_team and t.status='active')
$$;
create or replace function jhk_private.team_reconcile(p_team uuid,p_now timestamptz,p_self uuid default null) returns void language plpgsql set search_path='' as $$
declare f record;
begin
 update jhk_private.team_tournaments t set status='cancelled',finished_at=p_now where t.status='open' and t.created_at<p_now-interval '48 hours' and exists(select 1 from jhk_private.team_tournament_entries e where e.tournament_id=t.id and e.team_id=p_team);
 for f in select distinct x.id from jhk_private.team_fixtures x where (p_team in(x.home_team_id,x.away_team_id) or exists(select 1 from jhk_private.team_lineups l where l.fixture_id=x.id and l.session_id=p_self) or exists(select 1 from jhk_private.team_tournament_entries e where e.tournament_id=x.tournament_id and e.team_id=p_team)) and x.status in('active','pending','preparation') order by x.id loop perform jhk_private.team_settle(f.id,p_now); end loop;
 update jhk_private.team_fixtures x set recurrence_stopped=true,recurrence_confirmed=false where x.recurrence='weekly' and (p_team in(x.home_team_id,x.away_team_id)) and exists(select 1 from jhk_private.teams t where t.id in(x.home_team_id,x.away_team_id) and t.archived_at is not null);
 update jhk_private.team_fixtures x set status='declined',finished_at=p_now,settlement_reason='club-archived' where x.status='pending' and x.previous_fixture_id is not null and exists(select 1 from jhk_private.teams t where t.id in(x.home_team_id,x.away_team_id) and t.archived_at is not null);
end $$;

create or replace function jhk_private.team_command(p_self uuid,p_payload jsonb,p_now timestamptz) returns jsonb language plpgsql set search_path='' as $$
declare op text:=coalesce(p_payload->>'op','dashboard'); own jhk_private.teams; other jhk_private.teams; f jhk_private.team_fixtures; cup jhk_private.team_tournaments;
 run jhk_private.team_runs; ans jhk_private.team_answers; n integer; v_capacity integer; v_format text; v_name text; v_emblem text; v_palette text; v_tag text; prefix text;
 target uuid; fid uuid; tid uuid; member uuid; winner uuid; q jsonb; v_choice integer; v_round integer; rid uuid; elapsed integer; is_correct boolean; rows integer; entry record; manager boolean; arranger boolean; ids uuid[]; v_role text; v_badge text; out_member uuid; in_member uuid;
begin
 -- The beta serializes short team transactions, never the 30-second thinking window.
 perform pg_advisory_xact_lock(726482942);
 select t.* into own from jhk_private.teams t join jhk_private.team_members m on m.team_id=t.id where m.session_id=p_self and t.archived_at is null for update of t;
 -- Reconcile deadlines before any lock/readiness decision, including the other cup semifinal.
 perform jhk_private.team_reconcile(own.id,p_now,p_self);
 manager:=coalesce((jhk_private.club_permissions(own.id,p_self)->>'manageLineup')::boolean,false);
 arranger:=coalesce((jhk_private.club_permissions(own.id,p_self)->>'arrangeMatches')::boolean,false);
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
  insert into jhk_private.team_members(team_id,session_id,joined_at,is_selected) values(own.id,p_self,p_now,true);
  return jhk_private.team_dashboard(p_self,p_now);
 elsif op='join' then
  select * into other from jhk_private.teams where invite_code=upper(p_payload->>'code') and archived_at is null for update;
  if other.id is null then return jhk_private.fail('TEAM_NOT_FOUND','Check the private team invite code.'); end if;
  perform jhk_private.team_reconcile(other.id,p_now);
  if own.id=other.id then return jhk_private.team_dashboard(p_self,p_now); end if;
  if own.id is not null then return jhk_private.fail('ALREADY_IN_TEAM','You can belong to one team at a time.'); end if;
  if not other.join_open then return jhk_private.fail('TEAM_CLOSED','This captain has closed team invites.'); end if;
  if (select count(*) from jhk_private.team_members where team_id=other.id)>=22 then return jhk_private.fail('TEAM_FULL','This team is full.'); end if;
  insert into jhk_private.team_members(team_id,session_id,joined_at,is_selected) values(other.id,p_self,p_now,not jhk_private.team_locked(other.id) and (select count(*) from jhk_private.team_members where team_id=other.id and is_selected)<other.capacity);
  return jhk_private.team_dashboard(p_self,p_now);
 end if;
 if own.id is null and op not in('fixture','play','answer','next') then return jhk_private.fail('TEAM_REQUIRED','Create or join a team first.'); end if;
 if op in('settings','rotateInvite','transfer','kick','assignRole') and own.captain_id<>p_self then return jhk_private.fail('CAPTAIN_REQUIRED','Only the club captain can do that.'); end if;
 if op in('challenge','accept','decline','tournamentCreate','tournamentStart','tournamentLeave','tournamentJoin','readyLineup','startBattle','stopRecurrence','sendRematch') and not arranger then return jhk_private.fail('ARRANGER_REQUIRED','The captain or vice-captain arranges club matches.'); end if;
 if op='selectLineup' then
  if not manager then return jhk_private.fail('LINEUP_MANAGER_REQUIRED','The captain, vice-captain or coach selects the playing side.'); end if;
  if jhk_private.team_locked(own.id) then return jhk_private.fail('LINEUP_LOCKED','Use the fixture preparation screen to substitute before battle.'); end if;
  select array_agg(x::uuid) into ids from jsonb_array_elements_text(p_payload->'memberIds') x;
  if ids is null or cardinality(ids)<>own.capacity or (select count(distinct x) from unnest(ids) x)<>own.capacity or exists(select 1 from unnest(ids) x where not exists(select 1 from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=own.id and m.session_id=x and not s.deleted)) then return jhk_private.fail('TEAM_ROSTER_REQUIRED','Select exactly the playing size from your own club members.'); end if;
  update jhk_private.team_members set is_selected=session_id=any(ids) where team_id=own.id;
 elsif op='assignRole' then
  member:=(p_payload->>'memberId')::uuid; v_role:=p_payload->>'role';
  if v_role not in('member','vice-captain','coach') or v_role is null then return jhk_private.fail('BAD_ROLE','Choose member, vice-captain or coach.'); end if;
  if member=own.captain_id then return jhk_private.fail('TRANSFER_REQUIRED','Use captain transfer to change the captain.'); end if;
  if not exists(select 1 from jhk_private.team_members where team_id=own.id and session_id=member) then return jhk_private.fail('MEMBER_NOT_FOUND','Choose a club member.'); end if;
  if v_role in('vice-captain','coach') then update jhk_private.team_members set role_tag='member' where team_id=own.id and role_tag=v_role; end if;
  update jhk_private.team_members set role_tag=v_role where team_id=own.id and session_id=member;
 elsif op='roleConsent' then
  if jsonb_typeof(p_payload->'consent')<>'boolean' or not(p_payload ? 'consent') then return jhk_private.fail('BAD_BADGE','Choose whether to allow fun badges.'); end if;
  update jhk_private.team_members set fun_badge_consent=(p_payload->>'consent')::boolean,fun_badge=case when (p_payload->>'consent')::boolean then fun_badge else 'none' end where team_id=own.id and session_id=p_self;
  if not(p_payload->>'consent')::boolean then update jhk_private.team_lineups set badge_snapshot='none' where session_id=p_self; end if;
 elsif op='assignBadge' then
  member:=(p_payload->>'memberId')::uuid; v_badge:=p_payload->>'badge';
  if v_badge is null or v_badge not in('none','bottle-boy','analyst','keeper','finisher','cheer-captain') then return jhk_private.fail('BAD_BADGE','Choose an available fun badge.'); end if;
  if own.captain_id<>p_self and not(member=p_self and v_badge='none') then return jhk_private.fail('CAPTAIN_REQUIRED','Only the captain assigns fun badges. You can remove your own.'); end if;
  if not exists(select 1 from jhk_private.team_members where team_id=own.id and session_id=member) then return jhk_private.fail('MEMBER_NOT_FOUND','Choose a club member.'); end if;
  if v_badge<>'none' and not exists(select 1 from jhk_private.team_members where team_id=own.id and session_id=member and fun_badge_consent) then return jhk_private.fail('BADGE_CONSENT_REQUIRED','This member must opt in before receiving a fun badge.'); end if;
  update jhk_private.team_members set fun_badge=v_badge where team_id=own.id and session_id=member;
  if v_badge='none' then update jhk_private.team_lineups set badge_snapshot='none' where session_id=member; end if;
 elsif op in('fixtureLineup','substitute','readyLineup','startBattle') then
  fid:=(p_payload->>'fixtureId')::uuid; select * into f from jhk_private.team_fixtures where id=fid for update;
  if f.id is null or own.id not in(f.home_team_id,f.away_team_id) then return jhk_private.fail('FORBIDDEN','This is not your club fixture.'); end if;
  if f.status<>'preparation' then return jhk_private.fail('LINEUP_LOCKED','This fixture is outside preparation. Playing line-ups cannot change during battle.'); end if;
  if op in('fixtureLineup','substitute') then
   if not manager then return jhk_private.fail('LINEUP_MANAGER_REQUIRED','The captain, vice-captain or coach selects the playing side.'); end if;
   if op='fixtureLineup' then select array_agg(x::uuid) into ids from jsonb_array_elements_text(p_payload->'memberIds') x;
   else
    out_member:=(p_payload->>'outMemberId')::uuid; in_member:=(p_payload->>'inMemberId')::uuid;
    if not exists(select 1 from jhk_private.team_lineups where fixture_id=fid and team_id=own.id and session_id=out_member) or exists(select 1 from jhk_private.team_lineups where fixture_id=fid and session_id=in_member) then return jhk_private.fail('BAD_SUBSTITUTION','Choose one current player and one reserve.'); end if;
    select array_agg(case when session_id=out_member then in_member else session_id end) into ids from jhk_private.team_lineups where fixture_id=fid and team_id=own.id;
   end if;
   perform jhk_private.club_set_lineup(fid,own.id,ids,p_now);
  elsif op='readyLineup' then
   if jsonb_typeof(p_payload->'ready')<>'boolean' or not(p_payload ? 'ready') then return jhk_private.fail('BAD_READY','Choose whether this line-up is ready for an early battle.'); end if;
   update jhk_private.team_fixtures set home_ready=case when home_team_id=own.id then (p_payload->>'ready')::boolean else home_ready end,away_ready=case when away_team_id=own.id then (p_payload->>'ready')::boolean else away_ready end where id=fid;
   perform jhk_private.club_begin_battle(fid,p_now);
  else
   if not(f.home_ready and f.away_ready) then return jhk_private.fail('BOTH_TEAMS_REQUIRED','Both captains or vice-captains must confirm their current playing sides for an early start.'); end if;
   perform jhk_private.club_begin_battle(fid,p_now);
  end if;
 elsif op='stopRecurrence' then
  fid:=(p_payload->>'fixtureId')::uuid; select * into f from jhk_private.team_fixtures where id=fid for update;
  if f.id is null or own.id not in(f.home_team_id,f.away_team_id) then return jhk_private.fail('FORBIDDEN','This is not your club series.'); end if;
  update jhk_private.team_fixtures set recurrence_stopped=true,recurrence_confirmed=false,recurrence='none' where coalesce(series_id,id)=coalesce(f.series_id,f.id);
  update jhk_private.team_fixtures set status='declined',finished_at=p_now,settlement_reason='series-stopped' where coalesce(series_id,id)=coalesce(f.series_id,f.id) and previous_fixture_id is not null and status='pending';

 elsif op='settings' then
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
  update jhk_private.team_members set role_tag='member' where team_id=own.id and session_id in(member,p_self);
 elsif op in('kick','leave') then
  member:=case when op='leave' then p_self else (p_payload->>'memberId')::uuid end;
  if member=own.captain_id and (op='kick' or (select count(*) from jhk_private.team_members where team_id=own.id)>1) then return jhk_private.fail('TRANSFER_REQUIRED','Pass captaincy to a teammate before leaving.'); end if;
  if not exists(select 1 from jhk_private.team_members where team_id=own.id and session_id=member) then return jhk_private.fail('MEMBER_NOT_FOUND','That player is not on this roster.'); end if;
  if exists(select 1 from jhk_private.team_lineups l join jhk_private.team_fixtures x on x.id=l.fixture_id where l.team_id=own.id and l.session_id=member and x.status='active') then return jhk_private.fail('LINEUP_LOCKED','A playing member cannot leave or be removed during battle. Reserves can still leave.'); end if;
  update jhk_private.team_fixtures x set home_ready=false,away_ready=false where x.status='preparation' and exists(select 1 from jhk_private.team_lineups l where l.fixture_id=x.id and l.session_id=member);
  delete from jhk_private.team_lineups l using jhk_private.team_fixtures x where x.id=l.fixture_id and x.status='preparation' and l.team_id=own.id and l.session_id=member;
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
  if (select count(*) from jhk_private.team_fixtures where status='pending' and own.id in(home_team_id,away_team_id) and greatest(created_at,coalesce(available_at,created_at))>p_now-interval '48 hours')>=5 then return jhk_private.fail('TEAM_INVITE_LIMIT','Finish or decline a pending challenge before sending more.'); end if;
  select id into fid from jhk_private.team_fixtures where status='pending' and ((home_team_id=own.id and away_team_id=other.id) or(home_team_id=other.id and away_team_id=own.id)) and greatest(created_at,coalesce(available_at,created_at))>p_now-interval '48 hours' limit 1;
  if fid is null then
   insert into jhk_private.team_fixtures(home_team_id,away_team_id,created_by,capacity,format,round_count,created_at,available_at,recurrence) values(own.id,other.id,p_self,own.capacity,v_format,case when v_format='mini' then 3 else 6 end,p_now,p_now,coalesce(p_payload->>'recurrence','none')) returning id into fid;
   update jhk_private.team_fixtures set series_id=fid where id=fid;
  end if;
 elsif op='sendRematch' then
  fid:=(p_payload->>'fixtureId')::uuid; select * into f from jhk_private.team_fixtures where id=fid for update;
  if f.id is null or own.id<>f.home_team_id or f.previous_fixture_id is null then return jhk_private.fail('FORBIDDEN','Only the home club can send this weekly draft.'); end if;
  if f.status<>'pending' or f.recurrence_stopped then return jhk_private.fail('FIXTURE_CLOSED','This draft is no longer open.'); end if;
  if f.available_at>p_now then return jhk_private.fail('FIXTURE_NOT_AVAILABLE','This weekly draft opens at its scheduled time.'); end if;
  if jhk_private.team_locked(own.id) then return jhk_private.fail('TEAM_LOCKED','Finish your current club match or cup first.'); end if;
  if (select count(*) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=own.id and m.is_selected and not s.deleted)<>f.capacity then return jhk_private.fail('TEAM_ROSTER_REQUIRED','Confirm a complete current playing side first.'); end if;
  delete from jhk_private.team_lineups where fixture_id=fid and team_id=own.id;
  insert into jhk_private.team_lineups(fixture_id,team_id,session_id,nickname_snapshot,role_snapshot,badge_snapshot) select fid,own.id,s.id,s.nickname,case when s.id=own.captain_id then 'captain' else m.role_tag end,m.fun_badge from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=own.id and m.is_selected and not s.deleted;
  update jhk_private.team_fixtures set draft_sent_at=p_now,created_by=p_self where id=fid;
 elsif op in('accept','decline') then
  fid:=(p_payload->>'fixtureId')::uuid; select * into f from jhk_private.team_fixtures where id=fid for update;
  if f.id is null or own.id<>f.away_team_id or f.tournament_id is not null then return jhk_private.fail('FORBIDDEN','Only the challenged captain can respond to this invitation.'); end if;
  if f.status in('active','preparation') and op='accept' then return jhk_private.team_dashboard(p_self,p_now,fid); end if;
  if f.status<>'pending' then return jhk_private.fail('FIXTURE_CLOSED','This invitation is no longer open.'); end if;
  if op='accept' and coalesce(f.available_at,f.created_at)>p_now then return jhk_private.fail('FIXTURE_NOT_AVAILABLE','This weekly draft opens at its scheduled time.'); end if;
  if op='accept' and f.previous_fixture_id is not null and f.draft_sent_at is null then return jhk_private.fail('REMATCH_NOT_SENT','The home club must freshly confirm and send this weekly challenge.'); end if;
  if op='decline' then update jhk_private.team_fixtures set status='declined',finished_at=p_now where id=fid;
  else
   if jhk_private.team_locked(f.home_team_id) or jhk_private.team_locked(f.away_team_id) then return jhk_private.fail('TEAM_LOCKED','A team is already playing an active match or cup.'); end if;
   update jhk_private.team_fixtures set recurrence_confirmed=recurrence='weekly' and coalesce(p_payload->>'recurrence','none')='weekly',recurrence=case when recurrence='weekly' and coalesce(p_payload->>'recurrence','none')='weekly' then 'weekly' else 'none' end where id=fid;
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
  if not arranger then return jhk_private.fail('ARRANGER_REQUIRED','Your captain or vice-captain enters the club into a cup.'); end if;
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
  if exists(select 1 from jhk_private.team_tournament_entries e join jhk_private.teams t on t.id=e.team_id where e.tournament_id=tid and (t.archived_at is not null or (select count(*) from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=t.id and m.is_selected and not s.deleted)<>cup.capacity)) then return jhk_private.fail('TEAM_ROSTER_REQUIRED','Every team needs a complete roster before the cup starts.'); end if;
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
 if sqlerrm='LINEUP_LOCKED' then return jhk_private.fail('LINEUP_LOCKED','Playing line-ups lock when battle starts. Use reserves in preparation only.'); end if;
 if sqlerrm='LINEUP_FORBIDDEN' then return jhk_private.fail('FORBIDDEN','Only your own club line-up can be changed.'); end if;
 if sqlerrm='NO_QUESTIONS' then return jhk_private.fail('NO_QUESTIONS','The cricket bank cannot supply this format right now.'); end if;
 raise;
when invalid_text_representation or numeric_value_out_of_range or check_violation or not_null_violation or unique_violation then return jhk_private.fail('BAD_INPUT','Check the team details and try again.');
end $$;


-- Clear preparation readiness on account deletion; battle line-ups remain an immutable receipt.
create or replace function jhk_private.team_delete_profile(p_self uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare team uuid; replacement uuid;
begin
 perform pg_advisory_xact_lock(726482942);
 select team_id into team from jhk_private.team_members where session_id=p_self;
 update jhk_private.team_lineups set nickname_snapshot='Deleted player',role_snapshot='member',badge_snapshot='none' where session_id=p_self;
 update jhk_private.team_fixtures x set home_ready=false,away_ready=false where status='preparation' and exists(select 1 from jhk_private.team_lineups l where l.fixture_id=x.id and l.session_id=p_self);
 delete from jhk_private.team_lineups l using jhk_private.team_fixtures x where x.id=l.fixture_id and x.status='preparation' and l.session_id=p_self;
 if team is null then return; end if;
 delete from jhk_private.team_members where session_id=p_self;
 select m.session_id into replacement from jhk_private.team_members m join jhk_private.sessions s on s.id=m.session_id where m.team_id=team and not s.deleted order by m.joined_at,m.session_id limit 1;
 if replacement is null then
  update jhk_private.teams set archived_at=p_now,join_open=false where id=team;
  perform jhk_private.team_retire_open_entries(team,p_now);
  update jhk_private.team_fixtures set recurrence_stopped=true,recurrence_confirmed=false where team in(home_team_id,away_team_id);
 else
  update jhk_private.teams set captain_id=case when captain_id=p_self then replacement else captain_id end where id=team;
  update jhk_private.team_members set role_tag='member' where team_id=team and session_id=(select captain_id from jhk_private.teams where id=team);
 end if;
end $$;
revoke all on all functions in schema jhk_private from public,anon,authenticated;
grant execute on all functions in schema jhk_private to service_role;
