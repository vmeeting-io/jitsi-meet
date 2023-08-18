import BaseAPI from "./BaseApi";

class Post extends BaseAPI {
  _route = '/posts';

  site = val => {
    if (val) {
      this._query.site = val;
    }
    return this;
  }

  status = val => {
    if (val) {
      this._query.status = val;
    }
    return this;
  }

  type = val => {
    if (val) {
      this._query.type = val;
    }
    return this;
  }
}  

export const posts = () => new Post();
