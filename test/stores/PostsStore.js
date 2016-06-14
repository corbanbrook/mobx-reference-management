import { observable, action, toJS } from 'mobx'

export class PostFragment {
  constructor(data) {
    Object.assign(this, data)
  }
}

export class Contribution {
  constructor(data) {
    Object.assign(this, data)
  }
}

export class Post {
  id
  @observable title
  @observable body
  @observable children = []
  @observable contributions = []

  constructor(data) {
    Object.assign(this, {
      ...data,
      children: (data.children || []).map((child) => new PostFragment(child)),
      contributions: (data.contributions || []).map((contribution) => new Contribution(contribution))
    })
  }
}

export class PostsStore {
  static model = Post
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

  filterByHubId(hubId) {
    return this.collection.filter((item) => item.hub.id === hubId)
  }

  filterByUserId(userId) {
    return this.collection.filter((item) => item.user.id === userId)
  }
}
