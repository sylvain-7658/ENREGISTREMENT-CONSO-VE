
import { Charge, ProcessedCharge, Settings, StatsData, TariffType } from '../types';

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
];
// Nous appliquons une perte d'énergie de 12% pour la recharge en AC.
const CHARGING_LOSS_FACTOR = 1.12;


export const processCharges = (charges: Charge[], settings: Settings): ProcessedCharge[] => {
  const sortedCharges = [...charges].sort((a, b) => a.odometer - b.odometer);
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
    
    const avgConsumption = totalDistance > 0 ? (totalKwh / totalDistance) * 100 : 0;
    const avgCostPer100km = totalDistance > 0 ? (totalTripCost / totalDistance) * 100 : 0;

    let totalGasolineCost = 0;
    if (totalDistance > 0 && settings.gasolineCarConsumption > 0 && settings.gasolinePricePerLiter > 0) {
        totalGasolineCost = (totalDistance / 100) * settings.gasolineCarConsumption * settings.gasolinePricePerLiter;
    }

    return {
      name: key,
      totalKwh: parseFloat(totalKwh.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalDistance: parseFloat(totalDistance.toFixed(0)),
      avgConsumption: parseFloat(avgConsumption.toFixed(2)),
      avgCostPer100km: parseFloat(avgCostPer100km.toFixed(2)),
      totalGasolineCost: parseFloat(totalGasolineCost.toFixed(2)),
    };
  });
  
  return stats.sort((a,b) => a.name.localeCompare(b.name));
};