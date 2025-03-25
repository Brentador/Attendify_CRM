const { getConnection } = require('./salesforce'); 

async function testConnection() {
  try {
    const conn = await getConnection(); 
    console.log('Connection test successful!');
    console.log(`User ID: ${conn.userInfo.id}`);
    
  } catch (error) {
    console.log('Connection failed');
    console.log(error.errorCode ? `Code: ${error.errorCode}` : `Error: ${error.message}`);
  }
}
testConnection();