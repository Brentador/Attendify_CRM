const SessionService = require('../SessionCRUD');
const { getSpeakerId, getSessionId } = require('../salesforce');

(async () => {
  try {
    const speakerId = await getSpeakerId('36');
    const sessionId = await getSessionId('4');

    if (!speakerId) {
      console.error('No valid speaker found');
      return;
    }

    if (!sessionId) {
      console.error('No valid session found');
      return;
    }

    const sessionData = {
      Id: sessionId, // Salesforce record ID
      speaker__c: speakerId,
      description__c: 'Bijgewerkte beschrijving van de sessie',
      location__c: 'Nieuwe locatie',
      start_date__c: '2025-05-10T13:00:00Z', // nieuwe starttijd
      end_date__c: '2025-05-10T15:00:00Z'    // nieuwe eindtijd
    };

    const result = await SessionService.updateSession(sessionData);
    console.log('Sessie update resultaat:', result);
  } catch (error) {
    console.error('Fout bij het bijwerken van de sessie:', error);
  }
})();
