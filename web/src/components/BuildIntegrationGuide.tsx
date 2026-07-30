import React, { useState } from 'react'
import { TcDrawer } from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { formatBytes } from 'helpers/format'
import { Build } from 'types'

type Props = {
    build: Build | null
    projectId: string
    onClose: () => void
}

const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
    const [copied, setCopied] = useState(false)

    const handle = () => {
        void navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        })
    }

    return (
        <tc-icon-button
            icon={copied ? 'Check' : 'Clipboard'}
            variant={copied ? 'success' : 'secondary'}
            size="small"
            outline
            label={label}
            title={label}
            onClick={handle}
        ></tc-icon-button>
    )
}

const IdentifierRow: React.FC<{ label: string; value: string; copyLabel: string }> = ({
    label,
    value,
    copyLabel,
}) => (
    <div className="integration-guide__identifier">
        <span className="integration-guide__identifier-text">
            <span className="integration-guide__identifier-label">{label}</span>
            <code>{value}</code>
        </span>
        <CopyButton text={value} label={copyLabel} />
    </div>
)

const makeSnippet = (projectId: string, build: Build): string => {
    const reference = build.buildTag ? `buildTag=${build.buildTag}` : `buildId=${build.id}`
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
            <div className="integration-guide">
                <tc-eyebrow>{b.integrateEyebrow}</tc-eyebrow>
                <tc-alert variant="info">{b.integrateIntro}</tc-alert>

                {build && (
                    <tc-badge-row
                        className="integration-guide__meta"
                        ref={(element: (HTMLElement & { badges?: unknown[] }) | null) => {
                            if (element) {
                                element.badges = [
                                    { label: 'status', value: b.status[build.status] ?? build.status },
                                    { label: b.sizeLabel, value: formatBytes(build.sizeBytes) },
                                    ...(build.buildTag ? [{ label: b.tagLabel, value: build.buildTag }] : []),
                                ]
                            }
                        }}
                    ></tc-badge-row>
                )}

                <tc-panel bordered>
                    <tc-panel-header icon="Fingerprint">{b.identifiers}</tc-panel-header>
                    <div className="integration-guide__identifiers">
                        <IdentifierRow label={b.projectIdLabel} value={projectId} copyLabel={b.copy} />
                        {buildRef && <IdentifierRow label={buildRefLabel} value={buildRef} copyLabel={b.copy} />}
                    </div>
                </tc-panel>

                <tc-code-snippet
                    className="integration-guide__snippet"
                    code={snippet}
                    language="javascript"
                    title={b.snippetLabel}
                ></tc-code-snippet>

                <tc-helper-text icon="Info">{b.integrateFooter}</tc-helper-text>
            </div>
        </TcDrawer>
    )
}

export default BuildIntegrationGuide
