import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import Loading from 'components/Loading'
import FloatingActionBar from 'components/FloatingActionBar'

type ValueElement = HTMLElement & { value?: string }

const PlatformSettingsPanel: React.FC = () => {
    const { t } = useStrings()
    const s = t.platformSettings
    const settings = useStore((state) => state.settings)
    const fetchSettings = useStore((state) => state.fetchSettings)
    const saveSettings = useStore((state) => state.saveSettings)

    const canWrite = useCan('admin.settings.write')

    const [signupsOpen, setSignupsOpen] = useState(false)
    const [dirty, setDirty] = useState(false)
    const [saving, setSaving] = useState(false)

    const announcementRef = useRef<ValueElement | null>(null)
    const announcementValue = useRef('')

    const salesContactRef = useRef<ValueElement | null>(null)
    const salesContactValue = useRef('')

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    useEffect(() => {
        if (!settings) return
        setSignupsOpen(settings.signupsOpen)
        announcementValue.current = settings.announcement
        if (announcementRef.current) announcementRef.current.value = settings.announcement
        salesContactValue.current = settings.salesContact
        if (salesContactRef.current) salesContactRef.current.value = settings.salesContact
        setDirty(false)
    }, [settings])

    if (!settings) return <Loading />

    const handleSave = async () => {
        if (saving) return
        setSaving(true)
        try {
            await saveSettings({
                signupsOpen,
                announcement: announcementValue.current,
                salesContact: salesContactValue.current,
            })
            setDirty(false)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="module">
            <tc-section-card title={s.title} icon="Settings">
                <tc-stack direction="column" gap="1.15rem">
                    <tc-switch
                        checked={signupsOpen || undefined}
                        label={s.signupsOpenLabel}
                        help={s.signupsOpenHint}
                        onClick={() => {
                            setSignupsOpen((current) => !current)
                            setDirty(true)
                        }}
                    ></tc-switch>

                    <tc-textarea
                        ref={announcementRef}
                        label={s.announcementLabel}
                        help={s.announcementHint}
                        rows="3"
                        onInput={(event: React.FormEvent<ValueElement>) => {
                            announcementValue.current = String((event.target as ValueElement).value ?? '')
                            setDirty(true)
                        }}
                    ></tc-textarea>

                    <tc-form-input
                        ref={salesContactRef}
                        type="text"
                        label={s.salesContactLabel}
                        help={s.salesContactHint}
                        onInput={(event: React.FormEvent<ValueElement>) => {
                            salesContactValue.current = String((event.target as ValueElement).value ?? '')
                            setDirty(true)
                        }}
                    ></tc-form-input>
                </tc-stack>
            </tc-section-card>

            <FloatingActionBar label={s.unsavedHint} visible={dirty}>
                {canWrite && (
                    <tc-button key="save" variant="primary" disabled={saving || undefined} onClick={handleSave}>
                        {s.save}
                    </tc-button>
                )}
            </FloatingActionBar>
        </div>
    )
}

export default PlatformSettingsPanel
