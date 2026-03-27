import { renderToReadableStream } from "react-dom/server";
import { App } from "./src/client/app.tsx";
import { createElement } from "react";

const htmlBegin = `
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
`;

const htmlEnd = `
    <div style="color: red; font-size: 20px; font-weight: bold;">This is the end of the HTML</div>
    </body>
  </html>
`;

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
        const reactStream = await renderToReadableStream(createElement(App));
        const body = wrapReactStream(htmlBegin, reactStream, htmlEnd);
        return new Response(body, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
    "/api/status": new Response("OK"),
  },
});

console.log(`Server running at ${server.url}`);
