BEGIN;
CREATE TEMP TABLE jhk_over_checks(label text PRIMARY KEY) ON COMMIT DROP;
CREATE OR REPLACE FUNCTION pg_temp.over_check(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'JHK overs failed: %',label; END IF; INSERT INTO jhk_over_checks VALUES(label); END $$;
CREATE OR REPLACE FUNCTION pg_temp.over_call(token text,action text,payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE response jsonb; BEGIN response:=public.jhk_command(token,action,payload,'jhk-over-'||token); IF response->>'ok'<>'true' THEN RAISE EXCEPTION 'JHK % failed: %',action,response; END IF; RETURN response; END $$;
DO $$
DECLARE ha text:=repeat('3',64); hb text:=repeat('4',64); a uuid; b uuid; rid uuid; other uuid; snap jsonb; result jsonb; n integer; i integer; fmt text; choice integer; base_xp integer:=0;
BEGIN
 a:=(pg_temp.over_call(ha,'session','{"nickname":"Over Alpha","adultConfirmed":true,"termsVersion":"beta-1","_recoveryHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}')#>>'{session,id}')::uuid;
 b:=(pg_temp.over_call(hb,'session','{"nickname":"Over Beta","adultConfirmed":true,"termsVersion":"beta-1","_recoveryHash":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}')#>>'{session,id}')::uuid;
 PERFORM pg_temp.over_check(public.jhk_command(ha,'queue','{"format":"invented"}')#>>'{error,code}'='BAD_FORMAT','invalid over cannot enter queue');
 snap:=pg_temp.over_call(ha,'queue','{"format":"mini"}')->'match';rid:=(snap->>'id')::uuid;
 other:=(pg_temp.over_call(hb,'queue','{"format":"full"}')#>>'{match,id}')::uuid;
 PERFORM pg_temp.over_check(rid<>other,'Mini and Full queues remain separate');
 PERFORM pg_temp.over_call(ha,'leave',jsonb_build_object('roomId',rid));
 PERFORM pg_temp.over_call(hb,'leave',jsonb_build_object('roomId',other));
 FOREACH fmt IN ARRAY ARRAY['mini','full'] LOOP
  n:=case when fmt='mini' then 3 else 6 end;
  snap:=pg_temp.over_call(ha,'create',jsonb_build_object('format',fmt,'file','cricket'))->'match';rid:=(snap->>'id')::uuid;
  PERFORM pg_temp.over_check((snap->>'roundCount')::int=n AND snap->>'format'=fmt,'selected length is disclosed: '||fmt);
  snap:=pg_temp.over_call(hb,'join',jsonb_build_object('code',snap->>'code','format',case when fmt='mini' then 'full' else 'mini' end))->'match';
  PERFORM pg_temp.over_check((snap->>'roundCount')::int=n,'invitation adopts host length: '||fmt);
  PERFORM pg_temp.over_call(ha,'ready',jsonb_build_object('roomId',rid));
  PERFORM pg_temp.over_call(hb,'ready',jsonb_build_object('roomId',rid));
  PERFORM pg_temp.over_check((SELECT jsonb_array_length(deck)=n FROM jhk_private.rooms WHERE id=rid),'deck exactly matches over: '||fmt);
  FOR i IN 1..n LOOP
   UPDATE jhk_private.rooms SET starts_at=clock_timestamp()-interval '1 second',deadline_at=clock_timestamp()+interval '25 seconds' WHERE id=rid;
   PERFORM pg_temp.over_call(ha,'snapshot',jsonb_build_object('roomId',rid));
   PERFORM pg_temp.over_call(hb,'snapshot',jsonb_build_object('roomId',rid));
   SELECT (deck->(i-1)->>'correctIndex')::int INTO choice FROM jhk_private.rooms WHERE id=rid;
   snap:=pg_temp.over_call(ha,'answer',jsonb_build_object('roomId',rid,'round',i,'choice',choice,'requestId',gen_random_uuid()))->'match';
   snap:=pg_temp.over_call(hb,'answer',jsonb_build_object('roomId',rid,'round',i,'choice',(choice+1)%4,'requestId',gen_random_uuid()))->'match';
   IF i<n THEN
    PERFORM pg_temp.over_check(snap->>'phase'='result','over does not finish early: '||fmt||'/'||i);
    UPDATE jhk_private.rooms SET next_at=clock_timestamp()-interval '1 second' WHERE id=rid;
    snap:=pg_temp.over_call(ha,'snapshot',jsonb_build_object('roomId',rid))->'match';
    PERFORM pg_temp.over_check((snap->>'round')::int=i+1 AND snap->>'phase'='countdown','next round advances automatically: '||fmt||'/'||i);
   END IF;
  END LOOP;
  snap:=pg_temp.over_call(ha,'snapshot',jsonb_build_object('roomId',rid))->'match';
  PERFORM pg_temp.over_check(snap->>'phase'='finished' AND (snap->>'round')::int=n,'settles at exact final round: '||fmt);
  PERFORM pg_temp.over_check((snap#>>'{progression,completionXp}')::int=case when n=3 then 60 else 150 end AND (snap#>>'{progression,perfectXp}')::int=case when n=3 then 30 else 60 end,'completion and perfect bonuses disclosed: '||fmt);
  PERFORM pg_temp.over_check((SELECT amount=case when n=3 then 60 else 150 end AND perfect_bonus=0 FROM jhk_private.over_xp WHERE room_id=rid AND session_id=b),'loss still earns attempted-over XP: '||fmt);
  PERFORM jhk_private.settle(rid,clock_timestamp());
  PERFORM pg_temp.over_check((SELECT count(*)=2 FROM jhk_private.over_xp WHERE room_id=rid),'retry cannot duplicate XP: '||fmt);
  base_xp:=base_xp+n*30+case when n=3 then 90 else 210 end;
  PERFORM pg_temp.over_check((pg_temp.over_call(ha,'profile')#>>'{session,onlineXp}')::int=base_xp,'profile includes permanent bonus: '||fmt);
 END LOOP;
 snap:=pg_temp.over_call(ha,'create')->'match';rid:=(snap->>'id')::uuid;
 PERFORM pg_temp.over_check(snap->>'roundCount'='5' AND snap->>'format'='legacy','old clients retain five-round contract');
 PERFORM pg_temp.over_call(ha,'leave',jsonb_build_object('roomId',rid));
 snap:=pg_temp.over_call(ha,'create','{"format":"mini"}')->'match';rid:=(snap->>'id')::uuid;
 PERFORM pg_temp.over_call(ha,'leave',jsonb_build_object('roomId',rid));
 PERFORM pg_temp.over_check(NOT EXISTS(SELECT 1 FROM jhk_private.over_xp WHERE room_id=rid),'cancelled over grants no completion XP');
 PERFORM pg_temp.over_check(jsonb_array_length(pg_temp.over_call(ha,'exportProfile')->'overXp')=2,'private export includes earned over XP');
 INSERT INTO jhk_private.rooms(mode,deck,round_count,phase,round,starts_at,deadline_at) VALUES('private',jhk_private.make_deck(),3,'question',3,clock_timestamp()-interval '40 seconds',clock_timestamp()-interval '1 second') RETURNING id INTO rid;
 INSERT INTO jhk_private.members(room_id,session_id) VALUES(rid,a),(rid,b);
 INSERT INTO jhk_private.answers(room_id,round,session_id,request_id,choice,correct,elapsed_ms,xp,received_at) VALUES(rid,1,a,gen_random_uuid(),0,true,1000,30,clock_timestamp());
 PERFORM jhk_private.settle(rid,clock_timestamp());
 PERFORM pg_temp.over_check((SELECT phase='finished' FROM jhk_private.rooms WHERE id=rid) AND NOT EXISTS(SELECT 1 FROM jhk_private.over_xp WHERE room_id=rid),'partial and idle overs never earn completion XP');

END $$;
SELECT jsonb_build_object('suite','jhk-online-overs','checks',count(*),'labels',jsonb_agg(label ORDER BY label)) AS evidence FROM jhk_over_checks;
ROLLBACK;
