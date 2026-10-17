const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "public")));
app.get("/config", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ""
  });
});
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`Family Expense Tracker running on port ${PORT}`));
