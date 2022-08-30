class PropelLog {
    /**
     * @param {string} errors
     * @param {string} id
     * @param {boolean} isInsert
     * @param {string} objName
     * @param {string} rowName
     * @param {boolean} success
     *
     */
    constructor(errors, id, isInsert, objName, rowName, success)  {
      this.description = ''
      this.errors = errors
      this.id = id
      this.isInsert = isInsert
      this.objName = objName
      this.rowName = rowName
      this.success = success
      this.warning = ''
    }

    /**
     * 
     * @param {string} orgId
     * @return {string} eventId
     */
    createEventId(orgId) {
      return `${Date.now()}_${orgId}`
    }
  }
  
  module.exports = PropelLog
  