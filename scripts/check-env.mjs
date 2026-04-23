const requiredForGiscus = [
  "NEXT_PUBLIC_GISCUS_REPO",
  "NEXT_PUBLIC_GISCUS_REPO_ID",
  "NEXT_PUBLIC_GISCUS_CATEGORY",
  "NEXT_PUBLIC_GISCUS_CATEGORY_ID",
];

const requiredForImage = [
  "NEXT_PUBLIC_IMAGE_PROVIDER",
  "NEXT_PUBLIC_IMAGE_BASE_URL",
];

function collectMissing(keys) {
  return keys.filter((key) => !process.env[key] || process.env[key].trim() === "");
}

const missingGiscus = collectMissing(requiredForGiscus);
const missingImage = collectMissing(requiredForImage);

if (missingGiscus.length === 0 && missingImage.length === 0) {
  console.log("Environment check passed. All integration variables are configured.");
  process.exit(0);
}

console.log("Environment check report:");
if (missingGiscus.length > 0) {
  console.log(`- giscus missing: ${missingGiscus.join(", ")}`);
}
if (missingImage.length > 0) {
  console.log(`- object storage missing: ${missingImage.join(", ")}`);
}

console.log(
  "Tip: copy .env.example to .env.local, fill values, then rerun `npm run env:check`."
);
