async function connectRabbitmq(){
    const connection = await amqp.connect({
                protocol: 'amqp',
                hostname: 'rabbitmq',
                port: 5672,
                username: 'attendify',
                password: process.env.RABBITMQ_PASSWORD,
                vhost: 'attendify',
                frameMax: 131072,
            });
    return connection;
}

const connection = connectRabbitmq();

module.exports = connection;