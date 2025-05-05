const amqp = require('amqplib');

let connection = null;

async function connectRabbitmq(){
    if (!connection) {
        connection = await amqp.connect({
            protocol: 'amqp',
            hostname: 'rabbitmq',
            port: 5672,
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