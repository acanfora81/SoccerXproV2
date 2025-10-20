-- Create NegotiationStage enum in soccerxpro schema
CREATE TYPE soccerxpro."NegotiationStage" AS ENUM (
    'SCOUTING',
    'CONTACT', 
    'OFFER_SENT',
    'COUNTEROFFER',
    'AGREEMENT',
    'CLOSED',
    'REJECTED'
);

