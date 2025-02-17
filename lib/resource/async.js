"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.eachSeries = eachSeries;
exports.queue = queue;

function _noop() {}

function eachSeries(array, iterator, callback, deferNext) {
  var i = 0;
  var len = array.length;

  (function next(err) {
    if (err || i === len) {
      if (callback) {
        callback(err);
      }

      return;
    }

    if (deferNext) {
      setTimeout(() => {
        iterator(array[i++], next);
      }, 1);
    } else {
      iterator(array[i++], next);
    }
  })();
}

function onlyOnce(fn) {
  return function onceWrapper() {
    if (fn === null) {
      throw new Error("Callback was already called.");
    }

    var callFn = fn;
    fn = null;
    callFn.apply(this, arguments);
  };
}

function queue(worker, concurrency) {
  if (concurrency == null) {
    concurrency = 1;
  } else if (concurrency === 0) {
    throw new Error("Concurrency must not be zero");
  }

  var workers = 0;
  var q = {
    _tasks: [],
    concurrency,
    saturated: _noop,
    unsaturated: _noop,
    buffer: concurrency / 4,
    empty: _noop,
    drain: _noop,
    error: _noop,
    started: false,
    paused: false,

    push(data, callback) {
      _insert(data, false, callback);
    },

    kill() {
      workers = 0;
      q.drain = _noop;
      q.started = false;
      q._tasks = [];
    },

    unshift(data, callback) {
      _insert(data, true, callback);
    },

    process() {
      while (!q.paused && workers < q.concurrency && q._tasks.length) {
        var task = q._tasks.shift();

        if (q._tasks.length === 0) {
          q.empty();
        }

        workers += 1;

        if (workers === q.concurrency) {
          q.saturated();
        }

        worker(task.data, onlyOnce(_next(task)));
      }
    },

    length() {
      return q._tasks.length;
    },

    running() {
      return workers;
    },

    idle() {
      return q._tasks.length + workers === 0;
    },

    pause() {
      if (q.paused === true) {
        return;
      }

      q.paused = true;
    },

    resume() {
      if (q.paused === false) {
        return;
      }

      q.paused = false;

      for (var w = 1; w <= q.concurrency; w++) {
        q.process();
      }
    }

  };

  function _insert(data, insertAtFront, callback) {
    if (callback != null && typeof callback !== "function") {
      throw new Error("task callback must be a function");
    }

    q.started = true;

    if (data == null && q.idle()) {
      setTimeout(() => q.drain(), 1);
      return;
    }

    var item = {
      data,
      callback: typeof callback === "function" ? callback : _noop
    };

    if (insertAtFront) {
      q._tasks.unshift(item);
    } else {
      q._tasks.push(item);
    }

    setTimeout(() => q.process(), 1);
  }

  function _next(task) {
    return function next() {
      workers -= 1;
      task.callback.apply(task, arguments);

      if (arguments[0] != null) {
        q.error(arguments[0], task.data);
      }

      if (workers <= q.concurrency - q.buffer) {
        q.unsaturated();
      }

      if (q.idle()) {
        q.drain();
      }

      q.process();
    };
  }

  return q;
}
//# sourceMappingURL=async.js.map