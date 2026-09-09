import fs from 'fs';
import path from 'path';
import { Client } from "@notionhq/client";

// .env.local 파일 로드
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || '').trim();
      value = value.split('#')[0].trim();
      if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

const apiKey = process.env.NOTION_API_KEY;
const programsDbId = process.env.NOTION_RESERVATION_PROGRAMS_DATASOURCE_ID || process.env.NOTION_RESERVATION_PROJECTS_DATASOURCE_ID;
const timeslotsDbId = process.env.NOTION_RESERVATION_TIMESLOTS_DATASOURCE_ID;
const reservationsDbId = process.env.NOTION_RESERVATION_RESERVATIONS_DATASOURCE_ID;

console.log("API Key exists:", !!apiKey);
console.log("Programs DB ID:", programsDbId);
console.log("Timeslots DB ID:", timeslotsDbId);
console.log("Reservations DB ID:", reservationsDbId);

if (!apiKey) {
  console.error("No Notion API Key found.");
  process.exit(1);
}

const notion = new Client({ auth: apiKey });

async function checkDatabase(id, name) {
  if (!id) {
    console.log(`[${name}] No ID configured.`);
    return;
  }
  try {
    const dbInfo = await notion.dataSources.query({ data_source_id: id, page_size: 5 });
    console.log(`\n=================== ${name} (${id}) ===================`);
    console.log(`Total results: ${dbInfo.results.length}`);
    dbInfo.results.forEach((item, index) => {
      console.log(`\n--- Item ${index + 1} (Page ID: ${item.id}) ---`);
      Object.keys(item.properties).forEach(propName => {
        const prop = item.properties[propName];
        console.log(` - "${propName}": [Type: ${prop.type}]`, JSON.stringify(prop));
      });
    });
  } catch (err) {
    console.error(`Error querying ${name}:`, err.message);
  }
}

async function run() {
  await checkDatabase(programsDbId, "Programs DB");
  await checkDatabase(timeslotsDbId, "Timeslots DB");
  await checkDatabase(reservationsDbId, "Reservations DB");
}

run();
