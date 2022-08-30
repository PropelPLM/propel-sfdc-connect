/**
 * adding the key objects to exports
 */

const PropelConnect = require('./lib/PropelConnect')
const PropelHelper = require('./lib/PropelHelper')
const PropelLog = require('./lib/PropelLog')

module.exports = {
  newConnection: (hostUrl, sessionId) => {
    return new PropelConnect(hostUrl, sessionId)
  },
  newHelper: (connection, mapping, namespace, options) => {
    return new PropelHelper(connection, mapping, namespace, options)
  },
  newLog: (errors, id, isInsert, objName, rowName, success) => {
    return new PropelLog(errors, id, isInsert, objName, rowName, success)
  },
}
