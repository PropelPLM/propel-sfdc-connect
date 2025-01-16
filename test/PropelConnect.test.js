import PropelConnect from '../lib/PropelConnect';

describe('PropelConnect', function () {
  const conn = new PropelConnect(
    'mysample.salesforce.com',
    'test_session_id'
  )
  describe('constructor', function () {
    it('variables should be set', function () {
      expect(conn.querySize).toBe(200);
      expect(conn.serverUrl).toBe('mysample.salesforce.com');
      expect(conn.sessionId).toBe('test_session_id');
    })

    it('testing visual force url', function () {
      const conn = new PropelConnect(
        'http://mysample.visual.force.com',
        'test_session_id'
      )
      expect(conn.serverUrl).toBe('visual.salesforce.com');
    })
  })
})
