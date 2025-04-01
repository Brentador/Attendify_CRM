const amqp = require('amqplib');
const { Builder } = require('xml2js');


async function startHeartbeat(container) {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const builder = new Builder();

        console.log(`[Heartbeat] Connected to RabbitMQ for container: ${container}`);
        const TTL = 1000

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
                channel.publish("monitoring", "monitoring.heartbeat", Buffer.from(message), {
                    headers: {
                        'x-message-ttl': TTL
                    }
                })
                console.log(`Sent heartbeat for container: ${container} TTL`);
            } catch (error) {
                console.log(`Error sending heartbeat: ${error}`)
            }
        }, 1000)

    } catch (error) {
        console.log(`Error connecting to RabbitMQ: ${error}`);
    }
}


module.exports = startHeartbeat;