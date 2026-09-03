import { execSync } from "child_process";

try {
  const out = execSync("npx oxlint --format=json", { encoding: "utf8" });
  const data = JSON.parse(out);
  const items = Array.isArray(data) ? data : (data.diagnostics || data.warnings || []);
  console.log("Total warnings count:", items.length);
  items.forEach((w, idx) => {
    const line = w.labels?.[0]?.span?.line ?? "N/A";
    const col = w.labels?.[0]?.span?.column ?? "N/A";
    console.log(`[${idx + 1}] ${w.filename}:${line}:${col} | ${w.code} | ${w.message}`);
  });
} catch (e) {
  if (e.stdout) {
    const data = JSON.parse(e.stdout);
    console.log("Total warnings count:", data.length);
    data.forEach((w, idx) => {
      const line = w.labels?.[0]?.span?.line ?? "N/A";
      const col = w.labels?.[0]?.span?.column ?? "N/A";
      console.log(`[${idx + 1}] ${w.filename}:${line}:${col} | ${w.code} | ${w.message}`);
    });
  } else {
    console.error(e);
  }
}
