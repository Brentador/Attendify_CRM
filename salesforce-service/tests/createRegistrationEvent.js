const EventRegistrationService = require('../EventRegisterCRUD');
const { getUserId, getEventId } = require('../salesforce'); // Zorg dat deze helpers correct werken

(async () => {
  try {
    // Vervang deze waarden met bestaande "Name" velden in je Salesforce data
    const userUid = '26';    // de 'Name' van de user in Users_CRM__c
    const eventUid = '9';     // de 'Name' van het event in Eventcrm__c

    const userId = await getUserId(userUid);
    const eventId = await getEventId(eventUid);

    if (!userId || !eventId) {
      console.error('❌ Geen geldige user of event gevonden');
      return;
    }

    const registrationData = {
      user_id: userId,
      event_id: eventId
    };

    const result = await EventRegistrationService.createRegistration(registrationData);
    console.log('✅ User succesvol geregistreerd voor event:', result);
  } catch (error) {
    console.error('❌ Fout tijdens eventregistratie:', error);
  }
})();
