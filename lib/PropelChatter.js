const http = require('https')
const fs = require('fs')

/**
 * sends zip file to salesforce chatter via chatter api
 */
class PropelChatter {

  constructor(connection) {
    this.connection = connection
  }

  /**
   * @description If shouldPostToUser is false include recordId in options { recordId: 'sobjectId' }
   * @param {string} fileName 
   * @param {fs.ReadStream} fileStream 
   * @param {boolean} sendEmail 
   * @param {boolean} shouldPostToUser default true
   * @param {Object} args 
   * @return {result} chatter post result
   */
  postToChatterWithFile(
    fileName,
    fileStream,
    sendEmail = true,
    shouldPostToUser = true,
    args
  ) {

    this.connection.conn.chatter.resource('/feed-elements').create({
      body: {
        messageSegments: [{
          type: 'Text',
          text: `Post for file ${fileName}`
        }]
      },
      feedElementType : 'FeedItem',
      subjectId: shouldPostToUser ? 'me' : args.recordId
    }, (err, result) => {
      if (err) {
        console.log(err)
        throw err
      } else {
        return result
      }
    })


    // Add final boundary and bind request to zip
    // fileStream
    //   .on('end', () => {
    //     req.end(this.CRLF + '--' + boundary + '--' + this.CRLF)
    //   })
    //   .pipe(req, { end: false })
    //   .on('error', err => {
    //     throw err
    //   })
  }

  _sendConfirmationEmail(response) {
    const { namespace: ns, hostUrl: hostname, sessionId } = this.reqBody;
    var path = ns
      ? '/services/apexrest/' + ns + '/HerokuAPI/'
      : '/services/apexrest/HerokuAPI/';
  
    var options = {
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'OAuth ' + sessionId,
      },
    };
    // Execute request
    var req = new http.request(options, function (res) {
      console.log('response send email: ', res.statusCode);
    });
    // Request
    var postData =
      '{ "statusCode":"' +
      response.statusCode +
      '", "statusMessage":"' +
      response.statusMessage +
      '"}';
    req.write(postData);
    req.end();
  }
}

module.exports = PropelChatter
