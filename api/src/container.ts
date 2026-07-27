import 'reflect-metadata'
import { container as globalContainer } from 'tsyringe'
import { Database } from './Database.js'
import { Http } from './http.js'
import { MaintenanceService } from './services/MaintenanceService.js'
import { NotificationRepository } from './repositories/notifications/NotificationRepository.js'
import { NotificationService } from './services/NotificationService.js'
import { PushSubscriptionRepository } from './repositories/push/PushSubscriptionRepository.js'
import { PushService } from './services/PushService.js'
import { SettingsRepository } from './repositories/settings/SettingsRepository.js'
import { AccessPolicyService } from './services/AccessPolicyService.js'
import { AccessPolicyRepository } from './repositories/access/AccessPolicyRepository.js'
import { SettingsService } from './services/SettingsService.js'
import { FeatureService } from './services/FeatureService.js'
import { BillingRepository } from './repositories/billing/BillingRepository.js'
import { BillingService } from './services/BillingService.js'
import { EmailRepository } from './repositories/email/EmailRepository.js'
import { EmailService } from './services/EmailService.js'
import { EmailWorker } from './services/EmailWorker.js'
import { JobRepository } from './repositories/jobs/JobRepository.js'
import { JobService } from './services/JobService.js'
import { JobWorker } from './services/JobWorker.js'
import { WebhookRepository } from './repositories/webhooks/WebhookRepository.js'
import { WebhookService } from './services/WebhookService.js'
import { RetentionRepository } from './repositories/retention/RetentionRepository.js'
import { RetentionService } from './services/RetentionService.js'
import { PurgeWorker } from './services/PurgeWorker.js'
import { FileRepository } from './repositories/files/FileRepository.js'
import { FileService } from './services/FileService.js'
import { PlatformRepository } from './repositories/platform/PlatformRepository.js'
import { AuthTokenRepository } from './repositories/auth/AuthTokenRepository.js'
import { MagicLinkService } from './services/MagicLinkService.js'
import { ApiKeyService } from './services/ApiKeyService.js'
import { SigningKeyService } from './services/SigningKeyService.js'
import { AccountRepository } from './repositories/account/AccountRepository.js'
import { AccountService } from './services/AccountService.js'
import { AuditRepository } from './repositories/moderation/AuditRepository.js'
import { ReportRepository } from './repositories/moderation/ReportRepository.js'
import { ModerationService } from './services/ModerationService.js'
import { AdminOverviewService } from './services/AdminOverviewService.js'
import { ProjectRepository } from './repositories/projects/ProjectRepository.js'
import { TaskRepository } from './repositories/projects/TaskRepository.js'
import { ProjectService } from './services/ProjectService.js'
import { UserRepository } from './repositories/users/UserRepository.js'
import { IdentityRepository } from './repositories/users/IdentityRepository.js'
import { SessionRepository } from './repositories/users/SessionRepository.js'
import { AuthService } from './services/AuthService.js'
import { UserService } from './services/UserService.js'

const container = globalContainer.createChildContainer()

container.registerSingleton(Database, Database)
container.registerSingleton(Http, Http)
container.registerSingleton(MaintenanceService, MaintenanceService)

container.registerSingleton(NotificationRepository, NotificationRepository)
container.registerSingleton(NotificationService, NotificationService)
container.registerSingleton(PushSubscriptionRepository, PushSubscriptionRepository)
container.registerSingleton(PushService, PushService)

container.registerSingleton(SettingsRepository, SettingsRepository)
container.registerSingleton(AccessPolicyRepository, AccessPolicyRepository)
container.registerSingleton(AccessPolicyService, AccessPolicyService)
container.registerSingleton(SettingsService, SettingsService)
container.registerSingleton(FeatureService, FeatureService)

container.registerSingleton(SessionRepository, SessionRepository)
container.registerSingleton(UserRepository, UserRepository)
container.registerSingleton(IdentityRepository, IdentityRepository)
container.registerSingleton(AuthService, AuthService)
container.registerSingleton(UserService, UserService)

container.registerSingleton(AccountRepository, AccountRepository)
container.registerSingleton(AccountService, AccountService)

container.registerSingleton(AuditRepository, AuditRepository)
container.registerSingleton(ReportRepository, ReportRepository)
container.registerSingleton(ModerationService, ModerationService)
container.registerSingleton(AdminOverviewService, AdminOverviewService)

container.registerSingleton(ProjectRepository, ProjectRepository)
container.registerSingleton(TaskRepository, TaskRepository)
container.registerSingleton(ProjectService, ProjectService)

container.registerSingleton(BillingRepository, BillingRepository)
container.registerSingleton(BillingService, BillingService)

container.registerSingleton(EmailRepository, EmailRepository)
container.registerSingleton(EmailService, EmailService)
container.registerSingleton(EmailWorker, EmailWorker)

container.registerSingleton(JobRepository, JobRepository)
container.registerSingleton(JobService, JobService)
container.registerSingleton(JobWorker, JobWorker)

container.registerSingleton(WebhookRepository, WebhookRepository)
container.registerSingleton(WebhookService, WebhookService)

container.registerSingleton(RetentionRepository, RetentionRepository)
container.registerSingleton(RetentionService, RetentionService)
container.registerSingleton(PurgeWorker, PurgeWorker)

container.registerSingleton(FileRepository, FileRepository)
container.registerSingleton(FileService, FileService)

container.registerSingleton(PlatformRepository, PlatformRepository)

container.registerSingleton(AuthTokenRepository, AuthTokenRepository)
container.registerSingleton(MagicLinkService, MagicLinkService)
container.registerSingleton(ApiKeyService, ApiKeyService)

container.registerSingleton(SigningKeyService, SigningKeyService)

export default container
