'use strict'

const test = require('tap').test
const sinon = require('sinon')
const sinonStubPromise = require('sinon-stub-promise')
sinonStubPromise(sinon)

const queryMethod = require('../../../../lib/methods/query').query
const server = require('../../../server')
const modelUtils = require('../../../../utils/modelUtils')
const validationUtils = require('../../../../utils/validationUtils')
var arrow
var connector

// Default fn
var getODataMethodsStub = () => { }

test('### Start Arrow ###', function (t) {
  const ODataMock = () => {
    return (modelName) => {
      return getODataMethodsStub(modelName)
    }
  }

  server()
    .then((inst) => {
      arrow = inst
      connector = arrow.getConnector('appc.odata')
      connector.OData = ODataMock()

      t.ok(arrow, 'Arrow has been started')
      t.end()
    })
    .catch((err) => {
      t.threw(err)
    })
})

test('### query Call - Error Case ###', function (t) {
  const Model = arrow.getModel('Categories')

  const error = { message: 'Cannot find' }
  const validateError = null

  const options = {}

  const validateQueryStub = sinon.stub(validationUtils, 'validateQuery').callsFake((options) => {
    return validateError
  })

  const ODataMethods = {
    query: (Model, options) => {
      return Promise.reject(error)
    }
  }

  const querySpy = sinon.spy(ODataMethods, 'query')

  var getODataMethodsSpy = sinon.spy()
  getODataMethodsStub = function (modelName) {
    getODataMethodsSpy(modelName)
    return ODataMethods
  }

  queryMethod.call(connector, Model, options, (err) => {
    t.ok(validateQueryStub.calledOnce)
    t.ok(validateQueryStub.calledWith(options))
    t.ok(getODataMethodsSpy.calledOnce)
    t.ok(getODataMethodsSpy.calledWith('Categories'))
    t.ok(querySpy.calledOnce)
    t.ok(querySpy.calledWith(Model, options))
    t.equals(err, error)

    validateQueryStub.restore()
    t.end()
  })
})

test('### query Call - Error Case with invalid options ###', function (t) {
  const Model = arrow.getModel('Categories')

  const error = { message: 'Invalid options' }
  const options = {}
  const result = {}

  const validateQueryStub = sinon.stub(validationUtils, 'validateQuery').callsFake((options) => {
    return error
  })

  const ODataMethods = {
    query: (Model, options) => {
      return Promise.resolve(result)
    }
  }

  const querySpy = sinon.spy(ODataMethods, 'query')

  var getODataMethodsSpy = sinon.spy()
  getODataMethodsStub = function (modelName) {
    getODataMethodsSpy(modelName)
    return ODataMethods
  }

  queryMethod.call(connector, Model, options, (err) => {
    t.ok(validateQueryStub.calledOnce)
    t.ok(validateQueryStub.calledWith(options))
    t.notOk(getODataMethodsSpy.calledOnce)
    t.notOk(getODataMethodsSpy.calledWith('Categories'))
    t.notOk(querySpy.calledOnce)
    t.notOk(querySpy.calledWith(Model, options))
    t.deepEquals(err, error)

    validateQueryStub.restore()
    t.end()
  })
})

test('### query Call - Ok Case ###', function (t) {
  const Model = arrow.getModel('Categories')

  const options = {}
  const validateError = null
  const result = {
    data: [
      {
        id: '58b7f3c8e1674727aaf2ebf0',
        Description: 'Drinks cat. 1',
        Name: 'Cat. 0',
        Products: []
      },
      {
        id: '68b7f3c8e1674727aaf2ebf0',
        Description: 'Drinks cat. 2',
        Name: 'Cat. 1',
        Products: []
      }
    ]
  }

  var collectionsWithInstances = result.data.map((item) => {
    const instance = Model.instance(item, true)
    instance.setPrimaryKey(item.id)

    return instance
  })

  const collectionUtilsStub = sinon.stub(modelUtils, 'createCollectionFromPayload').callsFake((Model, items) => {
    return collectionsWithInstances
  })

  const validateQueryStub = sinon.stub(validationUtils, 'validateQuery').callsFake((options) => {
    return validateError
  })

  const ODataMethods = {
    query: (Model, options) => {
      return Promise.resolve(result)
    }
  }

  const querySpy = sinon.spy(ODataMethods, 'query')

  var getODataMethodsSpy = sinon.spy()
  getODataMethodsStub = function (modelName) {
    getODataMethodsSpy(modelName)
    return ODataMethods
  }

  queryMethod.call(connector, Model, options, (err, arg) => {
    t.ok(validateQueryStub.calledOnce)
    t.ok(validateQueryStub.calledWith(options))
    t.equal(collectionUtilsStub.firstCall.args[0], Model)
    t.equal(collectionUtilsStub.firstCall.args[1], result.data)
    t.ok(getODataMethodsSpy.calledOnce)
    t.ok(getODataMethodsSpy.calledWith('Categories'))
    t.ok(querySpy.calledOnce)
    t.ok(querySpy.calledWith(Model, options))
    t.ok(collectionUtilsStub.calledOnce)
    t.ok(collectionUtilsStub.calledWith(Model, result.data))
    t.equals(err, null)
    t.equals(arg, collectionsWithInstances)

    validateQueryStub.restore()
    collectionUtilsStub.restore()
    t.end()
  })
})

test('### query Call - Ok Case with empty callback ###', function (t) {
  const Model = arrow.getModel('Categories')

  const validateError = null
  const result = {}
  const options = {}

  const validateQueryStub = sinon.stub(validationUtils, 'validateQuery').callsFake((options) => {
    return validateError
  })

  const ODataMethods = {
    query: (Model, options) => {
      return Promise.resolve(result)
    }
  }

  const querySpy = sinon.spy(ODataMethods, 'query')

  var getODataMethodsSpy = sinon.spy()
  getODataMethodsStub = function (modelName) {
    getODataMethodsSpy(modelName)
    return ODataMethods
  }

  queryMethod.call(connector, Model, options, (err, arg) => {
    t.ok(validateQueryStub.calledOnce)
    t.ok(validateQueryStub.calledWith(options))
    t.ok(getODataMethodsSpy.calledOnce)
    t.ok(getODataMethodsSpy.calledWith('Categories'))
    t.ok(querySpy.calledOnce)
    t.ok(querySpy.calledWith(Model, options))
    t.equals(err, undefined)
    t.equals(arg, undefined)

    validateQueryStub.restore()
    t.end()
  })
})

test('### Stop Arrow ###', function (t) {
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
