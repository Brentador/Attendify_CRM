const amqp = require('amqplib');
const { Builder } = require('xml2js');
const express = require('express');

async function startHeartbeat(container) {
    try {
        //const connection = await amqp.connect(process.env.RABBITMQ_URL);
        //const channel = await connection.createChannel();
        //const builder = new Builder();

        console.log(`[Heartbeat] Connected to RabbitMQ for container: ${container}`);

        // Express server opzetten voor het heartbeat endpoint
        const app = express();
        // Variabele om de laatste heartbeat timestamp op te slaan
        let lastHeartbeatTimestamp = null;

        app.get('/heartbeat', (req, res) => {
            if (lastHeartbeatTimestamp) {
                res.status(200).json({ status: 'UP', lastHeartbeat: lastHeartbeatTimestamp });
            } else {
                res.status(503).json({ status: 'Not active yet' });
            }
        });

        const httpPort = process.env.HTTP_PORT || 30055;
        app.listen(httpPort, () => {
            console.log(`Heartbeat endpoint listening on port ${httpPort}`);
        });

        // Originele heartbeat code, uitgeschakeld via commentaar:
        /*
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
        */

    } catch (error) {
        console.log(`Error connecting to RabbitMQ: ${error}`);
    }
}

module.exports = startHeartbeat;


