const nodeJwt = require('node-salesforce-jwt');

/**
  * JWT wrapper to get session id to send to jsforce
  *
  * @param {Object} [options] - JWT options
  * @param {String} [options.clientId] - Connected App's client id
  * @param {Boolean} [options.isTest] - Determine the login url test.salesforce or login.salesforce
  * @param {String} [options.privateKey] - Private Key
  * @param {String} [options.user] - Username of the SFDC user you are acting on the behalf of
  */
  const getJwt = (options) => {
    return new Promise((resolve, reject) => {
        nodeJwt.getToken(
        {
          clientId: options.clientId,
          isTest: options.isTest,
          privateKey: options.privateKey,
          user: options.user
        },
        (err, response) => {
          if (err) {
            console.log(err) // TODO: figure out some overall logs for this npm module
            reject(err)
          } else {
            resolve(response)
          } 
        })
      }
    )
  }

module.exports.getJwt = getJwt
