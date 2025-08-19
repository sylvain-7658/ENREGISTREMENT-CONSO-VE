

import { Charge, ProcessedCharge, ProcessedTrip, Settings, StatsData, TariffType, Trip, TripStatsData, ClientStats, DestinationStats, MaintenanceEntry, ProcessedMaintenanceEntry } from '../types';

// Les tarifs en courant alternatif (AC) sont sujets à des pertes lors de la recharge, de la prise à la batterie.
const AC_TARIFFS: TariffType[] = [
  TariffType.PEAK,
  TariffType.OFF_PEAK,
  TariffType.TEMPO_BLUE_PEAK,
  TariffType.TEMPO_BLUE_OFFPEAK,
  TariffType.TEMPO_WHITE_PEAK,
  TariffType.TEMPO_WHITE_OFFPEAK,
  TariffType.TEMPO_RED_PEAK,
  TariffType.TEMPO_RED_OFFPEAK,
  TariffType.FREE_CHARGE,
];
// Nous appliquons une perte d'énergie de 12% pour la recharge en AC.
const CHARGING_LOSS_FACTOR = 1.12;


export const processCharges = (charges: Charge[], settings: Settings): ProcessedCharge[] => {
  const completedCharges = charges.filter(
    (c): c is Charge & { endPercentage: number; tariff: TariffType } =>
      c.status === 'completed' && c.endPercentage != null && c.tariff != null
  );

  const sortedCharges = [...completedCharges].sort((a, b) => a.odometer - b.odometer);
  const processedResult: ProcessedCharge[] = [];

  for (let index = 0; index < sortedCharges.length; index++) {
      const charge = sortedCharges[index];

      // --- Base calculations for the current charge ---
      const percentAdded = charge.endPercentage - charge.startPercentage;
      const kwhAddedToBattery = (percentAdded / 100) * settings.batteryCapacity;
      const kwhDrawnFromGrid = AC_TARIFFS.includes(charge.tariff)
          ? kwhAddedToBattery * CHARGING_LOSS_FACTOR
          : kwhAddedToBattery;

      let pricePerKwh: number;
      switch (charge.tariff) {
        case TariffType.PEAK: pricePerKwh = settings.pricePeak; break;
        case TariffType.OFF_PEAK: pricePerKwh = settings.priceOffPeak; break;
        case TariffType.TEMPO_BLUE_PEAK: pricePerKwh = settings.priceTempoBluePeak; break;
        case TariffType.TEMPO_BLUE_OFFPEAK: pricePerKwh = settings.priceTempoBlueOffPeak; break;
        case TariffType.TEMPO_WHITE_PEAK: pricePerKwh = settings.priceTempoWhitePeak; break;
        case TariffType.TEMPO_WHITE_OFFPEAK: pricePerKwh = settings.priceTempoWhiteOffPeak; break;
        case TariffType.TEMPO_RED_PEAK: pricePerKwh = settings.priceTempoRedPeak; break;
        case TariffType.TEMPO_RED_OFFPEAK: pricePerKwh = settings.priceTempoRedOffPeak; break;
        case TariffType.QUICK_CHARGE: pricePerKwh = charge.customPrice || 0; break;
        case TariffType.FREE_CHARGE: pricePerKwh = 0; break;
        default: pricePerKwh = 0;
      }

      const cost = kwhDrawnFromGrid * pricePerKwh;

      let gasolineEquivalentKm: number | null = null;
      if (settings.gasolineCarConsumption > 0 && settings.gasolinePricePerLiter > 0 && cost > 0) {
          const equivalentLiters = cost / settings.gasolinePricePerLiter;
          const equivalentKm = (equivalentLiters / settings.gasolineCarConsumption) * 100;
          gasolineEquivalentKm = parseFloat(equivalentKm.toFixed(0));
      }

      // --- Trip-related calculations (depend on previous charge) ---
      let distanceDriven: number | null = null;
      let consumptionKwh100km: number | null = null;
      let costPer100km: number | null = null;

      if (index > 0) {
          const prevChargeRaw = sortedCharges[index - 1];
          const prevChargeProcessed = processedResult[index - 1];
          distanceDriven = charge.odometer - prevChargeRaw.odometer;

          if (distanceDriven > 0) {
              const prevKwhAddedToBattery = (prevChargeRaw.endPercentage - prevChargeRaw.startPercentage) / 100 * settings.batteryCapacity;
              consumptionKwh100km = (prevKwhAddedToBattery / distanceDriven) * 100;
              costPer100km = (prevChargeProcessed.cost / distanceDriven) * 100;
          }
      }

      processedResult.push({
          ...charge,
          kwhAdded: parseFloat(kwhDrawnFromGrid.toFixed(2)),
          cost: parseFloat(cost.toFixed(2)),
          pricePerKwh: parseFloat(pricePerKwh.toFixed(4)),
          distanceDriven,
          consumptionKwh100km: consumptionKwh100km ? parseFloat(consumptionKwh100km.toFixed(2)) : null,
          gasolineEquivalentKm,
          costPer100km: costPer100km ? parseFloat(costPer100km.toFixed(2)) : null,
      });
  }
  return processedResult;
};

const getWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const generateStats = (charges: ProcessedCharge[], period: 'weekly' | 'monthly' | 'yearly', settings: Settings, filterTariffs?: TariffType[]): StatsData[] => {
  const chargesToProcess = filterTariffs && filterTariffs.length > 0
    ? charges.filter(charge => filterTariffs.includes(charge.tariff))
    : charges;

  const groups: { [key: string]: { charges: ProcessedCharge[] } } = {};

  chargesToProcess.forEach(charge => {
    const date = new Date(charge.date);
    let key = '';
    if (period === 'monthly') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === 'yearly') {
      key = `${date.getFullYear()}`;
    } else if (period === 'weekly') {
      key = `${date.getFullYear()}-W${String(getWeek(date)).padStart(2, '0')}`;
    }

    if (!groups[key]) {
      groups[key] = { charges: [] };
    }
    groups[key].charges.push(charge);
  });
  
  const stats: StatsData[] = Object.keys(groups).map(key => {
    const groupCharges = groups[key].charges;
    const totalKwh = groupCharges.reduce((sum, c) => sum + c.kwhAdded, 0);
    const totalCost = groupCharges.reduce((sum, c) => sum + c.cost, 0);
    const totalDistance = groupCharges.reduce((sum, c) => sum + (c.distanceDriven || 0), 0);
    const totalTripCost = groupCharges.reduce((sum, c) => sum + ((c.costPer100km || 0) * (c.distanceDriven || 0) / 100), 0);
    
    const kwhPerTariff: { [key in TariffType]?: number } = {};
    const costPerTariff: { [key in TariffType]?: number } = {};
    for (const charge of groupCharges) {
        kwhPerTariff[charge.tariff] = (kwhPerTariff[charge.tariff] || 0) + charge.kwhAdded;
        costPerTariff[charge.tariff] = (costPerTariff[charge.tariff] || 0) + charge.cost;
    }
    // Round values
    for (const tariff of Object.keys(kwhPerTariff) as TariffType[]) {
        kwhPerTariff[tariff] = parseFloat(kwhPerTariff[tariff]!.toFixed(2));
    }
    for (const tariff of Object.keys(costPerTariff) as TariffType[]) {
        costPerTariff[tariff] = parseFloat(costPerTariff[tariff]!.toFixed(2));
    }

    const avgConsumption = totalDistance > 0 ? (totalKwh / totalDistance) * 100 : 0;
    const avgCostPer100km = totalDistance > 0 ? (totalTripCost / totalDistance) * 100 : 0;

    let totalGasolineCost = 0;
    if (totalDistance > 0 && settings.gasolineCarConsumption > 0 && settings.gasolinePricePerLiter > 0) {
        totalGasolineCost = (totalDistance / 100) * settings.gasolineCarConsumption * settings.gasolinePricePerLiter;
    }

    let slowChargeKwh = 0;
    let fastChargeKwh = 0;
    let slowChargeCost = 0;
    let fastChargeCost = 0;
    let slowChargeCount = 0;
    let fastChargeCount = 0;

    groupCharges.forEach(charge => {
        if (charge.tariff === TariffType.QUICK_CHARGE) {
            fastChargeKwh += charge.kwhAdded;
            fastChargeCost += charge.cost;
            fastChargeCount++;
        } else {
            slowChargeKwh += charge.kwhAdded;
            slowChargeCost += charge.cost;
            slowChargeCount++;
        }
    });

    return {
      name: key,
      totalKwh: parseFloat(totalKwh.toFixed(2)),
      kwhPerTariff,
      costPerTariff,
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalDistance: parseFloat(totalDistance.toFixed(0)),
      avgConsumption: parseFloat(avgConsumption.toFixed(2)),
      avgCostPer100km: parseFloat(avgCostPer100km.toFixed(2)),
      totalGasolineCost: parseFloat(totalGasolineCost.toFixed(2)),
      slowChargeKwh: parseFloat(slowChargeKwh.toFixed(2)),
      fastChargeKwh: parseFloat(fastChargeKwh.toFixed(2)),
      slowChargeCost: parseFloat(slowChargeCost.toFixed(2)),
      fastChargeCost: parseFloat(fastChargeCost.toFixed(2)),
      slowChargeCount,
      fastChargeCount,
    };
  });
  
  return stats.sort((a,b) => a.name.localeCompare(b.name));
};

