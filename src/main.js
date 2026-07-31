import { createApp } from "./app/create-app.js";

const root = document.querySelector("#app");

if (!root) {
  throw new Error("Missing #app mount node");
}

const app = createApp(root);
app.start();
