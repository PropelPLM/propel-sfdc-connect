/**
 * adding the key objects to exports
 */

const PropelConnect = require('./lib/PropelConnect')
const PropelParser = require('./lib/PropelParser')
const PropelHelper = require('./lib/PropelHelper')
const PropelLog = require('./lib/PropelLog')

module.exports = {
  newConnection: (hostUrl, sessionId) => {
    return new PropelConnect(hostUrl, sessionId)
  },
  newParser: (data) => {
    return new PropelParser(data)
  },
  newHelper: (connection, mapping, namespace, options) => {
    return new PropelHelper(connection, mapping, namespace, options)
  },
  newLog: (connection, orgId) => {
    return new PropelLog(connection, orgId)
  },
}
