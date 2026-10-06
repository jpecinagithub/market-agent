import { defineTool} from "eve/tools";
import { z } from "zod";
import { fetchCompanyValue } from "../lib/twelveData";

export default defineTool({ 
    description: "Get the company value",

    inputSchema: z.object({
        empresa: z.string().min(2).describe("Simbolo de la empresa, por ejemplo: AAPL, MSFT, GOOGL"),  
    }),

    execute: async ( {empresa} ) => {
          
        //return `El valor de la ${empresa} es $100`;
        return fetchCompanyValue(empresa);
    },
});