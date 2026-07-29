import { createApp } from "./app/create-app.js";

const root = document.querySelector("#app");

if (!root) {
  throw new Error("找不到 #app 掛載節點");
}

const app = createApp(root);
app.start();
