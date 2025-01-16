import PropelLog  from '../lib/PropelLog';

describe('PropelLog', () => {
  const log = new PropelLog('test')

  describe('constructor', () => {
    it('setup varibles should be set', () => {

      expect(log.connection).toBe('test'); // 'connection was not set'
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

      expect(log.logs.length).toBe(1); // 'no add to logs')
    })
  })

  describe('_createEventId', () => {
    it('getting back an event Id', () => {

      expect(log._createEventId().length > 0).toBe(true); // 'event Id is null')
    })
  })
})
