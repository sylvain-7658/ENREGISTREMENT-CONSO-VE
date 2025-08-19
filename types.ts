

export type View = 'dashboard' | 'journal' | 'trajets' | 'entretien' | 'stats' | 'settings' | 'add-charge' | 'add-trip' | 'add-maintenance';

export interface Vehicle {
  name: string;
  capacity: number;
}

export interface Settings {
  recapEmail: string;
  batteryCapacity: number; // in kWh
  vehicleModel: string;
  registrationNumber: string;
  pricePeak: number; // price per kWh
  priceOffPeak: number; // price per kWh
  // Tempo prices
  priceTempoBluePeak: number;
  priceTempoBlueOffPeak: number;
  priceTempoWhitePeak: number;
  priceTempoWhiteOffPeak: number;
  priceTempoRedPeak: number;
  priceTempoRedOffPeak: number;
  // Gasoline comparison
  gasolineCarConsumption: number; // in L/100km
  gasolinePricePerLiter: number; // in €/L
  fiscalPower: number; // in CV
  // Billing
  billingRateLocal: number; // in € for short trips
  billingRateMedium: number; // in € for medium trips
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
  FREE_CHARGE = 'Borne gratuite',
}

export interface Charge {
  id: string;
  date: string; // ISO string format
  startPercentage: number;
  endPercentage?: number;
  odometer: number; // in km
  tariff?: TariffType;
  customPrice?: number; // price per kWh for quick charge
  status: 'pending' | 'completed';
}

export interface ProcessedCharge extends Charge {
  endPercentage: number;
  tariff: TariffType;
  kwhAdded: number;
  cost: number;
  distanceDriven: number | null;
  consumptionKwh100km: number | null;
  pricePerKwh: number;
  gasolineEquivalentKm: number | null;
  costPer100km: number | null;
}

export interface Trip {
  id: string;
  date: string; // ISO string format
  destination: string;
  client?: string;
  startOdometer: number;
  endOdometer?: number;
  startPercentage: number;
  endPercentage?: number;
  isBilled: boolean;
  status: 'pending' | 'completed';
}

export interface ProcessedTrip extends Trip {
  endOdometer: number;
  endPercentage: number;
  distance: number;
  kwhConsumed: number;
  cost: number;
  consumptionKwh100km: number;
  pricePerKwh: number;
  gasolineEquivalentCost: number;
  savings: number;
  billingAmount?: number;
}

export enum MaintenanceType {
  LAVAGE = 'Lavage',
  ENTRETIEN_PERIODIQUE = 'Entretien périodique',
  REPARATION = 'Réparation',
  PNEUS = 'Pneus',
  PARE_BRISE = 'Pare-brise',
  CARROSSERIE = 'Carrosserie',
}

export interface MaintenanceEntry {
  id: string;
  date: string; // ISO string format
  odometer: number; // in km
  type: MaintenanceType;
  details?: string;
  cost: number;
}

export interface ProcessedMaintenanceEntry extends MaintenanceEntry {}

export interface StatsData {
  name: string;
  totalKwh: number;
  kwhPerTariff: { [key in TariffType]?: number };
  costPerTariff: { [key in TariffType]?: number };
  totalCost: number;
  totalDistance: number;
  avgConsumption: number;
  avgCostPer100km: number;
  totalGasolineCost: number;
  slowChargeKwh?: number;
  fastChargeKwh?: number;
  slowChargeCost?: number;
  fastChargeCost?: number;
  slowChargeCount?: number;
  fastChargeCount?: number;
}

export interface TripStatsData {
  name: string;
  totalDistance: number;
  totalCost: number;
  totalSavings: number;
  totalBillingAmount: number;
}

export interface ClientStats {
  name: string;
  tripCount: number;
  totalDistance: number;
  totalBillingAmount: number;
}

export interface DestinationStats {
  name: string;
  tripCount: number;
  totalDistance: number;
  avgDistance: number;
}