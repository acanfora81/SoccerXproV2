-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "soccerxpro";

-- CreateEnum
CREATE TYPE "soccerxpro"."BodyPart" AS ENUM ('HEAD', 'NECK', 'SHOULDER', 'ARM', 'ELBOW', 'WRIST', 'HAND', 'CHEST', 'BACK', 'ABDOMEN', 'HIP', 'THIGH', 'KNEE', 'SHIN', 'CALF', 'ANKLE', 'FOOT');

-- CreateEnum
CREATE TYPE "soccerxpro"."BudgetCategory" AS ENUM ('PLAYER_SALARIES', 'TRANSFER_FEES', 'MEDICAL_COSTS', 'INFRASTRUCTURE', 'STAFF_SALARIES', 'EQUIPMENT', 'TRAVEL', 'MARKETING', 'OTHER');

-- CreateEnum
CREATE TYPE "soccerxpro"."ClauseType" AS ENUM ('RELEASE_CLAUSE', 'RENEWAL_OPTION', 'PERFORMANCE_BONUS', 'GOAL_BONUS', 'APPEARANCE_BONUS', 'RELEGATION_CLAUSE', 'PROMOTION_BONUS', 'INTERNATIONAL_BONUS', 'SELL_ON_PERCENTAGE', 'BUY_OPTION_FEE', 'OBLIGATION_FEE');

-- CreateEnum
CREATE TYPE "soccerxpro"."ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED', 'SUSPENDED', 'ON_LOAN');

-- CreateEnum
CREATE TYPE "soccerxpro"."ContractType" AS ENUM ('PERMANENT', 'LOAN', 'TRIAL', 'YOUTH', 'PROFESSIONAL', 'AMATEUR', 'APPRENTICESHIP', 'TRAINING_AGREEMENT');

