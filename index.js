/**
 * adding the key objects to exports
 */

const PropelChatter = require('./lib/PropelChatter')
const PropelConnect = require('./lib/PropelConnect')
const PropelJwtConnect = require('./lib/PropelJwtConnect')
const PropelParser = require('./lib/PropelParser')
const PropelHelper = require('./lib/PropelHelper')
const PropelLog = require('./lib/PropelLog')

module.exports = {
  newChatter: (connection, log) => {
    return new PropelChatter(connection, log)
  },
  newConnection: (hostUrl, sessionId) => {
    return new PropelConnect(hostUrl, sessionId)
  },
  newJwtConnection: () => {
    return new PropelJwtConnect()
  },
  newParser: (data) => {
    return new PropelParser(data)
  },
  newHelper: (connection, mapping, namespace, options) => {
    return new PropelHelper(connection, mapping, namespace, options)
  },
  newLog: (connection) => {
    return new PropelLog(connection)
  },
}
