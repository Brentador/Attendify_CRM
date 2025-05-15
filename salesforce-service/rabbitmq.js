const amqp = require('amqplib');

let connection = null;

async function connectRabbitmq(){
    if (!connection) {
        connection = await amqp.connect({
            protocol: 'amqp',
            hostname: process.env.RABBITMQ_HOST,
            port: process.env.RABBITMQ_PORT,
            username: 'attendify',
            password: process.env.RABBITMQ_PASSWORD,
            vhost: 'attendify',
            frameMax: 131072,
        });
        console.log('RabbitMQ connection established');
    }
    return connection;
}

module.exports = connectRabbitmq;