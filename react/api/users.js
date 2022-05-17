import BaseAPI from "./BaseApi";

class User extends BaseAPI {
  _route = '/users';

  me = () => {
    this._path = '/me';
    return this;
  }
}  

export const users = token => new User(token);
