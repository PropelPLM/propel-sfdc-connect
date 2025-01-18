/**
 * adding the key objects to exports
 */

import PropelChatter from './lib/PropelChatter.js';
import PropelConnect from './lib/PropelConnect.js';
import { jwtSession } from './lib/PropelJwtConnect.js';
import PropelParser from './lib/PropelParser.js';
import PropelHelper from './lib/PropelHelper.js';
import PropelLog from './lib/PropelLog.js';
import { createPropelContext } from './lib/PropelContext.js';
import { logger } from './lib/Logger.js';
import { createMessageBroker, startQueueConsumer, startQueueProducer } from './lib/worker/QueueUtils.js';

export {
  newChatter,
  newConnection,
  jwtSession,
  newParser,
  newHelper,
  newLog,
  createPropelContext,
  logger,
  createMessageBroker, startQueueConsumer, startQueueProducer
};

function newChatter(connection, log) {
  return new PropelChatter(connection, log);
}

function newConnection(hostUrl, sessionId) {
  return new PropelConnect(hostUrl, sessionId);
}

function newParser(data) {
  return new PropelParser(data);
}

function newHelper(connection, mapping, namespace, options) {
  return new PropelHelper(connection, mapping, namespace, options);
}

function newLog(connection) {
  return new PropelLog(connection);
}