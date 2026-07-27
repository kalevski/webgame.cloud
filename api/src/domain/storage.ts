import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { FileSourceType } from '../contracts/index.js'
import type { FileSourceRow } from '../schema/files.js'

export type StoragePort = {
    id: FileSourceType

    put(source: FileSourceRow, location: string, data: Buffer): Promise<void>
    get(source: FileSourceRow, location: string): Promise<Buffer>
    remove(source: FileSourceRow, location: string): Promise<void>
}

const registry = new Map<FileSourceType, StoragePort>()

export const registerStoragePort = (port: StoragePort): void => {
    registry.set(port.id, port)
}

export const getStoragePort = (id: FileSourceType): StoragePort | undefined => registry.get(id)

const diskPath = (source: FileSourceRow, location: string): string =>
    path.join(source.config.basePath || './uploads', location)

export const diskStoragePort: StoragePort = {
    id: 'disk',

    async put(source, location, data) {
        const target = diskPath(source, location)
        await fs.mkdir(path.dirname(target), { recursive: true })
        await fs.writeFile(target, data)
    },

    async get(source, location) {
        return fs.readFile(diskPath(source, location))
    },

    async remove(source, location) {
        await fs.rm(diskPath(source, location), { force: true })
    },
}

const s3Bucket = (source: FileSourceRow): string => {
    const bucket = source.config.bucket
    if (!bucket) throw new Error('s3 source has no bucket configured')
    return bucket
}

const s3ClientFor = async (source: FileSourceRow) => {
    const { S3Client } = await import('@aws-sdk/client-s3')
    const { region, endpoint, forcePathStyle, accessKeyId } = source.config
    return new S3Client({
        region: region || 'us-east-1',
        endpoint: endpoint || undefined,
        forcePathStyle: forcePathStyle ?? Boolean(endpoint),
        credentials: accessKeyId ? { accessKeyId, secretAccessKey: source.secret } : undefined,
    })
}

export const s3StoragePort: StoragePort = {
    id: 's3',

    async put(source, location, data) {
        const { PutObjectCommand } = await import('@aws-sdk/client-s3')
        const client = await s3ClientFor(source)
        await client.send(new PutObjectCommand({ Bucket: s3Bucket(source), Key: location, Body: data }))
    },

    async get(source, location) {
        const { GetObjectCommand } = await import('@aws-sdk/client-s3')
        const client = await s3ClientFor(source)
        const response = await client.send(new GetObjectCommand({ Bucket: s3Bucket(source), Key: location }))
        if (!response.Body) throw new Error('s3 object has no body')
        return Buffer.from(await response.Body.transformToByteArray())
    },

    async remove(source, location) {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
        const client = await s3ClientFor(source)
        await client.send(new DeleteObjectCommand({ Bucket: s3Bucket(source), Key: location }))
    },
}

registerStoragePort(diskStoragePort)
registerStoragePort(s3StoragePort)
