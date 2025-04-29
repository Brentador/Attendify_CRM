const SessionService = require('../SessionCRUD');
const { getSpeakerId, getEventId } = require('../salesforce');

(async () => {
  try {
    // Haal het Salesforce ID op voor de speaker (naam = '34')
    const speakerId = await getSpeakerId('34');  // Vervang met de juiste naam
    const eventId = await getEventId('2');  // Vervang met de juiste naam

    if (!speakerId) {
      console.error('No valid speaker found');
      return;
    }

    if (!eventId) {
      console.error('No valid event found');
      return;
    }

    const sessionData = {
      uid_event__c: eventId, // Vervang met geldige waarde
      speaker__c: speakerId, // Gebruik het opgehaalde Salesforce ID
      description__c: 'Demo sessie aanmaak',
      location__c: 'Amsterdam',
      start_date__c: '2025-05-10T09:00:00Z',
      end_date__c: '2025-05-10T11:00:00Z',
    };
    
    // Maak de sessie aan
    const result = await SessionService.createSession(sessionData);
    console.log('Sessie succesvol aangemaakt:', result);
  } catch (error) {
    console.error('Fout bij aanmaken sessie:', error);
  }
})();
