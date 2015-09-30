import _ from 'underscore';

import appDispatcher from '../dispatcher/app-dispatcher';
import createFields from '../helpers/create-fields';
import { EventEmitter as Events } from 'events';

export default new class GameStore extends Events {

  constructor() {
    super();
    /*
     * TODO: rethink about prepare here
     */
    this.prepare();
    this.bind();
  }

  data = {}

  get nextFieldGuess() {
    return _(this.data.fields)
      .chain()
      .where({ isMatched: false })
      .first()
      .value();
  }

  bind = () => {
      appDispatcher.register((action) => {
        switch (action.actionType) {
          case 'TRIAL': this.actionHandler(this.onActionTrial, action); break;
          case 'START': this.actionHandler(this.onActionStart, action); break;
        }
      });
  }

  prepare = () => {
    this.data = {
      fields: [],
      game: {
        isPlaying: false,
        timer: {
          minutes: 0,
          seconds: 0
        },
        lose: false,
        level: 0,
        wins: 0,
        lines: 5,
        size: 5,
      }
    }

    this.data.fields = createFields(this.data.game.lines, this.data.game.size);
  }

  actionHandler = (fn, action) => {
    fn(action);
    this.emitChange();
  }

  onActionStart = (action) => {
    this.prepare();
    this.data.game.isPlaying = true;

    let minutes
    let seconds;
    let duration = 5 * 60;

    let interval = setInterval(() => {

      minutes = parseInt(duration / 60, 10);
      seconds = parseInt(duration % 60, 10);

      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;

      this.data.game.timer.minutes = minutes;
      this.data.game.timer.seconds = seconds;
      this.emitChange();

      if (--duration < 0) {
        clearInterval(interval);
        fn();
      }

    }.bind(this), 1000);
  }

  onActionTrial = (action) => {
    if (this.isMatched(action.id)) {
      this.setMatched();
      // does the user win?
      return;
    }

    this.setGameOver();
  }

  setStart = () => {
    this.prepare();
  }

  setGameOver = () => {
    this.data.game.lose = true;
  }

  setMatched = () => {
    this.nextFieldGuess.isMatched = true;
  }

  isMatched = (id) => {
    return this.nextFieldGuess.id === id;
  }

  addChangeListener = (callback) => {
    this.on('change', callback);
  }

  removeChangeListener = (callback) => {
    this.removeChangeListener('change', callback);
  }

  emitChange = () => {
    this.emit('change');
  }
}
