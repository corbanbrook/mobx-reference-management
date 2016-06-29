import { autorun, transaction } from 'mobx'

export const referenceManager = (stores, schema) => {
  let waitingReferences = []
  const waitForReference = (item, refKey, key) => {
    waitingReferences.push({item, refKey, key})
  }

  // const connectRef = (refKey, value) => {
  //   let connected = []
  //   waitingReferences.forEach((wait, idx) => {
  //     if (wait.refKey == refKey && wait.key == value.key) {
  //       wait.item.buildRefs()
  //       connected.push(idx)
  //     }
  //   })
  //   connected.forEach((idx) => {
  //     waitingRefs.splice(idx, 1)
  //   })
  // }

  const buildStoreReferences = (storeKey) => {
    const store = stores[storeKey]
    const storeSchema = schema[storeKey]

    Object.keys(storeSchema).forEach((schemaKey) => {
      const schemaItem = storeSchema[schemaKey]
      const { belongsTo, hasMany, hasOne } = schemaItem

      if (schemaItem.type === Array) {
        const collection = store[schemaKey]

        if (collection) {
          collection.forEach((item) => {
            item.$refs = schemaItem

            if (belongsTo) {
              Object.keys(belongsTo).forEach((refKey) => {
                const options = belongsTo[refKey]
                const refStore = stores[options.store]
                const refItem = options.get(refStore).bind(refStore)(item[refKey].id)

                if (refItem) {
                  item[refKey] = refItem
                } else {
                  waitForReference(item, refKey, item[refKey][options.key])
                }
              })
            }

            if (hasMany) {
              Object.keys(hasMany).forEach((refKey) => {
                const options = hasMany[refKey]
                const refStore = stores[options.store]

                if (typeof options.get === 'function') {
                  item[refKey] = options.get(refStore).bind(refStore)(item.id)
                }
              })
            }

            if (hasOne) {
              Object.keys(hasOne).forEach((refKey) => {
                const options = hasOne[refKey]
                const refStore = stores[options.store]

                if (typeof options.get === 'function') {
                  item[refKey] = options.get(refStore).bind(refStore)(item.id)
                }
              })
            }
          })
        }
      } else {
        console.log("Have not implemented this yet! Only supports collections of models")
      }
    })
  }

  // Set a reference to the resource on the model
  Object.defineProperty(stores, '$buildReferences', {
    enumerable: false,
    value: () => {
      Object.keys(stores).forEach(buildStoreReferences)
    }
  });

  Object.keys(stores).forEach(storeKey => stores[storeKey].$buildReferences = stores.$buildReferences.bind(stores))

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
            result[refKey] = {[options.key || 'id']: value[refKey][options.key || 'id']}
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
    stores.$buildReferences()
  })
}
