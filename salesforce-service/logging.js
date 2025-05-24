async function logToMonitoring(message, exchange, channel) {
    const routingKey = 'monitoring.log';
    const logMessage = {
        sender: 'crm',
        timestamp: new Date().toISOString(),
        message: message
    };

    channel.publish(exchange, routingKey, Buffer.from(logMessage), { durable : true });

    console.log(`Log sent to exchange ${exchange} with routing key ${routingKey}: ${message}`);
}

module.exports = logToMonitoring;