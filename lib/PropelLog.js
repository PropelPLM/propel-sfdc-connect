class PropelLog {
    /**
     * @param {Object} args
     * {
     *   errors: {string},
     *   id: {string},
     *   isInsert: {boolean},
     *   objName: {string}, sobject name
     *   rowName: {string},
     *   success: {boolean},
     * }
     */
    constructor(args)  {
      this.description = ''
      this.errors = args.errors
      this.id = args.id
      this.isInsert = args.isInsert
      this.objName = args.objName
      this.rowName = args.rowName
      this.success = args.success
      this.warning = ''
    }
  }
  
  module.exports = PropelLog
  