-- 機器マスタテーブルを追加
CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Instrument_userId_name_number_key" ON "Instrument"("userId", "name", "number");

ALTER TABLE "Instrument" ADD CONSTRAINT "Instrument_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
