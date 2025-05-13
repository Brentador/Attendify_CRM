const { getEventId } = require('../salesforce'); // Use require for CommonJS

(async () => {
  try {
    // Retrieve the Salesforce ID for the event (replace '2' with the actual ID or UID)
    const eventId = await getEventId('2');

    if (!eventId) {
      console.error('No valid event found');
      return;
    }

    console.log('Event ID:', eventId);
  } catch (error) {
    console.error('Error getting event ID:', error);
  }
})();
