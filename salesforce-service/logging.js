const { Builder } = require('xml2js');

async function logToMonitoring(message, exchange, channel) {
    const routingKey = 'monitoring.log';
    const logMessage = {
        sender: 'crm',
        timestamp: new Date().toISOString(),
        message: message
    };

    const builder = new Builder();
    const logXML = builder.buildObject(logMessage);

    channel.publish(exchange, routingKey, Buffer.from(logXML), { persistent : true });

    console.log(`Log sent to exchange ${exchange} with routing key ${routingKey}: ${message}`);
}

module.exports = logToMonitoring;