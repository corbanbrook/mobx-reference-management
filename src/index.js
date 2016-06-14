import { autorun, transaction } from 'mobx'

export const referenceManager = (stores, schema) => {
  let waitingReferences = []
  const waitForReference = (item, refKey, key) => {
    console.log("Waiting for reference")
  }

  const buildReferences = (storeKey) => {
    return (stateStart = null) => {
      const { collectionKey, belongsTo, hasMany, hasOne, asNestedTree } = schema[storeKey]
      const store = stores[storeKey]

      const collection = store[collectionKey]

      if (collection) {
        collection.forEach((item) => {
          item.$refs = schema[storeKey]

          if (belongsTo) {
            Object.keys(belongsTo).forEach((refKey) => {
              const options = belongsTo[refKey]
              const refSchema = schema[options.store]
              const refStore = stores[options.store]
              const refCollection = refStore[refSchema.collectionKey]
              const refItem = refCollection.find((refItem) => refItem[options.key] === item[refKey][options.key])

              if (refItem) {
                item[refKey] = refItem
              } else {
                Object
                waitForReference(item, refKey, item[refKey][options.key])
              }
            })
          }

          if (hasMany) {
            Object.keys(hasMany).forEach((refKey) => {
              const options = hasMany[refKey]
              const refSchema = schema[options.store]
              const refStore = stores[options.store]

              if (typeof options.get === 'function') {
                item[refKey] = options.get(refStore).bind(refStore)(item.id)
              }
            })
          }

          if (hasOne) {
            Object.keys(hasOne).forEach((refKey) => {
              const options = hasOne[refKey]
              const refSchema = schema[options.store]
              const refStore = stores[options.store]

              if (typeof options.get === 'function') {
                item[refKey] = options.get(refStore).bind(refStore)(item.id)
              }
            })
          }

          if (asNestedTree) {
            Object.keys(asNestedTree).forEach((refKey) => {
              const options = asNestedTree[refKey] || {}

              if (item[refKey]) {
              }
            })
          }
        })
      }
    }
  }

  Object.keys(stores).forEach(key => stores[key].$buildReferences = buildReferences(key))

  return stores
}

export const serialize = (obj) => {
  const seen = []

  return JSON.parse(JSON.stringify(obj, function(key, value) {
    if (value && value.$refs) {
      const { belongsTo, hasMany, hasOne } = value.$refs

      let result = {...value}

      delete result.$refs

      if (belongsTo) {
        Object.keys(belongsTo).forEach((refKey) => {
          const options = belongsTo[refKey]
          if (result[refKey]) {
            result[refKey] = {[options.key]: value[refKey][options.key]}
          }
        })
      }

      if (hasMany) {
        Object.keys(hasMany).forEach((refKey) => {
          const options = hasMany[refKey]
          if (result[refKey]) {
            delete result[refKey]
          }
        })
      }

      if (hasOne) {
        Object.keys(hasOne).forEach((refKey) => {
          const options = hasOne[refKey]
          if (result[refKey]) {
            delete result[refKey]
          }
        })
      }

      return result
    }

    if (value && typeof value == 'object') {
      if (seen.indexOf(value) >= 0) {
        throw new Error(key + ' is circular')
      }
      seen.push(value)
    }

    return value
  }))
}

export const deserialize = (stores, state, loadStateHandler) => {
  transaction(() => {
    // First pass - deserialize data into stores
    Object.keys(stores).forEach((storeKey) => {
      let store = stores[storeKey]

      if (state[storeKey] && typeof loadStateHandler === 'function') {
        loadStateHandler(store, state[storeKey])
      }
    })

    // 2nd pass - Build references for deserialized data
    Object.keys(stores).forEach((storeKey) => stores[storeKey].$buildReferences())
  })
}
