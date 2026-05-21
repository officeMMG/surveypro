-- SurveyPro 初期テーブル作成SQL
-- Supabase SQL Editor に貼り付けて実行してください

-- 既存のテーブル・型を削除（再実行用）
DROP TABLE IF EXISTS "ContactRequest" CASCADE;
DROP TABLE IF EXISTS "Benchmark" CASCADE;
DROP TABLE IF EXISTS "LevelingResult" CASCADE;
DROP TABLE IF EXISTS "LevelingReading" CASCADE;
DROP TABLE IF EXISTS "LevelingRoute" CASCADE;
DROP TABLE IF EXISTS "ProjectMember" CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;
DROP TABLE IF EXISTS "UserApiKey" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TYPE IF EXISTS "ContactStatus" CASCADE;
DROP TYPE IF EXISTS "ContactRequestType" CASCADE;
DROP TYPE IF EXISTS "BenchmarkType" CASCADE;
DROP TYPE IF EXISTS "RouteDirection" CASCADE;
DROP TYPE IF EXISTS "GradeLevel" CASCADE;
DROP TYPE IF EXISTS "MemberRole" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
CREATE TYPE "GradeLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4');
CREATE TYPE "RouteDirection" AS ENUM ('FORWARD', 'BACKWARD', 'LOOP', 'JUNCTION');
CREATE TYPE "BenchmarkType" AS ENUM ('FIRST_ORDER', 'SECOND_ORDER', 'THIRD_ORDER', 'FOUR_ORDER', 'ELECTRONIC');
CREATE TYPE "ContactRequestType" AS ENUM ('API_KEY_CHANGE', 'ACCOUNT_ISSUE', 'OTHER');
CREATE TYPE "ContactStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "UserApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserApiKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT,
    "routeName" TEXT,
    "workStartDate" TIMESTAMP(3),
    "workEndDate" TIMESTAMP(3),
    "gradeLevel" "GradeLevel" NOT NULL DEFAULT 'LEVEL_3',
    "ownerId" TEXT NOT NULL,
    "autoDeleteAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LevelingRoute" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" "RouteDirection" NOT NULL DEFAULT 'FORWARD',
    "surveyDate" TIMESTAMP(3),
    "weather" TEXT,
    "instrument" TEXT,
    "observer" TEXT,
    "recorder" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LevelingRoute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LevelingReading" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "stationName" TEXT NOT NULL,
    "bs" DECIMAL(8,3),
    "fs" DECIMAL(8,3),
    "is_" DECIMAL(8,3),
    "ih" DECIMAL(8,3),
    "gh" DECIMAL(8,3),
    "rise" DECIMAL(8,3),
    "fall" DECIMAL(8,3),
    "distance" DECIMAL(8,3),
    "note" TEXT,
    "isKnown" BOOLEAN NOT NULL DEFAULT false,
    "knownElevation" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LevelingReading_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LevelingResult" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "totalBs" DECIMAL(8,3),
    "totalFs" DECIMAL(8,3),
    "closureError" DECIMAL(8,4),
    "totalDistance" DECIMAL(10,3),
    "allowableError" DECIMAL(8,4),
    "isPassed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LevelingResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Benchmark" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "type" "BenchmarkType" NOT NULL DEFAULT 'FOUR_ORDER',
    "latitudeDeg" DECIMAL(11,8),
    "longitudeDeg" DECIMAL(11,8),
    "elevation" DECIMAL(10,4),
    "establishedAt" TIMESTAMP(3),
    "managingOrg" TEXT,
    "location" TEXT,
    "guideMapUrl" TEXT,
    "photoUrl" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ContactRequestType" NOT NULL DEFAULT 'API_KEY_CHANGE',
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "UserApiKey_userId_provider_key" ON "UserApiKey"("userId", "provider");
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");
CREATE UNIQUE INDEX "LevelingReading_routeId_sequence_key" ON "LevelingReading"("routeId", "sequence");
CREATE UNIQUE INDEX "LevelingResult_routeId_key" ON "LevelingResult"("routeId");
CREATE UNIQUE INDEX "Benchmark_projectId_code_key" ON "Benchmark"("projectId", "code");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserApiKey" ADD CONSTRAINT "UserApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LevelingRoute" ADD CONSTRAINT "LevelingRoute_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LevelingReading" ADD CONSTRAINT "LevelingReading_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "LevelingRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LevelingResult" ADD CONSTRAINT "LevelingResult_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "LevelingRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Benchmark" ADD CONSTRAINT "Benchmark_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Benchmark" ADD CONSTRAINT "Benchmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
