var ReactRailsHotLoader = {
  since: null,
  port: 8082,
  host: window.location.hostname,
  shouldLog: true,

  start: function() {
    this._resetSince()
    var wsURL = "ws://" + this.host + ":" + this.port
    this.log("connecting to " + wsURL)
    this._socket = new WebSocket(wsURL)

    var _this = this

    this._socket.onopen =   function() { _this.log("connected") }
    this._socket.onclose =  function() { _this.log("disconnected") }

    this._socket.onmessage = function(message) {
      var changes = JSON.parse(message.data)
      _this.log("updating: " + changes.changed_file_names.join(", ") )
      changes.changed_asset_contents.forEach(function(jsCode) {
        try {
          eval.call(window, jsCode)
        } catch (err) {
          _this.log(err)
        }
      })
      ReactRailsUJS.mountComponents()
      _this._resetSince()
      _this.log("update finished")
    }

    this._interval = setInterval(function() {
      if (_this._socket.readyState == WebSocket.OPEN) {
        _this._socket.send(_this.since)
      } else {
        _this.log("WebSocket not ready, readyState: " + _this._socket.readyState)
      }
    }, 1500)
  },

  stop: function() {
    this._socket.close()
    clearInterval(this._interval)
  },

  _resetSince: function() {
    // Ruby prefers seconds.
    this.since = Date.now() / 1000
  },

  log: function(msg) {
    if (this.shouldLog) {
      console.log("[HotLoader] " + msg)
    }
  }
}

ReactRailsHotLoader.start()
