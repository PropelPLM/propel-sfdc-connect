import PropelHelper from '../lib/PropelHelper.js'

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
      
      expect(helper.connection).toBe('test');
      expect(helper.executor).toBe(null);
      expect(helper.mapping).toEqual(
        {
          My_Test_Field__c: 'My Test Field',
          Other_Api_Field__c: 'Other Api Field',
          id: 'Id',
          name: 'Name'
        }
      );
      expect(helper.namespaceString).toBe('TEST');
      expect(helper.options).toEqual({ id: 'test' });
    });
  });

  // buildQueryIds lets you get a single quote wrapped list of ids for sfdc queries
  describe('buildQueryIds', () => {
    it('return object test', () => {
      expect(helper.buildQueryIds(testList, 'Id')).toEqual([ "'1'", "'2'", "'3'", "'4'" ]);
    });
  });

  // formatter turns string into specified types
  describe('formatter', () => {
    it('return formater test', () => {
      expect(helper.formatter('double', '1.0') == 1.0).toBe(true); // 'number conversion fail'
      expect(helper.formatter('percent', '10.4') == 10.4).toBe(true); // 'percent conversion fail'
      expect(helper.formatter('boolean', 'FALSE')).toBe(false); // 'boolean conversion fail'
      expect(helper.formatter('joe mamma', '1.0')).toBe('1.0'); // 'default case conversion fail'
    })
  })

  describe('getAllValues', () => {
    it('return getAllValues test', () => {
      expect(helper.getAllValues(testList, 'id', false)).toEqual([ "1", "2", "3", "4" ]); // 'none wrapped list'
      expect(helper.getAllValues(testList, 'id', true)).toEqual([ "'1'", "'2'", "'3'", "'4'" ]); // 'wrapped list'
    })
  })

  describe('getHasMap', () => {
    it('return getHasMap', () => {
      expect(helper.getHasMap('id')).toBe(true); // 'mapping has: id'
      expect(helper.getHasMap('not_there')).toBe(false); // 'mapping does not have: not_there'
    })
  })

  describe('getNestedField', () => {
    it('return getNestedField', () => {
      expect(helper.getNestedField(nestedObj, ['id'])).toBe('666'); // 'array field'
    })
  })

  describe('getValue', () => {
    it('return getValue', () => {
      expect(helper.getValue(csvObj, 'My_Test_Field__c')).toBe('Some Value'); // 'getValue issue'
    })
  })

  describe('namespace', () => {
    it('return namespaece', () => {
      expect(helper.namespace('My_Test_Field__c')).toBe('TEST__My_Test_Field__c'); // 'namespace'
    })
  })

  describe('namespaceQuery', () => {
    it('return namespace query string', () => {
      expect(helper.namespaceQuery('select Id, My_Test_Field__c from Account')).toBe('select Id, TEST__My_Test_Field__c from Account'); //'namespaceQuery'
    })
  })

  describe('objectIsDiff', () => {
    it('return if object is different', () => {
      expect(helper.objectIsDiff(nestedObj, mappingObj)).toBe(true); // 'object is diff true')
      expect(helper.objectIsDiff(nestedObj, nestedObj)).toBe(false); // 'object is diff false')
    })
  })

  describe('parentNamespace', () => {
    it('return for parentNamespace', () => {
      expect(helper.parentNamespace('My_custom_object__r.My_custom_field__c')).toBe('TEST__My_custom_object__r.TEST__My_custom_field__c'); // 'parent namespace error'
    })
  })

  describe('randomGenerator', () => {
    it('return from randomGenerator', () => {
      expect(helper.randomGenerator().length).toBe(20); // 'error for randomGenerator'
      expect(helper.randomGenerator(2).length).toBe(2); // 'error for randomGenerator for custom length'
    })
  })

  describe('setValue', () => {
    it('return from setValue', () => {
      helper.setValue('New Value', csvObj, 'My_Test_Field__c')
      expect(csvObj['My Test Field']).toBe*('New Value'); // 'error on setValue'
    })
  })
});
