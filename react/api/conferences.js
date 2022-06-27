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
}

export const conferences = token => new Conference(token);
