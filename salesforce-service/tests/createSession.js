const SessionService = require('../consumers/SessionCRUD');
const { getEventId } = require('../salesforce');

(async () => {
  try {
    // Retrieve the Salesforce ID for the event (replace '2' with the actual ID or UID)
    const eventId = await getEventId('2');

    if (!eventId) {
      console.error('No valid event found');
      return;
    }

    const sessionData = {
      uid: 'GC1747123804524', // This should match the UID format from your XML
      event_id: eventId,
      title: 'Demo Session Title',
      description: 'This is a test session for demonstration purposes.',
      date: '2025-05-10',
      start_time: '09:00:00',
      end_time: '11:00:00',
      location: 'Amsterdam',
      max_attendees: 30,
      speaker: {
        name: 'Dr. John Doe',
        bio: 'Expert in Educational Technology.'
      }
    };
    
    // Create the session
    const result = await SessionService.createSession(sessionData);
    console.log('Session successfully created:', result);
  } catch (error) {
    console.error('Error creating session:', error);
  }
})();