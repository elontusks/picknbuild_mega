/**
 * Static catalog of common vehicle makes and models for the search intake
 * dropdowns. Not exhaustive — covers the 30+ brands that account for the
 * overwhelming majority of US listings on this marketplace. When the
 * ingestion pipeline is hooked up to real make/model facets later, this can
 * be replaced with a derived list.
 */

export const VEHICLE_CATALOG: Record<string, readonly string[]> = {
  Acura: ["ILX", "MDX", "RDX", "TLX", "TSX"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale"],
  "Aston Martin": ["DB11", "Vantage"],
  Audi: ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron"],
  Bentley: ["Bentayga", "Continental"],
  BMW: ["2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "i4", "iX"],
  Buick: ["Enclave", "Encore", "Envision"],
  Cadillac: ["CT4", "CT5", "Escalade", "XT4", "XT5", "XT6", "Lyriq"],
  Chevrolet: [
    "Blazer", "Bolt EV", "Camaro", "Colorado", "Corvette", "Equinox",
    "Impala", "Malibu", "Silverado 1500", "Silverado 2500", "Suburban",
    "Tahoe", "Trailblazer", "Traverse", "Trax",
  ],
  Chrysler: ["300", "Pacifica"],
  Dodge: ["Challenger", "Charger", "Durango", "Hornet"],
  Fiat: ["500", "500X"],
  Ford: [
    "Bronco", "Bronco Sport", "Edge", "Escape", "Expedition", "Explorer",
    "F-150", "F-250", "F-350", "Maverick", "Mustang", "Mustang Mach-E",
    "Ranger", "Transit",
  ],
  Genesis: ["G70", "G80", "G90", "GV70", "GV80"],
  GMC: ["Acadia", "Canyon", "Hummer EV", "Sierra 1500", "Terrain", "Yukon"],
  Honda: [
    "Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Passport", "Pilot",
    "Ridgeline",
  ],
  Hyundai: [
    "Elantra", "Ioniq 5", "Ioniq 6", "Kona", "Palisade", "Santa Cruz",
    "Santa Fe", "Sonata", "Tucson", "Venue",
  ],
  Infiniti: ["Q50", "QX50", "QX60", "QX80"],
  Jaguar: ["E-PACE", "F-PACE", "I-PACE", "XF"],
  Jeep: [
    "Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade",
    "Wagoneer", "Wrangler",
  ],
  Kia: [
    "Carnival", "EV6", "Forte", "K5", "Niro", "Rio", "Seltos", "Sorento",
    "Soul", "Sportage", "Stinger", "Telluride",
  ],
  "Land Rover": ["Defender", "Discovery", "Range Rover", "Range Rover Sport", "Range Rover Velar"],
  Lexus: ["ES", "GX", "IS", "LS", "LX", "NX", "RX", "UX"],
  Lincoln: ["Aviator", "Corsair", "Nautilus", "Navigator"],
  Lucid: ["Air"],
  Maserati: ["Ghibli", "Levante"],
  Mazda: ["CX-30", "CX-5", "CX-50", "CX-9", "CX-90", "MX-5 Miata", "Mazda3", "Mazda6"],
  "Mercedes-Benz": [
    "A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLB", "GLC", "GLE",
    "GLS", "EQS",
  ],
  Mini: ["Cooper", "Countryman"],
  Mitsubishi: ["Eclipse Cross", "Mirage", "Outlander", "Outlander Sport"],
  Nissan: [
    "Altima", "Ariya", "Armada", "Frontier", "Kicks", "Leaf", "Maxima",
    "Murano", "Pathfinder", "Rogue", "Sentra", "Titan", "Versa", "Z",
  ],
  Polestar: ["Polestar 2"],
  Porsche: ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  Ram: ["1500", "2500", "3500", "ProMaster"],
  Rivian: ["R1S", "R1T"],
  Subaru: [
    "Ascent", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback",
    "Solterra", "WRX",
  ],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  Toyota: [
    "4Runner", "86", "Avalon", "bZ4X", "Camry", "Corolla", "Corolla Cross",
    "Crown", "Highlander", "Land Cruiser", "Mirai", "Prius", "RAV4",
    "Sequoia", "Sienna", "Tacoma", "Tundra", "Venza",
  ],
  Volkswagen: [
    "Atlas", "Atlas Cross Sport", "ID.4", "Jetta", "Passat", "Taos", "Tiguan",
  ],
  Volvo: ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"],
} as const;

export const VEHICLE_MAKES: readonly string[] = Object.keys(VEHICLE_CATALOG).sort();

export function getModelsForMake(make: string): readonly string[] {
  return VEHICLE_CATALOG[make] ?? [];
}

const CURRENT_YEAR = new Date().getFullYear();
const EARLIEST_YEAR = 1990;

export const VEHICLE_YEARS: readonly number[] = Array.from(
  { length: CURRENT_YEAR + 1 - EARLIEST_YEAR + 1 },
  (_, i) => CURRENT_YEAR + 1 - i,
);
