const jsforce = require('jsforce-propel')
const https = require('https')

/**
 * PropelConnect is a wrapper class for the jforce-propel module
 * The focus is to support common use cases when working with Salesforce's
 * REST Api.
 */
class PropelConnect {
  /**
   * @param {stirng} hostUrl
   * @param {string} sessionId
   */
  constructor(hostUrl, sessionId) {

    this.querySize = 200
    this.serverUrl = hostUrl
    if (this.serverUrl.endsWith('visual.force.com')) {
      let dms = this.serverUrl.split('.')
      this.serverUrl = dms[1] + '.salesforce.com'
    }
    this.sessionId = sessionId

    this.QUERY_LIST = 'QUERY_LIST_STRING'

    // set up the connection with sfdc
    this.conn = this.connectSF()
    this.conn.bulk.pollInterval = 2 * 1000 // 2 sec
    this.conn.bulk.pollTimeout = 180 * 1000 // 180 sec
  }

  /**
   * @return {Connection} jsforce object
   */
  connectSF() {
    return new jsforce.Connection({
      serverUrl: 'https://' + this.serverUrl,
      sessionId: this.sessionId,
      maxRequest: 500,
    })
  }

  /**
   * @param {string} objectName
   * @param {string[]} objectIds
   * @returns {Promise}
   */
   delete(objectName, objectIds) {
    return new Promise((resolve, reject) => {
      if (!objectIds || !objectIds.length) { resolve([]) }
      this.conn.bulk.load(objectName, 'delete', objectIds.map((objId) => ({ Id: objId })))
        .then((res) => resolve(res))
        .fail((err) => reject(err))
    })
  }

  /**
   * @param {string} objectName
   * @param {Object[]} objects
   * @returns {Object[]}
   */
   insert(objectName, objects) {
    return new Promise((resolve, reject) => {
      if (!objects || !objects.length) { resolve([]) }
      this.conn.bulk.load(objectName, 'insert', objects)
        .then((res) => resolve(res))
        .fail((err) => reject(err))
    })
  }

  /**
   * @param {string} objectName
   * @param {Object[]} objects
   * @param {number} size
   * @returns {Object[]}
   */
   insertSlice(objectName, objects, size = 5) {
    return new Promise(async (resolve, reject) => {
      if (!objects || !objects.length) { resolve([]) }
      let result = []
      let start = 0
      while (start < objects.length) {
        const localList = objects.slice(start, start + size)
        try {
          const subResult = await this.insert(objectName, localList)
          start += size
          result.push(subResult)
        } catch (e) {
          reject(e)
          break
        }
      }
      resolve(result.flat())
    })
  }

  /**
   * @param {string} objName
   * @returns {Promise}
   */
   metadataRead(objName) {
    return this.conn.describe(objName, this._sReturn)
  }

  /**
   * This is same as queryLimit but make sure it won't go over the return limit
   * @param {string} queryString
   * @param {string[]} queryList
   */
  queryExtend(queryString, queryList) {
    return new Promise(async (resolve, reject) => {
      if (!queryList || !queryList.length) { resolve([]) }
      let result = []
      let start = 0
      while (start < queryList.length) {
        const localList = queryList.slice(start, start + this.querySize)
        try {
          const res = await this.queryLimit(queryString.replace(this.QUERY_LIST, localList.join(',')))
          start += this.querySize
          result.push(res)
        } catch (e) {
          reject(e)
          break
        }
      }
      resolve(result.flat())
    })
  }

  /**
   * Standard bulk query, limitation applied
   * note: no sub-query in bulk query
   * note: return cannot exceed 20,000 characters
   * @param {string} queryString
   * @return {Promise}
   */
  queryLimit() {
    return new Promise((resolve, reject) => {
      let res = []
      this.conn.bulk.query(queryString)
        .on('record', (rec) => res.push(rec))
        .on('finish', () => resolve(res))
        .on('error', (err) => reject(err))
    })
  }

  /**
   * @param {string} objectName
   * @param {string[]} objectIds
   * @return {Promise}
   */
   retrieve(objectName, objectIds, size = 2000) {
    return new Promise(async (resolve, reject) => {
      if (!objectIds || !objectIds.length) { resolve([]) }
      let result = []
      let start = 0
      while (start < objectIds.length) {
        const localList = objectIds.slice(start, start + size)
        try {
          const subResult = await this.conn.retrieve(objectName, localList, this._sReturn)
          start += size
          result.push(subResult)
        } catch (e) {
          reject(e)
          break
        }
      }
      resolve(result.flat())
    })
  }

  searchExtend(queryString, queryList) {
    return new Promise(async (resolve, reject) => {
      if (!queryList || !queryList.length) { resolve([]) }
      let result = []
      let start = 0
      while (start < queryList.length) {
        const localList = queryList.slice(start, start + this.querySize)
        try {
          const searchStr = queryString.replace(this.QUERY_LIST, localList.join(' OR '))
          const found = await this.conn.search(searchStr)
          start += this.querySize
          result.push(found.searchRecords)
        } catch (e) {
          reject(e)
          break
        }
      }
      resolve(result.flat())
    })
  }

  /**
   * note: avoid 414: URI Too Long with more than 16,410 characters
   * @param {string} queryString
   * @return {Promise}
   */
   simpleQuery(queryString) {
    return new Promise((resolve, reject) => {
      this.conn.query(queryString, (err, result) => {
        if (err) { reject(err) }
        resolve(result)
      })
    })
  }

  /**
   * @param {string} objectName
   * @param {Object[]} objects
   * @returns {Object[]}
   */
  update(objectName, objects) {
    return new Promise((resolve, reject) => {
      if (!objects || !objects.length) { resolve([]) }
      this.conn.bulk.load(objectName, 'update', { concurrencyMode: 'Serial' }, objects)
        .then((res) => resolve(res))
        .fail((err) => reject(err))
    })
  }