export const generateTripStats = (trips: ProcessedTrip[], period: 'weekly' | 'monthly' | 'yearly'): TripStatsData[] => {
  const groups: { [key: string]: { trips: ProcessedTrip[] } } = {};

  trips.forEach(trip => {
    const date = new Date(trip.date);
    let key = '';
    if (period === 'monthly') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === 'yearly') {
      key = `${date.getFullYear()}`;
    } else if (period === 'weekly') {
      key = `${date.getFullYear()}-W${String(getWeek(date)).padStart(2, '0')}`;
    }

    if (!groups[key]) {
      groups[key] = { trips: [] };
    }
    groups[key].trips.push(trip);
  });

  const stats: TripStatsData[] = Object.keys(groups).map(key => {
    const groupTrips = groups[key].trips;
    const totalDistance = groupTrips.reduce((sum, t) => sum + t.distance, 0);
    const totalCost = groupTrips.reduce((sum, t) => sum + t.cost, 0);
    const totalSavings = groupTrips.reduce((sum, t) => sum + t.savings, 0);
    const totalBillingAmount = groupTrips.reduce((sum, t) => sum + (t.billingAmount || 0), 0);
    
    return {
      name: key,
      totalDistance: parseFloat(totalDistance.toFixed(0)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalSavings: parseFloat(totalSavings.toFixed(2)),
      totalBillingAmount: parseFloat(totalBillingAmount.toFixed(2)),
    };
  });

  return stats.sort((a, b) => a.name.localeCompare(b.name));
};


