import { defineTool } from "eve/tools";
import { z } from "zod";

interface GeocodingResponse {
  results?: Array<{
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }>;
}

interface ForecastResponse {
  timezone?: string;
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
}

const weatherDescriptions: Record<number, string> = {
  0: "Despejado",
  1: "Principalmente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  71: "Nieve ligera",
  73: "Nieve moderada",
  75: "Nieve intensa",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos intensos",
  95: "Tormenta",
  96: "Tormenta con granizo",
  99: "Tormenta fuerte con granizo",
};

export default defineTool({
  description:
    "Obtiene el tiempo actual o el pronóstico meteorológico para una ubicación. Usa esta herramienta cuando el usuario pregunte por el tiempo, temperatura, lluvia o viento.",

  inputSchema: z.object({
    location: z
      .string()
      .min(2)
      .describe("Ciudad o ubicación, por ejemplo: Logroño, Madrid o París"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Fecha opcional en formato YYYY-MM-DD"),
  }),

  label: {
    start: ({ location }) => `Consultando el tiempo en ${location}`,
  },

  async execute({ location, date }, ctx) {
    const geocodingUrl = new URL(
      "https://geocoding-api.open-meteo.com/v1/search",
    );

    geocodingUrl.searchParams.set("name", location);
    geocodingUrl.searchParams.set("count", "1");
    geocodingUrl.searchParams.set("language", "es");
    geocodingUrl.searchParams.set("format", "json");

    const geocodingResponse = await fetch(geocodingUrl, {
      signal: ctx.abortSignal,
    });

    if (!geocodingResponse.ok) {
      throw new Error(
        `El servicio de ubicaciones respondió con HTTP ${geocodingResponse.status}.`,
      );
    }

    const geocoding =
      (await geocodingResponse.json()) as GeocodingResponse;

    const place = geocoding.results?.[0];

    if (!place) {
      throw new Error(`No se encontró la ubicación "${location}".`);
    }

    const forecastUrl = new URL(
      "https://api.open-meteo.com/v1/forecast",
    );

    forecastUrl.searchParams.set("latitude", String(place.latitude));
    forecastUrl.searchParams.set("longitude", String(place.longitude));
    forecastUrl.searchParams.set("timezone", "auto");

    forecastUrl.searchParams.set(
      "daily",
      [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "precipitation_sum",
        "wind_speed_10m_max",
      ].join(","),
    );

    if (date) {
      forecastUrl.searchParams.set("start_date", date);
      forecastUrl.searchParams.set("end_date", date);
    } else {
      forecastUrl.searchParams.set("forecast_days", "1");
      forecastUrl.searchParams.set(
        "current",
        [
          "temperature_2m",
          "apparent_temperature",
          "relative_humidity_2m",
          "precipitation",
          "weather_code",
          "wind_speed_10m",
        ].join(","),
      );
    }

    const forecastResponse = await fetch(forecastUrl, {
      signal: ctx.abortSignal,
    });

    if (!forecastResponse.ok) {
      const detail = await forecastResponse.text();

      throw new Error(
        `No se pudo obtener el pronóstico: HTTP ${forecastResponse.status}. ${detail}`,
      );
    }

    const forecast =
      (await forecastResponse.json()) as ForecastResponse;

    const daily = forecast.daily;
    const weatherCode =
      date ? daily?.weather_code[0] : forecast.current?.weather_code;

    return {
      location: {
        name: place.name,
        region: place.admin1 ?? null,
        country: place.country ?? null,
        latitude: place.latitude,
        longitude: place.longitude,
      },
      requestedDate: date ?? null,
      timezone: forecast.timezone ?? place.timezone ?? null,
      condition:
        weatherCode === undefined
          ? "Desconocida"
          : weatherDescriptions[weatherCode] ??
            `Código meteorológico ${weatherCode}`,
      current: forecast.current
        ? {
            time: forecast.current.time,
            temperatureC: forecast.current.temperature_2m,
            apparentTemperatureC:
              forecast.current.apparent_temperature,
            relativeHumidityPercent:
              forecast.current.relative_humidity_2m,
            precipitationMm: forecast.current.precipitation,
            windSpeedKmh: forecast.current.wind_speed_10m,
          }
        : null,
      forecast: daily
        ? {
            date: daily.time[0],
            minimumTemperatureC: daily.temperature_2m_min[0],
            maximumTemperatureC: daily.temperature_2m_max[0],
            precipitationProbabilityPercent:
              daily.precipitation_probability_max[0],
            precipitationMm: daily.precipitation_sum[0],
            maximumWindSpeedKmh: daily.wind_speed_10m_max[0],
          }
        : null,
      source: "Open-Meteo",
    };
  },
});

// Aupa el Athletic