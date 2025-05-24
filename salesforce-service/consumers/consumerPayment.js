const PaymentCRUD = require('../crud/PaymentCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');
const logToMonitoring = require('../logging');

async function startPaymentConsumer() {
    console.log('Starting payment consumer');
    let channel;
    try {
        const connection = await connectRabbitmq();
        channel = await connection.createChannel();


        await channel.consume(
            "crm.sale",
            async (message) => {
                try {
                    const xmlData = message.content.toString();
                    const parsedData = await parseStringPromise(xmlData, { explicitArray: false });
                    console.log('Parsed XML data:', parsedData);


                    const operation = parsedData.attendify.info.operation.toLowerCase();
                    if (operation == 'create_event_payment') {
                        let eventPaymentData;
                        let paid;
                        const eventPayment = parsedData.attendify.event_payment;
                        if (eventPayment.entrance_paid.trim().toLowerCase() === 'true') {
                            paid = true;
                        } else if (eventPayment.entrance_paid.trim().toLowerCase() == 'false') {
                            paid = false;
                        }
                        console.log('Parsed XML data:', eventPayment);
                        eventPaymentData = {
                            entrance_fee__c: eventPayment.entrance_fee,
                            entrance_paid__c: paid,
                            user_uid__c: eventPayment.uid,
                            event_uid__c: eventPayment.event_id,
                            paid_at__c: eventPayment.paid_at
                        };
                        console.log('Event Payment Data:', eventPaymentData);
                        await PaymentCRUD.createEventPayment(eventPaymentData);
                        logToMonitoring('Event Payment created successfully', 'sale', channel);
                    } else if (operation == 'create') {
                        const Payment = parsedData.attendify.tab;
                        console.log('Parsed XML data:', Payment);
                        let paid;
                        if (Payment.is_paid.trim().toLowerCase() === 'true') {
                            paid = true;
                        } else if (Payment.is_paid.trim().toLowerCase() == 'false') {
                            paid = false;
                        }
                        const PaymentData = {
                            user_uid__c: Payment.uid,
                            event_uid__c: Payment.event_id,
                            timestamp__c: Payment.timestamp,
                            is_paid__c: paid
                        };
                        console.log('Payment Data:', PaymentData);
                        const success = await PaymentCRUD.createPayment(PaymentData);
                        if (success) {
                            logToMonitoring('Payment created successfully', 'sale', channel);
                        }

                        const items = Payment.items?.tab_item;
                        if (items) {
                            const itemArray = Array.isArray(items) ? items : [items];
                            for (const item of itemArray) {
                                const itemData = {
                                    item_name: item.item_name,
                                    price: item.price,
                                    quantity: item.quantity,
                                };
                                const success = await PaymentCRUD.linkItemToPayment(PaymentData, itemData);
                                if (success) {
                                    logToMonitoring('Item successfully linked to payment', 'sale', channel);
                                }
                                console.log('Item Data:', itemData);
                            }
                        }
                    }
                } catch (error) {
                    logToMonitoring(`Error processing sale message: ${error}`, 'sale', channel);
                } finally {
                    channel.ack(message);
                }
            }
        )
    } catch (error) {
        logToMonitoring(`Error starting event consumer: ${error}`, 'event', channel);
    }
}



module.exports = startPaymentConsumer;