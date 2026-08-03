import React from 'react'
import useStrings from 'hooks/useStrings'
import ConfirmDeleteAccountModal from './ConfirmDeleteAccountModal'
import ConfirmImpersonateModal from './ConfirmImpersonateModal'
import CreateUserModal from './CreateUserModal'
import CreateServiceAccountModal from './CreateServiceAccountModal'
import CreateTicketModal from './CreateTicketModal'
import PickTemplateModal from './PickTemplateModal'
import FiltersModal from './FiltersModal'
import ManageAccessModal from './ManageAccessModal'
import ReportModal from './ReportModal'
import UpgradeModal from './UpgradeModal'
import ResolveReportModal from './ResolveReportModal'
import ConfirmDeleteProjectModal from './ConfirmDeleteProjectModal'
import ArchiveProjectModal from './ArchiveProjectModal'
import TransferProjectModal from './TransferProjectModal'
import LeaveProjectModal from './LeaveProjectModal'
import InviteMemberModal from './InviteMemberModal'
import EditMemberPermissionsModal from './EditMemberPermissionsModal'
import RemoveMemberModal from './RemoveMemberModal'
import RealmEditorModal from './RealmEditorModal'
import RealmTokenModal from './RealmTokenModal'
import ConfirmDeleteRealmModal from './ConfirmDeleteRealmModal'
import RealmRegionModal from './RealmRegionModal'
import ConfirmDeleteRealmRegionModal from './ConfirmDeleteRealmRegionModal'
import MoveProjectModal from './MoveProjectModal'
import AssetChildrenModal from './AssetChildrenModal'
import ConfirmDeleteAssetModal from './ConfirmDeleteAssetModal'
import BundleWizardModal from './BundleWizardModal'
import CreateConfigModal from './CreateConfigModal'
import ContactSalesModal from './ContactSalesModal'
import PlanModal from './PlanModal'
import EnquiryTrailModal from './EnquiryTrailModal'
import EnquiryActionModal from './EnquiryActionModal'
import EmailTemplateModal from './EmailTemplateModal'
import EmailComposeModal from './EmailComposeModal'
import EmailTriggerModal from './EmailTriggerModal'
import ApiKeyModal from './ApiKeyModal'
import WebhookModal from './WebhookModal'
import AssetSourceModal from './AssetSourceModal'
import SigningPublicKeyModal from './SigningPublicKeyModal'
import ConfirmRotateSigningKeyModal from './ConfirmRotateSigningKeyModal'
import { MODAL } from './keys'
import { ModalWindow } from './registry'

export { MODAL } from './keys'
export { ModalContext, useModalOpen, useModalClose, useModalInput } from './registry'

export const ModalRender: React.FC = () => {
    const { t } = useStrings()
    return (
        <>
            <ModalWindow modalKey={MODAL.DELETE_ACCOUNT} title={t.modal.deleteAccountTitle}>
                <ConfirmDeleteAccountModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.IMPERSONATE_USER} title={t.modal.impersonateTitle}>
                <ConfirmImpersonateModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CREATE_USER} title={t.modal.createUserTitle}>
                <CreateUserModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CREATE_SERVICE_ACCOUNT} title={t.modal.createServiceAccountTitle}>
                <CreateServiceAccountModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CREATE_TICKET} title={t.modal.createTicketTitle}>
                <CreateTicketModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.PICK_TEMPLATE} title={t.modal.pickTemplateTitle}>
                <PickTemplateModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.MANAGE_ACCESS} title={t.modal.manageAccessTitle}>
                <ManageAccessModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.FILTERS} title={t.modal.filtersTitle}>
                <FiltersModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.UPGRADE} title={t.modal.upgradeTitle}>
                <UpgradeModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.REPORT_CONTENT} title={t.modal.reportTitle}>
                <ReportModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.DELETE_ASSET} title={t.modal.deleteAssetTitle}>
                <ConfirmDeleteAssetModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.ASSET_CHILDREN} title={t.modal.assetChildrenTitle} scrollable>
                <AssetChildrenModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.RESOLVE_REPORT} title={t.modal.resolveReportTitle}>
                <ResolveReportModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CONFIRM_DELETE_PROJECT} title={t.modal.deleteProjectTitle}>
                <ConfirmDeleteProjectModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.ARCHIVE_PROJECT} title={t.projects.archive}>
                <ArchiveProjectModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.TRANSFER_PROJECT} title={t.projects.transfer}>
                <TransferProjectModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.LEAVE_PROJECT} title={t.projects.leave}>
                <LeaveProjectModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.INVITE_MEMBER} title={t.members.inviteTitle}>
                <InviteMemberModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.EDIT_MEMBER_PERMISSIONS} title={t.members.editPermissions}>
                <EditMemberPermissionsModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.REMOVE_MEMBER} title={t.members.remove}>
                <RemoveMemberModal />
            </ModalWindow>
            <ModalWindow
                modalKey={MODAL.REALM_EDITOR}
                title={(input) => (input ? t.realms.edit : t.realms.addTitle)}
                size="lg"
                scrollable
            >
                <RealmEditorModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.REALM_TOKEN} title={t.realms.rotateTitle}>
                <RealmTokenModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.DELETE_REALM} title={t.realms.deleteTitle}>
                <ConfirmDeleteRealmModal />
            </ModalWindow>
            <ModalWindow
                modalKey={MODAL.REALM_REGION}
                title={(input) => (input ? t.realms.regionEditTitle : t.realms.regionAddTitle)}
            >
                <RealmRegionModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.DELETE_REALM_REGION} title={t.realms.regionDelete}>
                <ConfirmDeleteRealmRegionModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.MOVE_PROJECT} title={t.realms.moveTitle}>
                <MoveProjectModal />
            </ModalWindow>
            <ModalWindow
                modalKey={MODAL.BUNDLE_WIZARD}
                title={(input) => ((input as { bundle?: unknown } | undefined)?.bundle ? t.bundles.edit : t.bundles.create)}
                size="xl"
                className="modal-wide"
                scrollable
                staticBackdrop
            >
                <BundleWizardModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CREATE_CONFIG} title={t.configs.createConfig}>
                <CreateConfigModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CONTACT_SALES} title={t.modal.contactSalesTitle}>
                <ContactSalesModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.PLAN_EDITOR} title={t.modal.planEditorTitle} size="lg">
                <PlanModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.ENQUIRY_TRAIL} title={t.enquiries.trailTitle}>
                <EnquiryTrailModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.ENQUIRY_ACTION} title={t.enquiries.actionTitle}>
                <EnquiryActionModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.EMAIL_TEMPLATE} title={t.email.templatesTitle} size="lg">
                <EmailTemplateModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.EMAIL_COMPOSE} title={t.email.composeTitle} size="lg">
                <EmailComposeModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.EMAIL_TRIGGER} title={t.email.triggerAdd}>
                <EmailTriggerModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.API_KEY} title={t.modal.apiKeyTitle}>
                <ApiKeyModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.WEBHOOK} title={t.modal.webhookTitle} size="lg">
                <WebhookModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.ASSET_SOURCE} title={t.modal.assetSourceTitle}>
                <AssetSourceModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.SIGNING_PUBLIC_KEY} title={t.modal.signingPublicKeyTitle} size="lg">
                <SigningPublicKeyModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CONFIRM_ROTATE_SIGNING_KEY} title={t.modal.rotateSigningKeyTitle}>
                <ConfirmRotateSigningKeyModal />
            </ModalWindow>
        </>
    )
}
