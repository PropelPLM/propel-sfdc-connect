var assert = require('assert');

const PropelHelper = require('../lib/PropelHelper');

const csvObj = {
  'My Test Field': 'Some Value',
  'Other Api Field': 'Some Other Value'
}
const mappingObj = {
  'id': 'Id',
  'name': 'Name',
  'My_Test_Field__c': 'My Test Field',
  'Other_Api_Field__c': 'Other Api Field',
}
const nestedObj = {
  'id': '666',
  'custom_field_1': 'test 1',
  'custom_field_2': 'test 2',
}
const testList = [
  { 'Id': '1', 'Name': 'Temp 1', 'My Test Field': 'test1' },
  { 'Id': '2', 'Name': 'Temp 2', 'My Test Field': 'test2' },
  { 'Id': '3', 'Name': 'Temp 3', 'My Test Field': 'test3' },
  { 'Id': '4', 'Name': 'Temp 4', 'My Test Field': 'test4' },
]

describe('PropelHelper', () => {
  const helper = new PropelHelper(
    'test', // enter in the connection
    mappingObj, // enter in the mapping obj
    'TEST', // enter in the namespace
    { id: 'test' } // enter in the options obj
  )
  describe('constructor', () => {
    it('variables should be set', () => {
      
      assert.equal(helper.connection, 'test')
      assert.equal(helper.executor, null)
      assert.deepEqual(
        helper.mapping,
        {
          My_Test_Field__c: 'My Test Field',
          Other_Api_Field__c: 'Other Api Field',
          id: 'Id',
          name: 'Name'
        }
      )
      assert.equal(helper.namespaceString, 'TEST')
      assert.deepEqual(helper.options, { id: 'test' })
    });
  });

  // buildQueryIds lets you get a single quote wrapped list of ids for sfdc queries
  describe('buildQueryIds', () => {
    it('return object test', () => {
      assert.deepEqual(
        helper.buildQueryIds(testList, 'Id'),
        [ "'1'", "'2'", "'3'", "'4'" ]
      )
    });
  });

  // formatter turns string into specified types
  describe('formatter', () => {
    it('return formater test', () => {
      assert.equal(helper.formatter('double', '1.0'), 1.0, 'number conversion fail')
      assert.equal(helper.formatter('percent', '10.4'), 10.4, 'percent conversion fail')
      assert.equal(helper.formatter('boolean', 'FALSE'), false, 'boolean conversion fail')
      assert.equal(helper.formatter('joe mamma', '1.0'), '1.0', 'default case conversion fail')
    })
  })

  describe('getAllValues', () => {
    it('return getAllValues test', () => {
      assert.deepEqual(helper.getAllValues(testList, 'id', false), [ "1", "2", "3", "4" ], 'none wrapped list')
      assert.deepEqual(helper.getAllValues(testList, 'id', true), [ "'1'", "'2'", "'3'", "'4'" ], 'wrapped list')
    })
  })

  describe('getHasMap', () => {
    it('return getHasMap', () => {
      assert.equal(helper.getHasMap('id'), true, 'mapping has: id')
      assert.equal(helper.getHasMap('not_there'), false, 'mapping does not have: not_there')
    })
  })

  describe('getNestedField', () => {
    it('return getNestedField', () => {
      assert.equal(helper.getNestedField(nestedObj, ['id']), '666', 'array field')
    })
  })

  describe('getValue', () => {
    it('return getValue', () => {
      assert.equal(helper.getValue(csvObj, 'My_Test_Field__c'), 'Some Value', 'getValue issue')
    })
  })

  describe('namespace', () => {
    it('return namespaece', () => {
      assert.equal(helper.namespace('My_Test_Field__c'), 'TEST__My_Test_Field__c', 'namespace')
    })
  })

  describe('namespaceQuery', () => {
    it('return namespace query string', () => {
      assert.equal(
        helper.namespaceQuery('select Id, My_Test_Field__c from Account'),
        'select Id, TEST__My_Test_Field__c from Account',
        'namespaceQuery'
      )
    })
  })

  describe('objectIsDiff', () => {
    it('return if object is different', () => {
      assert.equal(helper.objectIsDiff(nestedObj, mappingObj), true, 'object is diff true')
      assert.equal(helper.objectIsDiff(nestedObj, nestedObj), false, 'object is diff false')
    })
  })

  describe('parentNamespace', () => {
    it('return for parentNamespace', () => {
      assert.equal(
        helper.parentNamespace('My_custom_object__r.My_custom_field__c'),
        'TEST__My_custom_object__r.TEST__My_custom_field__c',
        'parent namespace error')
    })
  })

  describe('randomGenerator', () => {
    it('return from randomGenerator', () => {
      assert.equal(helper.randomGenerator().length, 20, 'error for randomGenerator')
      assert.equal(helper.randomGenerator(2).length, 2, 'error for randomGenerator for custom length')
    })
  })

  describe('setValue', () => {
    it('return from setValue', () => {
      helper.setValue('New Value', csvObj, 'My_Test_Field__c')
      assert.equal(csvObj['My Test Field'],'New Value', 'error on setValue')
    })
  })
});
