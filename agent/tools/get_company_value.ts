import { defineTool } from "eve/tools";
import { z } from "zod";
import { fetchCompanyValue } from "../lib/twelveData";

export default defineTool({
  description:
    "Obtiene la última cotización intradía de una empresa por su símbolo " +
    "bursátil (por ejemplo AAPL, MSFT, SAN.MC). Devuelve último precio, " +
    "apertura, máximo, mínimo y variación respecto a la vela anterior.",

  inputSchema: z.object({
    empresa: z
      .string()
      .min(1)
      .describe(
        "Símbolo bursátil de la empresa, por ejemplo: AAPL, MSFT, SAN.MC",
      ),
  }),

  label: {
    start: ({ empresa }) => `Consultando cotización de ${empresa}`,
  },

  execute: async ({ empresa }) => fetchCompanyValue(empresa),
});