  uploadFile(eventId, data) {
    return new Promise((resolve, reject) => {
      const filename = `Import logs ${eventId}.json`
      const dataLoad =
        `--a7V4kRcFA8E79pivMuV2tukQ85cmNKeoEgJgq
        Content-Disposition: form-data; name="entity_document";
        Content-Type: application/json

        {
            "PathOnClient" : "${filename}"
        }

        --a7V4kRcFA8E79pivMuV2tukQ85cmNKeoEgJgq
        Content-Type: application/octet-stream
        Content-Disposition: form-data; name="VersionData"; filename="${filename}"

        ${JSON.stringify(data)}

        --a7V4kRcFA8E79pivMuV2tukQ85cmNKeoEgJgq--`

      const options = {
        hostname: this.serverUrl,
        path: '/services/data/v23.0/sobjects/ContentVersion/',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary="a7V4kRcFA8E79pivMuV2tukQ85cmNKeoEgJgq"`,
          'Authorization': 'OAuth ' + this.sessionId
        }
      }
      // var base64data = new Buffer(filedata).toString('base64');
      const req = new https.request(options, (res) => {
        let data = ''
        res.on('data', (d) => {
          data += d
        })
        res.on('end', () => {
          resolve(data)
        })
      })
      req.on('error', (e) => {
        reject(e.message);
      })
      req.write(dataLoad);
      req.end()
    })
  }

  // async functions

  /**
   * @param {string[]} objNames
   * @returns {Object}
   */
   async loadMetadata(objNames) {
    let ret = {}
    for (let objName of objNames) {
      const metadata = await this.metadataRead(objName)
      let fieldMap = {}
      for (let f of metadata.fields) {
        fieldMap[f.name] = f
      }
      ret[metadata.name] = fieldMap
    }

    return ret
  }

  /**
   * @param {string} objectName
   * @param {string[]} names
   * @param {string} extWhereStr has to start with " WHERE ..."
   * @returns {Object}
   */
   async loadNameIdMap(objectName, names, extWhereStr) {
    if (!names || !names.length) {
      return {};
    }
    const ret = {};
    const objects = await this.soslQuery(objectName, names, extWhereStr)
    for (let obj of objects) {
      ret[obj.Name] = obj.Id;
      ret[obj.Name.toLowerCase()] = obj.Id;
    }
    return ret;
  }

  /**
   * @param {string} objectName
   * @param {string[]} names
   * @param {string} extWhereStr has to start with " WHERE ..."
   * @returns {Object[]}
   */
   async soslQuery(objectName, names, extWhereStr) {
    if (!names || !names.length) {
      return {};
    }
    let objects = []
    try {
      //escapeSosl
      names = names.map((x) => {
        let newStr = x.replace("\\", "\\\\");
        newStr = newStr.replace(/\'|\?|\&|\||\!|\{|\}|\[|\]|\(|\)|\^|\~|\*|\:|\"|\+|\-/g, '\\$&')
        return `"${newStr}"`;
      });
      const queryString = `FIND {${this.QUERY_LIST}} IN NAME FIELDS RETURNING  ${objectName} ( Id, Name  ${extWhereStr})`;
      objects = await this.searchExtend(queryString, names);
    } catch (error) {
      console.error(error);
    }
    return objects;
  }

  /**
   * @param {string} objectName
   * @param {string} objecyKey
   * @param {Object[]} objects
   * @returns {Object[]}
   */
  async upsert(objectName, objectKey, objects) {
    if (!objects || !objects.length) { return [] }
    let res
    if (objectKey == 'Id') {
      res = await this._upsertById(objectName, objects)
    } else {
      res = await this._upsert(objectName, objectKey, objects)
    }
    this._sMapId(objects, res)
    return res
  }

  /**
   * note: upsert external id will not return id in the result
   * @param {string} objectName
   * @param {Object[]} objects
   * @returns {Object[]}
   */
  async _upsertById(objectName, objects) {
    const res = new Array(objects.length)
    let updateList = []
    let insertList = []
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]
      if (obj.Id) {
        updateList.push({ index: i, data: obj })
      } else {
        insertList.push({ index: i, data: obj })
      }
    }
    const callResult = await Promise.all([
      this.update(objectName, updateList.map((e) => e.data)),
      this.insert(objectName, insertList.map((e) => e.data)),
    ])
    for (let i = 0; i < callResult[0].length; i++) {
      const r = callResult[0][i]
      res[updateList[i].index] = r
    }
    for (let i = 0; i < callResult[1].length; i++) {
      const r = callResult[1][i]
      r.insert = true
      res[insertList[i].index] = r
    }

    return res
  }

  /**
   * @param {Error} err
   * @param {Object[]} result
   * @returns {Object[]}
   */
   _sReturn(err, result) {
    if (err) { return console.error(err) }
    return result
  }

  _sMapId(objects, results) {
    for (let i = 0; i < results.length; i++) {
      objects.Id = results[i].id
    }
  }

  /**
   * @param {string} objectName
   * @param {string} objecyKey
   * @param {Object[]} objects
   * @returns {Object[]}
   */
   _upsert(objectName, objectKey, objects) {
    return new Promise((resolve, reject) => {
      if (!objects || !objects.length) { resolve([]) }
      this.conn.bulk.load(objectName, 'upsert', { extIdField: objectKey, concurrencyMode: 'Serial' }, objects)
        .then((res) => resolve(res))
        .fail((err) => reject(err))
    })
  }

}

module.exports = PropelConnect
