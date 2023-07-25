import axios from 'axios';
import BaseAPI from "./BaseApi";

class Conference extends BaseAPI {
  _route = '/conferences';

  meetingId = value => {
    if (value) {
      this._query.meeting_id = value;
    }
    return this;
  }

  name = value => {
    if (value) {
      this._query.name = value;
    }
    return this;
  }

  site = value => {
    if (typeof value !== 'undefined') {
      this._query.site = value;
    }
    return this;
  }

  checkPassword = password => {
    if (this._path === '') {
      console.error('ERROR: conference id is needed.');
      return this;
    }

    return axios.post(`${this.toString()}/check-password`, { password }, this._config);
  }
}

export const conferences = token => new Conference(token);
