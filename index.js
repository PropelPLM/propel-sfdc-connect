/**
 * adding the key objects to exports
 */

const PropelConnect = require('./lib/PropelConnect')
module.exports = {
    propel_connect: require('./lib/PropelConnect'),
    propel_helper: require('./lib/PropelHelper'),
    propel_log: require('./lib/PropelLog'),
    new_connection: (hostUrl, sessionId) => {
      return new PropelConnect(hostUrl, sessionId)
    }
}
