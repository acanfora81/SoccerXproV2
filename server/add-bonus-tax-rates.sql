-- Script SQL per aggiungere le tabelle bonus tax rates nello schema soccerxpro
-- Esegui questo script direttamente nel database Supabase

-- 1. Crea l'enum BonusType nello schema soccerxpro
CREATE TYPE "soccerxpro"."BonusType" AS ENUM ('IMAGE_RIGHTS', 'LOYALTY_BONUS', 'SIGNING_BONUS', 'ACCOMMODATION_BONUS', 'CAR_ALLOWANCE', 'TRANSFER_ALLOWANCE');

-- 2. Crea la tabella bonus_tax_rates nello schema soccerxpro
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

-- 3. Crea l'indice unico per evitare duplicati
CREATE UNIQUE INDEX "bonus_tax_rates_year_type_team_id_key" ON "soccerxpro"."bonus_tax_rates"("year", "type", "team_id");

-- 4. Aggiungi la foreign key verso la tabella teams
ALTER TABLE "soccerxpro"."bonus_tax_rates" ADD CONSTRAINT "bonus_tax_rates_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "soccerxpro"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Aggiungi il campo transferAllowance alla tabella contracts se non esiste
ALTER TABLE "soccerxpro"."contracts" ADD COLUMN IF NOT EXISTS "transferAllowance" DECIMAL(8,2);

-- Messaggio di conferma
SELECT 'Tabelle bonus tax rates create con successo nello schema soccerxpro!' as message;




