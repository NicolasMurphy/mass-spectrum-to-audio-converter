export const CUSTOM_ACCESSION = "CUSTOM-001";

export const isCustomCompound = (accession: string) =>
  accession.startsWith("CUSTOM-");
