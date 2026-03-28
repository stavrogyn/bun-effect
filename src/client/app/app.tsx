import { Effect } from "effect";
import { type ReactNode } from "react";
import { HttpError, JSONParseError } from "@shared/errors/errors";
import { AuthProvider } from "@client/entities/auth";
import { AuthComposer } from "@client/widgets/auth";
import { NotificationProvider } from "@client/entities/notification";

export type FetchDataResponse = {
  data: string;
  status: "success" | "error";
};

export type AppInitialState = {
  initialAuthUuid: string;
  initialFetchData: FetchDataResponse;
};

export function App(props: AppInitialState): ReactNode {
  return (
    <AuthProvider initialAuthUuid={props.initialAuthUuid}>
      <NotificationProvider>
      <div>
        <h1>Hello World</h1>
        <SuspensedSection initialFetchData={props.initialFetchData} />
        <AuthComposer />
      </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

const SuspensedSection = ({ initialFetchData }: { initialFetchData: FetchDataResponse }) => {
  return (
    <div>
      Loaded data: {initialFetchData.data}, status: {initialFetchData.status}
    </div>
  );
};

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

export async function loadServerAppState(): Promise<AppInitialState> {
  const [initialAuthUuid, initialFetchData] = await Promise.all([
    Promise.resolve(crypto.randomUUID()),
    Effect.runPromise(fetchDataEffect),
  ]);
  return { initialAuthUuid, initialFetchData };
}
