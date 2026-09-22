import { parseArgs } from './flags.js'
import { out } from './output.js'
import { USAGE } from './usage.js'
import { jobsCommand } from './commands/jobs.js'
import { runCommand } from './commands/run.js'
import { seedDemoCommand } from './commands/seed-demo.js'
import { statusCommand } from './commands/status.js'

const main = async (): Promise<number> => {
    const [command = 'help', ...rest] = process.argv.slice(2)

    if (command === 'help' || command === '--help' || command === '-h') {
        out(USAGE)
        return 0
    }

    const { options, positional } = parseArgs(rest)

    switch (command) {
        case 'status': await statusCommand(); break
        case 'jobs': await jobsCommand(); break
        case 'run': await runCommand(positional); break
        case 'seed-demo': await seedDemoCommand(options); break
        default:
            out(`unknown command "${command}"`)
            out(USAGE)
            return 1
    }

    return 0
}

try {
    process.exit(await main())
} catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
}
