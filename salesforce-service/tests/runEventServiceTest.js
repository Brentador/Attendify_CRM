
const EventService = require('../EventCRUD');
const { getConnection } = require('../salesforce');



// --- Voorbeeld Data ---
const eventToCreate = {
    Address__c: 'Testlaan 123',
    description__c: 'Dit is een test event aangemaakt door een script.',
    End_date__c: '2024-10-27T17:00:00.000Z', // Gebruik ISO 8601 formaat (UTC)
    max_attendees__c: 25,
    name_event__c: 'Automatische Test Event',
    Start_date__c: '2024-10-27T14:00:00.000Z' // Gebruik ISO 8601 formaat (UTC)
};

const eventUpdates = {
    // Name wordt hieronder toegevoegd na creatie
    description__c: 'Dit is de BIJGEWERKTE beschrijving via het script.',
    max_attendees__c: 30
};

// --- Hoofdfunctie (Async IIFE) ---
(async () => {
    let createdEventName = null; // Om de Name (Auto Number) van het gemaakte event op te slaan

    try {
        // --- 1. Event Aanmaken ---
        console.log("1. Bezig met aanmaken van een nieuw event...");
        const createResult = await EventService.createEvent(eventToCreate);

        if (createResult && createResult.success) {
            console.log("   Event succesvol aangemaakt!");
            console.log("   Nieuwe Event ID:", createResult.id);

            // --- Haal de Auto-Number 'Name' op ---
            try {
                console.log("   Bezig met ophalen van de Event Name (Auto Number)...");
                // Haal hier de verbinding op (nu zou getConnection gedefinieerd moeten zijn)
                const conn = await getConnection();
                // Gebruik de CORRECTE objectnaam in de query
                const queryResult = await conn.query(`SELECT Name FROM Eventcrm__c WHERE Id = '${createResult.id}'`);
                if (queryResult.records && queryResult.records.length > 0) {
                    createdEventName = queryResult.records[0].Name;
                    // Deze log bestond al, maar laat zien dat de naam is gevonden in de try-block
                    console.log(`   Event Name gevonden IN try-block: ${createdEventName}`);
                } else {
                    // Gooi een error als de query geen resultaten geeft
                    throw new Error(`Kon de Name niet vinden voor het aangemaakte event met ID: ${createResult.id}`);
                }
            } catch(queryError){
                 console.error("   Fout bij het ophalen van de Event Name:", queryError.message || queryError);
                 console.log("   !!! Update en Delete stappen worden overgeslagen !!!");
                 // Stop hier als het ophalen van de naam mislukt
                 createdEventName = null; // Zorg dat de naam leeg is
            }

            // ----- Extra print om de opgehaalde naam te zien -----
            if (createdEventName !== null) {
                console.log(`*** DEBUG: Naam die gebruikt wordt voor update/delete: ${createdEventName} ***`);
            } else {
                 console.log("*** DEBUG: Kon Event Name niet ophalen, update/delete overgeslagen. ***")
                 return; // Stop het script als de naam niet kon worden opgehaald
            }
             // ------------------------------------------------------

        } else {
            console.error("   Fout bij het aanmaken van het event:", createResult ? createResult.errors : 'Onbekende fout');
            return; // Stop als aanmaken mislukt
        }

        // --- 2. Event Bijwerken ---
        // De 'if (createdEventName)' check is hierdoor een beetje dubbel, maar niet schadelijk
        if (createdEventName) {
            console.log(`\n2. Bezig met bijwerken van event met Name: ${createdEventName}...`);
            const dataForUpdate = {
                ...eventUpdates,
                Name: createdEventName // Voeg de Name toe voor identificatie
            };
            const updateResult = await EventService.updateEvent(dataForUpdate);

            if (updateResult && updateResult.success) {
                console.log("   Event succesvol bijgewerkt!");
                console.log("   Bijgewerkte Event ID:", updateResult.id); // updateResult bevat meestal ook id
            } else if (updateResult && updateResult.message === 'Event not found') {
                 console.warn(`   Event met Name ${createdEventName} niet gevonden voor update (mogelijk al verwijderd?).`);
            } else if (updateResult && updateResult.message === 'No fields to update provided'){
                 console.warn(`   Geen velden om bij te werken voor event met Name ${createdEventName}.`);
            } else {
                console.error("   Fout bij het bijwerken van het event:", updateResult ? updateResult.errors || updateResult.message : 'Onbekende fout');
            }
        }

        // --- 3. Event Verwijderen ---
        if (createdEventName) {
            console.log(`\n3. Bezig met verwijderen van event met Name: ${createdEventName}...`);
            const deleteResult = await EventService.deleteEvent(createdEventName);

            if (deleteResult && deleteResult.success) {
                console.log("   Event succesvol verwijderd!");
            } else {
                console.error("   Fout bij het verwijderen van het event:", deleteResult.message || 'Onbekende fout');
            }
        }

    } catch (error) {
        console.error("\n--- Er is een algemene fout opgetreden tijdens het script ---");
        console.error("Foutmelding:", error.message || error);
        if (error.stack) {
            // Beperk de stack trace lengte indien nodig
            console.error("Stack Trace:", error.stack.substring(0, 1000) + (error.stack.length > 1000 ? '...' : ''));
        }
         if (error.errorCode && error.fields) {
              console.error(`Salesforce Error Code: ${error.errorCode}, Fields: ${error.fields.join(', ')}`);
          }
    } finally {
        console.log("\n--- Script voltooid ---");
        // Geen automatische closeConnection nodig met jsforce tenzij je specifiek resources wilt vrijgeven
    }
})(); // Roep de async functie meteen aan