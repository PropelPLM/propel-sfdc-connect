class PropelLog {
    
    /**
     * @param {string} orgId 
     */
    constructor(orgId)  {
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
        this.logs.push(propelConnect.newLog(
          result.errors.map((e) => '' + e),
          result.Id,
          sObjectName,
          result.success,
        ))
      })
    }

    /**
     * private function to create the event id for logging.
     */
    _createEventId() {
      this.eventId = `${Date.now()}_${this.orgId}`
    }


    /**
     * send the log results to the org
     * 
     */
    async sendReport() {
      try {
        const res = await this.service.uploadFile(this._createEventId(), this.logs)
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
  