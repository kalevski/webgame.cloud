import React, { useState } from 'react'
import { TcButton, TcDrawer, TcHeading, TcText } from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { Build } from 'types'

type Props = {
    build: Build | null
    projectId: string
    onClose: () => void
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const { t } = useStrings()
    const [copied, setCopied] = useState(false)

    const handle = () => {
        void navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        })
    }

    return (
        <TcButton variant="secondary" outline size="small" onClick={handle}>
            <i className={`bi bi-${copied ? 'check-lg' : 'clipboard'} me-1`} />
            {copied ? t.builds.copied : t.builds.copy}
        </TcButton>
    )
}

const IdentifierRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="d-flex align-items-center justify-content-between gap-2 p-2 bg-body-secondary rounded mb-2">
        <div className="d-flex flex-column overflow-hidden">
            <TcText variant="muted" size="small">
                {label}
            </TcText>
            <code className="text-break">{value}</code>
        </div>
        <div className="flex-shrink-0">
            <CopyButton text={value} />
        </div>
    </div>
)

const makeSnippet = (projectId: string, build: Build): string => {
    const reference = build.buildTag
        ? `buildTag=${build.buildTag}`
        : `buildId=${build.id}`
    return [
        `const manifest = await fetch(`,
        `    '${window.location.origin}/api/public/projects/${projectId}/assets?${reference}'`,
        `).then((response) => response.json())`,
        ``,
        `// manifest.files — every packed output, grouped by kind`,
        `for (const file of manifest.files) {`,
        `    console.log(file.group, file.name, file.url)`,
        `}`,
    ].join('\n')
}

const BuildIntegrationGuide: React.FC<Props> = ({ build, projectId, onClose }) => {
    const { t } = useStrings()
    const b = t.builds

    const buildRef = build?.buildTag || build?.id || null
    const buildRefLabel = build?.buildTag ? b.buildTagPreferred : b.buildIdLabel
    const snippet = build ? makeSnippet(projectId, build) : ''

    return (
        <TcDrawer open={build !== null} onClose={onClose} side="right" heading={b.integrateTitle}>
            <div className="d-flex flex-column gap-3 p-1">
                <TcText variant="muted">{b.integrateIntro}</TcText>

                <div>
                    <TcHeading as="h6">{b.identifiers}</TcHeading>
                    <IdentifierRow label={b.projectIdLabel} value={projectId} />
                    {buildRef && <IdentifierRow label={buildRefLabel} value={buildRef} />}
                </div>

                <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <TcHeading as="h6">{b.snippetLabel}</TcHeading>
                        {snippet && <CopyButton text={snippet} />}
                    </div>
                    <pre className="bg-body-secondary rounded p-3 overflow-auto" style={{ fontSize: '0.8rem' }}>
                        <code>{snippet}</code>
                    </pre>
                </div>
            </div>
        </TcDrawer>
    )
}

export default BuildIntegrationGuide
