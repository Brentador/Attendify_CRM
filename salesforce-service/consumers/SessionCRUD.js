const { getConnection } = require('../salesforce');

class SessionService {
  static async createSession(sessionData) {
    try {
      const conn = await getConnection();
      const startDateTime = `${sessionData.date}T${sessionData.start_time}`;
      const endDateTime = `${sessionData.date}T${sessionData.end_time}`;

      return await conn.sobject('Session__c').create({
        uid_event__c: sessionData.event_id,
        title__c: sessionData.title,
        description__c: sessionData.description,
        start_date__c: startDateTime,
        end_date__c: endDateTime,
        location__c: sessionData.location,
        max_attendees__c: sessionData.max_attendees,
        speaker_name__c: sessionData.speaker?.name,
        speaker_bio__c: sessionData.speaker?.bio,
      });
    } catch (error) {
      console.error('Error in creating session:', error);
      throw error;
    }
  }

  static async updateSession(sessionData) {
    try {
      const conn = await getConnection();

      // Search for the session using the 'Name' field (which is mapped to UID)
      const result = await conn.sobject('Session__c')
        .find({ Name: sessionData.uid })
        .execute();

      if (result && result.length > 0) {
        const session = result[0];
        const sessionToUpdate = { Id: session.Id };

        // Combine date and time for Salesforce fields
        if (sessionData.date && sessionData.start_time) {
          sessionToUpdate.start_date__c = `${sessionData.date}T${sessionData.start_time}`;
        }
        if (sessionData.date && sessionData.end_time) {
          sessionToUpdate.end_date__c = `${sessionData.date}T${sessionData.end_time}`;
        }

        // Map all other fields
        sessionToUpdate.uid_event__c = sessionData.event_id || null;
        sessionToUpdate.title__c = sessionData.title || null;
        sessionToUpdate.description__c = sessionData.description || null;
        sessionToUpdate.location__c = sessionData.location || null;
        sessionToUpdate.max_attendees__c = sessionData.max_attendees || null;
        sessionToUpdate.speaker_name__c = sessionData.speaker?.name || null;
        sessionToUpdate.speaker_bio__c = sessionData.speaker?.bio || null;

        return await conn.sobject('Session__c').update(sessionToUpdate);
      } else {
        console.log('No session found to update');
        return { success: false, message: 'Session not found' };
      }
    } catch (error) {
      console.error('Error in updating session:', error);
      throw error;
    }
  }

  static async deleteSessionById(sessionId) {
    try {
      const conn = await getConnection();
      const deleteResult = await conn.sobject('Session__c').destroy(sessionId);
      console.log(`Session with ID ${sessionId} deleted successfully.`);
      return { success: true, message: 'Session deleted successfully', result: deleteResult };
    } catch (error) {
      console.error(`Error deleting session with ID ${sessionId}:`, error);
      return { success: false, message: 'Error deleting session', error };
    }
  }  
}

module.exports = SessionService;