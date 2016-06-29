import { observable, toJS, action, useStrict } from 'mobx'
import { referenceManager, serialize, deserialize } from '../src'
import { HubsStore, UsersStore, PostsStore } from './stores'

useStrict(true)

// import { list, map, child, ref }

const schema = {
  hubs: {
    collection: {
      type: Array,
      belongsTo: {
        user: { store: 'users', key: 'id', get: store => store.getById }
      },
      hasMany: {
        posts: { store: 'posts', collection: 'collection', key: 'id', get: store => store.filterByHubId }
      }
    }
  },
  posts: {
    collection: {
      type: Array,
      belongsTo: {
        user: { store: 'users', key: 'id', get: store => store.getById },
        hub: { store: 'hubs', key: 'id', get: store => store.getById }
      }
    }
  },
  users: {
    collection: {
      type: Array,
      hasMany: {
        posts: { store: 'posts', collection: 'collection', key: 'id', get: store => store.filterByUserId },
        hubs: { store: 'hubs', collection: 'collection', key: 'id', get: store => store.filterByUserId }
      }
    }
  }
}

export class AppState {
  stores = {}

  constructor(stores) {
    this.stores = referenceManager(stores, schema)
  }

  fromJS(state) {
    deserialize(this.stores, state, (store, state) => store.load(state))
  }

  toJS() {
    return serialize(toJS(this.stores))
  }
}
