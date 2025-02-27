import type { Config } from "drizzle-kit";

export default {
  schema: "./schema.ts", // スキーマ適宜ファイル
  out: "./migration", // マイグレーションファイルの出力先
  dialect: "sqlite", // 使用するDBの種類
} satisfies Config;
