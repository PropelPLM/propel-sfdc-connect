import PropelCsvParser from '../lib/PropelParser';

const csvString = 'name,id\ntester,1\nmore_tester,2'

describe('PropelCsvParser', () => {
  const propelParse = new PropelCsvParser(csvString)
  describe('constructor', () => {
    it('variables should be set', () => {
      expect(propelParse.data != null).toBe(true); //'this.data was not set'
    })
  })

  describe('parseCsv', () => {
    propelParse.parseCsv()
    it('parseCsv will populate this.nodes', () => {
      expect(propelParse.nodes.length).toBe(2); // 'this.nodes was not populated'
    })
  })
})
