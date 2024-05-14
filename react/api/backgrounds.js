import BaseAPI from "./BaseApi";

class Background extends BaseAPI {
  _route = '/backgrounds';

}  

export const backgrounds = token => new Background(token);
