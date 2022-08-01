import axios from 'axios';
import qs from 'query-string';

import { API_ROOT } from './constants';

const apiToken = window._env_.VMEETING_API_TOKEN;

export default class BaseAPI {
  constructor(token) {
    this._config = {
      headers: { Authorization: `Bearer ${token || apiToken}` },
    }
    this._path = '';
    this._route = '';
    this._query = {}
  }

  get path() {
    return `${API_ROOT}${this._route}${this._path}`;
  }

  get query() {
    const q = qs.stringify(this._query);
    return q ? `?${q}` : '';
  }

  toString = () => `${this.path}${this.query}`;

  create = data => axios.post(this.toString(), data, this._config);
  
  update = data => axios.patch(this.toString(), data, this._config);
  
  delete = data => axios.delete(this.toString(), data, this._config);
  
  get = () => axios.get(this.toString(), this._config);

  page = value => {
    this._query.page = value;
    return this;
  }

  pageSize = value => {
    this._query.limit = value || 10;
    return this;
  }

  pagination = bool => {
    this._query.pagination = bool;
    return this;
  }

  search = value => {
    if (value) {
        this._query.search = value;
    }
    return this;
  }

  delete_yn = value =>{
    this._query.delete_yn = value;
    return this;  
  }

  id = value => {
    this._path = `/${value}`;
    return this;
  };

  then = (successCallback, failureCallback) =>
    axios.get(this.toString(), this._config).then(successCallback, failureCallback);
}  
