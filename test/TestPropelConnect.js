const assert = require('assert')

const PropelConnect = require('../lib/PropelConnect')

describe('PropelConnect', function () {
  const conn = new PropelConnect(
    'mysample.salesforce.com',
    'test_session_id'
  )
  describe('constructor', function () {
    it('variables should be set', function () {
      assert.equal(conn.querySize, 200)
      assert.equal(conn.serverUrl, 'mysample.salesforce.com')
      assert.equal(conn.sessionId, 'test_session_id')
    })

    it('testing visual force url', function () {
      const conn = new PropelConnect(
        'http://mysample.visual.force.com',
        'test_session_id'
      )
      assert.equal(conn.serverUrl, 'visual.salesforce.com')
    })
  })
})
