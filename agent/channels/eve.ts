import { eveChannel } from "eve/channels/eve";
import { localDev, UnauthenticatedError, vercelOidc } from "eve/channels/auth";

/**
 * En producción, las peticiones sin credencial OIDC válida reciben un 401
 * con el mismo formato que el muro de Vercel ("Authorization is required
 * for this route.").
 *
 * Por qué: `eve remote connect` solo inicia su login OIDC cuando detecta
 * ese desafío. Sin él (por ejemplo, con la Deployment Protection
 * desactivada en el dashboard), el TUI nunca se autentica y toda petición
 * muere con "Production auth is not configured". Emitir el desafío desde
 * el propio agente hace que el remoto funcione sin depender del estado
 * del dashboard de Vercel.
 *
 * La seguridad no cambia: vercelOidc() sigue siendo la única vía de acceso
 * en producción; esto solo cambia la forma del 401 para anónimos.
 */
function productionAuthChallenge() {
  return () => {
    if (process.env.VERCEL_ENV !== "production") return null;
    throw new UnauthenticatedError({ code: "unauthorized" });
  };
}

export default eveChannel({
  auth: [
    // El TUI de eve y tus despliegues de Vercel llegan con OIDC.
    vercelOidc(),
    // Abierto en localhost para `eve dev`; ignorado en producción.
    localDev(),
    // Desafío de auth para el TUI en producción (ver comentario arriba).
    productionAuthChallenge(),
  ],
});
