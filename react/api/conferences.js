import BaseAPI from "./BaseApi";

class Conference extends BaseAPI {
  _route = '/conferences';

  name = value => {
    if (value) {
      this._query.name = value;
    }
    return this;
  }
}

export const conferences = token => new Conference(token);
