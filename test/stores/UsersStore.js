import { observable, computed, action, toJS } from 'mobx'

export class User {
  id
  @observable firstName
  @observable lastName
  @computed get fullName() { return this.firstName + ' ' + this.lastName }

  constructor(data) {
    Object.assign(this, data)
  }
}

export class UsersStore {
  static model = User
  @observable collection = []
  @observable current = null

  @action load(state) {
    Object.assign(this, {
      ...state,
      collection: state.collection.map((item) => new this.constructor.model(item))
    })
  }

  fetch(item) {
    setTimeout(() => {
      this.add(item)
    }, 500)
  }

  @action add(item) {
    this.collection.push(new this.constructor.model(item))
    this.$buildReferences()
  }

  getById(id) {
    return this.collection.find((item) => item.id === id)
  }
}
