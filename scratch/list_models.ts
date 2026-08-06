import "dotenv/config";
async function listModels() {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await res.json();
  const names = data.models.map((m: any) => m.name);
  console.log(names.filter((n: string) => n.includes("flash")));
}
listModels().catch(console.error);
