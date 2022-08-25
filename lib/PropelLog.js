class PropelLog {
    /**
     * @param {string} rowName
     * @param {string} objName
     * @param {boolean} success
     * @param {boolean} isInsert
     */
    constructor(objName, id, rowName, success, errors, isInsert)  {
      this.objName = objName
      this.id = id
      this.rowName = rowName
      this.success = success
      this.isInsert = isInsert
      this.description = ''
      this.warning = ''
      this.errors = errors
    }
  }
  
  module.exports = PropelLog
  