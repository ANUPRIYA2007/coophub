// ==============================================================================
// COOP HUB — AI Demand Forecasting Service
// ==============================================================================
// Powered by: Amazon Chronos-2 (Time-Series) + NVIDIA NIM / Gemini (AI Insights)
// ==============================================================================

import { chronosForecastService, CHENNAI_LOCALITIES, SERVICE_CATEGORIES } from './chronosForecastService.js';

export const CHENNAI_AREAS = CHENNAI_LOCALITIES;
export const STANDARD_SERVICES = SERVICE_CATEGORIES;

export async function getHistoricalData() {
  const records = await chronosForecastService.getHistoricalBookings({});
  return { bookings: records, pillars: [] };
}

export const demandForecastService = {
  CHENNAI_AREAS,
  STANDARD_SERVICES,

  async getHistoricalData() {
    return getHistoricalData();
  },

  async getDemandForecast({ area = "Guindy", service = "Electrician", timeRange = "7d", pincode = "600032" }) {
    return await chronosForecastService.getDemandForecast({ area, service, timeRange });
  },

  async getAllAreasDemandMatrix() {
    return await chronosForecastService.getAllAreasDemandMatrix();
  }
};

export default demandForecastService;
