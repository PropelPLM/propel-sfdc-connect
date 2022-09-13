const http = require('https')
const fs = require('fs')

/**
 * sends zip file to salesforce chatter via chatter api
 */
class PropelChatter {

  constructor(connection, log) {
    this.sfdcApiVersion = 'v34.0'
    this.connection = connection
    this.CRLF = '\r\n'
    this.log = log
  }

  /**
   * @description If shouldPostToUser is false include recordId in options { recordId: 'sobjectId' }
   * @param {string} communityId 
   * @param {string} fileName 
   * @param {fs.ReadStream} fileStream 
   * @param {boolean} sendEmail 
   * @param {boolean} shouldPostToUser default true
   * @param {Object} options 
   */
  postToChatterWithFile(
    communityId,
    fileName,
    fileStream,
    sendEmail = true,
    shouldPostToUser = true,
    options
  ) {

    // variables
    const boundary = 'a7V4kRcFA8E79pivMuV2tukQ85cmNKeoEgJgq'
    const path = (communityId) 
      ? `/services/data/${this.sfdcApiVersion}/chatter/feed-elements`
      : `/services/data/${this.sfdcApiVersion}/connect/communities/${communityId}/chatter/feed-elements`

    const options = {
      hostname: this.connection.serverUrl,
      path,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `OAuth ${this.connection.sessionId}`,
      },
    }

    const subjectId = shouldPostToUser ? 'me' : options.recordId

    // Execute request
    let req = new http.request(options, (res) => {
      if (sendEmail) {
        //this._sendConfirmationEmail.call(res);
      }
    })

    // write data to request body
    req.write(this._getPost(boundary, fileName, subjectId))

    // Add final boundary and bind request to zip
    fileStream
      .on('end', function () {
        req.end(this.CRLF + '--' + boundary + '--' + this.CRLF)
      })
      .pipe(req, { end: false });
  }

  /**
   * Keeping for now when we enable post errors to chatter
   * @param {string} errorMessage 
   * @param {string} subjectId 
   * @returns string
   */
  _getErrorPost(errorMessage, subjectId) {
    return [
      '{',
      '"body":{',
      '"messageSegments":[',
      '{',
      '"type":"Text",',
      `"text":${JSON.stringify(errorMessage)}`,
      '}',
      ']',
      '},',
      '"feedElementType":"FeedItem",',
      `"subjectId":"${subjectId}"`,
      '}',
    ].join(this.CRLF)
  }

  _getPost(boundary, fileName, subjectId) {
    return [
      '--' + boundary,
      'Content-Disposition: form-data; name="json"',
      'Content-Type: application/json; charset=UTF-8',
      '',
      '{',
      '"body":{',
      '"messageSegments":[',
      '{',
      '"type":"Text",',
      '"text":""',
      '}',
      ']',
      '},',
      '"capabilities":{',
      '"content":{',
      `"title":"${fileName}"`,
      '}',
      '},',
      '"feedElementType":"FeedItem",',
      `"subjectId":"${subjectId}"`,
      '}',
      '',
      '--' + boundary,
      `Content-Disposition: form-data; name="feedElementFileUpload"; filename="${fileName}"`,
      'Content-Type: application/octet-stream; charset=ISO-8859-1',
      '',
      '',
    ].join(this.CRLF)
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
