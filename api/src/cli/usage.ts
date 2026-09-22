export const USAGE = `webgame-api — manage a running api service over its local control API

Usage: webgame-api <command> [options]

Commands
  status          build, database, migration version, in-process workers
  jobs            scheduled jobs with cron, next run and last run
  run [kind ...]  enqueue jobs now (no kinds = every scheduled job)
  seed-demo       fill an empty database with a demo dataset
                    --scale=small|medium|large   how much (default small)
                    --seed=<string>              the PRNG seed (default webgame)
                    --force                      layer a SECOND dataset on a populated
                                                 database (it does not replace the first)
  help            this text

Talks to the control API on 127.0.0.1:\${CONTROL_PORT} (default 6010), which is
bound to localhost inside the service process — run this command inside the
container (docker exec <container> webgame-api status) or set CONTROL_URL to
somewhere reachable. Job commands return immediately; follow progress with
"webgame-api jobs" or the service logs.
`
