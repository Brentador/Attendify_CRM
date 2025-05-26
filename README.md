#Attendify CRM Integration (EhB Project)
Dit project is onderdeel van een groter integratieproject voor de Erasmushogeschool Brussel (EhB). De focus van deze repository ligt op het ontvangen en verwerken van berichten via RabbitMQ, met integratie richting Salesforce.

Overzicht
Integreert met Salesforce voor het beheren van CRM-data.
Gebruikt RabbitMQ als message broker om berichten asynchroon te ontvangen en te verwerken.
Onderdeel van een breder project waarin verschillende systemen gekoppeld worden.

Gebruikte technologieën
JavaScript – Hoofdprogrammeertaal van het project.
RabbitMQ – Message broker voor het ontvangen van berichten.
Salesforce – CRM-systeem waarmee data wordt gesynchroniseerd.
Node.js, Express, jsforce, amqplib, dotenv, faye, xml2js, bcryptjs

Functionaliteit
Luistert naar een RabbitMQ-queue voor binnenkomende berichten.
Verwerkt ontvangen berichten en synchroniseert relevante data met Salesforce.
Logging van ontvangen en verwerkte berichten.
(Optioneel) Foutafhandeling en retries bij mislukte berichten.

Installatie
Clone deze repository:


git clone https://github.com/Brentador/Attendify_CRM.git
Ga naar de projectmap:

bash
cd Attendify_CRM
Installeer de benodigde packages:

bash
npm install
Stel je omgevingsvariabelen in (bijvoorbeeld voor RabbitMQ- en Salesforce-credentials):

Maak een .env bestand aan op basis van .env.example.
Voeg RabbitMQ URL, queue-naam, en Salesforce-config toe.
Start de applicatie:

bash
npm start
Gebruik
Zorg dat RabbitMQ draait en de juiste queue beschikbaar is.
Start de applicatie. Deze zal automatisch verbinding maken met RabbitMQ, berichten ophalen en doorzetten naar Salesforce.
Controleer de logs voor verwerking en eventuele foutmeldingen.