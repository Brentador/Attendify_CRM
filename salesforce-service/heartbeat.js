const amqp = require('amqplib');
const { Builder } = require('xml2js');
const connection = require('../rabbitmq');


async function startHeartbeat(container) {
    console.log(process.env.RABBITMQ_URL)
    try {
        const channel = await connection.createChannel();
        const builder = new Builder();

        console.log(`[Heartbeat] Connected to RabbitMQ for container: ${container}`);

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
                channel.publish("monitoring", "monitoring.heartbeat", Buffer.from(message))
                console.log(`Sent heartbeat for container: ${container}`);
            } catch (error) {
                console.log(`Error sending heartbeat: ${error}`)
            }
        }, 10000)

    } catch (error) {
        console.log(`Error connecting to RabbitMQ: ${error}`);
    }
}


module.exports = startHeartbeat;