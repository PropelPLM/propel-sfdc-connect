import MessageBroker from './MessageBroker.js';
/*
 * 

Example usage for setting up a queue worker, and publishing to the queue.
Note that the message broker is intended to be a singleton across the app (to limit connections)

```
const { logger, createMessageBroker, startQueueConsumer, startQueueProducer } = require('@propelsoftwaresolutions/propel-sfdc-connect');

const start = async () => {
    // Create a message broker
    const messageBroker = await createMessageBroker({
        url: process.env.CLOUDAMQP_URL
    });

    // Create a simple worker
    class ImportWorker {
        async processMessage(msg) {
            logger.info('Receieved message from queue...', msg);
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            await delay(3000); // wait for 3 seconds
            logger.info('Worker is all done...');
        }
    }

    // Start a consumer
    await startQueueConsumer(messageBroker, {
        queue: process.env.INCOMING_QUEUE || 'my-queue-name',
        deadLetterExchange: process.env.DEAD_LETTER_EXCHANGE || 'my-dead-letter-exchange',
        workerType: ImportWorker
    });

    // Start a producer
    const producer = await startQueueProducer(messageBroker, {
        queue: process.env.INCOMING_QUEUE || 'my-queue=name'
    });

    // Send a message to the queue
    try {
        await producer.send({ foo: 'bar' });
    } catch (e) {
        logger.error('Failed to write to the queue', e);
    }
};

start();
```
 */


/**
 * Create message broker with established connection to RabbitMQ based on the config.
 * App should turn this into a singleton to avoid creating multiple connections to the same broker.
 */
export const createMessageBroker = async (config) => {
    let mb = new MessageBroker(config);
    await mb.connect();
    return mb;
}

/**
 * Start a worker that listens to a queue based on the consumerConfig
 */
export const startQueueConsumer = async (messageBroker, consumerConfig) => {
    return await messageBroker.addConsumer(consumerConfig);
}

/**
 * Start a producer that can write to a queue based on the producerConfig
 */
export const startQueueProducer = async (messageBroker, consumerConfig) => {
    return await messageBroker.addProducer(consumerConfig);
}

