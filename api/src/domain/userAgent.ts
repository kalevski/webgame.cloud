export type UserAgentDescription = {
    browser: string
    os: string
}

const UNKNOWN = 'Unknown'

const BROWSERS: ReadonlyArray<[RegExp, string]> = [
    [/\bEdg(?:e|A|iOS)?\//, 'Edge'],
    [/\bOPR\/|\bOpera\b/, 'Opera'],
    [/\bSamsungBrowser\//, 'Samsung Internet'],
    [/\bFirefox\/|\bFxiOS\//, 'Firefox'],
    [/\bCriOS\//, 'Chrome'],
    [/\bChrome\//, 'Chrome'],
    [/\bSafari\//, 'Safari'],
    [/\bcurl\//, 'curl'],
]

const OPERATING_SYSTEMS: ReadonlyArray<[RegExp, string]> = [
    [/\bWindows NT\b/, 'Windows'],
    [/\b(iPhone|iPad|iPod)\b/, 'iOS'],
    [/\bAndroid\b/, 'Android'],
    [/\bMac OS X\b|\bMacintosh\b/, 'macOS'],
    [/\bCrOS\b/, 'ChromeOS'],
    [/\bLinux\b|\bX11\b/, 'Linux'],
]

const match = (value: string, table: ReadonlyArray<[RegExp, string]>): string => {
    for (const [pattern, label] of table) {
        if (pattern.test(value)) return label
    }
    return UNKNOWN
}

export const describeUserAgent = (userAgent: string): UserAgentDescription => {
    const value = userAgent.trim()
    if (!value) return { browser: UNKNOWN, os: UNKNOWN }
    return { browser: match(value, BROWSERS), os: match(value, OPERATING_SYSTEMS) }
}
