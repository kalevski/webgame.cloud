import React from 'react'
import useStrings from 'hooks/useStrings'
import ConfirmDeleteAccountModal from './ConfirmDeleteAccountModal'
import ConfirmImpersonateModal from './ConfirmImpersonateModal'
import CreateUserModal from './CreateUserModal'
import FiltersModal from './FiltersModal'
import ManageAccessModal from './ManageAccessModal'
import ReportModal from './ReportModal'
import UpgradeModal from './UpgradeModal'
import CreateProjectModal from './CreateProjectModal'
import CreateTaskModal from './CreateTaskModal'
import ConfirmDeleteTaskModal from './ConfirmDeleteTaskModal'
import ResolveReportModal from './ResolveReportModal'
import ConfirmDeleteProjectModal from './ConfirmDeleteProjectModal'
import ContactSalesModal from './ContactSalesModal'
import PlanModal from './PlanModal'
import EnquiryTrailModal from './EnquiryTrailModal'
import EnquiryActionModal from './EnquiryActionModal'
import EmailTemplateModal from './EmailTemplateModal'
import EmailComposeModal from './EmailComposeModal'
import EmailTriggerModal from './EmailTriggerModal'
import ApiKeyModal from './ApiKeyModal'
import WebhookModal from './WebhookModal'
import FileSourceModal from './FileSourceModal'
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
            <ModalWindow modalKey={MODAL.CREATE_PROJECT} title={t.modal.createProjectTitle}>
                <CreateProjectModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CREATE_TASK} title={t.modal.createTaskTitle} size="sm">
                <CreateTaskModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CONFIRM_DELETE_TASK} title={t.modal.deleteTaskTitle} size="sm">
                <ConfirmDeleteTaskModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.RESOLVE_REPORT} title={t.modal.resolveReportTitle} size="sm">
                <ResolveReportModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CONFIRM_DELETE_PROJECT} title={t.modal.deleteProjectTitle} size="sm">
                <ConfirmDeleteProjectModal />
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
            <ModalWindow modalKey={MODAL.FILE_SOURCE} title={t.modal.fileSourceTitle}>
                <FileSourceModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.SIGNING_PUBLIC_KEY} title={t.modal.signingPublicKeyTitle} size="lg">
                <SigningPublicKeyModal />
            </ModalWindow>
            <ModalWindow modalKey={MODAL.CONFIRM_ROTATE_SIGNING_KEY} title={t.modal.rotateSigningKeyTitle} size="sm">
                <ConfirmRotateSigningKeyModal />
            </ModalWindow>
        </>
    )
}
