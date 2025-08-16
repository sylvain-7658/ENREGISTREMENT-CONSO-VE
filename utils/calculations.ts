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

  return sortedCharges.map((charge, index) => {
    const percentAdded = charge.endPercentage - charge.startPercentage;
    // Ceci est l'énergie qui est réellement stockée dans la batterie.
    const kwhAddedToBattery = (percentAdded / 100) * settings.batteryCapacity;

    // Pour les tarifs AC, on prend en compte les pertes de charge. L'énergie tirée du réseau est plus élevée.
    // Pour les recharges rapides DC, les pertes sont minimes et généralement gérées par le fournisseur.
    const kwhDrawnFromGrid = AC_TARIFFS.includes(charge.tariff)
      ? kwhAddedToBattery * CHARGING_LOSS_FACTOR
      : kwhAddedToBattery;

    let pricePerKwh: number;
    switch (charge.tariff) {
      case TariffType.PEAK:
        pricePerKwh = settings.pricePeak;
        break;
      case TariffType.OFF_PEAK:
        pricePerKwh = settings.priceOffPeak;
        break;
      case TariffType.TEMPO_BLUE_PEAK:
        pricePerKwh = settings.priceTempoBluePeak;
        break;
      case TariffType.TEMPO_BLUE_OFFPEAK:
        pricePerKwh = settings.priceTempoBlueOffPeak;
        break;
      case TariffType.TEMPO_WHITE_PEAK:
        pricePerKwh = settings.priceTempoWhitePeak;
        break;
      case TariffType.TEMPO_WHITE_OFFPEAK:
        pricePerKwh = settings.priceTempoWhiteOffPeak;
        break;
      case TariffType.TEMPO_RED_PEAK:
        pricePerKwh = settings.priceTempoRedPeak;
        break;
      case TariffType.TEMPO_RED_OFFPEAK:
        pricePerKwh = settings.priceTempoRedOffPeak;
        break;
      case TariffType.QUICK_CHARGE:
        pricePerKwh = charge.customPrice || 0;
        break;
      default:
        pricePerKwh = 0;
    }
    // Le coût final est basé sur l'énergie tirée du réseau.
    const cost = kwhDrawnFromGrid * pricePerKwh;

    let distanceDriven: number | null = null;
    let consumptionKwh100km: number | null = null;

    if (index > 0) {
      const prevCharge = sortedCharges[index - 1];
      distanceDriven = charge.odometer - prevCharge.odometer;
      if (distanceDriven > 0) {
        // La consommation est basée sur l'énergie stockée dans la batterie lors de la recharge *précédente*,
        // car c'est cette énergie qui était disponible pour parcourir la distance.
        const prevKwhAddedToBattery = (prevCharge.endPercentage - prevCharge.startPercentage) / 100 * settings.batteryCapacity;
        consumptionKwh100km = (prevKwhAddedToBattery / distanceDriven) * 100;
      }
    }

    return {
      ...charge,
      // "kwhAdded" dans l'interface utilisateur reflète maintenant l'énergie tirée du réseau (ce qui est facturé).
      kwhAdded: parseFloat(kwhDrawnFromGrid.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      pricePerKwh: parseFloat(pricePerKwh.toFixed(4)),
      distanceDriven,
      consumptionKwh100km: consumptionKwh100km ? parseFloat(consumptionKwh100km.toFixed(2)) : null,
    };
  });
};

const getWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const generateStats = (charges: ProcessedCharge[], period: 'weekly' | 'monthly' | 'yearly', filterTariffs?: TariffType[]): StatsData[] => {
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
    const avgConsumption = totalDistance > 0 ? (totalKwh / totalDistance) * 100 : 0;

    return {
      name: key,
      totalKwh: parseFloat(totalKwh.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalDistance: parseFloat(totalDistance.toFixed(0)),
      avgConsumption: parseFloat(avgConsumption.toFixed(2)),
    };
  });
  
  return stats.sort((a,b) => a.name.localeCompare(b.name));
};