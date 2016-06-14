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

  load(state) {
    Object.assign(this, {
      ...state,
      collection: state.collection.map((item) => new this.constructor.model(item))
    })
  }

  add(item) {
    this.collection.push(new this.constructor.model(item))
  }

  getById(id) {
    return this.collection.find((item) => item.id === id)
  }
}
