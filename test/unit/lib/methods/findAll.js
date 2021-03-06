'use strict'

const test = require('tap').test
const sinon = require('sinon')
const sinonStubPromise = require('sinon-stub-promise')
sinonStubPromise(sinon)

const findAllMethod = require('../../../../lib/methods/findAll').findAll
const server = require('../../../server')
const modelUtils = require('../../../../utils/modelUtils')
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

test('### findAll Call - Error Case ###', function (t) {
  const Model = arrow.getModel('Categories')

  const error = { message: 'Cannot find' }

  const ODataMethods = {
    findAll: (key) => {
      return Promise.reject(error)
    }
  }
  const findAllSpy = sinon.spy(ODataMethods, 'findAll')

  var getODataMethodsSpy = sinon.spy()
  getODataMethodsStub = function (modelName) {
    getODataMethodsSpy(modelName)
    return ODataMethods
  }

  findAllMethod.call(connector, Model, (err) => {
    t.ok(getODataMethodsSpy.calledOnce)
    t.ok(getODataMethodsSpy.calledWith('Categories'))
    t.ok(findAllSpy.calledOnce)
    t.ok(findAllSpy.calledWith(1000))
    t.equals(err, error)

    t.end()
  })
})

test('### findAll Call - Ok Case ###', function (t) {
  const Model = arrow.getModel('Categories')

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
      },
      {
        id: '78b7f3c8e1674727aaf2ebf0',
        Description: 'Drinks cat. 3',
        Name: 'Cat. 2',
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

  const ODataMethods = {
    findAll: (key) => {
      return Promise.resolve(result)
    }
  }
  const findAllSpy = sinon.spy(ODataMethods, 'findAll')

  var getODataMethodsSpy = sinon.spy()
  getODataMethodsStub = function (modelName) {
    getODataMethodsSpy(modelName)
    return ODataMethods
  }

  findAllMethod.call(connector, Model, (err, arg) => {
    t.equal(collectionUtilsStub.firstCall.args[0], Model)
    t.equal(collectionUtilsStub.firstCall.args[1], result.data)
    t.ok(getODataMethodsSpy.calledOnce)
    t.ok(getODataMethodsSpy.calledWith('Categories'))
    t.ok(findAllSpy.calledOnce)
    t.ok(findAllSpy.calledWith(1000))
    t.ok(collectionUtilsStub.calledOnce)
    t.ok(collectionUtilsStub.calledWith(Model, result.data))
    t.equals(err, null)
    t.equals(arg, collectionsWithInstances)

    collectionUtilsStub.restore()
    t.end()
  })
})

test('### Stop Arrow ###', function (t) {
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
