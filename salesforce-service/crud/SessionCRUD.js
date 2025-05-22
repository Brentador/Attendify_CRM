const { getConnection } = require('../salesforce');

class SessionService {
    static async getSalesforceId(objectType, uid) {
      const conn = await getConnection();
      const result = await conn.query(`
        SELECT Id FROM ${objectType} WHERE uid__c = '${uid}' LIMIT 1
      `);
      return result.records[0]?.Id || null;
    }

    static async createSession(sessionData) {
      try {
        const conn = await getConnection();
        const eventId = await this.getSalesforceId('Eventcrm__c', sessionData.event_id);
          return await conn.sobject('Session__c').create({
            description__c: sessionData.description__c,
            end_time__c: sessionData.end_time__c,
            location__c: sessionData.location__c,
            max_attendees__c: sessionData.max_attendees__c,
            speaker_bio__c: sessionData.speaker_bio__c,
            speaker_name__c: sessionData.speaker_name__c,
            start_time__c: sessionData.start_time__c,
            date__c: sessionData.date__c,
            title__c: sessionData.title__c,
            event_uid__c: sessionData.event_uid__c,
            uid__c: sessionData.uid__c,
            event__c: eventId,

        });
        
      } catch (error) {
          console.error('Error in creating session:', error);
          return;
      }
    }
    
    static async updateSession(sessionData) {
      try {
          const conn = await getConnection();
          
          const result = await conn.sobject('Session__c')
              .find({ uid__c: sessionData.uid__c })
              .execute();
          
          if (result && result.length > 0) {
            const session = result[0];
            const sessionToUpdate = { Id: session.Id };
              for (const [key, value] of Object.entries(sessionData)) {
                if (value !== null) {
                    sessionToUpdate[key] = value;
                }
              }
              return await conn.sobject('Session__c').update(sessionToUpdate);
          } else {
              console.log(`No session found with uid: ${sessionData.uid}`);
              return { success: false, message: 'session not found' };
          }
      } catch (error) {
        console.error('Error in updating session:', error);
        return;
      } 
    }

    static async deleteSession(uid){
      try{
        const conn = await getConnection();
  
        const query = `SELECT Id FROM Session__c WHERE uid__c = '${uid}'`
        const result = await conn.query(query);
  
        if (result.records.length === 0){
          console.log(`No session found with uid: ${uid}`)
          return { success: false, message: 'Session not found' }
        }
  
        const sessionId = result.records[0].Id;
  
        await conn.sobject('Session__c').destroy(sessionId);
        console.log(`Session with uid ${uid} deleted successfully.`);
        return { success: true, message: 'Session deleted successfully' };
      }catch (error) {
        console.error(`Error deleting session with uid ${uid}:`, error);
        return { success: false, message: 'Error deleting session', error };
      }
    }

    static async registerSession(sessionRegisterData) {
        try {
            const conn = await getConnection();
            const userId = await this.getSalesforceId('Users_CRM__c', sessionRegisterData.user_uid__c);
            const sessionId = await this.getSalesforceId('Session__c', sessionRegisterData.session_uid__c);
            console.log('User ID:', userId);
            console.log('Session ID:', sessionId);
            console.log('user uid:', sessionRegisterData.user_uid__c);
            console.log('Session uid:', sessionRegisterData.session_uid__c);

            const result = await conn.sobject('Session_registration__c').create({
                user_uid__c: sessionRegisterData.user_uid__c,
                session_uid__c: sessionRegisterData.session_uid__c,
                User__c: userId,
                Session__c: sessionId
            });
            console.log('Session registered successfully:', result);
            return result;
        } catch (error) {
            console.error('Error in registering session:', error);
            return null;
        }
    }

    static async unregisterSession(sessionRegisterData) {
        try {
            const conn = await getConnection();
            const recordId = await conn.sobject('Session_registration__c').findOne({
                user_uid__c: sessionRegisterData.user_uid__c,
                session_uid__c: sessionRegisterData.session_uid__c
            }, 'Id');

            await conn.sobject('Session_registration__c').destroy(recordId.Id);
        } catch (error) {
            console.error('Error in unregistering session:', error);
            return null;
        }
    }
  }

  
   

module.exports = SessionService;