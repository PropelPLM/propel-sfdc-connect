var assert = require('assert')

const PropelLog = require('../lib/PropelLog')

describe('PropelLog', () => {
  const log = new PropelLog('test')

  describe('constructor', () => {
    it('setup varibles should be set', () => {

      assert.equal(log.connection, 'test', 'connection was not set')
    })
  })

  describe('addToLogs', () => {
    log.addToLogs(
      [
        {
          errors: ['you have an issue', 'more issues'],
          Id: '1234',
          success: true
        }
      ],
      'My_object__c'
    )
    it('does addToLogs work?', () => {

      assert.equal(log.logs.length, 1, 'no add to logs')
    })
  })

  describe('_createEventId', () => {
    it('getting back an event Id', () => {

      assert.ok(log._createEventId().length > 0, 'event Id is null')
    })
  })
})
