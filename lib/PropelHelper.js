const PropelLog = require('./PropelLog')

class PropelHelper {
  /**
   * @param {PropelConnect} connection
   * @param {Object} mapping
   * @param {string} namespace
   * @param {Object} options
   */
  constructor(connection, mapping, namespace, options) {
    // static
    this.connection = connection
    this.executor = null
    this.mapping = mapping
    this.namespaceString = namespace
    this.options = options
  }

  /**
   * @param {Object[]} objects
   * @param {string} fields
   * @param {boolean} quote
   * @return {string[]}
   */
   buildQueryIds(objects, fields, quote = true) {
    if (!objects || !objects.length) { return [] }
    let values = new Set()
    for (let obj of objects) {
      const val = this.getNestedField(obj, fields)
      if (val) {
        values.add(val)
      }
    }
    return [...values].map((v) => quote ? `'${v.replace(/[']/g, '\\\'')}'` : v)
  }

  /**
   * convert data based on type from sf
   * @param {string} type
   * @param {string} raw
   * @return {*}
   */
   formatter(type, raw) {
    if (raw == null) { return }
    switch (type) {
      case 'int':
      case 'double':
      case 'currency': {
        if (!isNaN(raw)) { return raw }
        const num = Number(raw.replace(/[$%,]/g, ''))
        if (isNaN(num)) {
          console.error('Cannot parse number: ' + raw)
        }
        return num
      }
      case 'percent': {
        if (!isNaN(raw)) { return raw }
        let hasPercent = 1
        if (raw.includes('%')) {
          raw = raw.replace(/[%]/g, '')
          hasPercent = 100
        }
        const num = Number(raw.replace(/[%]/g, ''))
        if (isNaN(num)) {
          console.error('Cannot parse number: ' + raw)
          return null
        }
        return (num / hasPercent)
      }
      case 'boolean': {
        return ['true', 'yes', '1'].includes(raw.toLowerCase())
      }
      default: {
        return raw
      }
    }
  }

  /**
   * get raw data from a list of object as an array
   * @param {Object[]} raws
   * @param {string} fieldApi
   * @param {boolean} wrap
   * @return {string[]}
   */
   getAllValues(raws, fieldApi, wrap) {
    let objValues = new Set()
    let objField = this.mapping[fieldApi]
    if (!objField) { return [] }
    for (let raw of raws) {
      const val = raw.raw ? raw.raw[objField] : raw[objField]
      if (val) {
        objValues.add(wrap ? `'${val}'` : val)
      }
    }

    return [...objValues]
  }

  /**
   * @param {string} fieldApi
   */
   getHasMap(fieldApi) {
    return !!this.mapping[fieldApi]
  }

  /**
   * @param {Object} object
   * @param {string} field
   * @return {*}
   */
   getNestedField(object, field) {
    if (!field) { return null }
    if (!object) { return object }
    let lookups = Array.isArray(field) ? field : field.split('.');
    let thisField = lookups.shift();
    let nextObject = object[thisField];
    if (lookups.length === 0) {
      return nextObject;
    }
    return this.getNestedField(nextObject, Array.isArray(field) ? lookups : lookups.join('.'));
  }

  /**
   * get raw data by field
   * @param {Object} raw
   * @param {string} fieldApi
   * @return {string}
   */
   getValue(raw, fieldApi) {
    let objField = this.mapping[fieldApi]
    return raw.raw ? raw.raw[objField] : raw[objField]
  }

  /**
   * to inject name space
   * @param {string} field
   * @return {string}
   */
  namespace(field) {
    return this.namespaceString ? `${this.namespaceString}__${field}` : field
  }

  /**
   * @param {string} queryStr
   * @return {string}
   */
   namespaceQuery(queryStr) {
    let parts = queryStr.split(/[ ,.\n]/g)
    parts.forEach((p) => {
      if (p.endsWith('__c') || p.endsWith('__r')) {
        queryStr = queryStr.replace(new RegExp(`[ ]${p}`), ' ' + this.namespace(p))
        queryStr = queryStr.replace(new RegExp(`[,]${p}`), ',' + this.namespace(p))
        queryStr = queryStr.replace(new RegExp(`[.]${p}`), '.' + this.namespace(p))
      }
    })
    return queryStr
  }

  /**
   * @param {Object} newRev
   * @param {Object} oldRev
   */
   objectIsDiff(newObj, oldObj) {
    for (let field in newObj) {
      if (newObj[field] && newObj[field] != oldObj[field]) {
        return true
      }
    }
    return false
  }

