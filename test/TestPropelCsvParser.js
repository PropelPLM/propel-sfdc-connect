const assert = require('assert');

const PropelCsvParser = require('../lib/PropelParser');

const csvString = 'name,id\ntester,1\nmore_tester,2'

describe('PropelCsvParser', () => {
  const propelParse = new PropelCsvParser(csvString)
  describe('constructor', () => {
    it('variables should be set', () => {
      assert.ok(propelParse.data != null, 'this.data was not set')
    })
  })

  describe('parseCsv', () => {
    propelParse.parseCsv()
    it('parseCsv will populate this.nodes', () => {
      assert.ok(propelParse.nodes.length == 2, 'this.nodes was not populated')
    })
  })
})
