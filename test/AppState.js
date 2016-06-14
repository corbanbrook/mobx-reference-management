import { observable, toJS } from 'mobx'
import { referenceManager, serialize, deserialize } from '../src'
import { HubsStore, UsersStore, PostsStore } from './stores'

const schema = {
  hubs: {
    collection: {
      type: Array,
      belongsTo: {
        user: { store: 'users', key: 'id', get: store => store.getById }
      },
      hasMany: {
        posts: { store: 'posts', key: 'id', get: store => store.filterByHubId }
      }
    },
    collectionKey: 'collection',
    belongsTo: {
      user: { store: 'users', key: 'id', get: store => store.getById }
    },
    hasMany: {
      posts: { store: 'posts', key: 'id', get: store => store.filterByHubId }
    }
  },
  posts: {
    collection: {
      type: Array,
      belongsTo: {
        user: { store: 'users', key: 'id', get: store => store.getById },
        hub: { store: 'hubs', key: 'id', get: store => store.getById }
      }
    },
    collectionKey: 'collection',
    belongsTo: {
      user: { store: 'users', key: 'id', get: store => store.getById },
      hub: { store: 'hubs', key: 'id', get: store => store.getById }
    },
    asNestedTree: {
      children: null,
      contributions: null
    }
  },
  users: {
    collection: {
      type: Array,
      hasMany: {
        posts: { store: 'posts', key: 'id', get: store => store.filterByUserId },
        hubs: { store: 'hubs', key: 'id', get: store => store.filterByUserId }
      }
    },
    collectionKey: 'collection',
    hasMany: {
      posts: { store: 'posts', key: 'id', get: store => store.filterByUserId },
      hubs: { store: 'hubs', key: 'id', get: store => store.filterByUserId }
    }
  }
}

export class AppState {
  @observable stores = {}

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
