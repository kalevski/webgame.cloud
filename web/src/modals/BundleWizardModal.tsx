import React, { useEffect, useMemo, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import ChoiceCards, { ChoiceCardOption } from 'components/ChoiceCards'
import { escapeHtml } from 'helpers/html'
import { formatBytes } from 'helpers/format'
import { Bundle, BundleDraft, BundleEngine, PackingAlgorithm } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: unknown; values?: string[]; items?: unknown[] }

const STEP_KEYS = ['details', 'rule', 'packing'] as const

const ALGORITHM_ITEMS = [
    { key: 'basic', label: 'Basic' },
    { key: 'max-rects', label: 'MaxRects' },
    { key: 'shelf', label: 'Shelf' },
    { key: 'guillotine', label: 'Guillotine' },
]

const ENGINE_LOGOS: Record<string, string | undefined> = {
    phaser: '/imgs/phaser-planet-small.png',
    pixi: '/imgs/pixijs-logo-transparent-light.png',
}

const valuesFrom = (event: Event): string[] => {
    const detail = (event as CustomEvent<{ value: string | string[] }>).detail?.value
    if (Array.isArray(detail)) return detail
    if (typeof detail === 'string' && detail) return detail.split(',')
    return []
}

const BundleWizardModal: React.FC = () => {
    const closeModal = useModalClose()
    const input = useModalInput<{ projectId: string; bundle: Bundle | null }>(MODAL.BUNDLE_WIZARD)
    const isOpen = useModalIsOpen(MODAL.BUNDLE_WIZARD)
    const createBundle = useStore((state) => state.createBundle)
    const updateBundle = useStore((state) => state.updateBundle)
    const previewRule = useStore((state) => state.previewRule)
    const preview = useStore((state) => state.preview)
    const previewLoading = useStore((state) => state.previewLoading)
    const categoriesAndTags = useStore((state) => state.categoriesAndTags)
    const { t } = useStrings()
    const b = t.bundles

    const existing = input?.bundle ?? null
    const [step, setStep] = useState(0)
    const [name, setName] = useState('')
    const [engine, setEngine] = useState<BundleEngine>('phaser')
    const [categoryId, setCategoryId] = useState('')
    const [included, setIncluded] = useState<string[]>([])
    const [excluded, setExcluded] = useState<string[]>([])
    const buildTag = useRef('')
    const algorithm = useRef<PackingAlgorithm>('max-rects')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setStep(0)
        setName(existing?.name ?? '')
        setEngine(existing?.engine ?? 'phaser')
        setCategoryId(existing?.categoryId ?? '')
        setIncluded(existing?.includedTags ?? [])
        setExcluded(existing?.excludedTags ?? [])
        buildTag.current = existing?.buildTag ?? ''
        algorithm.current = existing?.algorithm ?? 'max-rects'
    }, [isOpen, existing])

    const engineOptions: ChoiceCardOption[] = [
        {
            key: 'phaser',
            name: 'Phaser',
            note: b.enginePhaserNote,
            detail: b.enginePhaserDetail,
            logo: ENGINE_LOGOS.phaser,
            tags: b.enginePhaserTags,
        },
        {
            key: 'pixi',
            name: 'PixiJS',
            note: b.enginePixiNote,
            detail: b.enginePixiDetail,
            logo: ENGINE_LOGOS.pixi,
            tags: b.enginePixiTags,
        },
        {
            key: 'custom',
            name: b.engineCustom,
            note: b.engineCustomNote,
            detail: b.engineCustomDetail,
            icon: 'braces',
            tags: b.engineCustomTags,
        },
    ]

    const tagItems = useMemo(
        () => (categoriesAndTags?.tags ?? []).map((tag) => ({ key: tag.name, label: tag.name })),
        [categoriesAndTags]
    )

    const nameInput = useTc<ValueElement>({
        onChange: (value: unknown) => setName(String(value ?? '')),
    })
    const categorySelect = useTc<ValueElement>({
        items: [
            { key: '', label: b.anyCategory },
            ...(categoriesAndTags?.categories ?? []).map((category) => ({ key: category.id, label: category.name })),
        ],
        onChange: (value: unknown) => setCategoryId(String(value ?? '')),
    })
    const includedSelect = useTc<ValueElement>({ items: tagItems }, {
        'tc-change': (event: Event) => setIncluded(valuesFrom(event)),
    })
    const excludedSelect = useTc<ValueElement>({ items: tagItems }, {
        'tc-change': (event: Event) => setExcluded(valuesFrom(event)),
    })
    const buildTagSelect = useTc<ValueElement>({
        items: [
            { key: '', label: b.noBuildTag },
            ...(categoriesAndTags?.buildTags ?? []).map((tag) => ({ key: tag.name, label: tag.name })),
        ],
        onChange: (value: unknown) => {
            buildTag.current = String(value ?? '')
        },
    })
    const algorithmSelect = useTc<ValueElement>({
        items: ALGORITHM_ITEMS,
        onChange: (value: unknown) => {
            algorithm.current = String(value ?? 'max-rects') as PackingAlgorithm
        },
    })
    const stepper = useTc<ValueElement>({
        steps: [
            { key: 'details', label: b.stepDetails, description: b.stepDetailsHint },
            { key: 'rule', label: b.stepRule, description: b.stepRuleHint },
            { key: 'packing', label: b.stepPacking, description: b.stepPackingHint },
        ],
    })

    useEffect(() => {
        if (!isOpen) return
        const frame = requestAnimationFrame(() => {
            if (nameInput.current) nameInput.current.value = name
            if (categorySelect.current) categorySelect.current.value = categoryId
            if (buildTagSelect.current) buildTagSelect.current.value = buildTag.current
            if (algorithmSelect.current) algorithmSelect.current.value = algorithm.current
            if (includedSelect.current) includedSelect.current.values = included
            if (excludedSelect.current) excludedSelect.current.values = excluded
        })
        return () => cancelAnimationFrame(frame)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    useEffect(() => {
        if (!isOpen || !input) return
        const handle = setTimeout(() => {
            void previewRule(input.projectId, {
                categoryId: categoryId || null,
                includedTags: included,
                excludedTags: excluded,
            })
        }, 250)
        return () => clearTimeout(handle)
    }, [isOpen, categoryId, included, excluded, input, previewRule])

    const previewRows = useMemo(
        () =>
            (preview?.files ?? [])
                .map((file) =>
                    [
                        '<tr>',
                        `<td><strong>${escapeHtml(file.name)}</strong></td>`,
                        `<td>${escapeHtml(file.kind)}</td>`,
                        `<td>${(file.tags ?? [])
                            .map((tag) => `<tc-badge variant="secondary">${escapeHtml(tag)}</tc-badge>`)
                            .join(' ')}</td>`,
                        `<td style="text-align:right">${escapeHtml(formatBytes(file.sizeBytes))}</td>`,
                        '</tr>',
                    ].join('')
                )
                .join(''),
        [preview]
    )

    const previewTable = useTc<ValueElement>({
        columns: [
            { key: 'name', label: b.previewColName, minWidth: '14rem' },
            { key: 'kind', label: b.previewColKind },
            { key: 'tags', label: b.previewColTags, minWidth: '12rem' },
            { key: 'size', label: b.previewColSize, align: 'right' },
        ],
        rows: previewRows,
        total: preview?.count ?? 0,
        offset: 0,
        limit: Math.max(preview?.files.length ?? 0, 1),
        loading: previewLoading,
    })

    const submit = async () => {
        if (!input) return
        setSaving(true)
        const draft: BundleDraft = {
            name: name.trim(),
            engine,
            categoryId: categoryId || null,
            includedTags: included,
            excludedTags: excluded,
            buildTag: buildTag.current,
            algorithm: algorithm.current,
        }
        try {
            const done = existing
                ? await updateBundle(input.projectId, existing.id, draft)
                : Boolean(await createBundle(input.projectId, draft))
            if (done) closeModal(true)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div className="bundle-wizard">
                <div className="bundle-wizard__stepper">
                    <tc-stepper ref={stepper} active-step={STEP_KEYS[step]} />
                </div>

                <div hidden={step !== 0 || undefined}>
                    <tc-form-input ref={nameInput} label={b.nameLabel} placeholder={b.namePlaceholder} required />
                    <tc-helper-text icon="Lightbulb">{b.nameHint}</tc-helper-text>

                    <tc-label>{b.engineLabel}</tc-label>
                    <ChoiceCards
                        options={engineOptions}
                        value={engine}
                        onChange={(next) => setEngine(next as BundleEngine)}
                        label={b.engineLabel}
                    />
                    <tc-helper-text icon="Info">{b.engineHint}</tc-helper-text>
                </div>

                <div hidden={step !== 1 || undefined}>
                    <tc-alert variant="info">{b.ruleIntro}</tc-alert>

                    <tc-label>{b.categoryLabel}</tc-label>
                    <tc-extended-select
                        ref={categorySelect}
                        placeholder={b.anyCategory}
                        search-placeholder={b.categorySearch}
                        max-height="220"
                    ></tc-extended-select>
                    <tc-helper-text icon="Info">{b.categoryHint}</tc-helper-text>

                    <tc-label>{b.includedLabel}</tc-label>
                    <tc-extended-select
                        ref={includedSelect}
                        multiple
                        placeholder={b.includedPlaceholder}
                        search-placeholder={b.tagSearch}
                        max-height="220"
                    ></tc-extended-select>
                    <tc-helper-text icon="Info">{b.includedHint}</tc-helper-text>

                    <tc-label>{b.excludedLabel}</tc-label>
                    <tc-extended-select
                        ref={excludedSelect}
                        multiple
                        placeholder={b.excludedPlaceholder}
                        search-placeholder={b.tagSearch}
                        max-height="220"
                    ></tc-extended-select>
                    <tc-helper-text icon="Info">{b.excludedHint}</tc-helper-text>

                    <tc-label>{b.buildTagLabel}</tc-label>
                    <tc-extended-select
                        ref={buildTagSelect}
                        placeholder={b.noBuildTag}
                        search-placeholder={b.buildTagSearch}
                        max-height="220"
                    ></tc-extended-select>
                    <tc-helper-text icon="Info">{b.buildTagHint}</tc-helper-text>
                </div>

                <div hidden={step !== 2 || undefined}>
                    <tc-label>{b.algorithmLabel}</tc-label>
                    <tc-extended-select
                        ref={algorithmSelect}
                        placeholder={b.algorithmLabel}
                        max-height="220"
                    ></tc-extended-select>
                    <tc-helper-text icon="Info">{b.algorithmHint}</tc-helper-text>
                </div>

                <tc-section-card title={b.previewTitle} className="bundle-wizard__preview">
                    <tc-stack direction="column" gap="0.6rem">
                        <tc-text variant="muted">
                            {b.previewSummary(preview?.count ?? 0, formatBytes(preview?.totalBytes ?? 0))}
                        </tc-text>

                        <div>
                            <tc-empty-state
                                icon="package"
                                hidden={(preview?.count ?? 0) > 0 || previewLoading || undefined}
                            >
                                {b.previewEmpty}
                            </tc-empty-state>
                            <tc-advanced-table ref={previewTable}></tc-advanced-table>
                        </div>
                    </tc-stack>
                </tc-section-card>
            </div>

            <tc-button
                slot="footer"
                variant="secondary"
                outline
                hidden={step === 0 || undefined}
                onClick={() => setStep(step - 1)}
            >
                {t.modal.back}
            </tc-button>
            <tc-button
                slot="footer"
                variant="secondary"
                hidden={step === STEP_KEYS.length - 1 || undefined}
                disabled={(step === 0 && name.trim().length === 0) || undefined}
                onClick={() => setStep(step + 1)}
            >
                {t.modal.next}
            </tc-button>
            <tc-button
                slot="footer"
                variant="primary"
                hidden={step !== STEP_KEYS.length - 1 || name.trim().length === 0 || undefined}
                disabled={saving || undefined}
                onClick={submit}
            >
                {existing ? t.projects.save : b.create}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default BundleWizardModal
