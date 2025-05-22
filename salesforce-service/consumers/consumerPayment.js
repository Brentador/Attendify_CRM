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


                const sender = parsedData.attendify.info.sender.toLowerCase();
                if (sender == 'frontend'){
                    console.log('Sender is frontend');
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
                        console.log('Event Payment Data:', eventPaymentData);
                await PaymentCRUD.createPayment(eventPaymentData);
                console.log('Event Payment created successfully');
                } else if (sender == 'pos'){
                    console.log('Sender is pos');
                    let PaymentData;
                    const Payment = parsedData.attendify.tab;
                    console.log('Parsed XML data:', Payment);
                    PaymentData = {
                            user_uid__c: Payment.uid,
                            event_uid__c: Payment.event_id,
                            timestamp__c: Payment.timestamp,
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