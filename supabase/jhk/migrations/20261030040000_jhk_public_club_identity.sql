-- Public club identity is display-only: never include invite codes or authority roles.
create or replace function jhk_private.public_club_identity(p_session uuid) returns jsonb language sql stable set search_path='' as $$
 select coalesce((select jsonb_build_object('teamTag',t.tag,'teamName',t.name,'teamPalette',t.palette,'teamSize',t.capacity) from jhk_private.team_members m join jhk_private.teams t on t.id=m.team_id join jhk_private.sessions s on s.id=m.session_id where m.session_id=p_session and not s.deleted and t.archived_at is null),jsonb_build_object('teamTag',null,'teamName',null,'teamPalette',null,'teamSize',null))
$$;

create or replace function jhk_private.profile_json(p jhk_private.sessions,p_now timestamptz) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',p.id,'nickname',p.nickname,'email',p.email,'avatar',p.avatar,'locale',p.locale,'preferences',p.preferences,'adultConfirmed',p.adult_confirmed,'termsVersion',p.terms_version,'profileComplete',jhk_private.profile_complete(p),'expiresAt',jhk_private.ms(p.expires_at),'onlineXp',(select coalesce(sum(a.xp),0) from jhk_private.answers a where a.session_id=p.id)+(select coalesce(sum(amount),0) from jhk_private.over_xp where session_id=p.id))
 ||jhk_private.wallet(p.id)||jsonb_build_object('title',jhk_private.current_title(p.id,p_now),'humanRoad',jhk_private.human_road(p.id))
 ||jhk_private.public_club_identity(p.id)
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
 select jsonb_agg(jsonb_build_object('id',s.id,'nickname',s.nickname,'ready',m.ready,'answered',exists(select 1 from jhk_private.answers x where x.room_id=r.id and x.round=r.round and x.session_id=s.id),'score',(select count(*) from jhk_private.answers x where x.room_id=r.id and x.session_id=s.id and x.correct and (x.round<r.round or r.phase in ('result','finished') or s.id=p_self)))||jhk_private.public_club_identity(s.id) order by m.joined_at,m.session_id) into players from jhk_private.members m join jhk_private.sessions s on s.id=m.session_id where m.room_id=r.id;
 return jsonb_build_object('id',r.id,'code',case when r.mode='private' then r.code else null end,'mode',r.mode,'phase',case when r.phase='question' and p_now<r.starts_at then 'countdown' else r.phase end,'round',r.round,'roundCount',r.round_count,'format',case r.round_count when 3 then 'mini' when 6 then 'full' else 'legacy' end,'progression',jsonb_build_object('answerXp',(select coalesce(sum(x.xp),0) from jhk_private.answers x where x.room_id=r.id and x.session_id=p_self),'completionXp',coalesce((select amount-perfect_bonus from jhk_private.over_xp where room_id=r.id and session_id=p_self),0),'perfectXp',coalesce((select perfect_bonus from jhk_private.over_xp where room_id=r.id and session_id=p_self),0),'totalXp',(select coalesce(sum(x.xp),0) from jhk_private.answers x where x.session_id=p_self)+(select coalesce(sum(amount),0) from jhk_private.over_xp where session_id=p_self)),'startsAt',jhk_private.ms(coalesce(issued,r.starts_at)),'deadlineAt',jhk_private.ms(r.deadline_at),'nextAt',jhk_private.ms(r.next_at),'serverNow',jhk_private.ms(p_now),'selfId',p_self,'players',coalesce(players,'[]'::jsonb),'reactionsEnabled',true,'reactions',coalesce((select jsonb_agg(m.last_reaction order by m.last_reaction->>'at') from jhk_private.members m where m.room_id=r.id and m.last_reaction is not null and (m.last_reaction->>'at')::bigint>=jhk_private.ms(p_now)-12000),'[]'::jsonb),'question',case when r.round>0 and r.phase not in ('waiting','cancelled') and (r.phase<>'question' or p_now>=r.starts_at) then q-'correctIndex'-'explanation'-'sourceUrl' else null end,'receipt',receipt,'result',verdict,'winnerId',r.winner_id,'reason',r.reason,'file',r.file,'stake',r.stake,'rewardMultiplier',r.reward_multiplier,'economy',jsonb_build_object('status',case when r.economy_state='pending' and exists(select 1 from jhk_private.escrows where room_id=r.id and session_id=p_self) then 'reserved' else r.economy_state end,'balance',(select balance from jhk_private.wallets where session_id=p_self),'savings',(jhk_private.wallet(p_self)->'savings'),'reserved',coalesce((select amount from jhk_private.escrows where room_id=r.id and session_id=p_self and state='reserved'),0),'payout',coalesce((select sum(amount) from jhk_private.wallet_entries where room_id=r.id and session_id=p_self and kind in ('payout','refund')),0),'reward',coalesce((select amount from jhk_private.reward_claims where room_id=r.id and session_id=p_self),0)));
end $$;

