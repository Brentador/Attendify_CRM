const jsforce = require('jsforce');
const amqp = require('amqplib'); // require amqplib for RabbitMQ connection
require('dotenv').config();

let conn = null;
const HEARTBEAT_INTERVAL = process.env.HEARTBEAT_INTERVAL || 3600; // 1 minutes

async function getConnection() {
  if (!conn) {
    conn = new jsforce.Connection({
      loginUrl: process.env.SF_LOGIN_URL
    });
    
    await conn.login(
      process.env.SF_USERNAME,
      process.env.SF_PASSWORD + process.env.SF_SECURITY_TOKEN
    );
    
    // Start the heartbeat after successful login
    startHeartbeat();
  }
  return conn;
}

function startHeartbeat() {
  setInterval(async () => {
    try {
      // Verify connection by calling identity
      await conn.identity();
      // Send heartbeat to RabbitMQ
      await sendHeartbeat();
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }, HEARTBEAT_INTERVAL);
}

async function sendHeartbeat() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = process.env.RABBITMQ_QUEUE || 'heartbeat';
    await channel.assertQueue(queue, { durable: false });
    const heartbeatMsg = JSON.stringify({
      timestamp: new Date().toISOString(),
      message: 'Salesforce heartbeat'
    });
    channel.sendToQueue(queue, Buffer.from(heartbeatMsg));
    console.log(`Heartbeat sent to RabbitMQ: ${heartbeatMsg}`);
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error sending heartbeat to RabbitMQ:', error);
  }
}

module.exports = { getConnection };
