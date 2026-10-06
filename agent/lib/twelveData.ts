const BASE_URL = "https://api.twelvedata.com/time_series";

interface TwelveDataError {
  status: "error";
  message: string;
  code?: number;
}

interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

interface TwelveDataSuccess {
  status: "ok";
  meta: {
    symbol: string;
    interval: string;
    currency?: string;
    exchange?: string;
  };
  values: TwelveDataCandle[];
}

export interface CompanyQuote {
  symbol: string;
  currency: string | null;
  exchange: string | null;
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
}

/**
 * Obtiene la última cotización intradía de un símbolo bursátil.
 * TwelveData devuelve las velas ordenadas de más reciente a más antigua.
 */
export async function fetchCompanyValue(
  empresa: string,
): Promise<CompanyQuote> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Falta la variable de entorno TWELVE_DATA_API_KEY. " +
        "Consulta .env.example para configurarla.",
    );
  }

  const symbol = empresa.trim().toUpperCase();

  if (!symbol) {
    throw new Error(
      "Indica un símbolo bursátil válido, por ejemplo AAPL o SAN.MC.",
    );
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", "1min");
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `TwelveData respondió con HTTP ${response.status}.`,
    );
  }

  const data = (await response.json()) as
    | TwelveDataSuccess
    | TwelveDataError;

  // TwelveData devuelve HTTP 200 con {"status":"error"} ante símbolos
  // inválidos o límites de la API: hay que validar el payload.
  if (
    data.status === "error" ||
    !("values" in data) ||
    !Array.isArray(data.values) ||
    data.values.length === 0
  ) {
    const message =
      data.status === "error" ? data.message : "respuesta inesperada";
    throw new Error(
      `No se pudo obtener la cotización de ${symbol}: ${message}.`,
    );
  }

  const [latest, previous] = data.values;
  const close = Number(latest.close);
  const previousClose = previous ? Number(previous.close) : null;
  const change =
    previousClose !== null && !Number.isNaN(previousClose)
      ? close - previousClose
      : null;

  return {
    symbol: data.meta?.symbol ?? symbol,
    currency: data.meta?.currency ?? null,
    exchange: data.meta?.exchange ?? null,
    datetime: latest.datetime,
    open: Number(latest.open),
    high: Number(latest.high),
    low: Number(latest.low),
    close,
    volume:
      latest.volume !== undefined ? Number(latest.volume) : null,
    previousClose,
    change,
    changePercent:
      change !== null && previousClose ? (change / previousClose) * 100 : null,
  };
}
