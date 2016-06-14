import { observable, action, toJS } from 'mobx'

export class Hub {
  id
  @observable name

  constructor(data) {
    Object.assign(this, data)
  }
}

export class HubsStore {
  static model = Hub

  @observable collection = []
  @observable current = null

  load(state) {
    Object.assign(this, {
      ...state,
      collection: state.collection.map((item) => new this.constructor.model(item))
    })
  }

  add(item) {
    this.collection.push(new this.constructor.model(item))
    this.$buildReferences(this.collection[this.collection.length - 1])
  }

  getById(id) {
    return this.collection.find((item) => item.id === id)
  }

  filterByUserId(userId) {
    return this.collection.filter((item) => item.user.id === userId)
  }
}
