import { createHash } from 'node:crypto'

export const hashSecret = (value: string): string => createHash('sha256').update(value).digest('hex')
