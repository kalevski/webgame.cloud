import type { ConfigValidationError, SchemaProperty, SchemaPropertyType } from '../contracts/index.js'
import { SCHEMA_REF_MAX_DEPTH } from '../contracts/index.js'

export type SchemaLookup = (id: string) => SchemaProperty[] | undefined

const JSON_TYPE: Record<Exclude<SchemaPropertyType, 'ref'>, string> = {
    string: 'string',
    number: 'number',
    integer: 'integer',
    boolean: 'boolean',
    object: 'object',
    array: 'array',
}

export class SchemaCycleError extends Error {}

export const inlineDefinition = (
    definition: SchemaProperty[],
    lookup: SchemaLookup,
    seen: string[] = [],
    depth = 0
): SchemaProperty[] => {
    if (depth > SCHEMA_REF_MAX_DEPTH) throw new SchemaCycleError('schema nesting is too deep')

    return definition.map((property) => {
        if (property.type === 'ref') {
            const id = property.ref ?? ''
            if (seen.includes(id)) throw new SchemaCycleError(`schema ${id} references itself`)
            const target = lookup(id)
            if (!target) return { ...property, type: 'object' as SchemaPropertyType, properties: [] }
            return {
                ...property,
                type: 'object' as SchemaPropertyType,
                properties: inlineDefinition(target, lookup, [...seen, id], depth + 1),
            }
        }

        if (property.properties) {
            return {
                ...property,
                properties: inlineDefinition(property.properties, lookup, seen, depth + 1),
            }
        }

        return property
    })
}

export const toJsonSchema = (definition: SchemaProperty[]): Record<string, unknown> => {
    const properties: Record<string, unknown> = {}
    const required: string[] = []

    for (const property of definition) {
        if (property.required) required.push(property.key)

        if (property.type === 'object') {
            properties[property.key] = toJsonSchema(property.properties ?? [])
            continue
        }

        if (property.type === 'array') {
            properties[property.key] = {
                type: 'array',
                items: property.itemType && property.itemType !== 'ref'
                    ? { type: JSON_TYPE[property.itemType] }
                    : {},
            }
            continue
        }

        const base: Record<string, unknown> = {
            type: JSON_TYPE[property.type as Exclude<SchemaPropertyType, 'ref'>] ?? 'string',
        }
        if (property.enum && property.enum.length > 0) base.enum = property.enum
        properties[property.key] = base
    }

    return { type: 'object', properties, required }
}

const matches = (value: unknown, property: SchemaProperty): boolean => {
    switch (property.type) {
        case 'string':
            return typeof value === 'string'
        case 'number':
            return typeof value === 'number' && Number.isFinite(value)
        case 'integer':
            return typeof value === 'number' && Number.isInteger(value)
        case 'boolean':
            return typeof value === 'boolean'
        case 'array':
            return Array.isArray(value)
        case 'object':
            return typeof value === 'object' && value !== null && !Array.isArray(value)
        default:
            return true
    }
}

export const validateValues = (
    definition: SchemaProperty[],
    values: Record<string, unknown>,
    path = ''
): ConfigValidationError[] => {
    const errors: ConfigValidationError[] = []

    for (const property of definition) {
        const here = path ? `${path}.${property.key}` : property.key
        const value = values?.[property.key]

        if (value === undefined || value === null) {
            if (property.required) errors.push({ path: here, message: 'is required' })
            continue
        }

        if (!matches(value, property)) {
            errors.push({ path: here, message: `must be a ${property.type}` })
            continue
        }

        if (property.enum && property.enum.length > 0 && !property.enum.includes(String(value))) {
            errors.push({ path: here, message: `must be one of ${property.enum.join(', ')}` })
            continue
        }

        if (property.type === 'object' && property.properties) {
            errors.push(...validateValues(property.properties, value as Record<string, unknown>, here))
        }
    }

    return errors
}

export const migrateValues = (
    definition: SchemaProperty[],
    values: Record<string, unknown>
): Record<string, unknown> => {
    const migrated: Record<string, unknown> = {}

    for (const property of definition) {
        const current = values?.[property.key]
        if (current !== undefined) {
            migrated[property.key] = property.type === 'object' && property.properties
                ? migrateValues(property.properties, current as Record<string, unknown>)
                : current
            continue
        }
        if (property.defaultValue !== undefined) migrated[property.key] = property.defaultValue
        else if (property.type === 'object') migrated[property.key] = migrateValues(property.properties ?? [], {})
    }

    return migrated
}
