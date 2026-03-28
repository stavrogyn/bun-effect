import { hydrateRoot } from "react-dom/client";
import { App, type AppInitialState } from "@client/app/app";
import { createElement } from "react";

const domNode = document.getElementById("root");
const stateEl = document.getElementById("__INITIAL_STATE__");

if (domNode && stateEl?.textContent) {
  let initial: AppInitialState;
  try {
    initial = JSON.parse(stateEl.textContent) as AppInitialState;
  } catch (e) {
    throw new Error("Failed to parse initial state");
  }

  hydrateRoot(domNode, createElement(App, initial));
}
