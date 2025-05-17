const PaymentCRUD = require('../PaymentCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');

async function startEventPaymentConsumer() {
    console.log('Starting consumer...');
    try{
        const connection = await connectRabbitmq();
        console.log('Connected to RabbitMQ.');
        const channel =  await connection.createChannel();
        console.log('Connected to RabbitMQ2.');


        channel.consume(
            "crm.sale",
            async (message) => {
                try {
                const xmlData = message.content.toString();
                const parsedData = await parseStringPromise(xmlData, { explicitArray: false });
                console.log('Parsed XML data:', parsedData);


                const sender = parsedData.attendify.info.sender.toLowerCase();
                if (sender == 'frontend '){
                let eventPaymentData;
                    const eventPayment = parsedData.attendify.event_payment;
                    console.log('Parsed XML data:', eventPayment);
                    eventPaymentData = {
                            entrance_fee__c: eventPayment.entrance_fee,
                            entrance_paid__c: eventPayment.entrance_paid,
                            user_uid__c: eventPayment.uid,
                            event_uid__c: eventPayment.event_id,
                            paid_at__c: eventPayment.paid_at
                    };
                await PaymentCRUD.createEventPayment(eventPaymentData);
                } else if (sender == 'odoo'){
                    let PaymentData;
                    const Payment = parsedData.attendify.tab;
                    console.log('Parsed XML data:', Payment);
                    PaymentData = {
                            user_uid__c: Payment.uid,
                            event_uid__c: Payment.event_id,
                            timestamp__c: Payment.timestamp,
                    };
                    await PaymentCRUD.createPayment(PaymentData);

                    const items = Payment.items?.tab_item;
                    if (items) {
                        const itemArray = Array.isArray(items) ? items : [items];
                        for (const item of itemArray) {
                            const itemData = {
                                item_name: item.item_name,
                                price: item.price,
                                quantity: item.quantity,
                            };
                            await PaymentCRUD.linkItemToPayment(PaymentData, itemData);
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing message:', error);
            } finally {
                channel.ack(message);
            }
            }
        )
    }catch(error){
        console.error('Error starting consumer:', error);
    }
}

async function stopEventPaymentConsumer(connection){
    try{
        await connection.close();
        exit();
    } catch(error){
        exit();
    }
}

module.exports = { startEventPaymentConsumer, stopEventPaymentConsumer };