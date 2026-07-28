import React from 'react'
import LegalDocument from 'components/LegalDocument'

const LegalDmca: React.FC = () => (
    <LegalDocument title="Copyright and takedown policy" updated="2026-07-01">
        <p>
            <strong>Placeholder copy pending legal review.</strong> WebGame Cloud hosts game assets uploaded by
            developers. If you believe material hosted here infringes your copyright, tell us and we will act.
        </p>

        <h2>Sending a notice</h2>
        <p>
            Send a notice identifying the copyrighted work, the project or build reference where it appears,
            your contact details, and a statement that you are the rights holder or act on their behalf.
        </p>

        <h2>What happens next</h2>
        <p>
            We acknowledge every notice, remove or disable access to material we determine to be infringing,
            and tell the account holder what was removed and why. Repeat infringement ends the account.
        </p>

        <h2>Counter-notice</h2>
        <p>
            An account holder who believes their material was removed in error may send a counter-notice. We
            forward it to the original reporter and may restore the material if no legal action follows.
        </p>
    </LegalDocument>
)

export default LegalDmca
