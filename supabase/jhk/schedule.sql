-- Operator-only; pg_cron must be enabled.
select cron.schedule('jhk-expire-rooms','* * * * *','select jhk_private.expire_rooms(clock_timestamp());');
