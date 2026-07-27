import React from 'react'
import LegalDocument from 'components/LegalDocument'

const LegalPrivacy: React.FC = () => (
    <LegalDocument title="Privacy Policy" updated="2026-01-01">
        <p>
            <strong>This is a template — replace this document with your own privacy policy.</strong> The
            text below is generic placeholder copy describing the data a starter app of this shape typically
            handles.
        </p>

        <h2>What data we collect</h2>
        <p>
            Account basics from your sign-in provider (name, email, profile picture), the content you create
            in the app, and minimal technical data needed to keep you signed in. We do not sell your data.
        </p>

        <h2>Cookies and sessions</h2>
        <p>
            We use a single session cookie named <code>starter_session</code> to keep you signed in. It is
            strictly necessary — without it the app cannot function. This template ships with no advertising
            or third-party tracking cookies.
        </p>

        <h2>How we use your data</h2>
        <p>
            To operate your account, store the content you create, and secure the service. We process it only
            for these purposes and keep it while your account is active.
        </p>

        <h2>Your rights</h2>
        <p>
            You can export everything you own as a JSON file and permanently delete your account at any time,
            both from your account settings. You may also request access to or correction of your data.
        </p>

        <h2>Contact</h2>
        <p>
            Questions about this policy? Email <a href="mailto:privacy@example.com">privacy@example.com</a>.
        </p>
    </LegalDocument>
)

export default LegalPrivacy
