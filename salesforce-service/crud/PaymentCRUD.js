const { getConnection } = require('../salesforce');

class EventPaymentService {
    static async getSalesforceId(objectType, uid) {
      const conn = await getConnection();
      const result = await conn.query(`
        SELECT Id FROM ${objectType} WHERE uid__c = '${uid}' LIMIT 1
      `);
      return result.records[0]?.Id || null;
    }

    static async getAnotherSalesforceId(objectType, user_uid, event_uid, timestamp) {
      const conn = await getConnection();
      const utcTimestamp = new Date(timestamp).toISOString();
      const result = await conn.query(`
        SELECT Id FROM ${objectType} WHERE user_uid__c = '${user_uid}' AND event_uid__c = '${event_uid}' AND timestamp__c = ${utcTimestamp} LIMIT 1
      `);
      return result.records[0]?.Id || null;
    }

    static async createEventPayment(eventPaymentData) {
      try {
        const conn = await getConnection();
        const userId = await this.getSalesforceId('Users_CRM__c', eventPaymentData.user_uid__c);
        const eventId = await this.getSalesforceId('Eventcrm__c', eventPaymentData.event_uid__c);
          return await conn.sobject('Event_Payment__c').create({
            entrance_fee__c: eventPaymentData.entrance_fee__c,
            entrance_paid__c: eventPaymentData.entrance_paid__c,
            user_uid__c: eventPaymentData.user_uid__c,
            event_uid__c: eventPaymentData.event_uid__c,
            User__c: userId,
            Event__c: eventId,
            paid_at__c: eventPaymentData.paid_at__c,
        });
      } catch (error) {
          console.error('Error in creating event:', error);
          return;
      }
    }

    static async createPayment(PaymentData){
        try{
            const conn = await getConnection();
            const userId = await this.getSalesforceId('Users_CRM__c', PaymentData.user_uid__c);
            const eventId = await this.getSalesforceId('Eventcrm__c', PaymentData.event_uid__c);
            return await conn.sobject('Payment_CRM__c').create({
                user_uid__c: PaymentData.user_uid__c,
                event_uid__c: PaymentData.event_uid__c,
                timestamp__c: PaymentData.timestamp__c,
                is_paid__c: PaymentData.is_paid__c,
                User__c: userId,
                Event__c: eventId,
            });
        } catch (error) {
            console.error('Error in creating payment:', error);
            return;
        }
    }

    static async linkItemToPayment(paymentData, itemData) {
        try {
            const conn = await getConnection();
            const paymentId = await this.getAnotherSalesforceId('Payment_CRM__c', paymentData.user_uid__c, paymentData.event_uid__c, paymentData.timestamp__c);
            return await conn.sobject('Item__c').create({
                Payment__c: paymentId,
                item_name__c: itemData.item_name,
                price__c: itemData.price,
                quantity__c: itemData.quantity,
            });
        } catch (error) {
            console.error('Error in linking item to payment:', error);
            return;
        }
    }
}
    

module.exports = EventPaymentService;