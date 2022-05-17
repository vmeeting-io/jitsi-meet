import BaseAPI from "./BaseApi";

class Conference extends BaseAPI {
  _route = '/conferences';
}  

export const conferences = token => new Conference(token);
