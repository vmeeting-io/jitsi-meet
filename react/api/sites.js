import BaseAPI from "./BaseApi";

class Site extends BaseAPI {
  _route = '/sites';

  siteId = value => {
    if (value) {
      this._query.site_id = value;
    }
    return this;
  }
}  

export const sites = token => new Site(token);
