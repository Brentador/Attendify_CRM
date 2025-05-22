const PaymentCRUD = require('../crud/PaymentCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');

async function startPaymentConsumer() {
    console.log('Starting payment consumer');
    try{
        const connection = await connectRabbitmq();
        const channel =  await connection.createChannel();


        channel.consume(
            "crm.sale",
            async (message) => {
                try {
                const xmlData = message.content.toString();
                const parsedData = await parseStringPromise(xmlData, { explicitArray: false });
                console.log('Parsed XML data:', parsedData);


                const operation = parsedData.attendify.info.operation.toLowerCase();
                if (operation == 'create_event_payment'){
                    let eventPaymentData;
                    let paid;
                    const eventPayment = parsedData.attendify.event_payment;
                    if(eventPayment.entrance_paid.trim().toLowerCase() === 'true'){
                        paid = true;
                    } else if (eventPayment.entrance_paid.trim().toLowerCase() == 'false'){
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
                console.log('Event Payment created successfully');
                } else if (operation == 'create'){
                    let PaymentData;
                    const Payment = parsedData.attendify.tab;
                    console.log('Parsed XML data:', Payment);
                    let paid;
                    if(Payment.is_paid.trim().toLowerCase() === 'true'){
                        paid = true;
                    } else if (Payment.is_paid.trim().toLowerCase() == 'false'){
                        paid = false;
                    }
                    PaymentData = {
                            user_uid__c: Payment.uid,
                            event_uid__c: Payment.event_id,
                            timestamp__c: Payment.timestamp,
                            is_paid__c: paid
                    };
                    console.log('Payment Data:', PaymentData);
                    await PaymentCRUD.createPayment(PaymentData);
                    console.log('Payment created successfully');

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
                            console.log('Item linked to payment successfully');
                            console.log('Item Data:', itemData);
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



module.exports = startPaymentConsumer;