const SessionService = require('../SessionCRUD');
const { getSessionId } = require('../salesforce');

(async () => {
  try {
    const sessionId = await getSessionId('4'); // Zoek sessie op basis van Name of andere unieke waarde

    if (!sessionId) {
      console.error('No valid session found');
      return;
    }

    const result = await SessionService.deleteSessionById(sessionId);
    console.log('Verwijder resultaat:', result);
  } catch (error) {
    console.error('Fout bij verwijderen van de sessie:', error);
  }
})();
