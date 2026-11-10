import { createApp } from "./app";
import { createContainer } from "./container";
import { env } from "./infrastructure/config/env";

createApp(createContainer(), env.corsOrigins).listen(env.port, () => {
  console.info(`Respawn API escuchando en el puerto ${env.port}`);
});
