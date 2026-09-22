import { escapeHtml as escape } from '@toolcase/base'

export const escapeHtml = (value: unknown): string => escape(String(value ?? ''))

export const rowIconButton = (
    icon: string,
    variant: string,
    action: string,
    id: string,
    label: string,
    idAttribute = 'data-id'
): string =>
    `<tc-icon-button icon="${icon}" variant="${variant}" size="small" outline` +
    ` data-action="${action}" ${idAttribute}="${escapeHtml(id)}"` +
    ` label="${escapeHtml(label)}" title="${escapeHtml(label)}"></tc-icon-button>`
