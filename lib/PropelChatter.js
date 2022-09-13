const http = require('https')
const fs = require('fs')
const path = require('path')

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

  getDirectory() {
    const directoryPath = path.join(__dirname, '../../../../');
    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            console.log(file); 
        });
    })
  }

  sendToChatter(
    communityId,
    fileName,
    errorMessage,
    nameOnDisk,
    recordId,
    sendEmail = true,
    shouldPostToUser = true
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
        'Content-Type': errorMessage
          ? 'application/json; charset=UTF-8'
          : 'multipart/form-data; boundary=' + boundary,
        Authorization: 'OAuth ' + this.connection.sessionId,
      },
    }

    const subjectId = shouldPostToUser ? 'me' : recordId
    const postData = (errorMessage)
      ? this._getErrorPost(errorMessage, subjectId)
      : this._getPost(boundary, fileName, subjectId)

    // Execute request
    let req = new http.request(options, (res) => {
      
      if (!errorMessage) {
        // Send confirmation email
        if (sendEmail) {
          //this._sendConfirmationEmail.call(res);
        }
      }
    });

    // If error show message and finish response
    req.on('error', function (e) {
      console.log(`Error in request ${e}`);
      this.log.addToLogs([{ errors: [e] }], '')
    });

    // write data to request body
    req.write(postData);
    if (!errorMessage) {
      // Add final boundary and bind request to zip
      fs.createReadStream(nameOnDisk)
        .on('end', function () {
          removeFileFromDisk(nameOnDisk);
          req.end(this.CRLF + '--' + boundary + '--' + this.CRLF);
        })
        .pipe(req, { end: false });
    } else {
      req.end();
    }
  }

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
