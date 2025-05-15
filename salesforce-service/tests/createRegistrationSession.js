const SessionRegistrationService = require('../consumers/SessionRegisterCRUD');
const { getUserId, getSessionId } = require('../salesforce');

(async () => {
  try {
    const userId = await getUserId('26');
    const sessionId = await getSessionId('11');

    if (!userId || !sessionId) {
      console.error('❌ User of sessie niet gevonden');
      return;
    }

    const result = await SessionRegistrationService.createRegistration({
      user_id: userId,
      session_id: sessionId
    });

    console.log('✅ Registratie succesvol:', result);
  } catch (error) {
    console.error('❌ Error tijdens registratie:', error);
  }
})();
