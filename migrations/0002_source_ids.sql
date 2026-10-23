-- Source identifiers kept with each source row: men's and women's leagues share names on the platform,
-- so the competition is decided by idSport (sport + gender); idCompetition is stored for audits.
ALTER TABLE event_sources ADD COLUMN src_sport_id TEXT NOT NULL DEFAULT '';
ALTER TABLE event_sources ADD COLUMN src_comp_id TEXT NOT NULL DEFAULT '';
