BEGIN;
CREATE TEMP TABLE jhk_economy_checks(label text PRIMARY KEY) ON COMMIT DROP;
CREATE OR REPLACE FUNCTION pg_temp.jhk_check(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'JHK economy failed: %',label; END IF; INSERT INTO jhk_economy_checks VALUES(label); END $$;
CREATE OR REPLACE FUNCTION pg_temp.jhk_call(token text,action text,payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE response jsonb; BEGIN response:=public.jhk_command(token,action,payload,'jhk-economy-'||token); IF response->>'ok'<>'true' THEN RAISE EXCEPTION 'JHK % failed: %',action,response; END IF; RETURN response; END $$;
DO $$
DECLARE ha text:=repeat('1',64); hb text:=repeat('2',64); a uuid; b uuid; rid uuid; other uuid; snap jsonb; result jsonb; n integer; i integer; f text; book bigint; deck jsonb;
BEGIN
 a:=(pg_temp.jhk_call(ha,'session','{"nickname":"JHK Alpha"}')#>>'{session,id}')::uuid;
 b:=(pg_temp.jhk_call(hb,'session','{"nickname":"JHK Beta"}')#>>'{session,id}')::uuid;
 PERFORM pg_temp.jhk_check((SELECT balance=100 FROM jhk_private.wallets WHERE session_id=a),'starter coins are 100 server-owned units');
 PERFORM pg_temp.jhk_check(public.hisaab_game(ha,'profile')#>>'{error,code}'='UNAUTHORIZED','JHK guest cannot authenticate to other game');
 PERFORM public.hisaab_game(repeat('5',64),'session','{"nickname":"Sibling check"}'::jsonb,'jhk-cross-check');
 PERFORM pg_temp.jhk_check(public.jhk_command(repeat('5',64),'profile')#>>'{error,code}'='UNAUTHORIZED','other game guest cannot authenticate to JHK');
 PERFORM pg_temp.jhk_check(NOT EXISTS(SELECT 1 FROM hisaab_private.sessions WHERE id IN(a,b)),'JHK identities remain in isolated schema');
 result:=public.jhk_command(ha,'create','{"file":"subsidies"}');
 PERFORM pg_temp.jhk_check(result#>>'{error,code}'='BAD_FILE','unrelated game file identifiers rejected');
 FOREACH f IN ARRAY ARRAY['sports','science','cricket','football','basketball','baseball','formula-1','space','physics','biology','computing'] LOOP
  deck:=jhk_private.make_deck(f,clock_timestamp());
  PERFORM pg_temp.jhk_check(jsonb_array_length(deck)=5 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(deck) q WHERE NOT (q->'files' ? f)),'reviewed topic stays exact: '||f);
 END LOOP;
 result:=public.jhk_command(ha,'queue','{"stake":101}');
 PERFORM pg_temp.jhk_check(result#>>'{error,code}'='INSUFFICIENT_BALANCE','overspend rejected before room creation');
 snap:=pg_temp.jhk_call(ha,'queue','{"file":"science","stake":20}')->'match'; rid:=(snap->>'id')::uuid;
 result:=pg_temp.jhk_call(hb,'queue','{"file":"sports","stake":20}'); other:=(result#>>'{match,id}')::uuid;
 PERFORM pg_temp.jhk_check(rid<>other,'sports and science queues never silently combine');
 PERFORM pg_temp.jhk_call(hb,'leave',jsonb_build_object('roomId',other));
 snap:=pg_temp.jhk_call(hb,'queue','{"file":"science","stake":20}')->'match';
 PERFORM pg_temp.jhk_check(snap->>'id'=rid::text AND jsonb_array_length(snap->'players')=2,'independent guest joins same human queue');
 result:=public.jhk_command(hb,'ready',jsonb_build_object('roomId',rid));
 PERFORM pg_temp.jhk_check(result#>>'{error,code}'='STAKE_CONFIRMATION','positive stake cannot be silently charged');
 PERFORM pg_temp.jhk_call(ha,'ready',jsonb_build_object('roomId',rid,'stake',20));
 PERFORM pg_temp.jhk_call(ha,'ready',jsonb_build_object('roomId',rid,'stake',20));
 PERFORM pg_temp.jhk_check((SELECT balance=80 FROM jhk_private.wallets WHERE session_id=a) AND jhk_private.wallet(a)->>'savings'='100','ready retry moves own stake once and preserves total ownership');
 PERFORM pg_temp.jhk_call(hb,'ready',jsonb_build_object('roomId',rid,'stake',20));
 UPDATE jhk_private.rooms SET phase='question',round=5,starts_at=clock_timestamp()-interval '1 second',deadline_at=clock_timestamp()+interval '20 seconds' WHERE id=rid;
 FOR i IN 1..5 LOOP
  INSERT INTO jhk_private.answers(room_id,round,session_id,request_id,choice,correct,elapsed_ms,xp,received_at) VALUES
   (rid,i,a,gen_random_uuid(),0,true,1000,30,clock_timestamp()),(rid,i,b,gen_random_uuid(),1,false,1000,0,clock_timestamp());
 END LOOP;
 PERFORM jhk_private.settle(rid,clock_timestamp()); PERFORM jhk_private.settle(rid,clock_timestamp());
 PERFORM pg_temp.jhk_check((SELECT balance=130 FROM jhk_private.wallets WHERE session_id=a) AND (SELECT balance=80 FROM jhk_private.wallets WHERE session_id=b),'winner receives 40 pot and 10 completion coins without bonus multiplier');
 PERFORM pg_temp.jhk_check((SELECT count(*)=1 FROM jhk_private.reward_claims WHERE room_id=rid) AND (SELECT count(*)=2 FROM jhk_private.results WHERE room_id=rid),'completed human match grants one eligible reward and one result per player');
 PERFORM pg_temp.jhk_check(jhk_private.savings_board(a,clock_timestamp())#>>'{self,title,title}'='coin-champion','coin leaderboard uses neutral JHK title');
 PERFORM pg_temp.jhk_check(pg_temp.jhk_call(ha,'profile')#>>'{session,onlineXp}'='150','server profile exposes cumulative authoritative XP');

 snap:=pg_temp.jhk_call(ha,'create','{"file":"cricket","stake":20}')->'match';rid:=(snap->>'id')::uuid;
 PERFORM pg_temp.jhk_call(hb,'join',jsonb_build_object('code',snap->>'code'));
 PERFORM pg_temp.jhk_call(ha,'ready',jsonb_build_object('roomId',rid,'stake',20));
 PERFORM pg_temp.jhk_call(hb,'leave',jsonb_build_object('roomId',rid));
 PERFORM pg_temp.jhk_check((SELECT balance=130 FROM jhk_private.wallets WHERE session_id=a),'prestart cancellation refunds reserved host');
 snap:=pg_temp.jhk_call(ha,'create','{"stake":20}')->'match';rid:=(snap->>'id')::uuid;
 PERFORM pg_temp.jhk_call(hb,'join',jsonb_build_object('code',snap->>'code'));
 PERFORM pg_temp.jhk_call(ha,'ready',jsonb_build_object('roomId',rid,'stake',20));
 PERFORM pg_temp.jhk_call(hb,'ready',jsonb_build_object('roomId',rid,'stake',20));
 PERFORM pg_temp.jhk_call(ha,'leave',jsonb_build_object('roomId',rid));
 PERFORM pg_temp.jhk_call(ha,'leave',jsonb_build_object('roomId',rid));
 PERFORM pg_temp.jhk_check((SELECT balance=110 FROM jhk_private.wallets WHERE session_id=a) AND (SELECT balance=100 FROM jhk_private.wallets WHERE session_id=b),'poststart quit forfeits once rather than evading stake');
 PERFORM pg_temp.jhk_check(NOT EXISTS(SELECT 1 FROM jhk_private.reward_claims WHERE room_id=rid) AND NOT EXISTS(SELECT 1 FROM jhk_private.results WHERE room_id=rid),'forfeit creates no completion reward or standings');
 snap:=pg_temp.jhk_call(ha,'create','{"stake":20}')->'match';rid:=(snap->>'id')::uuid;
 PERFORM pg_temp.jhk_call(hb,'join',jsonb_build_object('code',snap->>'code'));
 PERFORM pg_temp.jhk_call(ha,'ready',jsonb_build_object('roomId',rid,'stake',20));
 PERFORM pg_temp.jhk_call(hb,'ready',jsonb_build_object('roomId',rid,'stake',20));
 UPDATE jhk_private.members SET last_seen=clock_timestamp()-interval '91 seconds' WHERE room_id=rid;
 PERFORM jhk_private.expire_rooms(clock_timestamp()); PERFORM jhk_private.expire_rooms(clock_timestamp());
 PERFORM pg_temp.jhk_check((SELECT balance=110 FROM jhk_private.wallets WHERE session_id=a) AND (SELECT balance=100 FROM jhk_private.wallets WHERE session_id=b),'both absent expiry refunds exactly once');

 UPDATE jhk_private.wallets SET balance=0 WHERE session_id=b;
 UPDATE jhk_private.wallet_entries SET amount=0 WHERE session_id=b AND kind='starter';
 snap:=pg_temp.jhk_call(hb,'queue','{"file":"sports","stake":0}')->'match';rid:=(snap->>'id')::uuid;
 snap:=pg_temp.jhk_call(ha,'queue','{"file":"sports","stake":0}')->'match';
 PERFORM pg_temp.jhk_check(snap->>'id'=rid::text,'zero-balance guest retains human duel access');
 PERFORM pg_temp.jhk_call(hb,'ready',jsonb_build_object('roomId',rid,'stake',0));
 PERFORM pg_temp.jhk_call(ha,'ready',jsonb_build_object('roomId',rid,'stake',0));
 PERFORM pg_temp.jhk_call(hb,'leave',jsonb_build_object('roomId',rid));
 PERFORM pg_temp.jhk_check((SELECT balance=0 FROM jhk_private.wallets WHERE session_id=b),'zero stake cannot incur a debt on leaving');
 PERFORM pg_temp.jhk_check(NOT EXISTS(SELECT 1 FROM jhk_private.wallets w WHERE w.session_id IN(a,b) AND w.balance<>(SELECT sum(e.amount) FROM jhk_private.wallet_entries e WHERE e.session_id=w.session_id)),'balances equal immutable signed ledger totals');
END $$;
SELECT jsonb_build_object('suite','jhk-online-economy','checks',count(*),'labels',jsonb_agg(label ORDER BY label)) AS evidence FROM jhk_economy_checks;
ROLLBACK;
