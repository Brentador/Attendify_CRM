const amqp = require('amqplib');
const { Builder } = require('xml2js');


async function startHeartbeat(container) {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const builder = new Builder();

        console.log(`[Heartbeat] Connected to RabbitMQ for container: ${container}`);

        let lastHeartbeatTimestamp = null;

        
        setInterval(async () => {
            try {
                let heartbeatMessage = {
                    attendify: {
                        info: {
                            sender: "CRM",
                            container_name: container,
                            timestamp: new Date().toISOString(),
                        }
                    }
                };

                const message = builder.buildObject(heartbeatMessage);
                channel.publish("monitoring", "monitoring.heartbeat", Buffer.from(message));
                lastHeartbeatTimestamp = new Date().toISOString();
                console.log(`Sent heartbeat for container: ${container}`);
            } catch (error) {
                console.log(`Error sending heartbeat: ${error}`);
            }
        }, 1000);
        

    } catch (error) {
        console.log(`Error connecting to RabbitMQ: ${error}`);
    }
}

module.exports = startHeartbeat;