-- CreateEnum
CREATE TYPE "soccerxpro"."ContractRole" AS ENUM ('PROFESSIONAL_PLAYER', 'AMATEUR_PLAYER', 'YOUTH_SERIES', 'APPRENTICESHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "soccerxpro"."PaymentFrequency" AS ENUM ('MONTHLY', 'BIMONTHLY', 'PER_APPEARANCE', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "soccerxpro"."AmendmentType" AS ENUM ('RENEWAL', 'EXTENSION', 'MODIFICATION', 'TERMINATION');

-- CreateEnum
CREATE TYPE "soccerxpro"."FootType" AS ENUM ('LEFT', 'RIGHT', 'BOTH');

-- CreateEnum
CREATE TYPE "soccerxpro"."InjurySeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'SEVERE');

-- CreateEnum
CREATE TYPE "soccerxpro"."InjuryStatus" AS ENUM ('ACTIVE', 'RECOVERING', 'HEALED', 'CHRONIC');

-- CreateEnum
CREATE TYPE "soccerxpro"."InjuryType" AS ENUM ('MUSCLE_STRAIN', 'LIGAMENT_TEAR', 'BONE_FRACTURE', 'CONCUSSION', 'BRUISE', 'CUT', 'SPRAIN', 'OVERUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "soccerxpro"."Position" AS ENUM ('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD');

-- CreateEnum
CREATE TYPE "soccerxpro"."TransferStatus" AS ENUM ('SCOUTING', 'NEGOTIATING', 'AGREED', 'MEDICAL_PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "soccerxpro"."TransferType" AS ENUM ('INCOMING', 'OUTGOING', 'LOAN_IN', 'LOAN_OUT', 'FREE_TRANSFER', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "soccerxpro"."UserRole" AS ENUM ('ADMIN', 'DIRECTOR_SPORT', 'MEDICAL_STAFF', 'SECRETARY', 'SCOUT', 'PREPARATORE_ATLETICO');

-- CreateEnum
CREATE TYPE "soccerxpro"."VisitType" AS ENUM ('ROUTINE_CHECKUP', 'INJURY_ASSESSMENT', 'REHABILITATION', 'FITNESS_TEST', 'SPECIALIST_CONSULTATION', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "soccerxpro"."TaxRegime" AS ENUM ('STANDARD', 'BECKHAM_LAW', 'IMPATRIATE', 'NON_RESIDENT', 'SPECIAL_REGIME');

-- CreateEnum
CREATE TYPE "soccerxpro"."WorkPermitStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'RENEWAL_PENDING');

-- CreateEnum
CREATE TYPE "soccerxpro"."MedicalExamResult" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'CONDITIONAL', 'RETEST_REQUIRED');

-- CreateEnum
CREATE TYPE "soccerxpro"."ComplianceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW', 'EXPIRED');

-- CreateEnum
CREATE TYPE "soccerxpro"."ContractPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "soccerxpro"."BonusType" AS ENUM ('IMAGE_RIGHTS', 'LOYALTY_BONUS', 'SIGNING_BONUS', 'ACCOMMODATION_BONUS', 'CAR_ALLOWANCE', 'TRANSFER_ALLOWANCE');

-- CreateEnum
CREATE TYPE "soccerxpro"."PaymentScheduleType" AS ENUM ('SALARY', 'BONUS', 'SIGNING_BONUS', 'LOYALTY_BONUS', 'IMAGE_RIGHTS', 'TRANSFER_FEE', 'AGENT_COMMISSION', 'OTHER');

-- CreateEnum
CREATE TYPE "soccerxpro"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'CANCELLED');

-- CreateTable
CREATE TABLE "soccerxpro"."teams" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxPlayers" INTEGER NOT NULL DEFAULT 25,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "vatNumber" TEXT,
    "subscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'trial',
    "trialEndsAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."user_profiles" (
    "id" SERIAL NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "soccerxpro"."UserRole" NOT NULL DEFAULT 'SECRETARY',
    "theme_preference" TEXT NOT NULL DEFAULT 'light',
    "language_preference" TEXT NOT NULL DEFAULT 'it',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" UUID,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."players" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL,
    "position" "soccerxpro"."Position" NOT NULL,
    "shirtNumber" INTEGER,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "preferredFoot" "soccerxpro"."FootType",
    "placeOfBirth" TEXT,
    "taxCode" TEXT,
    "passportNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "team_id" UUID,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."performance_data" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL,
    "session_type" TEXT,
    "duration_minutes" INTEGER,
    "total_distance_m" DOUBLE PRECISION,
    "sprint_distance_m" DOUBLE PRECISION,
    "top_speed_kmh" DOUBLE PRECISION,
    "avg_speed_kmh" DOUBLE PRECISION,
    "player_load" DOUBLE PRECISION,
    "high_intensity_runs" INTEGER,
    "max_heart_rate" INTEGER,
    "avg_heart_rate" INTEGER,
    "source_device" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,
    "team_id" UUID NOT NULL,
    "extras" JSONB,
    "acc_events_per_min_over_2_ms2" DOUBLE PRECISION,
    "avg_metabolic_power_wkg" DOUBLE PRECISION,
    "dec_events_per_min_over_minus2_ms2" DOUBLE PRECISION,
    "distance_15_20_kmh_m" DOUBLE PRECISION,
    "distance_20_25_kmh_m" DOUBLE PRECISION,
    "distance_acc_over_2_ms2_m" DOUBLE PRECISION,
    "distance_acc_over_3_ms2_m" DOUBLE PRECISION,
    "distance_dec_over_minus2_ms2_m" DOUBLE PRECISION,
    "distance_dec_over_minus3_ms2_m" DOUBLE PRECISION,
    "distance_over_15_kmh_m" DOUBLE PRECISION,
    "distance_over_20_kmh_m" DOUBLE PRECISION,
    "distance_over_20wkg_m" DOUBLE PRECISION,
    "distance_over_25_kmh_m" DOUBLE PRECISION,
    "distance_over_35wkg_m" DOUBLE PRECISION,
    "distance_per_min" DOUBLE PRECISION,
    "drill_name" TEXT,
    "equivalent_distance_m" DOUBLE PRECISION,
    "equivalent_distance_pct" DOUBLE PRECISION,
    "is_match" BOOLEAN,
    "max_power_5s_wkg" DOUBLE PRECISION,
    "num_acc_over_3_ms2" INTEGER,
    "num_dec_over_minus3_ms2" INTEGER,
    "pct_distance_acc_over_2_ms2" DOUBLE PRECISION,
    "pct_distance_dec_over_minus2_ms2" DOUBLE PRECISION,
    "rvp_index" DOUBLE PRECISION,
    "session_day" TEXT,
    "time_5_10_wkg_min" INTEGER,
    "time_under_5wkg_min" INTEGER,
    "training_load" DOUBLE PRECISION,
    "session_name" TEXT,

    CONSTRAINT "performance_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."budgets" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "category" "soccerxpro"."BudgetCategory" NOT NULL,
    "budgetAmount" DECIMAL(12,2) NOT NULL,
    "spentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."contract_clauses" (
    "id" SERIAL NOT NULL,
    "clauseType" "soccerxpro"."ClauseType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'EUR',
    "conditions" TEXT,
    "contractId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "team_id" UUID NOT NULL,
    "percentage" DECIMAL(5,2),

    CONSTRAINT "contract_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."contracts" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "salary" DECIMAL(12,2) NOT NULL,
    "netSalary" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "contractType" "soccerxpro"."ContractType" NOT NULL,
    "status" "soccerxpro"."ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "signedDate" TIMESTAMP(3),
    "notes" TEXT,
    "playerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "team_id" UUID NOT NULL,
    "responsibleUserId" INTEGER,
    "contractNumber" TEXT,
    "fifaId" TEXT,
    "leagueRegistrationId" TEXT,
    "protocolNumber" TEXT,
    "imageRights" DECIMAL(10,2),
    "loyaltyBonus" DECIMAL(10,2),
    "signingBonus" DECIMAL(10,2),
    "accommodationBonus" DECIMAL(8,2),
    "carAllowance" DECIMAL(8,2),
    "taxRegime" "soccerxpro"."TaxRegime",
    "taxRate" DECIMAL(5,2),
    "socialContributions" DECIMAL(10,2),
    "insuranceValue" DECIMAL(12,2),
    "insuranceProvider" TEXT,
    "medicalInsurance" BOOLEAN DEFAULT false,
    "loanFromClub" TEXT,
    "loanToClub" TEXT,
    "buyOption" BOOLEAN DEFAULT false,
    "buyPrice" DECIMAL(12,2),
    "obligationToBuy" BOOLEAN DEFAULT false,
    "autoRenewal" BOOLEAN DEFAULT false,
    "renewalConditions" TEXT,
    "renewalNoticeMonths" INTEGER,
    "jurisdiction" TEXT,
    "arbitrationClause" BOOLEAN DEFAULT false,
    "confidentialityClause" BOOLEAN DEFAULT false,
    "nonCompeteClause" BOOLEAN DEFAULT false,
    "nonCompeteMonths" INTEGER,
    "isMinor" BOOLEAN DEFAULT false,
    "parentalConsent" BOOLEAN DEFAULT false,
    "tutorName" TEXT,
    "tutorContact" TEXT,
    "educationClause" BOOLEAN DEFAULT false,
    "languageRequirement" TEXT,
    "trainingObligation" BOOLEAN DEFAULT false,
    "performanceTargets" JSONB,
    "kpiTargets" JSONB,
    "workPermitRequired" BOOLEAN DEFAULT false,
    "workPermitStatus" "soccerxpro"."WorkPermitStatus",
    "workPermitExpiry" TIMESTAMP(3),
    "visaRequired" BOOLEAN DEFAULT false,
    "visaType" TEXT,
    "relocationPackage" DECIMAL(10,2),
    "familySupport" BOOLEAN DEFAULT false,
    "languageLessons" BOOLEAN DEFAULT false,
    "mediaObligations" TEXT,
    "socialMediaClause" TEXT,
    "sponsorshipRights" BOOLEAN DEFAULT false,
    "medicalExamDate" TIMESTAMP(3),
    "medicalExamResult" "soccerxpro"."MedicalExamResult",
    "medicalRestrictions" TEXT,
    "dopingConsent" BOOLEAN DEFAULT false,
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "complianceStatus" "soccerxpro"."ComplianceStatus" DEFAULT 'PENDING',
    "complianceNotes" TEXT,
    "priority" "soccerxpro"."ContractPriority" DEFAULT 'NORMAL',
    "tags" TEXT[],
    "internalNotes" TEXT,
    "agentContact" TEXT,
    "contractRole" "soccerxpro"."ContractRole",
    "paymentFrequency" "soccerxpro"."PaymentFrequency",
    "depositDate" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."contract_files" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "url" TEXT,
    "uploadedById" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "team_id" UUID NOT NULL,

    CONSTRAINT "contract_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."contract_amendments" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "type" "soccerxpro"."AmendmentType" NOT NULL,
    "signedDate" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "team_id" UUID NOT NULL,

    CONSTRAINT "contract_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."expenses" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "category" "soccerxpro"."BudgetCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "budgetId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."injuries" (
    "id" SERIAL NOT NULL,
    "injuryType" "soccerxpro"."InjuryType" NOT NULL,
    "bodyPart" "soccerxpro"."BodyPart" NOT NULL,
    "severity" "soccerxpro"."InjurySeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "injuryDate" TIMESTAMP(3) NOT NULL,
    "expectedReturn" TIMESTAMP(3),
    "actualReturn" TIMESTAMP(3),
    "status" "soccerxpro"."InjuryStatus" NOT NULL DEFAULT 'ACTIVE',
    "diagnosis" TEXT,
    "treatment" TEXT,
    "notes" TEXT,
    "playerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "injuries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."medical_visits" (
    "id" SERIAL NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "visitType" "soccerxpro"."VisitType" NOT NULL,
    "doctor" TEXT NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "notes" TEXT,
    "followUp" TIMESTAMP(3),
    "playerId" INTEGER NOT NULL,
    "injuryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "medical_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."player_statistics" (
    "id" SERIAL NOT NULL,
    "season" TEXT NOT NULL,
    "games" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "minutesPlayed" INTEGER NOT NULL DEFAULT 0,
    "playerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "player_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."transfers" (
    "id" SERIAL NOT NULL,
    "transferType" "soccerxpro"."TransferType" NOT NULL,
    "transferDate" TIMESTAMP(3),
    "fee" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'EUR',
    "status" "soccerxpro"."TransferStatus" NOT NULL DEFAULT 'NEGOTIATING',
    "fromClub" TEXT,
    "toClub" TEXT,
    "agent" TEXT,
    "notes" TEXT,
    "playerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."contract_payment_schedule" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT,
    "paymentType" "soccerxpro"."PaymentScheduleType" NOT NULL,
    "status" "soccerxpro"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "paidAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "contract_payment_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."tax_rates" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "soccerxpro"."ContractType" NOT NULL,
    "inps" DECIMAL(5,2) NOT NULL,
    "inail" DECIMAL(5,2),
    "ffc" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soccerxpro"."bonus_tax_rates" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "soccerxpro"."BonusType" NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "team_id" UUID NOT NULL,

    CONSTRAINT "bonus_tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "soccerxpro"."teams"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_auth_user_id_key" ON "soccerxpro"."user_profiles"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "soccerxpro"."user_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "players_shirtNumber_key" ON "soccerxpro"."players"("shirtNumber");

-- CreateIndex
CREATE UNIQUE INDEX "players_taxCode_key" ON "soccerxpro"."players"("taxCode");

-- CreateIndex
CREATE UNIQUE INDEX "players_passportNumber_key" ON "soccerxpro"."players"("passportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_year_category_key" ON "soccerxpro"."budgets"("year", "category");

-- CreateIndex
CREATE INDEX "contracts_team_id_playerId_status_idx" ON "soccerxpro"."contracts"("team_id", "playerId", "status");

-- CreateIndex
CREATE INDEX "contracts_team_id_startDate_idx" ON "soccerxpro"."contracts"("team_id", "startDate");

-- CreateIndex
CREATE INDEX "contracts_team_id_endDate_idx" ON "soccerxpro"."contracts"("team_id", "endDate");

-- CreateIndex
CREATE INDEX "contracts_team_id_complianceStatus_idx" ON "soccerxpro"."contracts"("team_id", "complianceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_team_id_contractNumber_key" ON "soccerxpro"."contracts"("team_id", "contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "player_statistics_playerId_season_key" ON "soccerxpro"."player_statistics"("playerId", "season");

-- CreateIndex
CREATE INDEX "contract_payment_schedule_team_id_contractId_status_idx" ON "soccerxpro"."contract_payment_schedule"("team_id", "contractId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_year_type_team_id_key" ON "soccerxpro"."tax_rates"("year", "type", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "bonus_tax_rates_year_type_team_id_key" ON "soccerxpro"."bonus_tax_rates"("year", "type", "team_id");

-- AddForeignKey
ALTER TABLE "soccerxpro"."user_profiles" ADD CONSTRAINT "user_profiles_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."players" ADD CONSTRAINT "players_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "soccerxpro"."user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."players" ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."performance_data" ADD CONSTRAINT "performance_data_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "soccerxpro"."user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."performance_data" ADD CONSTRAINT "performance_data_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "soccerxpro"."players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."performance_data" ADD CONSTRAINT "performance_data_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."budgets" ADD CONSTRAINT "budgets_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contract_clauses" ADD CONSTRAINT "contract_clauses_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "soccerxpro"."contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contract_clauses" ADD CONSTRAINT "contract_clauses_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contracts" ADD CONSTRAINT "contracts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "soccerxpro"."user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contracts" ADD CONSTRAINT "contracts_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "soccerxpro"."players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contracts" ADD CONSTRAINT "contracts_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "soccerxpro"."user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contracts" ADD CONSTRAINT "contracts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contract_files" ADD CONSTRAINT "contract_files_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "soccerxpro"."contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contract_files" ADD CONSTRAINT "contract_files_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contract_files" ADD CONSTRAINT "contract_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "soccerxpro"."user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contract_amendments" ADD CONSTRAINT "contract_amendments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "soccerxpro"."contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contract_amendments" ADD CONSTRAINT "contract_amendments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."expenses" ADD CONSTRAINT "expenses_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "soccerxpro"."budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."expenses" ADD CONSTRAINT "expenses_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."injuries" ADD CONSTRAINT "injuries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "soccerxpro"."user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."injuries" ADD CONSTRAINT "injuries_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "soccerxpro"."players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."injuries" ADD CONSTRAINT "injuries_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."medical_visits" ADD CONSTRAINT "medical_visits_injuryId_fkey" FOREIGN KEY ("injuryId") REFERENCES "soccerxpro"."injuries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."medical_visits" ADD CONSTRAINT "medical_visits_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "soccerxpro"."players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."medical_visits" ADD CONSTRAINT "medical_visits_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."player_statistics" ADD CONSTRAINT "player_statistics_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "soccerxpro"."players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."player_statistics" ADD CONSTRAINT "player_statistics_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."transfers" ADD CONSTRAINT "transfers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "soccerxpro"."user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."transfers" ADD CONSTRAINT "transfers_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "soccerxpro"."players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."transfers" ADD CONSTRAINT "transfers_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contract_payment_schedule" ADD CONSTRAINT "contract_payment_schedule_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "soccerxpro"."contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."contract_payment_schedule" ADD CONSTRAINT "contract_payment_schedule_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."tax_rates" ADD CONSTRAINT "tax_rates_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soccerxpro"."bonus_tax_rates" ADD CONSTRAINT "bonus_tax_rates_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

