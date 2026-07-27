DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'
