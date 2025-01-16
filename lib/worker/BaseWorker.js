import { RabbitMQConsumer } from '../utils/RabbitMQConsumer';
import { logger } from 'propel-sfdc-connect';

export class BaseWorker {
    constructor(queueName, messageHandler) {
        this.queueName = queueName;
        this.messageHandler = messageHandler;
        this.consumer = new RabbitMQConsumer({
            url: process.env.RABBITMQ_URL || 'amqp://localhost',
            queue: queueName
        });
    }

    async start() {
        try {
            await this.consumer.connect();
            await this.consumer.consume(this.messageHandler);
            logger.info(`Worker started for queue: ${this.queueName}`);
        } catch (error) {
            logger.error(`Worker error for queue ${this.queueName}:`, error);
            await this.consumer.disconnect();
            process.exit(1);
        }

        process.on('SIGTERM', async () => {
            logger.info(`Shutting down worker for queue: ${this.queueName}`);
            await this.consumer.disconnect();
            process.exit(0);
        });
    }
}