const { getConnection } = require('../salesforce');

class SessionService {
  static async createSession(sessionData) {
    try {
      const conn = await getConnection();
      return await conn.sobject('Session__c').create({
        speaker__c: sessionData.speaker__c,
        uid_event__c: sessionData.uid_event__c,
        description__c: sessionData.description__c,
        location__c: sessionData.location__c,
        start_date__c: sessionData.start_date__c,
        end_date__c: sessionData.end_date__c,
      });
    } catch (error) {
      console.error('Error in creating session:', error);
      throw error;
    }
  }

  static async updateSession(sessionData) {
    try {
      const conn = await getConnection();
  
      // Zoek de sessie via het 'Name' veld (wat de uid_session__c voorstelt)
      const result = await conn.sobject('Session__c')
        .find({ Name: sessionData.Name }) // Name is het unieke veld
        .execute();
  
      if (result && result.length > 0) {
        const session = result[0];
        const sessionToUpdate = { Id: session.Id };
  
        // Vul alle velden behalve 'Name' (die mag niet aangepast worden)
        for (const [key, value] of Object.entries(sessionData)) {
          if (value !== null && key !== 'Name') {
            sessionToUpdate[key] = value;
          }
        }
  
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