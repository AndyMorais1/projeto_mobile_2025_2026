// main router para Supabase Edge Functions (compatível com HA)
// NÃO valida JWT — cada function valida por conta própria.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

console.log("main function started");

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const [, fn, ...rest] = url.pathname.split("/");

    if (!fn) {
      return new Response(
          JSON.stringify({ msg: "missing function name in request" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
      );
    }

    const servicePath = `/home/deno/functions/${fn}`;

    console.log(`serving the request with ${servicePath}`);

    const worker = await EdgeRuntime.userWorkers.create({
      servicePath,
      memoryLimitMb: 150,
      workerTimeoutMs: 60_000,
      noModuleCache: false,
      importMapPath: null,
      envVars: Object.entries(Deno.env.toObject()),
    });

    return await worker.fetch(req);
  } catch (e) {
    console.error("MAIN ERROR:", e);

    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
