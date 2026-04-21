import { bootstrapDatabase } from "./bootstrap.mjs";
import { env } from "./config/env.mjs";
import { createApp } from "./app.mjs";

await bootstrapDatabase();

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`[parcial] API/UI lista en http://localhost:${env.PORT}`);
});

