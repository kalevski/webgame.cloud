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
import { RoleApplicationRepository } from './repositories/access/RoleApplicationRepository.js'
import { RoleApplicationService } from './services/RoleApplicationService.js'
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
import { ServiceAccountService } from './services/ServiceAccountService.js'
import { SigningKeyService } from './services/SigningKeyService.js'
import { HealthService } from './services/HealthService.js'
import { AlarmService } from './services/AlarmService.js'
import { DemoDataService } from './services/DemoDataService.js'
import { AccountRepository } from './repositories/account/AccountRepository.js'
import { AccountService } from './services/AccountService.js'
import { AuditRepository } from './repositories/moderation/AuditRepository.js'
import { ReportRepository } from './repositories/moderation/ReportRepository.js'
import { ModerationService } from './services/ModerationService.js'
import { AdminOverviewRepository } from './repositories/admin/AdminOverviewRepository.js'
import { AdminOverviewService } from './services/AdminOverviewService.js'
import { ProjectRepository } from './repositories/projects/ProjectRepository.js'
import { MemberRepository } from './repositories/projects/MemberRepository.js'
import { InviteRepository } from './repositories/projects/InviteRepository.js'
import { RealmRepository } from './repositories/realms/RealmRepository.js'
import { RealmRegionRepository } from './repositories/realms/RealmRegionRepository.js'
import { ProjectMigrationRepository } from './repositories/realms/ProjectMigrationRepository.js'
import { RealmService } from './services/RealmService.js'
import { AssetFileRepository } from './repositories/assets/AssetFileRepository.js'
import { UploadService } from './services/UploadService.js'
import { BundleRepository } from './repositories/bundles/BundleRepository.js'
import { BundleService } from './services/BundleService.js'
import { BuildRepository } from './repositories/builds/BuildRepository.js'
import { BuildService } from './services/BuildService.js'
import { ConfigRepository } from './repositories/configs/ConfigRepository.js'
import { ConfigService } from './services/ConfigService.js'
import { TranslationRepository } from './repositories/translations/TranslationRepository.js'
import { TranslationService } from './services/TranslationService.js'
import { WaitlistRepository } from './repositories/waitlist/WaitlistRepository.js'
import { WaitlistService } from './services/WaitlistService.js'
import { ProjectService } from './services/ProjectService.js'
import { UserRepository } from './repositories/users/UserRepository.js'
import { IdentityRepository } from './repositories/users/IdentityRepository.js'
import { SessionRepository } from './repositories/users/SessionRepository.js'
import { AuthService } from './services/AuthService.js'
import { UserService } from './services/UserService.js'
import { TicketRepository } from './repositories/tickets/TicketRepository.js'
import { TicketMessageRepository } from './repositories/tickets/TicketMessageRepository.js'
import { TicketService } from './services/TicketService.js'

const container = globalContainer.createChildContainer()

container.registerSingleton(Database)
container.registerSingleton(Http)
container.registerSingleton(MaintenanceService)

container.registerSingleton(NotificationRepository)
container.registerSingleton(NotificationService)
container.registerSingleton(PushSubscriptionRepository)
container.registerSingleton(PushService)

container.registerSingleton(SettingsRepository)
container.registerSingleton(AccessPolicyRepository)
container.registerSingleton(AccessPolicyService)
container.registerSingleton(RoleApplicationRepository)
container.registerSingleton(RoleApplicationService)
container.registerSingleton(SettingsService)
container.registerSingleton(FeatureService)

container.registerSingleton(SessionRepository)
container.registerSingleton(UserRepository)
container.registerSingleton(IdentityRepository)
container.registerSingleton(AuthService)
container.registerSingleton(UserService)

container.registerSingleton(AccountRepository)
container.registerSingleton(AccountService)

container.registerSingleton(AuditRepository)
container.registerSingleton(ReportRepository)
container.registerSingleton(ModerationService)
container.registerSingleton(AdminOverviewRepository)
container.registerSingleton(AdminOverviewService)

container.registerSingleton(ProjectRepository)
container.registerSingleton(MemberRepository)
container.registerSingleton(InviteRepository)
container.registerSingleton(RealmRepository)
container.registerSingleton(RealmRegionRepository)
container.registerSingleton(ProjectMigrationRepository)
container.registerSingleton(RealmService)
container.registerSingleton(AssetFileRepository)
container.registerSingleton(UploadService)
container.registerSingleton(BundleRepository)
container.registerSingleton(BundleService)
container.registerSingleton(BuildRepository)
container.registerSingleton(BuildService)
container.registerSingleton(ConfigRepository)
container.registerSingleton(ConfigService)

container.registerSingleton(TranslationRepository)
container.registerSingleton(TranslationService)
container.registerSingleton(WaitlistRepository)
container.registerSingleton(WaitlistService)
container.registerSingleton(ProjectService)

container.registerSingleton(TicketRepository)
container.registerSingleton(TicketMessageRepository)
container.registerSingleton(TicketService)

container.registerSingleton(BillingRepository)
container.registerSingleton(BillingService)

container.registerSingleton(EmailRepository)
container.registerSingleton(EmailService)
container.registerSingleton(EmailWorker)

container.registerSingleton(JobRepository)
container.registerSingleton(JobService)
container.registerSingleton(JobWorker)

container.registerSingleton(WebhookRepository)
container.registerSingleton(WebhookService)

container.registerSingleton(RetentionRepository)
container.registerSingleton(RetentionService)
container.registerSingleton(PurgeWorker)

container.registerSingleton(FileRepository)
container.registerSingleton(FileService)

container.registerSingleton(PlatformRepository)

container.registerSingleton(AuthTokenRepository)
container.registerSingleton(MagicLinkService)
container.registerSingleton(ApiKeyService)
container.registerSingleton(ServiceAccountService)

container.registerSingleton(SigningKeyService)

container.registerSingleton(HealthService)
container.registerSingleton(AlarmService)
container.registerSingleton(DemoDataService)

export default container
