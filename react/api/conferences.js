import BaseAPI from "./BaseApi";

class Conference extends BaseAPI {
  _route = '/conferences';
}  

export const conferences = () => new Conference();
