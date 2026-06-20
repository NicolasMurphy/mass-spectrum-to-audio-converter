DROP TABLE IF EXISTS accession_peak_counts;

CREATE TABLE accession_peak_counts AS
SELECT accession, COUNT(*) AS peaks
FROM (
    SELECT DISTINCT accession, mz, intensity
    FROM spectrum_data
    WHERE intensity > 0
) d
GROUP BY accession;

ALTER TABLE accession_peak_counts ADD PRIMARY KEY (accession);
