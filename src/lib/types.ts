export interface Contracte {
  codi_expedient?: string;
  descripcio_expedient: string;    // contract description
  import_adjudicacio?: number;
  data_adjudicacio?: string;       // adjudication date
  adjudicatari?: string;
  organisme_contractant?: string;  // contracting body
  tipus_contracte?: string;
  procediment_adjudicacio?: string; // adjudication procedure
  exercici?: string;
  dies_durada?: number;
  mesos_durada?: number;
  codi_cpv?: string;
}

export interface Subvencio {
  clau?: string;
  codi_raisc?: string;
  objecte_de_la_convocat_ria?: string;   // the grant description
  ra_social_del_beneficiari?: string;     // beneficiary name
  cif_beneficiari?: string;
  import_subvenci_pr_stec_ajut?: number;  // the amount
  data_concessi?: string;                  // the date
  entitat_oo_aa_o_departament_1?: string;  // granting body
  any_de_la_convocat_ria?: string;
  finalitat_rais?: string;
}

export interface SubvencioBDNS {
  idConvocatoria: string;
  descripcion: string;
  importe: number;
  fechaPublicacion: string;
  organo: string;
  beneficiarios?: string[];
  tipoConvocatoria?: string;
}

export interface CarrecPublic {
  cognoms_nom: string;              // full name
  denominacio_lloc?: string;        // position title
  departament?: string;             // department
  retribucio_anual_prevista?: string; // NOTE: string like "130,049.12 EUR"
  vinculacio?: string;
  sexe?: string;
  inici_periode?: string;
}

export interface Pressupost {
  exercici?: string;               // fiscal year
  ingr_s_despesa?: string;         // "D" or "I"
  cap_tol?: string;
  nom_cap_tol?: string;
  nom_programa?: string;           // program name
  nom_secci?: string;
  import_sense_consolidar?: number;
  import_consolidat_sector_p_blic?: number;
  nom_servei_entitat?: string;
}

export interface CasCorrupcio {
  slug: string;
  nom: string;
  descripcio: string;
  comunitat: string;
  partit?: string;
  import_estimat?: number;
  estat: 'en_curs' | 'sentencia_ferma' | 'arxivat' | 'prescrit';
  persones: PersonaImplicada[];
  font_judicial?: string;
  data_inici?: string;
  data_sentencia?: string;
}

export interface PersonaImplicada {
  slug: string;
  nom: string;
  carrec?: string;
  partit?: string;
  estat_judicial: 'investigat' | 'acusat' | 'condemnat' | 'absolt';
  sentencia?: string;
  pena?: string;
  casos_relacionats?: string[];
}

export interface DashboardStats {
  totalContractes: number;
  importTotalContractes: number;
  totalSubvencions: number;
  importTotalSubvencions: number;
  totalCasosCorrupcio: number;
  totalPersonesImplicades: number;
  importEstimatCorrupcio: number;
}

export interface SocrataQueryOptions {
  dataset: string;
  domain?: string;
  select?: string;
  where?: string;
  group?: string;
  order?: string;
  limit?: number;
  offset?: number;
  q?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface Anomalia {
  id: string;
  tipus: 'fraccionament' | 'concentracio' | 'porta_giratoria' | 'lobby_contracte';
  titol: string;
  descripcio: string;
  gravetat: 'alta' | 'mitjana' | 'baixa';
  evidencia: Record<string, unknown>;
  data_deteccio: string;
}
