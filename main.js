var net             = require('net'),
    sockets         = [],
    commands        = {},
    defaults        = {},
    filters         = {},
    servers         = {},
    BB_DEFAULT_PORT = 51980,
    BB_DEFAULT_HOST = '127.0.0.1';

function BootBoy(uid, port, host) {
  this.uid = uid;
  this.port = port;
  this.host = host;

  defaults[this.uid] = undefined;
  filters[this.uid]  = function (data, next) {
    return data;
  };
}

function uid() {
  function part() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return part() + part() + '-' + part() + part();
}

function netRespond(socket, counter, response) {
  if (sockets.indexOf(socket) === -1) {
    socket.destroy();
  } else {
    socket.write(response + '\n');

    if (--counter === 0) {
      setImmediate(socket.end.bind(socket));
    }
  }
}

function register(name, handler) {
  var command, config, myCommands;

  commands[this.uid] = myCommands = commands[this.uid] || {};

  if (typeof name === 'string' && name.length > 0) {
    command = {
      handlers: []
    };

    config = myCommands[name];
    config = myCommands[name] = config || command;

    if (typeof handler === 'function') {
      config.handlers.push(handler.bind.bind(handler, this));
    }
  }
}

BootBoy.prototype.default = function (handler) {
  if (typeof handler === 'function') {
    defaults[this.uid] = handler.bind.bind(handler, this);
  }
};

BootBoy.prototype.filter = function (fn) {
  if (typeof fn === 'function') {
    filters[this.uid] = fn.bind(this);
  }
};

BootBoy.prototype.learn = function (command, handler) {
  register.call(this, command, handler);
};

BootBoy.prototype.listen = function () {
  var me = this;

  if (servers[this.uid]) {
    return;
  }

  servers[this.uid] = net.createServer(function (socket) {
    sockets.push(socket);

    socket.setEncoding('utf8');

    socket.on('data', function (data) {
      var command, config, handlers, handler, counter;

      data    = data.trim();
      data    = data.split('\n');
      command = data.shift();
      data    = data.join('\n');
      config  = commands[me.uid][command] || {};

      try {
        data = filters[me.uid]({
          command: command,
          payload: data
        });
      } catch (err) {
        setImmediate(netRespond.bind(null, socket, 1, err.message));

        return;
      }

      handlers = config.handlers || [];
      handlers = handlers.slice();
      counter  = 0;

      if (handlers.length === 0) {
        if (defaults[me.uid]) {
          setImmediate(defaults[me.uid](data, netRespond.bind(null, socket, 1)));
        } else {
          setImmediate(socket.end.bind(socket));
        }
      }

      while (handler = handlers.shift()) {
        setImmediate(handler(data, netRespond.bind(null, socket, ++counter)));
      }
    });

    socket.on('error', function (err) {
      // no-op
    });

    socket.on('close', function (err) {
      sockets = sockets.filter(function (socket) {
        return socket !== this;
      }, this);

      if (err) {
        this.destroy()
      }
    });
  }).listen(this.port, this.host);
};

module.exports.hire = function (port, host) {
  port = port || BB_DEFAULT_PORT;
  host = host || BB_DEFAULT_HOST;

  return new BootBoy(uid(), port, host);
};
