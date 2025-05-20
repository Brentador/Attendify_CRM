const EventRegistrationService = require('../consumers/EventRegisterCRUD');
const { getUserId, getEventId } = require('../salesforce'); // Zorg dat deze helpers correct werken

(async () => {
  try {
    // Vervang deze waarden met bestaande velden in je Salesforce data
    const userUid = '182';    // de 'uid__c' van de user in Users_CRM__c
    const eventUid = 'GC94367240';     // de 'uid__c' van het event in Eventcrm__c

    console.log("User UID:", userUid); // Log de userUid
    console.log("Event UID:", eventUid); // Log de eventUid

    const userId = await getUserId(userUid);
    console.log("User ID:", userId);  // Log de userId

    const eventId = await getEventId(eventUid);
    console.log("Event ID:", eventId); // Log de eventId

    if (!userId || !eventId) {
      console.error('❌ Geen geldige user of event gevonden');
      return;
    }

    const registrationData = {
      user__c: userId,  // Correcte veldnaam
      Event_crm__c: eventId   // Correcte veldnaam
    };

    console.log("Registration Data:", registrationData); // Log de registratiedata

    const result = await EventRegistrationService.createRegistration(registrationData);
    console.log('✅ User succesvol geregistreerd voor event:', result);
  } catch (error) {
    console.error('❌ Fout tijdens eventregistratie:', error);
    console.error("Error details:", error); // Log de volledige error
  }
})();