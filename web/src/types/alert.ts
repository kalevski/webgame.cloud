export type AlertVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'

export type AppAlert = {
    key: string
    variant: AlertVariant
    message: string
    dismissible: boolean
}
