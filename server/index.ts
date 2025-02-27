import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import microsoft from "./api/scraping/microsoft";
import google from "./api/scraping/google";
import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import { forms } from "./db/schema";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// カスタムロガーの定義
export const customLogger = (message: string, ...rest: string[]) => {
  console.log(message, ...rest);
};

// ログの設定
app.use("*", logger(customLogger));

// すべてのルートにCORS設定を適用
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

app.get("/api/hello", (c) => c.text("Hello, World!"));

// prettier-ignore
const router = app.basePath("/api")
  .route("/microsoft", microsoft)
  .route("/google", google)

export default app;

// クライアント側で利用する型定義
export type ApiRoutes = typeof router;
