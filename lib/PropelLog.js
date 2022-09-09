class PropelLog {
    
    /**
     * @param {PropelConnect} connection
     */
    constructor(connection)  {
      this.connection = connection
      this.logs = []
      this.orgId = orgId
    }

    /**
     * 
     * @param {[object]} results sfdc api results
     * @param {string} sObjectName string name of the sobject
     */
    addToLogs(results, sObjectName) {
      results.forEach(result => {
        this.logs.push({
          errors: result.errors.map((e) => '' + e),
          record_id: result.Id,
          sobject_name: sObjectName,
          success: result.success,
        })
      })
    }

    /**
     * private function to create the event id for logging.
     */
    _createEventId() {
      return `${Date.now()}`
    }


    /**
     * send the log results to the org
     * 
     */
    async sendReport() {
      try {
        const res = await this.connection.uploadFile(this._createEventId(), this.logs)
        const reportRes = JSON.parse(res || '{}')
        if (!reportRes.success) {
          throw new Error('Fail to log file ' + JSON.stringify(reportRes))
        }
      } catch (e) {
        console.error(e.stack)
      }
    }
  }
  
  module.exports = PropelLog
  