  /**
   * supports parent custom fields and only Id, Name, and CreatedDate standard fields
   * @param {string} field
   * @return {string}
   */
  parentNamespace(field) {
    const standardFields = [
      'Id',
      'Name',
      'CreatedDate'
    ]
    let returnField = field

    if (this.namespaceString) {
      returnField = ''
      field.split('.').forEach(part => {
        returnField += standardFields.includes(part) ? `${part}.` : `${this.namespaceString}__${part}.`
      })

      returnField = returnField.substring(0, returnField.length - 1)
    }
  
    return returnField
  }

  randomGenerator(num = 20) {
    const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const baseLength = base.length;
    let res = ''
    for (let i = 0; i < num; i++) {
      res += base.charAt(Math.floor(Math.random() * baseLength))
    }
    return res
  }

  /**
   * set raw data value by field
   * NOTE: this will override the raw data for
   *   any class using the same row
   * @param {string} value
   * @param {Object} raw
   * @param {string} fieldApi
   */
  setValue(value, raw, fieldApi) {
    let objField = this.mapping[fieldApi]
    if (raw.raw) {
      raw.raw[objField] = value
    } else {
      raw[objField] = value
    }
  }


  // async functions

  /**
   * @param {string} objectName
   * @param {string} revIdString
   * @param {Object<string.string>} oldNewRevId
   * @return {Object[]}
   */
  async cloneObject(objectName, revIdString, oldNewRevId) {
    let qStr = this.namespaceQuery(`select Id from ${objectName} where Item_Revision__c in (${this.connection.QUERY_LIST})`)
    const objObjs = await this.connection.queryExtend(qStr, revIdString)
    const objIds = objObjs.map(r => r.Id)
    let objDetailObjs = await this.connection.retrieve(this.namespace(objectName), objIds)
    if (!objDetailObjs || !objDetailObjs.length) { return }
    const oldIds = objDetailObjs.map((obj) => obj.Id)
    for (let i = 0; i < objDetailObjs.length; i++) {
      const obj = objDetailObjs[i];

      obj[this.executor.ITEM_REVISION__C] = oldNewRevId[obj[this.executor.ITEM_REVISION__C]]
      if (!obj[this.executor.ITEM_REVISION__C]) {
        // missing new id (should never happen but this protect data)
        objDetailObjs[i] = null
        continue
      }
      obj.Id = null
      if (objectName != 'Document__c') {
        delete obj.Name
      }
      this.objNullOutMap[objectName].forEach((f) => {
        delete obj[this.namespace(f)]
      })
      this.objNullOutMap.systemFields.forEach((f) => {
        delete obj[f]
      })
      const fieldMap = this.executor.metadata[this.namespace(objectName)]
      if (fieldMap) {
        for (let field of Object.keys(fieldMap)) {
          if (!fieldMap[field].createable) {
            delete obj[field]
          }
        }
      }

    }
    objDetailObjs = objDetailObjs.filter((obj) => !!obj)
    let insertResult
    if (objectName != 'Document__c') {
      insertResult = await this.connection.insert(
        this.namespace(objectName),
        objDetailObjs
      )
    } else {
      insertResult = await this.connection.insertSlice(
        this.namespace(objectName),
        objDetailObjs,
        this.executor.batchSizeDoc
      )
    }

    const resMap = {}
    for (let i = 0; i < insertResult.length; i++) {
      const res = insertResult[i]
      const obj = objDetailObjs[i]
      if (res.id) {
        if (objectName == 'Assembly__c') {
          let key = `${obj[this.executor.ITEM__C]}-${obj[this.executor.ITEM_REVISION__C]}${obj[this.executor.SECONDARY_UNIQUE_KEY__C] ? '-' + obj[this.executor.SECONDARY_UNIQUE_KEY__C] : ''}`
          resMap[key] = res.id
        } else {
          resMap[obj[this.executor.PRIMARY_KEY__C]] = res.id
        }
      }
      if (!res.success) {
        this.executor.logs.push(new PropelLog({
          errors: res.errors.map((e) => '' + e),
          id: obj.Id,
          isInsert: true,
          objName: obj.Name,
          rowName: `${objectName} (New Draft)`,
          success: res.success,
        }))
      }
    }

    // price assy
    if (objectName == 'Assembly__c') {
      for (let i = 0; i < oldIds.length; i++) {
        if (insertResult[i].success) {
          this.executor.assyOldNewId[oldIds[i]] = insertResult[i].id
        }
      }
    }

    return resMap
  }
}

module.exports = PropelHelper