create or replace function jhk_private.board(p_self uuid,p_period text,p_now timestamptz) returns jsonb language plpgsql set search_path='' as $$
declare start_at timestamptz; end_at timestamptz; rows jsonb; self_row jsonb; cid text;
begin
 start_at:=case when p_period='daily' then date_trunc('day',p_now at time zone 'UTC') at time zone 'UTC' else date_trunc('week',p_now at time zone 'UTC') at time zone 'UTC' end;
 end_at:=start_at+case when p_period='daily' then interval '1 day' else interval '7 days' end;
 cid:=p_period||'/'||to_char(start_at at time zone 'UTC','YYYY-MM-DD');
 with eligible as (
  select x.*,row_number() over(partition by x.session_id,x.opponent_id,(x.completed_at at time zone 'UTC')::date order by x.completed_at,x.room_id) pair_n
  from jhk_private.results x join jhk_private.sessions s on s.id=x.session_id
  where x.completed_at>=start_at and x.completed_at<end_at and not s.deleted and s.expires_at>p_now and (p_period<>'tournament' or x.mode='tournament')
 ), capped as (
  select x.*,row_number() over(partition by session_id order by points desc,correct desc,elapsed_ms,completed_at,room_id) best_n from eligible x where pair_n=1
 ), aggregates as (
  select session_id,count(*)::int matches,(select count(distinct y.opponent_id)::int from capped y where y.session_id=capped.session_id) opponents,sum(points)::int points,count(*) filter(where points=3)::int wins,sum(correct)::int correct,sum(elapsed_ms)::bigint elapsed_ms,max(completed_at) last_at
  from capped where (p_period<>'tournament' or best_n<=5) group by session_id
 ), ranked as (
  select row_number() over(order by points desc,correct desc,elapsed_ms,last_at,session_id)::int rank,a.*,s.nickname from aggregates a join jhk_private.sessions s on s.id=a.session_id where matches>=3 and opponents>=3
 ), shaped as (
  select rank,session_id,jsonb_build_object('rank',rank,'id',session_id,'nickname',nickname,'matches',matches,'opponents',opponents,'wins',wins,'points',points,'correct',correct,'elapsedMs',elapsed_ms,'title',case when rank<=10 then jsonb_build_object('title','ranked-contender','name','Top Ten','source',case when p_period='tournament' then 'tournament' else 'leaderboard' end,'rank',rank,'awardedAt',jhk_private.ms(start_at),'expiresAt',jhk_private.ms(end_at),'competitionId',cid) else null end)||jhk_private.public_club_identity(session_id) item from ranked
 ) select coalesce(jsonb_agg(item order by rank) filter(where rank<=50),'[]'::jsonb),(jsonb_agg(item) filter(where session_id=p_self))->0 into rows,self_row from shaped;
 return jsonb_build_object('period',p_period,'competitionId',cid,'startsAt',jhk_private.ms(start_at),'endsAt',jhk_private.ms(end_at),'minimumMatches',3,'minimumOpponents',3,'rows',rows,'self',self_row);
end $$;

create or replace function jhk_private.savings_board(p_self uuid,p_now timestamptz) returns jsonb language plpgsql set search_path='' as $$
declare start_at timestamptz:=date_trunc('day',p_now at time zone 'UTC') at time zone 'UTC'; end_at timestamptz; rows jsonb; self_row jsonb; cid text;
begin
 end_at:=start_at+interval '1 day'; cid:='savings/'||to_char(start_at at time zone 'UTC','YYYY-MM-DD');
 with amounts as (
  select s.id,s.nickname,w.balance+coalesce((select sum(e.amount) from jhk_private.escrows e where e.session_id=s.id and e.state='reserved'),0) savings
  from jhk_private.wallets w join jhk_private.sessions s on s.id=w.session_id
  where not s.deleted and s.expires_at>p_now
  -- A starter grant alone never grants the title; complete at least one participating human duel.
  and exists(select 1 from jhk_private.reward_claims rc where rc.session_id=s.id)
 ), ranked as (
  select *,row_number() over(order by savings desc,id)::int rank from amounts
 ), shaped as (
  select id,rank,jsonb_build_object('id',id,'nickname',nickname,'rank',rank,'savings',savings,'matches',0,'wins',0,'points',savings,'correct',0,'elapsedMs',0,'title',case when rank=1 then jsonb_build_object('title','coin-champion','name','Coin Champion','source','savings','rank',1,'awardedAt',jhk_private.ms(start_at),'expiresAt',jhk_private.ms(end_at),'competitionId',cid) else null end)||jhk_private.public_club_identity(id) item from ranked
 ) select coalesce(jsonb_agg(item order by rank) filter(where rank<=50),'[]'::jsonb),(jsonb_agg(item) filter(where id=p_self))->0 into rows,self_row from shaped;
 return jsonb_build_object('period','savings','competitionId',cid,'startsAt',jhk_private.ms(start_at),'endsAt',jhk_private.ms(end_at),'minimumMatches',1,'rows',rows,'self',self_row);
end $$;

revoke all on all functions in schema jhk_private from public,anon,authenticated;
grant execute on all functions in schema jhk_private to service_role;
