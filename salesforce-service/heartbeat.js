const { Builder } = require('xml2js');
const connectRabbitmq = require('./rabbitmq');


async function startHeartbeat(container) {
    try {
        const connection = await connectRabbitmq();
        const channel = await connection.createChannel();
        const builder = new Builder();
        setInterval(async () => {
            try {
                let heartbeatMessage = {
                    heartbeat: {
                        sender: "CRM",
                        timestamp: Date.now(),
                    }
                };

                const message = builder.buildObject(heartbeatMessage);
                channel.publish("monitoring", "monitoring.heartbeat", Buffer.from(message))
            } catch (error) {
                console.log(`Error sending heartbeat: ${error}`)
            }
        }, 1000)

    } catch (error) {
        console.log(`Error connecting to RabbitMQ: ${error}`);
    }
}


module.exports = startHeartbeat;