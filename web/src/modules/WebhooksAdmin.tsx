import React, { useEffect, useMemo } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { escapeHtml } from 'helpers/html'
import { MODAL, useModalOpen } from 'modals'
import { WebhookDeliveryStatus, WebhookEndpoint, WEBHOOK_DELIVERY_STATUSES } from 'types'
import { formatDateTime } from 'helpers/dates'

const STATUS_VARIANTS: Record<WebhookDeliveryStatus, string> = {
    pending: 'warning',
    delivered: 'success',
    failed: 'danger',
}

const PAGE_SIZE = 25

const WebhooksAdmin: React.FC = () => {
    const { t } = useStrings()
    const w = t.webhooks
    const webhooks = useStore((state) => state.webhooks)
    const webhooksLoaded = useStore((state) => state.webhooksLoaded)
    const deliveries = useStore((state) => state.deliveries)
    const deliveriesTotal = useStore((state) => state.deliveriesTotal)
    const deliveriesLoading = useStore((state) => state.deliveriesLoading)
    const deliveryFilters = useStore((state) => state.deliveryFilters)
    const fetchWebhooks = useStore((state) => state.fetchWebhooks)
    const fetchDeliveries = useStore((state) => state.fetchDeliveries)
    const deleteWebhook = useStore((state) => state.deleteWebhook)

    const canWrite = useCan('webhook.write')

    const openWebhook = useModalOpen<{ endpointId: string } | null, WebhookEndpoint | null>(MODAL.WEBHOOK)

    useEffect(() => {
        void fetchWebhooks()
        void fetchDeliveries({ limit: PAGE_SIZE, offset: 0 })
    }, [fetchWebhooks, fetchDeliveries])

    const endpointList = useTc<HTMLElement>({
        actions: webhooks.map((endpoint) => ({
            key: endpoint.id,
            title: endpoint.url,
            description: [
                w.eventCount(endpoint.events.length),
                endpoint.active ? '' : w.inactive,
                endpoint.description,
            ].filter(Boolean).join(' · '),
            ...(canWrite ? { label: w.edit, variant: 'secondary', icon: 'Pencil' } : {}),
        })),
        onActionClick: (id: string) => {
            const endpoint = webhooks.find((entry) => entry.id === id)
            if (endpoint) openWebhook(endpoint)
        },
    })

    const readOnlyList = useTc<HTMLElement>({
        items: webhooks.map((endpoint) => ({
            id: endpoint.id,
            label: endpoint.url,
            secondary: w.eventCount(endpoint.events.length),
        })),
    })

    const rows = useMemo(
        () =>
            deliveries
                .map((delivery) => [
                    '<tr>',
                    `<td>${escapeHtml(delivery.endpointUrl ?? '—')}</td>`,
                    `<td>${escapeHtml(delivery.action)}</td>`,
                    `<td><tc-badge variant="${STATUS_VARIANTS[delivery.status]}">${escapeHtml(w.statusLabels[delivery.status])}</tc-badge></td>`,
                    `<td style="text-align:right">${delivery.attempts}</td>`,
                    `<td>${escapeHtml(delivery.responseStatus === null ? (delivery.error || '—') : String(delivery.responseStatus))}</td>`,
                    `<td>${escapeHtml(formatDateTime(delivery.createdAt))}</td>`,
                    '</tr>',
                ].join(''))
                .join(''),
        [deliveries, w]
    )

    const table = useTc<HTMLElement>({
        columns: [
            { key: 'endpoint', label: w.columnEndpoint, minWidth: '16rem' },
            { key: 'event', label: w.columnEvent, minWidth: '10rem' },
            { key: 'status', label: w.columnStatus },
            { key: 'attempts', label: w.columnAttempts, align: 'right', hideBelow: 'md' },
            { key: 'response', label: w.columnResponse, hideBelow: 'md' },
            { key: 'created', label: w.columnCreated, hideBelow: 'sm' },
        ],
        filters: [
            { key: 'q', label: w.filterSearch, type: 'text', placeholder: w.filterSearchPlaceholder },
            {
                key: 'status',
                label: w.filterStatus,
                type: 'select',
                placeholder: w.filterAll,
                options: WEBHOOK_DELIVERY_STATUSES.map((status) => ({
                    value: status,
                    label: w.statusLabels[status],
                })),
            },
        ],
        filterValues: deliveryFilters as Record<string, unknown>,
        rows,
        onFilterChange: (key: string, value: unknown) => {
            void fetchDeliveries({ [key]: (value as string) || undefined, offset: 0 })
        },
        onPageChange: (offset: number) => {
            void fetchDeliveries({ offset })
        },
    })

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-endpoint]')
        const id = button?.dataset.endpoint
        if (!id) return
        const endpoint = webhooks.find((entry) => entry.id === id)
        if (endpoint && window.confirm(w.deletePrompt(endpoint.url))) void deleteWebhook(id)
    }

    return (
        <div className="module module-webhooks" role="presentation" onClick={onClick}>
            <tc-section-card title={w.title} icon="Webhook">
                <span slot="action" className="section-card-actions">
                    {canWrite && (
                        <tc-button variant="primary" onClick={() => openWebhook(null)}>
                            {w.create}
                        </tc-button>
                    )}
                </span>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{w.intro}</tc-text>

                    {webhooksLoaded && webhooks.length === 0 && (
                        <tc-empty-state icon="webhook">{w.empty}</tc-empty-state>
                    )}

                    {webhooks.length > 0 && canWrite && (
                        <tc-action-row-list ref={endpointList} outline trailing-icon="none"></tc-action-row-list>
                    )}

                    {webhooks.length > 0 && !canWrite && <tc-data-list ref={readOnlyList}></tc-data-list>}
                </tc-stack>
            </tc-section-card>

            <tc-section-card title={w.deliveriesTitle} className="module-webhooks__deliveries">
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{w.deliveriesIntro}</tc-text>

                    <tc-advanced-table
                        ref={table}
                        limit={PAGE_SIZE}
                        offset={deliveryFilters.offset ?? 0}
                        total={deliveriesTotal}
                        loading={deliveriesLoading || undefined}
                    ></tc-advanced-table>

                    {!deliveriesLoading && deliveries.length === 0 && (
                        <tc-empty-state icon="send">{w.deliveriesEmpty}</tc-empty-state>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default WebhooksAdmin
