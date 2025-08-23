import { VehiclePreset } from '../types';

// The list of vehicles, excluding the custom option.
const rawVehicles: VehiclePreset[] = [
  
  { name: 'Renault 5 E-TECH (40)', capacity: 40 },
  { name: 'Renault 5 E-TECH (52)', capacity: 52 },
  { name: 'Renault Mégane E-TECH (40)', capacity: 40 },
  { name: 'Renault Mégane E-TECH (60)', capacity: 60 },
  { name: 'Renault Scénic E-TECH', capacity: 87 },
  { name: 'Renault ZOE R135', capacity: 52 },

  { name: 'Peugeot e-208 (50)', capacity: 50 },
  { name: 'Peugeot e-208 (51, MY24)', capacity: 51 },
  { name: 'Peugeot e-2008 (50/51)', capacity: 51 },
  { name: 'Peugeot e-308', capacity: 54 },
  { name: 'Peugeot e-3008 (Std Range)', capacity: 73 },
  { name: 'Peugeot e-3008 (Long Range)', capacity: 98 },
  { name: 'Peugeot e-408', capacity: 73 },

  { name: 'Citroën ë-C3', capacity: 44 },
  { name: 'Citroën ë-C4 (50/54)', capacity: 54 },
  { name: 'Citroën ë-C4 X (50/54)', capacity: 54 },
  { name: 'Citroën Ami', capacity: 5.5 },

  { name: 'Opel Corsa Electric (50/51)', capacity: 51 },
  { name: 'Opel Mokka Electric (50/51)', capacity: 51 },
  { name: 'Opel Astra Electric', capacity: 54 },
  { name: 'Opel Frontera Electric', capacity: 44 },
  { name: 'Opel Grandland Electric', capacity: 73 },

  { name: 'Fiat 500e (24)', capacity: 24 },
  { name: 'Fiat 500e (42)', capacity: 42 },
  { name: 'Fiat 600e', capacity: 54 },
  { name: 'Fiat Grande Panda', capacity: 44 },

  { name: 'Dacia Spring', capacity: 27 },

  { name: 'Tesla Model 3 RWD', capacity: 60 },
  { name: 'Tesla Model 3 Long Range', capacity: 75 },
  { name: 'Tesla Model 3 Performance', capacity: 75 },
  { name: 'Tesla Model Y RWD', capacity: 60 },
  { name: 'Tesla Model Y Long Range', capacity: 75 },
  { name: 'Tesla Model Y Performance', capacity: 75 },
  { name: 'Tesla Model S Dual Motor', capacity: 100 },
  { name: 'Tesla Model X Dual Motor', capacity: 100 },

  { name: 'Volkswagen ID.3 (Pure)', capacity: 52 },
  { name: 'Volkswagen ID.3 (Pro)', capacity: 58 },
  { name: 'Volkswagen ID.3 (Pro S)', capacity: 77 },
  { name: 'Volkswagen ID.4 (Pure)', capacity: 52 },
  { name: 'Volkswagen ID.4 (Pro/Max)', capacity: 77 },
  { name: 'Volkswagen ID.5 (Pro/GTX)', capacity: 77 },
  { name: 'Volkswagen ID.7 (Pro)', capacity: 77 },
  { name: 'Volkswagen ID.7 (Pro S)', capacity: 86 },
  { name: 'Volkswagen ID. Buzz (RWD/AWD)', capacity: 77 },

  { name: 'Škoda Enyaq 60', capacity: 62 },
  { name: 'Škoda Enyaq 80/85', capacity: 82 },
  { name: 'Škoda Enyaq Coupé 80/85', capacity: 82 },

  { name: 'Cupra Born (58)', capacity: 58 },
  { name: 'Cupra Born (77)', capacity: 77 },
  { name: 'Cupra Tavascan', capacity: 77 },

  { name: 'Audi Q4 e-tron (35)', capacity: 52 },
  { name: 'Audi Q4 e-tron (40/45/50)', capacity: 77 },
  { name: 'Audi Q6 e-tron', capacity: 100 },
  { name: 'Audi e-tron GT / RS', capacity: 93 },

  { name: 'BMW i4 eDrive35', capacity: 66 },
  { name: 'BMW i4 eDrive40 / M50', capacity: 84 },
  { name: 'BMW i5 eDrive40 / M60', capacity: 81 },
  { name: 'BMW i7', capacity: 102 },
  { name: 'BMW iX1', capacity: 66 },
  { name: 'BMW iX2', capacity: 66 },
  { name: 'BMW iX3', capacity: 80 },
  { name: 'BMW iX xDrive40', capacity: 71 },
  { name: 'BMW iX xDrive50 / M60', capacity: 105 },
  { name: 'MINI Cooper Electric (E)', capacity: 41 },
  { name: 'MINI Cooper Electric (SE)', capacity: 54 },
  { name: 'MINI Countryman Electric', capacity: 66 },

  { name: 'Mercedes-Benz EQA', capacity: 67 },
  { name: 'Mercedes-Benz EQB', capacity: 70 },
  { name: 'Mercedes-Benz EQE (berline)', capacity: 90 },
  { name: 'Mercedes-Benz EQE SUV', capacity: 90 },
  { name: 'Mercedes-Benz EQS (berline)', capacity: 108 },
  { name: 'Mercedes-Benz EQS SUV', capacity: 108 },
  { name: 'Mercedes-Benz EQV', capacity: 90 },

  { name: 'Hyundai Kona Electric (Std)', capacity: 48 },
  { name: 'Hyundai Kona Electric (Long Range)', capacity: 65 },
  { name: 'Hyundai IONIQ 5 (Std)', capacity: 58 },
  { name: 'Hyundai IONIQ 5 (Long Range)', capacity: 84 },
  { name: 'Hyundai IONIQ 6 (Std)', capacity: 53 },
  { name: 'Hyundai IONIQ 6 (Long Range)', capacity: 77 },

  { name: 'Kia Niro EV', capacity: 65 },
  { name: 'Kia EV6 (Std)', capacity: 58 },
  { name: 'Kia EV6 (Long Range)', capacity: 77 },
  { name: 'Kia EV9', capacity: 100 },

  { name: 'Nissan LEAF (40)', capacity: 40 },
  { name: 'Nissan LEAF e+ (62)', capacity: 62 },
  { name: 'Nissan Ariya (63)', capacity: 63 },
  { name: 'Nissan Ariya (87)', capacity: 87 },

  { name: 'Toyota bZ4X', capacity: 71 },
  { name: 'Subaru Solterra', capacity: 71 },

  { name: 'Mazda MX-30', capacity: 35.5 },

  { name: 'Honda e', capacity: 35.5 },
  { name: 'Honda e:NY1', capacity: 69 },

  { name: 'Smart #1 (Pro)', capacity: 49 },
  { name: 'Smart #1 (Premium/BRABUS)', capacity: 66 },
  { name: 'Smart #3 (Pro)', capacity: 49 },
  { name: 'Smart #3 (Premium/BRABUS)', capacity: 66 },

  { name: 'BYD Dolphin (Std)', capacity: 45 },
  { name: 'BYD Dolphin (Extended)', capacity: 60 },
  { name: 'BYD Atto 3', capacity: 60 },
  { name: 'BYD Seal (Std)', capacity: 62 },
  { name: 'BYD Seal (Perf)', capacity: 82 },
  { name: 'BYD Seal U', capacity: 71 },

  { name: 'MG4 Electric (Std)', capacity: 51 },
  { name: 'MG4 Electric (Long Range)', capacity: 64 },
  { name: 'MG4 Electric (XPower/Ext Range)', capacity: 77 },
  { name: 'MG ZS EV (Std)', capacity: 50 },
  { name: 'MG ZS EV (Long Range)', capacity: 70 },
  { name: 'MG5 Electric (Std)', capacity: 57 },
  { name: 'MG5 Electric (Long Range)', capacity: 61 },

  { name: 'Volvo EX30 (Single)', capacity: 49 },
  { name: 'Volvo EX30 (Extended)', capacity: 64 },
  { name: 'Volvo EX40/EC40 (Single)', capacity: 69 },
  { name: 'Volvo EX40/EC40 (Twin)', capacity: 82 },
  { name: 'Volvo EX90', capacity: 111 },

  { name: 'Polestar 2 (Std)', capacity: 69 },
  { name: 'Polestar 2 (Long Range)', capacity: 82 },
  { name: 'Polestar 3', capacity: 111 },
  { name: 'Polestar 4', capacity: 100 },

  { name: 'Porsche Taycan (Perf Battery)', capacity: 79 },
  { name: 'Porsche Taycan (Perf Battery Plus)', capacity: 93 },

  { name: 'Jaguar I-PACE', capacity: 90 },

  { name: 'Lotus Eletre', capacity: 112 },
  { name: 'Lotus Emeya', capacity: 102 },

  { name: 'NIO ET5 (Std)', capacity: 75 },
  { name: 'NIO ET5 (Long Range)', capacity: 100 },
  { name: 'NIO EL6/ES6 (Std)', capacity: 75 },
  { name: 'NIO EL6/ES6 (Long Range)', capacity: 100 },
  { name: 'NIO ET7 (Std)', capacity: 75 },
  { name: 'NIO ET7 (Long Range)', capacity: 100 },

  { name: 'XPeng G6', capacity: 66 },
  { name: 'XPeng G9', capacity: 90 },
  { name: 'XPeng P7', capacity: 82 },

  { name: 'ORA Funky Cat (48)', capacity: 48 },
  { name: 'ORA Funky Cat (63)', capacity: 63 },

  { name: 'BYD Tang (EU)', capacity: 86 }

];

const customOption: VehiclePreset = { name: 'Autre / Personnalisé', capacity: 0 };

// Sort the list alphabetically by name and add the custom option at the end.
export const vehicles: VehiclePreset[] = [
  ...rawVehicles.sort((a, b) => a.name.localeCompare(b.name)),
  customOption,
];