export const processTrips = (trips: Trip[], settings: Settings, charges: ProcessedCharge[]): ProcessedTrip[] => {
  const completedTrips = trips.filter(
    (t): t is Trip & { endOdometer: number; endPercentage: number } =>
      t.status === 'completed' && t.endOdometer != null && t.endPercentage != null
  );

  const sortedTrips = [...completedTrips].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.endOdometer - a.endOdometer);
  const sortedChargesByOdo = [...charges].sort((a, b) => a.odometer - b.odometer);

  return sortedTrips.map(trip => {
    const relevantCharge = sortedChargesByOdo.filter(c => c.odometer <= trip.startOdometer).pop();
    const pricePerKwh = relevantCharge?.pricePerKwh || 0;

    const distance = trip.endOdometer - trip.startOdometer;
    if (distance <= 0) {
      return {
        ...trip,
        distance: 0,
        kwhConsumed: 0,
        cost: 0,
        consumptionKwh100km: 0,
        pricePerKwh: pricePerKwh,
        gasolineEquivalentCost: 0,
        savings: 0,
        billingAmount: undefined,
      };
    }

    const percentConsumed = trip.startPercentage - trip.endPercentage;
    const kwhConsumed = (percentConsumed / 100) * settings.batteryCapacity;
    const cost = kwhConsumed * pricePerKwh;
    const consumptionKwh100km = (kwhConsumed / distance) * 100;

    let gasolineEquivalentCost = 0;
    let savings = 0;
    if (settings.gasolineCarConsumption > 0 && settings.gasolinePricePerLiter > 0) {
      gasolineEquivalentCost = (distance / 100) * settings.gasolineCarConsumption * settings.gasolinePricePerLiter;
      savings = gasolineEquivalentCost - cost;
    }

    let billingAmount: number | undefined = undefined;
    if (trip.isBilled) {
        if (distance < 11) {
            billingAmount = settings.billingRateLocal;
        } else if (distance >= 11 && distance <= 30) {
            billingAmount = settings.billingRateMedium;
        } else { // distance > 30
            const fiscalPower = settings.fiscalPower || 4;
            let rate = 0;
            if (fiscalPower <= 3) {
                rate = 0.529;
            } else if (fiscalPower === 4) {
                rate = 0.606;
            } else { // 5 CV and more
                rate = 0.636;
            }
            billingAmount = distance * rate;
        }
    }

    return {
      ...trip,
      distance: parseFloat(distance.toFixed(0)),
      kwhConsumed: parseFloat(kwhConsumed.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      consumptionKwh100km: parseFloat(consumptionKwh100km.toFixed(2)),
      pricePerKwh: pricePerKwh,
      gasolineEquivalentCost: parseFloat(gasolineEquivalentCost.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      billingAmount: billingAmount ? parseFloat(billingAmount.toFixed(2)) : undefined,
    };
  });
};

export const generateClientStats = (trips: ProcessedTrip[]): ClientStats[] => {
  const clientMap: { [key: string]: { tripCount: number; totalDistance: number; totalBillingAmount: number } } = {};

  trips.forEach(trip => {
    const clientName = trip.client || 'Non spécifié';
    if (!clientMap[clientName]) {
      clientMap[clientName] = { tripCount: 0, totalDistance: 0, totalBillingAmount: 0 };
    }
    clientMap[clientName].tripCount++;
    clientMap[clientName].totalDistance += trip.distance;
    clientMap[clientName].totalBillingAmount += trip.billingAmount || 0;
  });

  const stats: ClientStats[] = Object.keys(clientMap).map(name => ({
    name,
    tripCount: clientMap[name].tripCount,
    totalDistance: parseFloat(clientMap[name].totalDistance.toFixed(0)),
    totalBillingAmount: parseFloat(clientMap[name].totalBillingAmount.toFixed(2)),
  }));

  return stats.sort((a, b) => b.totalBillingAmount - a.totalBillingAmount);
};

export const generateDestinationStats = (trips: ProcessedTrip[]): DestinationStats[] => {
  const destinationMap: { [key: string]: { tripCount: number; totalDistance: number } } = {};

  trips.forEach(trip => {
    const destinationName = trip.destination;
    if (!destinationMap[destinationName]) {
      destinationMap[destinationName] = { tripCount: 0, totalDistance: 0 };
    }
    destinationMap[destinationName].tripCount++;
    destinationMap[destinationName].totalDistance += trip.distance;
  });

  const stats: DestinationStats[] = Object.keys(destinationMap).map(name => {
    const data = destinationMap[name];
    return {
      name,
      tripCount: data.tripCount,
      totalDistance: parseFloat(data.totalDistance.toFixed(0)),
      avgDistance: parseFloat((data.totalDistance / data.tripCount).toFixed(0)),
    };
  });

  return stats.sort((a, b) => b.tripCount - a.tripCount);
};

export const processMaintenanceEntries = (entries: MaintenanceEntry[]): ProcessedMaintenanceEntry[] => {
  const sortedEntries = [...entries].sort((a, b) => b.odometer - a.odometer);
  return sortedEntries;
};