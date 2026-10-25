import type { Institution, LngLat } from "@rb/domain";

/** Municipios cabecera con un peso aproximado por población, para repartir casos ficticios. */
export interface Place {
  municipality: string;
  province: string;
  location: LngLat;
  weight: number;
}

export const PLACES: readonly Place[] = [
  {
    municipality: "Distrito Nacional",
    province: "Distrito Nacional",
    location: [-69.931, 18.486],
    weight: 10,
  },
  {
    municipality: "Santo Domingo Este",
    province: "Santo Domingo",
    location: [-69.857, 18.488],
    weight: 9,
  },
  {
    municipality: "Santo Domingo Norte",
    province: "Santo Domingo",
    location: [-69.915, 18.56],
    weight: 7,
  },
  {
    municipality: "Santo Domingo Oeste",
    province: "Santo Domingo",
    location: [-70.0, 18.49],
    weight: 6,
  },
  { municipality: "Boca Chica", province: "Santo Domingo", location: [-69.606, 18.452], weight: 2 },
  {
    municipality: "Santiago de los Caballeros",
    province: "Santiago",
    location: [-70.697, 19.451],
    weight: 8,
  },
  { municipality: "La Vega", province: "La Vega", location: [-70.529, 19.222], weight: 4 },
  {
    municipality: "San Cristóbal",
    province: "San Cristóbal",
    location: [-70.106, 18.416],
    weight: 5,
  },
  {
    municipality: "San Pedro de Macorís",
    province: "San Pedro de Macorís",
    location: [-69.297, 18.461],
    weight: 3,
  },
  { municipality: "La Romana", province: "La Romana", location: [-68.973, 18.427], weight: 3 },
  { municipality: "Higüey", province: "La Altagracia", location: [-68.708, 18.615], weight: 3 },
  {
    municipality: "Puerto Plata",
    province: "Puerto Plata",
    location: [-70.688, 19.793],
    weight: 3,
  },
  {
    municipality: "San Francisco de Macorís",
    province: "Duarte",
    location: [-70.252, 19.3],
    weight: 3,
  },
  { municipality: "Moca", province: "Espaillat", location: [-70.525, 19.394], weight: 2 },
  { municipality: "Baní", province: "Peravia", location: [-70.331, 18.28], weight: 2 },
  { municipality: "Azua", province: "Azua", location: [-70.735, 18.453], weight: 2 },
  { municipality: "Barahona", province: "Barahona", location: [-71.1, 18.208], weight: 2 },
  {
    municipality: "San Juan de la Maguana",
    province: "San Juan",
    location: [-71.229, 18.806],
    weight: 2,
  },
  { municipality: "Bonao", province: "Monseñor Nouel", location: [-70.409, 18.936], weight: 2 },
  { municipality: "Cotuí", province: "Sánchez Ramírez", location: [-70.149, 19.053], weight: 1 },
  {
    municipality: "Nagua",
    province: "María Trinidad Sánchez",
    location: [-69.847, 19.376],
    weight: 1,
  },
  { municipality: "Samaná", province: "Samaná", location: [-69.336, 19.205], weight: 1 },
  { municipality: "Monte Plata", province: "Monte Plata", location: [-69.784, 18.807], weight: 1 },
  { municipality: "Hato Mayor", province: "Hato Mayor", location: [-69.257, 18.762], weight: 1 },
  { municipality: "El Seibo", province: "El Seybo", location: [-69.039, 18.765], weight: 1 },
  { municipality: "Dajabón", province: "Dajabón", location: [-71.708, 19.549], weight: 1 },
  { municipality: "Montecristi", province: "Monte Cristi", location: [-71.646, 19.848], weight: 1 },
  { municipality: "Mao", province: "Valverde", location: [-71.078, 19.552], weight: 1 },
  { municipality: "Comendador", province: "Elías Piña", location: [-71.698, 18.876], weight: 1 },
  { municipality: "Neiba", province: "Bahoruco", location: [-71.419, 18.481], weight: 1 },
  { municipality: "Jimaní", province: "Independencia", location: [-71.851, 18.492], weight: 0.5 },
  { municipality: "Pedernales", province: "Pedernales", location: [-71.744, 18.038], weight: 0.5 },
  {
    municipality: "San José de Ocoa",
    province: "San José de Ocoa",
    location: [-70.506, 18.546],
    weight: 0.5,
  },
  {
    municipality: "Salcedo",
    province: "Hermanas Mirabal",
    location: [-70.418, 19.377],
    weight: 0.5,
  },
  {
    municipality: "Sabaneta",
    province: "Santiago Rodríguez",
    location: [-71.344, 19.476],
    weight: 0.5,
  },
];

export function placeByName(municipality: string): Place {
  const p = PLACES.find((x) => x.municipality === municipality);
  if (!p) throw new Error(`Municipio desconocido en el catálogo de seed: ${municipality}`);
  return p;
}

/**
 * Instituciones genéricas y ficticias en ubicaciones aproximadas. No representan
 * a ningún hospital, destacamento o sede real.
 */
export const INSTITUTIONS: readonly Institution[] = [
  {
    id: "h-dn",
    kind: "hospital",
    name: "Hospital traumatológico · Santo Domingo",
    province: "Distrito Nacional",
    location: [-69.919, 18.494],
  },
  {
    id: "h-sti",
    kind: "hospital",
    name: "Hospital regional · Santiago",
    province: "Santiago",
    location: [-70.687, 19.445],
  },
  {
    id: "h-lv",
    kind: "hospital",
    name: "Hospital provincial · La Vega",
    province: "La Vega",
    location: [-70.521, 19.228],
  },
  {
    id: "h-pp",
    kind: "hospital",
    name: "Hospital provincial · Puerto Plata",
    province: "Puerto Plata",
    location: [-70.694, 19.789],
  },
  {
    id: "h-spm",
    kind: "hospital",
    name: "Hospital regional · San Pedro de Macorís",
    province: "San Pedro de Macorís",
    location: [-69.291, 18.466],
  },
  {
    id: "h-sj",
    kind: "hospital",
    name: "Hospital regional · San Juan",
    province: "San Juan",
    location: [-71.224, 18.81],
  },
  {
    id: "d-dn",
    kind: "destacamento",
    name: "Destacamento policial · Distrito Nacional",
    province: "Distrito Nacional",
    location: [-69.945, 18.49],
  },
  {
    id: "d-sde",
    kind: "destacamento",
    name: "Destacamento policial · Santo Domingo Este",
    province: "Santo Domingo",
    location: [-69.847, 18.494],
  },
  {
    id: "d-sti",
    kind: "destacamento",
    name: "Destacamento policial · Santiago",
    province: "Santiago",
    location: [-70.709, 19.461],
  },
  {
    id: "d-hig",
    kind: "destacamento",
    name: "Destacamento policial · Higüey",
    province: "La Altagracia",
    location: [-68.702, 18.621],
  },
  {
    id: "m-sd",
    kind: "forense",
    name: "Patología forense · Santo Domingo",
    province: "Distrito Nacional",
    location: [-69.927, 18.47],
  },
  {
    id: "m-sti",
    kind: "forense",
    name: "Patología forense · Santiago",
    province: "Santiago",
    location: [-70.681, 19.455],
  },
  {
    id: "m-sj",
    kind: "forense",
    name: "Patología forense · San Juan",
    province: "San Juan",
    location: [-71.237, 18.812],
  },
];

export function institutionById(id: string): Institution {
  const i = INSTITUTIONS.find((x) => x.id === id);
  if (!i) throw new Error(`Institución desconocida: ${id}`);
  return i;
}
