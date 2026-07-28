import React, { useEffect, useMemo, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { detailValue, useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { Bundle, BundleDraft, BundleEngine, PackingAlgorithm } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const NO_TAGS: string[] = []

const ENGINE_OPTIONS = [
    { key: 'phaser', label: 'Phaser' },
    { key: 'pixi', label: 'PixiJS' },
    { key: 'custom', label: 'Custom' },
]

const ALGORITHM_ITEMS = [
    { key: 'basic', label: 'Basic' },
    { key: 'max-rects', label: 'MaxRects' },
    { key: 'shelf', label: 'Shelf' },
    { key: 'guillotine', label: 'Guillotine' },
]

const tagsFrom = (event: Event): string[] => detailValue<string[]>(event as CustomEvent) ?? []

const BundleWizardModal: React.FC = () => {
    const closeModal = useModalClose()
    const input = useModalInput<{ projectId: string; bundle: Bundle | null }>(MODAL.BUNDLE_WIZARD)
    const createBundle = useStore((state) => state.createBundle)
    const updateBundle = useStore((state) => state.updateBundle)
    const previewRule = useStore((state) => state.previewRule)
    const preview = useStore((state) => state.preview)
    const vocabularies = useStore((state) => state.vocabularies)
    const { t } = useStrings()
    const b = t.bundles

    const existing = input?.bundle ?? null
    const [step, setStep] = useState(0)
    const [name, setName] = useState(existing?.name ?? '')
    const [engine, setEngine] = useState<BundleEngine>(existing?.engine ?? 'phaser')
    const [included, setIncluded] = useState<string[]>(existing?.includedTags ?? [])
    const [excluded, setExcluded] = useState<string[]>(existing?.excludedTags ?? [])
    const [buildTag, setBuildTag] = useState(existing?.buildTag ?? '')
    const [algorithm, setAlgorithm] = useState<PackingAlgorithm>(existing?.algorithm ?? 'max-rects')
    const [saving, setSaving] = useState(false)

    const nameInput = useTc<ValueElement>({
        defaultValue: existing?.name ?? '',
        onChange: (value: unknown) => setName(String(value ?? '')),
    })
    const engineCards = useTc<ValueElement>({
        options: ENGINE_OPTIONS,
        defaultValue: existing?.engine ?? 'phaser',
        onChange: (value: unknown) => setEngine(String(value ?? 'phaser') as BundleEngine),
    })
    const tagNames = useMemo(
        () => (vocabularies?.tags ?? []).map((tag) => tag.name),
        [vocabularies]
    )
    const includedInput = useTc<ValueElement>(
        {
            recommendations: tagNames,
            defaultValue: existing?.includedTags ?? NO_TAGS,
        },
        { 'tc-change': (event: Event) => setIncluded(tagsFrom(event)) }
    )
    const excludedInput = useTc<ValueElement>(
        {
            recommendations: tagNames,
            defaultValue: existing?.excludedTags ?? NO_TAGS,
        },
        { 'tc-change': (event: Event) => setExcluded(tagsFrom(event)) }
    )
    const buildTagItems = useMemo(
        () => [
            { key: '', label: '—' },
            ...(vocabularies?.buildTags ?? []).map((tag) => ({ key: tag.name, label: tag.name })),
        ],
        [vocabularies]
    )
    const buildTagSelect = useTc<ValueElement>({
        items: buildTagItems,
        defaultValue: existing?.buildTag ?? '',
        onChange: (value: unknown) => setBuildTag(String(value ?? '')),
    })
    const algorithmSelect = useTc<ValueElement>({
        items: ALGORITHM_ITEMS,
        defaultValue: existing?.algorithm ?? 'max-rects',
        onChange: (value: unknown) => setAlgorithm(String(value ?? 'max-rects') as PackingAlgorithm),
    })

    useEffect(() => {
        if (step !== 2 || !input) return
        const handle = setTimeout(() => {
            void previewRule(input.projectId, { includedTags: included, excludedTags: excluded })
        }, 250)
        return () => clearTimeout(handle)
    }, [step, included, excluded, input, previewRule])

    const submit = async () => {
        if (!input) return
        setSaving(true)
        const draft: BundleDraft = {
            name: name.trim(),
            engine,
            includedTags: included,
            excludedTags: excluded,
            buildTag,
            algorithm,
        }
        const done = existing
            ? await updateBundle(input.projectId, existing.id, draft)
            : Boolean(await createBundle(input.projectId, draft))
        setSaving(false)
        if (done) closeModal(true)
    }

    return (
        <>
            <div hidden={step !== 0 || undefined}>
                <tc-form-input ref={nameInput} label={b.nameLabel} required />
                <tc-label>{b.engineLabel}</tc-label>
                <tc-card-options ref={engineCards} />
            </div>

            <div hidden={step !== 1 || undefined}>
                <tc-tag-input ref={includedInput} label={b.includedLabel} allow-create />
                <tc-tag-input ref={excludedInput} label={b.excludedLabel} allow-create />
                <tc-label>{b.buildTagLabel}</tc-label>
                <tc-extended-select ref={buildTagSelect} />
            </div>

            <div hidden={step !== 2 || undefined}>
                <tc-alert variant="info" hidden={!preview || undefined}>
                    {b.previewCount(preview?.count ?? 0)}
                </tc-alert>
                <tc-empty-state icon="package" hidden={preview?.count !== 0 || undefined}>
                    {b.previewEmpty}
                </tc-empty-state>
            </div>

            <div hidden={step !== 3 || undefined}>
                <tc-label>{b.algorithmLabel}</tc-label>
                <tc-select ref={algorithmSelect} />
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
                variant="primary"
                hidden={step === 3 || undefined}
                disabled={(step === 0 && name.trim().length === 0) || undefined}
                onClick={() => setStep(step + 1)}
            >
                {t.modal.next}
            </tc-button>
            <tc-button
                slot="footer"
                variant="primary"
                hidden={step !== 3 || undefined}
                disabled={saving || undefined}
                onClick={submit}
            >
                {t.projects.save}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default BundleWizardModal
