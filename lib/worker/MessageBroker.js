import amqp from 'amqplib';
import { logger } from '../Logger.js';

const BROKER_CONFIG_DEFAULTS = {
    reconnectTimeout: 60000,    // when reconnecting to the queue on failure, how long to wait (1 min default)
    url: null                  // connection url for RabbitMQ
};

const CONSUMER_CONFIG_DEFAULTS = {
    prefetch: 1,                // queue refetch setting    
    maxRetries: 3,              // max retries before moving to dead letter queue
    queue: null,                // queue name
    deadLetterExchange: null,   // optionally move to dead letter queue when max retries are exceeded    
    workerType: null            // Class for the worker -- will instantiate new instance with no-arg constructor when worker is executed
};

const REQUIRED_BROKER_CONFIGS = [ 'reconnectTimeout', 'url' ];
const REQUIRED_CONSUMER_CONFIGS = [ 'queue', 'prefetch', 'maxRetries', 'workerType' ];
    
/**
 *
 */
export default class MessageBroker {

    config;
    consumers = [];
    producers = [];
    connection = null;
    pendingReinit = false;

    constructor(config) {
        this.config = Object.assign({}, BROKER_CONFIG_DEFAULTS, config);
        this.connection = null;

        for (let configKey of REQUIRED_BROKER_CONFIGS) {
            if (!this.config[configKey] && this.config[configKey] !== 0) {
                throw new Error(`Missing required config: ${configKey}`);
            }
        }
    }

    /**
     * Establishes a connection to the broker (e.g. rabbitmq) if not already connected.
     * Does not start a channel or any producers/consumers yet.
     * In case of failure (on this call or in the future), schedules a reconnection attempt
     * 
     * @returns true if connection is successful or already connected, false otherwise
     */
    async connect() {
        try {
            if (this.isConnected()) {
                return true;
            }            
            this.connection = await amqp.connect(this.config.url);
            
            // Log connection errors
            this.connection.on('error', async (error) => {
                logger.error(`RabbitMQ connection error`, error);
            });

            // Reconnect when connection is closed
            this.connection.on('close', async () => {
                logger.error(`RabbitMQ connection closed`);
                this.connection = null;
                this.scheduleReInitialize();
            });
            return true;
        } catch (error) {
            logger.error(`Failed to connect to RabbitMQ`, error);
            await this.safeCloseConnection();
            this.scheduleReInitialize(); // (in case connection is null, close won't trigger this -- reinit handles dup calls so should be ok)
            return false;
        }
    }

    /**
     * Schedules a "reinitialize". After a configured delay, the reinitialization 
     * will attempt to reconnect (if not already connected), and will re-create
     * any channels that have become disconnected (or have not yet connected).
     * 
     * Note, only a single reinitialization is allowed to be scheduled at a time.
     * At the end of reinitialization, we will check that everything is connected
     * successfully -- if not, then a new reinitialization will be scheduled.
     */
    scheduleReInitialize() {
        if (this.pendingReinit) {
            return;
        }

        this.pendingReinit = true;
        logger.info(`Scheduling reinitialize of RabbitMQ channels in ${this.config.reconnectTimeout}ms...`);
        setTimeout(async () => {
            let reinitSuccess = true;
            try {
                logger.info(`Attempting reinitialization of RabbitMQ channels`);
                let isConnected = await this.connect();
                if (isConnected) {
                    await this.setupChannels();
                }
                reinitSuccess = isConnected && this.isAllChannelsValid();
                if (reinitSuccess) {
                    logger.info(`Successfully reinitialized RabbitMQ channels`);
                }
            } catch (error) {
                logger.error('Error reinitializing RabbitMQ channels:', error);
                reinitSuccess = false;
            } finally {
                this.pendingReinit = false;
                if (!reinitSuccess) {
                    this.scheduleReInitialize();
                }
            }
        } , this.config.reconnectTimeout);
    }

    /**
     * Checks if all consumers and producers have valid channels.
     * Return true if they do, false otherwise
     */
    isAllChannelsValid () {
        for (let i = 0; i < this.consumers.length; i++) {
            if (!this.consumers[i].channel) {
                return false;
            }
        }
        for (let i = 0; i < this.producers.length; i++) {
            if (!this.producers[i].channel) {
                return false;
            }
        }
        return true;
    }

    /**
     * Adds a new consumer based on the consumerConfig, and sets up a channel for this consumer.
     * If the consumer fails to start, schedules a reInitialize after a configured delay.
     */
    async addConsumer(consumerConfig) {
        consumerConfig = Object.assign({}, CONSUMER_CONFIG_DEFAULTS, consumerConfig);

        for (let configKey of REQUIRED_CONSUMER_CONFIGS) {
            if (!consumerConfig[configKey] && consumerConfig[configKey] !== 0) {
                throw new Error(`Missing required consumer config: ${configKey}`);
            }
        }
        this.validateWorkerType(consumerConfig);

        const newConsumer = {
            config: consumerConfig,
            channel: null           
        };
        this.consumers.push(newConsumer);
        let isSuccess = await this.setupChannel(newConsumer, 'consumer');
        if (!isSuccess) {
            this.scheduleReInitialize();
        }
        return newConsumer;
    }

    /**
     * Adds a new producer based on the proucerConfig, and sets up a channel for this producer.
     * If the producer fails to start, schedules a reInitialize after a configured delay.
     */
    async addProducer(producerConfig) {
        const newProducer = {
            config: producerConfig,
            channel: null           
        };
        this.producers.push(newProducer);
        let isSuccess = await this.setupChannel(newProducer, 'producer');
        if (!isSuccess) {
            this.scheduleReInitialize();
        }
        return newProducer;
    }

