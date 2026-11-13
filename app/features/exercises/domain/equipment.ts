/**
 * Vocabulario cerrado de equipo. Un arreglo vacío significa «ninguno».
 * "Gimnasio completo" implica todo lo anterior.
 */
export const EQUIPMENT = [
  "mancuernas",
  "bandas",
  "barra-de-dominadas",
  "banco-o-silla",
  "cuerda",
  "gimnasio-completo",
] as const;

export type Equipment = (typeof EQUIPMENT)[number];
