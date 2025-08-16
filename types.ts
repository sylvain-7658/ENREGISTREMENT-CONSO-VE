export interface Vehicle {
  name: string;
  capacity: number;
}

export interface Settings {
  recapEmail: string;
  batteryCapacity: number; // in kWh
  pricePeak: number; // price per kWh
  priceOffPeak: number; // price per kWh
  // Tempo prices
  priceTempoBluePeak: number;
  priceTempoBlueOffPeak: number;
  priceTempoWhitePeak: number;
  priceTempoWhiteOffPeak: number;
  priceTempoRedPeak: number;
  priceTempoRedOffPeak: number;
}

export enum TariffType {
  PEAK = 'Heures Pleines',
  OFF_PEAK = 'Heures Creuses',
  TEMPO_BLUE_PEAK = 'Tempo Bleu - Heures Pleines',
  TEMPO_BLUE_OFFPEAK = 'Tempo Bleu - Heures Creuses',
  TEMPO_WHITE_PEAK = 'Tempo Blanc - Heures Pleines',
  TEMPO_WHITE_OFFPEAK = 'Tempo Blanc - Heures Creuses',
  TEMPO_RED_PEAK = 'Tempo Rouge - Heures Pleines',
  TEMPO_RED_OFFPEAK = 'Tempo Rouge - Heures Creuses',
  QUICK_CHARGE = 'Recharge borne rapide',
}

export interface Charge {
  id: string;
  date: string; // ISO string format
  startPercentage: number;
  endPercentage: number;
  odometer: number; // in km
  tariff: TariffType;
  customPrice?: number; // price per kWh for quick charge
}

export interface ProcessedCharge extends Charge {
  kwhAdded: number;
  cost: number;
  distanceDriven: number | null;
  consumptionKwh100km: number | null;
  pricePerKwh: number;
}

export interface StatsData {
  name: string;
  totalKwh: number;
  totalCost: number;
  totalDistance: number;
  avgConsumption: number;
}

export interface User {
  id: string; // Firebase UID
  email: string;
  isAdmin?: boolean;
}