    /**
     * Checks all producers and consumers. For any that don't have valid channels, reinitialize them.
     * Primary use for this is during reinialization after a disconnect.
     */
    async setupChannels() {
        let hasErrors = false;
        for (let i = 0; i < this.consumers.length; i++) {
            let isSuccess = await this.setupChannel(this.consumers[i], 'consumer');
            hasErrors = hasErrors || !isSuccess;
        }
        for (let i = 0; i < this.producers.length; i++) {
            let isSuccess = await this.setupChannel(this.producers[i], 'producer');
            hasErrors = hasErrors || !isSuccess;
        }
        if (hasErrors) {
            this.scheduleReInitialize(); // something went wrong -- will need to do another reinit pass
        }
    }
     
    /** 
     * Create channel for the consumer or producer if it doesn't already exist 
     * This is an internal function.  Does not schedule reinitialization on failure -- caller handles that.
     * However, does schedule reinitialization if channel later encounters error / dissconect
    */
    async setupChannel(consumerOrProducer, channelType) {
        if (consumerOrProducer.channel) {
            return true; // already set up
        }

        let channel;
        try {
            if (!this.connection) {
                throw new Error('Broker connection not established.');
            }
            channel = await this.connection.createChannel();        
            consumerOrProducer.channel = channel;
            if (channelType === 'producer') {
                await channel.checkQueue(consumerOrProducer.config.queue);
            } else if (channelType === 'consumer') {
                await channel.checkQueue(consumerOrProducer.config.queue);
                await channel.prefetch(consumerOrProducer.config.prefetch);            
                await channel.consume(consumerOrProducer.config.queue, async (msg) => await this.doConsume(consumerOrProducer, msg));
            } else {
                throw new Error(`Unknown channel type: ${channelType}`);
            }

            // Log connection errors
            channel.on('error', (error) => {
                logger.error(`RabbitMQ channel error`, error);
            });

            // Reconnect when connection is closed
            channel.on('close', () => {
                logger.error(`RabbitMQ channel closed`);
                consumerOrProducer.channel = null;
                this.scheduleReInitialize();
            });

            return true;
        } catch (error) {
            logger.error('Error setting up channel. Will retry during re-initialization.', error);
            consumerOrProducer.channel = null;
            await this.safeCloseChannel(channel);
            return false;
        }
    }

    /**
     * Callback to consume a message
     */
    async doConsume (consumer, msg) {
        if (!msg) {
            return;
        }
        try {
            logger.info(`Processing message from queue: ${consumer.config.queue}`);            
            let workerInstance = new consumer.config.workerType();
            await workerInstance.processMessage(msg);
            consumer.channel.ack(msg);
            logger.info(`Successfully processed message from queue: ${consumer.config.queue}`);
        } catch (error) {
            try {
                await this.handleConsumerError(consumer, msg, error);
            } catch (e) {
                // not much we can do here other than log -- likely will go back to the queue
                // (e.g. if the nack in the error handler failed)
                logger.error('Error handling consumer retry logic', e);
            }
        }
    }

    /**
     * Handles configured consumer retry logic. 
     */
    async handleConsumerError(consumer, msg, error) {
        logger.error(`Error processing message from queue ${consumer.config.queue}:`, error);               
        // Check if message has been requeued too many times
        const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;
        const maxRetries = consumer.config.maxRetries;
        if (retryCount <= maxRetries) {
            // Requeue with retry count
            consumer.channel.nack(msg, false, true, {
                headers: {
                    ...msg.properties.headers,
                    'x-retry-count': retryCount
                }
            });
            logger.warn(`Message requeued (attempt ${retryCount}/${maxRetries})`);
        } else {
            // Move to dead letter queue or discard
            consumer.channel.nack(msg, false, false);
            logger.error(`Message rejected after ${maxRetries} attempts`);
            
            if (consumer.config.deadLetterExchange) {
                logger.info(`Publishing message to dead letter queue: ${consumer.config.deadLetterExchange}`);
                try {
                    await consumer.channel.publish(
                        consumer.config.deadLetterExchange,
                        consumer.config.queue,
                        msg.content,
                        {
                            headers: {
                                ...msg.properties.headers,
                                'x-error': error.message,
                                'x-failed-at': new Date().toISOString()
                            }
                        }
                    );
                } catch (dlqError) {
                    logger.error('Failed to publish to dead letter exchange');
                    throw dlqError;
                }
            } else {
                logger.warn(`No dead letter queue configured. Discarding message.`);
            }
        }
    }

    /**
     * Close the channel if it they exists.
     * Set internal references to null
     */
    async safeCloseChannel(channel) {
        if (channel) {
            try {
                await channel.close();
            } catch (e) {
                logger.warn('Cannot close channel - already closed');
            }
        }
    }
    
    /**
     * Close the connection if it exists.
     * Set internal references to null
     */
    async safeCloseConnection() {
        if (this.connection) {
            try {
                await this.connection.close();
            } catch (e) {
                logger.warn('Cannot close connection - already closed');
            } finally {
                this.connection = null;
            }
        }
    }     

    isConnected() {
        return this.connection;
    }

    validateWorkerType(consumerConfig) {
        if (typeof consumerConfig.workerType !== 'function') {
            throw new Error('workerType must be a constructor');
        }
    }
}
