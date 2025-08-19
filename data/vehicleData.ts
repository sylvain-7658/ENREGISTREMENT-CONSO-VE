import { Vehicle } from '../types';

// The list of vehicles, excluding the custom option.
const rawVehicles: Vehicle[] = [
  { name: 'Dacia Spring Electric', capacity: 27.4 },
  { name: 'Fiat 500e', capacity: 42 },
  { name: 'Hyundai Kona Electric (64 kWh)', capacity: 64 },
  { name: 'Kia e-Niro (64 kWh)', capacity: 64 },
  { name: 'MG ZS EV', capacity: 44.5 },
  { name: 'Peugeot e-208', capacity: 50 },
  { name: 'Renault Zoe E-Tech', capacity: 52 },
  { name: 'Tesla Model 3 (SR+)', capacity: 55 },
  { name: 'Tesla Model 3 Long Range', capacity: 75 },
  { name: 'Tesla Model Y Long Range', capacity: 75 },
  { name: 'Volkswagen ID.3 Pro', capacity: 58 },
  { name: 'Volkswagen ID.3 Pure', capacity: 45 },
  { name: 'Volkswagen ID.4', capacity: 77 },
  { name: 'Renault 5', capacity: 52 },
];

const customOption: Vehicle = { name: 'Autre / Personnalisé', capacity: 0 };

// Sort the list alphabetically by name and add the custom option at the end.
export const vehicles: Vehicle[] = [
  ...rawVehicles.sort((a, b) => a.name.localeCompare(b.name)),
  customOption,
];
