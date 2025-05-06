// C:\Users\Gebruiker\Desktop\api_bib\Attendify_CRM\test-dotenv.js
console.log("Huidige werkdirectory (vanuit test-dotenv.js):", process.cwd());
console.log("Test: poging om .env te laden uit dezelfde map...");

const dotenvResult = require('dotenv').config(); // Geen path, zoekt in huidige map

if (dotenvResult.error) {
  console.error("FOUT bij het laden van .env in test-dotenv.js:", dotenvResult.error);
} else {
  console.log(".env succesvol geladen en geparsed in test-dotenv.js!");
  console.log("Geparsede variabelen (test-dotenv.js):", dotenvResult.parsed);
}

console.log("--- Waarden uit process.env na dotenv (test-dotenv.js) ---");
console.log("SF_USERNAME (test-dotenv.js):", process.env.SF_USERNAME);
console.log("SF_PASSWORD is ingesteld (test-dotenv.js):", !!process.env.SF_PASSWORD);

if (!process.env.SF_USERNAME) {
    console.log("CONCLUSIE (test-dotenv.js): SF_USERNAME is nog steeds undefined. Probleem met .env bestand of dotenv installatie.");
} else {
    console.log("CONCLUSIE (test-dotenv.js): SF_USERNAME is GEVONDEN. Dotenv en .env bestand werken hier correct.");
}