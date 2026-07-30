import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useFeature from 'hooks/useFeature'
import Icon from 'components/icons'
import { TcUsageSummaryPanel } from 'lib/tc'
import { LimitUsage, RESOURCE_LABELS, USAGE_WARN_RATIO } from 'types'

type Row = {
    label: string
    used: number
    total: number
    measurementUnit: string
    warn: boolean
}

const toRows = (usage: LimitUsage[], storageUnit: string): Row[] =>
    usage
        .filter((entry): entry is LimitUsage & { limit: number } => entry.limit !== null && entry.limit > 0)
        .map((entry) => ({
            label: RESOURCE_LABELS[entry.resource],
            used: entry.used,
            total: entry.limit,
            measurementUnit: entry.resource === 'storage_mb' ? storageUnit : '',
            warn: entry.used / entry.limit >= USAGE_WARN_RATIO,
        }))

const UsageSummary: React.FC = () => {
    const { t } = useStrings()
    const u = t.usagePanel
    const navigate = useNavigate()
    const billingEnabled = useFeature('billing')

    const accountUsage = useStore((state) => state.accountUsage)
    const accountUsageLoaded = useStore((state) => state.accountUsageLoaded)
    const fetchAccountUsage = useStore((state) => state.fetchAccountUsage)
    const projects = useStore((state) => state.projects)
    const activeProjectId = useStore((state) => state.activeProjectId)
    const projectUsage = useStore((state) => state.projectUsage)
    const fetchProjectUsage = useStore((state) => state.fetchProjectUsage)

    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchAccountUsage()
    }, [fetchAccountUsage])

    useEffect(() => {
        if (activeProjectId) fetchProjectUsage(activeProjectId)
    }, [activeProjectId, fetchProjectUsage])

    useEffect(() => {
        if (!open) return
        const onPointer = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onPointer)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onPointer)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const activeProject = useMemo(
        () => projects.find((project) => project.id === activeProjectId) ?? null,
        [projects, activeProjectId]
    )

    const accountRows = useMemo(() => toRows(accountUsage, u.unitStorage), [accountUsage, u.unitStorage])
    const projectRows = useMemo(
        () => (activeProjectId ? toRows(projectUsage[activeProjectId] ?? [], u.unitStorage) : []),
        [activeProjectId, projectUsage, u.unitStorage]
    )

    const nearLimit = [...accountRows, ...projectRows].some((row) => row.warn)
    const measured = accountRows.length > 0 || projectRows.length > 0

    const openPanel = () => {
        setOpen((value) => !value)
        if (open) return
        fetchAccountUsage()
        if (activeProjectId) fetchProjectUsage(activeProjectId)
    }

    return (
        <div className="module-usage" ref={rootRef}>
            <button
                type="button"
                className="module-usage__button"
                aria-label={u.title}
                title={u.title}
                onClick={openPanel}
            >
                <Icon name="gauge" size={18} />
                {nearLimit && <span className="module-usage__dot" />}
            </button>
            {open && (
                <div className="module-usage__panel">
                    <div className="module-usage__head">
                        <strong>{u.title}</strong>
                    </div>

                    <tc-scroll-area max-height="320" axis="y">
                        <div className="module-usage__body">
                            {!measured && accountUsageLoaded && (
                                <p className="module-usage__empty">
                                    {accountUsage.length > 0 ? u.unlimited : u.empty}
                                </p>
                            )}
                            {accountRows.length > 0 && (
                                <TcUsageSummaryPanel title={u.account} usage={accountRows} />
                            )}
                            {projectRows.length > 0 && activeProject && (
                                <TcUsageSummaryPanel
                                    title={u.project(activeProject.name)}
                                    usage={projectRows}
                                />
                            )}
                        </div>
                    </tc-scroll-area>

                    {nearLimit && billingEnabled && (
                        <div className="module-usage__upgrade">
                            <span className="module-usage__upgrade-note">{u.nearLimit}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false)
                                    navigate('/billing')
                                }}
                            >
                                {u.upgrade}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default UsageSummary
