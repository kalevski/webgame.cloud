import React, { useEffect, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useProjectCan } from 'hooks/useProjectCan'
import { detailValue, useTc } from '@toolcase/web-components/react'
import FloatingActionBar from 'components/FloatingActionBar'
import { Project } from 'types'

const ProjectSettingsCategoriesAndTags: React.FC<{ project: Project }> = ({ project }) => {
    const { t } = useStrings()
    const p = t.projects
    const w = t.projectWizard
    const saveCategoriesAndTags = useStore((state) => state.saveCategoriesAndTags)
    const categoriesAndTags = useStore((state) => state.categoriesAndTags)
    const fetchCategoriesAndTags = useStore((state) => state.fetchCategoriesAndTags)
    const canWrite = useProjectCan('project.settings')

    const [categories, setCategories] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [buildTags, setBuildTags] = useState<string[]>([])
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)

    useEffect(() => {
        void fetchCategoriesAndTags(project.id)
    }, [project.id, fetchCategoriesAndTags])

    useEffect(() => {
        if (!categoriesAndTags) return
        setCategories(categoriesAndTags.categories.map((entry) => entry.name))
        setTags(categoriesAndTags.tags.map((entry) => entry.name))
        setBuildTags(categoriesAndTags.buildTags.map((entry) => entry.name))
        setDirty(false)
    }, [categoriesAndTags])

    const advice = w.categoryAndTagRecommendations[project.appType]

    const categoryInput = useTc<HTMLElement>(
        { value: categories, recommendations: advice.categories },
        {
            'tc-change': (event: Event) => {
                setCategories(detailValue<string[]>(event as CustomEvent) ?? [])
                setDirty(true)
            },
        }
    )
    const tagInput = useTc<HTMLElement>(
        { value: tags, recommendations: advice.tags },
        {
            'tc-change': (event: Event) => {
                setTags(detailValue<string[]>(event as CustomEvent) ?? [])
                setDirty(true)
            },
        }
    )
    const buildTagInput = useTc<HTMLElement>(
        { value: buildTags, recommendations: advice.buildTags },
        {
            'tc-change': (event: Event) => {
                setBuildTags(detailValue<string[]>(event as CustomEvent) ?? [])
                setDirty(true)
            },
        }
    )

    const handleSave = async () => {
        if (saving || categories.length === 0) return
        setSaving(true)
        try {
            const ok = await saveCategoriesAndTags(project.id, { categories, tags, buildTags })
            if (ok) setDirty(false)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="project-settings">
            <div className="project-settings__form">
                <tc-panel bordered className="module-project-detail__settings-panel">
                    <tc-stack direction="column" gap="0.85rem">
                        <tc-text variant="muted">{w.categoriesAndTagsIntro}</tc-text>

                        <div>
                            <tc-tag-input
                                ref={categoryInput}
                                label={p.categoriesLabel}
                                help={w.categoriesGuide}
                                allow-create
                                disabled={!canWrite || undefined}
                            />
                            <tc-helper-text icon="Lightbulb">{advice.categoriesNote}</tc-helper-text>
                        </div>

                        <div>
                            <tc-tag-input
                                ref={tagInput}
                                label={p.tagsLabel}
                                help={w.tagsGuide}
                                allow-create
                                disabled={!canWrite || undefined}
                            />
                            <tc-helper-text icon="Lightbulb">{advice.tagsNote}</tc-helper-text>
                        </div>

                        <div>
                            <tc-tag-input
                                ref={buildTagInput}
                                label={p.buildTagsLabel}
                                help={w.buildTagsGuide}
                                allow-create
                                disabled={!canWrite || undefined}
                            />
                            <tc-helper-text icon="Lightbulb">{advice.buildTagsNote}</tc-helper-text>
                        </div>

                        <tc-alert variant="warning">{w.categoriesAndTagsRemoveWarning}</tc-alert>

                    </tc-stack>
                </tc-panel>
            </div>

            <FloatingActionBar label={p.unsavedHint} visible={dirty}>
                {canWrite && (
                    <tc-button
                        key="save"
                        variant="primary"
                        disabled={saving || categories.length === 0 || undefined}
                        onClick={handleSave}
                    >
                        {p.save}
                    </tc-button>
                )}
            </FloatingActionBar>
        </div>
    )
}

export default ProjectSettingsCategoriesAndTags
