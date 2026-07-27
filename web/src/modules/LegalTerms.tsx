import React from 'react'
import LegalDocument from 'components/LegalDocument'

const LegalTerms: React.FC = () => (
    <LegalDocument title="Terms of Service" updated="2026-01-01">
        <p>
            <strong>This is a template — replace this document with your own terms of service.</strong> The
            text below is generic placeholder copy.
        </p>

        <h2>Acceptance</h2>
        <p>
            By creating an account and using this application you agree to these terms. If you do not agree,
            please do not use the service.
        </p>

        <h2>Acceptable use</h2>
        <p>
            Do not post unlawful, harmful, or abusive content, and do not attempt to disrupt or misuse the
            service. An administrator may remove content or deactivate an account that breaks these terms.
        </p>

        <h2>Your content</h2>
        <p>
            Content you create remains yours. Marking content as shared grants the platform permission to
            display it to other signed-in users for as long as that content exists.
        </p>

        <h2>No warranty</h2>
        <p>
            The service is provided “as is”, without warranties of any kind. To the extent permitted by law,
            we are not liable for any damages arising from your use of it.
        </p>

        <h2>Contact</h2>
        <p>
            Questions about these terms? Email <a href="mailto:support@example.com">support@example.com</a>.
        </p>
    </LegalDocument>
)

export default LegalTerms
