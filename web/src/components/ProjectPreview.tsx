import React from 'react'
import useStrings from 'hooks/useStrings'
import ProjectIconTile from 'components/ProjectIconTile'
import { GENRE_BY_KEY } from 'configs/genres'
import { AppType } from 'types'

export type ProjectPreviewDraft = {
    name: string
    description: string
    appType: AppType
    genre: string
    icon: string
    color: string
    categories: string[]
    tags: string[]
    buildTags: string[]
}

type ProjectPreviewProps = {
    draft: ProjectPreviewDraft
    compact?: boolean
}

const stripMarkdown = (value: string): string =>
    value
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/[*_`>#\-]/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()

const ChipRow: React.FC<{ label: string; values: string[]; empty: string }> = ({ label, values, empty }) => (
    <div className="project-preview__row">
        <span className="project-preview__row-label">{label}</span>
        {values.length === 0 ? (
            <span className="project-preview__row-empty">{empty}</span>
        ) : (
            <span className="project-preview__chips">
                {values.map((value) => (
                    <span key={value} className="project-preview__chip">
                        {value}
                    </span>
                ))}
            </span>
        )}
    </div>
)

const ProjectPreview: React.FC<ProjectPreviewProps> = ({ draft, compact = false }) => {
    const { t } = useStrings()
    const p = t.projects
    const w = t.projectWizard

    const genre = GENRE_BY_KEY[draft.genre]
    const appTypeLabel =
        draft.appType === 'game' ? p.appTypeGame : draft.appType === 'app' ? p.appTypeApp : p.appTypePrototype
    const summary = stripMarkdown(draft.description)

    if (compact) {
        return (
            <div className="project-preview project-preview--compact">
                <ProjectIconTile icon={draft.icon} color={draft.color} size="sm" />
                <span className="project-preview__compact-name">{draft.name.trim() || w.previewUntitled}</span>
                <span className="project-preview__compact-meta">
                    {appTypeLabel}
                    {genre ? ` · ${genre.label}` : ''}
                    {` · ${w.previewCounts(draft.categories.length, draft.tags.length, draft.buildTags.length)}`}
                </span>
            </div>
        )
    }

    return (
        <div className="project-preview">
            <span className="project-preview__eyebrow">{w.previewTitle}</span>

            <div className="project-preview__head">
                <ProjectIconTile icon={draft.icon} color={draft.color} size="lg" />
                <div className="project-preview__identity">
                    <span className="project-preview__name">{draft.name.trim() || w.previewUntitled}</span>
                    <span className="project-preview__badges">
                        <tc-badge variant="primary" text={appTypeLabel}></tc-badge>
                        {genre && <tc-badge variant="secondary" text={genre.label}></tc-badge>}
                    </span>
                </div>
            </div>

            <p className="project-preview__description">{summary || w.previewNoDescription}</p>

            <div className="project-preview__rows">
                <ChipRow label={p.categoriesLabel} values={draft.categories} empty={w.previewNone} />
                <ChipRow label={p.tagsLabel} values={draft.tags} empty={w.previewNone} />
                <ChipRow label={p.buildTagsLabel} values={draft.buildTags} empty={w.previewNone} />
            </div>

            <p className="project-preview__hint">{w.previewHint}</p>
        </div>
    )
}

export default ProjectPreview
