import { Effect } from "effect";
import { Suspense, use, type ReactNode } from "react";
import { HttpError, JSONParseError } from "../../shared";

export function App (): ReactNode {
  return (
    <div>
      <h1>Hello World</h1>
      <Suspense fallback={<div>Loading...</div>}><SuspensedComponent /></Suspense>
    </div>
  );
};

const SuspensedComponent = () => {
  const data = use(Effect.runPromise(fetchDataEffect));

  return <div>Loaded data: {data.data}, status: {data.status}</div>;
}

const fetchDataEffect = Effect.gen(function* () {
  const response = yield* Effect.tryPromise({
    try: () => fetchData(),
    catch: (error) => Effect.die(new HttpError()),
  });
  const data = yield* Effect.tryPromise({
    try: () => response.json() as Promise<FetchDataResponse>,
    catch: (error) => Effect.die(new JSONParseError()),
  });

  return data;
});

function fetchData(): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Response(JSON.stringify({
        data: "Data",
        status: "success",
      })));
    }, 2000);
  });
}

type FetchDataResponse = {
  data: string;
  status: "success" | "error";
};
