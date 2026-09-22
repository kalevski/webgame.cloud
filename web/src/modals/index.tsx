import React from 'react'
import useStrings from 'hooks/useStrings'
import ConfirmDeleteAccountModal from './ConfirmDeleteAccountModal'
import ConfirmImpersonateModal from './ConfirmImpersonateModal'
import CreateUserModal from './CreateUserModal'
import CreateServiceAccountModal from './CreateServiceAccountModal'
import CreateTicketModal from './CreateTicketModal'
import FiltersModal from './FiltersModal'
import ManageAccessModal from './ManageAccessModal'
import ReportModal from './ReportModal'
import UpgradeModal from './UpgradeModal'
import ResolveReportModal from './ResolveReportModal'
import RoleApplicationModal from './RoleApplicationModal'
import ReviewRoleApplicationModal from './ReviewRoleApplicationModal'
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
import { SheetWindow } from './registry'

export { MODAL } from './keys'
export { ModalContext, useModalOpen, useModalClose, useModalInput } from './registry'

export const ModalRender: React.FC = () => {
    const { t } = useStrings()
    return (
        <>
            <SheetWindow modalKey={MODAL.DELETE_ACCOUNT} title={t.modal.deleteAccountTitle}>
                <ConfirmDeleteAccountModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.IMPERSONATE_USER} title={t.modal.impersonateTitle}>
                <ConfirmImpersonateModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.CREATE_USER} title={t.modal.createUserTitle}>
                <CreateUserModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.CREATE_SERVICE_ACCOUNT} title={t.modal.createServiceAccountTitle}>
                <CreateServiceAccountModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.CREATE_TICKET} title={t.modal.createTicketTitle}>
                <CreateTicketModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.MANAGE_ACCESS} title={t.modal.manageAccessTitle}>
                <ManageAccessModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.FILTERS} title={t.modal.filtersTitle}>
                <FiltersModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.UPGRADE} title={t.modal.upgradeTitle}>
                <UpgradeModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.REPORT_CONTENT} title={t.modal.reportTitle}>
                <ReportModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.DELETE_ASSET} title={t.modal.deleteAssetTitle}>
                <ConfirmDeleteAssetModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.ASSET_CHILDREN} title={t.modal.assetChildrenTitle}>
                <AssetChildrenModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.RESOLVE_REPORT} title={t.modal.resolveReportTitle}>
                <ResolveReportModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.ROLE_APPLICATION} title={t.modal.roleApplicationTitle}>
                <RoleApplicationModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.REVIEW_ROLE_APPLICATION} title={t.modal.reviewRoleApplicationTitle}>
                <ReviewRoleApplicationModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.CONFIRM_DELETE_PROJECT} title={t.modal.deleteProjectTitle}>
                <ConfirmDeleteProjectModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.ARCHIVE_PROJECT} title={t.projects.archive}>
                <ArchiveProjectModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.TRANSFER_PROJECT} title={t.projects.transfer}>
                <TransferProjectModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.LEAVE_PROJECT} title={t.projects.leave}>
                <LeaveProjectModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.INVITE_MEMBER} title={t.members.inviteTitle}>
                <InviteMemberModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.EDIT_MEMBER_PERMISSIONS} title={t.members.editPermissions}>
                <EditMemberPermissionsModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.REMOVE_MEMBER} title={t.members.remove}>
                <RemoveMemberModal />
            </SheetWindow>
            <SheetWindow
                modalKey={MODAL.REALM_EDITOR}
                title={(input) => (input ? t.realms.edit : t.realms.addTitle)}
                presentation="full"
            >
                <RealmEditorModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.REALM_TOKEN} title={t.realms.rotateTitle}>
                <RealmTokenModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.DELETE_REALM} title={t.realms.deleteTitle}>
                <ConfirmDeleteRealmModal />
            </SheetWindow>
            <SheetWindow
                modalKey={MODAL.REALM_REGION}
                title={(input) => (input ? t.realms.regionEditTitle : t.realms.regionAddTitle)}
            >
                <RealmRegionModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.DELETE_REALM_REGION} title={t.realms.regionDelete}>
                <ConfirmDeleteRealmRegionModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.MOVE_PROJECT} title={t.realms.moveTitle}>
                <MoveProjectModal />
            </SheetWindow>
            <SheetWindow
                modalKey={MODAL.BUNDLE_WIZARD}
                title={(input) => ((input as { bundle?: unknown } | undefined)?.bundle ? t.bundles.edit : t.bundles.create)}
                presentation="full"
                            >
                <BundleWizardModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.CREATE_CONFIG} title={t.configs.createConfig}>
                <CreateConfigModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.CONTACT_SALES} title={t.modal.contactSalesTitle}>
                <ContactSalesModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.PLAN_EDITOR} title={t.modal.planEditorTitle} presentation="full">
                <PlanModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.ENQUIRY_TRAIL} title={t.enquiries.trailTitle}>
                <EnquiryTrailModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.ENQUIRY_ACTION} title={t.enquiries.actionTitle}>
                <EnquiryActionModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.EMAIL_TEMPLATE} title={t.email.templatesTitle} presentation="full">
                <EmailTemplateModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.EMAIL_COMPOSE} title={t.email.composeTitle} presentation="full">
                <EmailComposeModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.EMAIL_TRIGGER} title={t.email.triggerAdd}>
                <EmailTriggerModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.API_KEY} title={t.modal.apiKeyTitle}>
                <ApiKeyModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.WEBHOOK} title={t.modal.webhookTitle} presentation="full">
                <WebhookModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.ASSET_SOURCE} title={t.modal.assetSourceTitle}>
                <AssetSourceModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.SIGNING_PUBLIC_KEY} title={t.modal.signingPublicKeyTitle} presentation="full">
                <SigningPublicKeyModal />
            </SheetWindow>
            <SheetWindow modalKey={MODAL.CONFIRM_ROTATE_SIGNING_KEY} title={t.modal.rotateSigningKeyTitle}>
                <ConfirmRotateSigningKeyModal />
            </SheetWindow>
        </>
    )
}
