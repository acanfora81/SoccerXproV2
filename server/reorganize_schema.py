#!/usr/bin/env python3
"""
Script per riorganizzare schema.prisma secondo la struttura della Sidebar
Mantiene TUTTI i campi e relazioni intatti, solo riordina e aggiunge intestazioni
"""

import re

# Leggi il file originale
with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# Estrai header (generator + datasource)
header_match = re.search(r'(generator.*?}\s+datasource.*?}\s+)', content, re.DOTALL)
header = header_match.group(1) if header_match else ""

# Estrai tutti i modelli
models = {}
current_model = None
current_content = []

for line in content.split('\n'):
    # Rileva inizio modello
    if re.match(r'^(model|enum)\s+(\w+)', line):
        # Salva il modello precedente
        if current_model:
            models[current_model] = '\n'.join(current_content)
        # Inizia nuovo modello
        match = re.match(r'^(model|enum)\s+(\w+)', line)
        current_model = match.group(2)
        current_content = [line]
    elif current_model:
        current_content.append(line)
        # Rileva fine modello
        if line.strip() == '}' or (line.strip().startswith('@@') and '}' not in line):
            # Controlla se è l'ultima riga del modello
            pass

# Salva l'ultimo modello
if current_model:
    models[current_model] = '\n'.join(current_content)

# Definisci l'ordine dei modelli secondo la sidebar
output = header + "\n"

# ===============================================================
# 1️⃣ CORE / MULTI-TENANT BASE
# ===============================================================
output += """/// ===============================================================
/// 1️⃣ CORE / MULTI-TENANT BASE
/// Sistema multi-tenant, autenticazione, abbonamenti e inviti
/// ===============================================================

"""

core_models = ['Team', 'UserProfile', 'Subscription', 'TeamInvite', 'TwoFactorAuth']
for model in core_models:
    if model in models:
        output += models[model] + "\n\n"

# ===============================================================
# 2️⃣ MODULO GIOCATORI
# ===============================================================
output += """/// ===============================================================
/// 2️⃣ MODULO GIOCATORI (Anagrafica sportiva)
/// Gestione anagrafiche giocatori, statistiche e trasferimenti
/// ===============================================================

"""

player_models = ['Player', 'player_statistics', 'transfers']
for model in player_models:
    if model in models:
        output += models[model] + "\n\n"

# ===============================================================
# 3️⃣ MODULO PERFORMANCE
# ===============================================================
output += """/// ===============================================================
/// 3️⃣ MODULO PERFORMANCE (Analisi e GPS)
/// Dati prestazionali, GPS e metriche fisiche
/// ===============================================================

"""

performance_models = ['PerformanceData']
for model in performance_models:
    if model in models:
        output += models[model] + "\n\n"

# ===============================================================
# 4️⃣ MODULO CONTRATTI & FINANZE
# ===============================================================
output += """/// ===============================================================
/// 4️⃣ MODULO CONTRATTI & FINANZE
/// Contratti, pagamenti, budget, tasse e normativa fiscale
/// ===============================================================

"""

contracts_models = [
    'contracts', 'contract_amendments', 'contract_clauses', 'contract_files',
    'contract_payment_schedule', 'budgets', 'expenses', 'TaxRate', 'BonusTaxRate',
    'tax_config', 'tax_irpef_bracket', 'tax_municipal_additional_bracket',
    'tax_municipal_additional_rule', 'tax_regional_additional_bracket',
    'tax_regional_additional_scheme', 'tax_extra_deduction_rule', 'tax_bonus_l207_rule'
]
for model in contracts_models:
    if model in models:
        output += models[model] + "\n\n"

# ===============================================================
# 5️⃣ MODULO MEDICO & GDPR
# ===============================================================
output += """/// ===============================================================
/// 5️⃣ MODULO MEDICO & GDPR
/// Gestione medica, infortuni, visite e conformità GDPR
/// ===============================================================

"""

medical_models = [
    'injuries', 'medical_visits', 'MedicalCase', 'MedicalDiagnosis',
    'MedicalExamination', 'MedicalTreatment', 'MedicalDocument', 'MedicalAccessLog',
    'GDPRConfiguration', 'DataProcessingAgreement', 'MedicalVault', 'MedicalVaultAccess',
    'MedicalConsent', 'DataBreachRegister', 'GDPRRequest', 'AnonymizedMedicalData',
    'DataRetentionPolicy', 'PlayerHealthProfile'
]
for model in medical_models:
    if model in models:
        output += models[model] + "\n\n"

# ===============================================================
# 6️⃣ MODULO MERCATO & SCOUTING
# ===============================================================
output += """/// ===============================================================
/// 6️⃣ MODULO MERCATO & SCOUTING
/// Gestione mercato, agenti, target, trattative, offerte e scouting
/// ===============================================================

"""

market_models = [
    'market_agent', 'market_target', 'market_shortlist', 'market_shortlist_item',
    'market_negotiation', 'NegotiationStage', 'market_offer', 'market_budget',
    'scouting_scout', 'scouting_rubric', 'scouting_rubric_criterion', 'scouting_match',
    'scouting_session', 'scouting_report', 'scouting_report_score', 'scouting_assignment',
    'scouting_followup', 'scouting_media', 'scouting_review', 'scouting_region',
    'scouting_scout_region', 'scouting_tag', 'scouting_tag_link',
    'ScoutingProspect', 'ScoutingReport', 'ScoutingShortlist', 'ScoutingShortlistItem',
    'ScoutingEventLog', 'Agent', 'ScoutingStatus'
]
for model in market_models:
    if model in models:
        output += models[model] + "\n\n"

# ===============================================================
# 7️⃣ ENUMS & SUPPORT TYPES
# ===============================================================
output += """/// ===============================================================
/// 7️⃣ ENUMS & SUPPORT TYPES
/// Tipi enumerati di supporto per tutti i moduli
/// ===============================================================

"""

# Tutti gli enum rimanenti
all_enums = [
    'BodyPart', 'BudgetCategory', 'ClauseType', 'ContractStatus', 'ContractType',
    'ContractRole', 'PaymentFrequency', 'AmendmentType', 'FootType', 'InjurySeverity',
    'InjuryStatus', 'InjuryType', 'Position', 'TransferStatus', 'TransferType',
    'UserRole', 'VisitType', 'TaxRegime', 'WorkPermitStatus', 'MedicalExamResult',
    'ComplianceStatus', 'ContractPriority', 'BonusType', 'PaymentScheduleType',
    'PaymentStatus', 'TaxBase', 'SubscriptionPlan', 'SubscriptionStatus',
    'MedicalCaseType', 'InjuryMechanism', 'MedicalInjurySeverity', 'RehabStage',
    'ExamType', 'TreatmentType', 'VisibilityLevel', 'DataClassification',
    'ConsentStatus', 'LawfulBasis', 'AuditAction', 'DataRetentionReason',
    'ObservationType', 'ScoutingSessionStatus', 'RecommendationLevel', 'PriorityLevel',
    'AssignmentStatus', 'MediaType'
]

for enum in all_enums:
    if enum in models:
        output += models[enum] + "\n\n"

# Scrivi il file riorganizzato
with open('prisma/schema_reorganized.prisma', 'w', encoding='utf-8') as f:
    f.write(output)

print("✅ Schema riorganizzato salvato in prisma/schema_reorganized.prisma")
print(f"📊 Modelli trovati: {len(models)}")
print(f"📝 Dimensione output: {len(output)} caratteri")

