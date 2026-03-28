import { renderToReadableStream } from "react-dom/server";
import {
  App,
  loadServerAppState,
  type AppInitialState,
} from "@client/app/app";
import { createElement } from "react";

const hydrateEntryPath = `${import.meta.dir}/public/hydrate.ts`;

let hydrateBundleCache: { mtimeMs: number; js: string } | null = null;

async function getHydrateBundleJs(): Promise<string> {
  const file = Bun.file(hydrateEntryPath);
  const mtimeMs = file.lastModified;
  if (hydrateBundleCache?.mtimeMs === mtimeMs) {
    return hydrateBundleCache.js;
  }
  const result = await Bun.build({
    entrypoints: [hydrateEntryPath],
    target: "browser",
    format: "esm",
    minify: false,
  });
  if (!result.success) {
    console.error(result.logs);
    throw new Error("hydrate bundle failed");
  }
  const output = result.outputs[0];
  if (!output) {
    throw new Error("hydrate bundle produced no output");
  }
  const js = await output.text();
  hydrateBundleCache = { mtimeMs, js };
  return js;
}

function escapeJsonForInlineScript(json: string): string {
  return json.replace(/</g, "\\u003c");
}

function htmlSuffix(state: AppInitialState): string {
  const payload = escapeJsonForInlineScript(JSON.stringify(state));
  return `
    </div>
    <div style="color: red; font-size: 20px; font-weight: bold;">This is the end of the HTML</div>
    <script type="application/json" id="__INITIAL_STATE__">${payload}</script>
    <script type="module" src="/assets/hydrate.js"></script>
    </body>
  </html>
`;
}

function htmlPrefix(): string {
  return `
  <html>
    <head>
      <title>Effect</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="Effect is a fast and simple web framework for Bun">
      <meta name="keywords" content="Effect, Bun, Web Framework, Fast, Simple">
      <meta name="author" content="Effect">
      <meta name="robots" content="index, follow">
      <meta name="googlebot" content="index, follow">
      <meta name="bingbot" content="index, follow">
      <meta name="yandexbot" content="index, follow">
    </head>
    <body>
    <div style="color: blue; font-size: 20px; font-weight: bold;">This is the beginning of the HTML</div>
    <div id="root">
  `;
}


function wrapReactStream(
  prefix: string,
  reactBody: ReadableStream<Uint8Array>,
  suffix: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const head = encoder.encode(prefix);
  const tail = encoder.encode(suffix);

  return new ReadableStream({
    async start(controller) {
      controller.enqueue(head);
      const reader = reactBody.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) controller.enqueue(value);
        }
      } finally {
        reader.releaseLock();
      }
      controller.enqueue(tail);
      controller.close();
    },
  });
}

const server = Bun.serve({
  routes: {
    "/": {
      GET: async () => {
        const initialState = await loadServerAppState();
        const reactStream = await renderToReadableStream(
          createElement(App, initialState),
        );
        const body = wrapReactStream(
          htmlPrefix(),
          reactStream,
          htmlSuffix(initialState),
        );
        return new Response(body, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' wss:; frame-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; block-all-mixed-content;",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            "X-Download-Options": "noopen",
          },
        });
      },
    },
    "/assets/hydrate.js": {
      GET: async () => {
        try {
          const js = await getHydrateBundleJs();
          return new Response(js, {
            headers: {
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "no-cache",
            },
          });
        } catch (e) {
          console.error(e);
          return new Response("Hydrate bundle error", { status: 500 });
        }
      },
    },
    "/assets/:path": {
      GET: async (req) => {
        const path = req.params.path;
        const file = Bun.file(`./public/${path}`);
        return new Response(file.stream(), {
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });
      },
    },
    "/api/status": new Response("OK"),
  },
});

console.log(`Server running at ${server.url}`);
