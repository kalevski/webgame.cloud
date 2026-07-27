import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import Loading from 'components/Loading'

type ValueElement = HTMLElement & { value?: string }

const PlatformSettingsPanel: React.FC = () => {
    const { t } = useStrings()
    const s = t.platformSettings
    const settings = useStore((state) => state.settings)
    const fetchSettings = useStore((state) => state.fetchSettings)
    const saveSettings = useStore((state) => state.saveSettings)

    const canWrite = useCan('admin.settings.write')

    const [signupsOpen, setSignupsOpen] = useState(false)

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
    }, [settings])

    if (!settings) return <Loading />

    return (
        <div className="module">
            <tc-section-card title={s.title}>
                <tc-stack direction="column" gap="1.15rem">
                    <tc-switch
                        checked={signupsOpen || undefined}
                        label={s.signupsOpenLabel}
                        help={s.signupsOpenHint}
                        onClick={() => setSignupsOpen((current) => !current)}
                    ></tc-switch>

                    <tc-textarea
                        ref={announcementRef}
                        label={s.announcementLabel}
                        help={s.announcementHint}
                        rows="3"
                        onInput={(event: React.FormEvent<ValueElement>) => {
                            announcementValue.current = String((event.target as ValueElement).value ?? '')
                        }}
                    ></tc-textarea>

                    <tc-form-input
                        ref={salesContactRef}
                        type="text"
                        label={s.salesContactLabel}
                        help={s.salesContactHint}
                        onInput={(event: React.FormEvent<ValueElement>) => {
                            salesContactValue.current = String((event.target as ValueElement).value ?? '')
                        }}
                    ></tc-form-input>

                    {canWrite && (
                        <div>
                            <tc-button
                                variant="primary"
                                onClick={() => saveSettings({
                                    signupsOpen,
                                    announcement: announcementValue.current,
                                    salesContact: salesContactValue.current,
                                })}
                            >
                                {s.save}
                            </tc-button>
                        </div>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default PlatformSettingsPanel
