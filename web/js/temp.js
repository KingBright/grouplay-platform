$scope.groups = {}
$scope.joined
$scope.name = Cookies.get("name")
$scope.errorMsg = ""
$scope.updateGroups = function (info) {
    if (info.joined && info.joined != 'null') {
        $scope.joined = info.joined
    } else {
        $scope.joined = null
    }
    $scope.groups = info
}

$scope.myGroup = function () {
    return $scope.joined.host == $scope.name
}

$scope.canExit = function () {
    return $scope.joined.playing == false
}

$scope.canStart = function () {
    return $scope.joined.host == $scope.name && $scope.joined.current > 1 && $scope.joined.playing == false
}

$scope.canJoin = function (group) {
    return group.playing == false && group.current < group.limit && !$scope.joined
}

$scope.createGroup = function () {
    var options = checkCreateOptions()
    socks.createGroup(options.max, options.allowSpectator)
}

$scope.exitGroup = function () {
    var joined = $scope.groups.joined
    socks.exitGroup(joined.id)
}

$scope.joinGroup = function (id) {
    socks.joinGroup(id)
}

//TODO
$scope.spectateGroup = function (id) {
    console.log("spectate group", id)
}

$scope.dataUpdateCallback
// For game to register a callback
$scope.setDataUpdateCallback = function (callback) {
    if (callback) {
        console.log("Callback found in game", "onUpdateData")
    } else {
        console.log("No callback found in game", "onUpdateData")
    }
    $scope.dataUpdateCallback = callback
}
// For game to transact with server
$scope.doGameAction = function (action, data) {
    socks.updateData(action, data)
}

$scope.register = function (name) {
    if (!name && name == "") {
        name = $scope.name
    }
    console.log("register", name)
    socks.register(name)
}

$scope.startGame = function (id) {
    socks.startGame(id)
}

$scope.loadGamePage = function (pathToPage) {
    //TODO for now
    if (!pathToPage) {
        pathToPage = "quoridor.html"
    }
    if ($scope.joined) {
        $scope.joined.playing = true
        $scope.gamePage = pathToPage
    }
    console.log("load page", pathToPage)
}

$scope.canShowGamePage = function () {
    return $scope.joined && $scope.joined.playing == true && $scope.gamePage
}

// Socket
var socks = {}
socks.REGISTER = "register"
socks.CREATE_GROUP = "create_group"
socks.JOIN_GROUP = "join_group"
socks.EXIT_GROUP = "exit_group"
socks.GROUP_UPDATE = "group_update"

socks.START_GAME = "start_game"
socks.UPDATE_DATA = "update_data"

socks.sock = new SockJS(':8081/grouplay')
socks.sock.onopen = function () {
    console.log("socket opened")
    var name = $scope.name
    if (name && name != '') {
        socks.register(name)
    } else {
        askForName()
    }
}

socks.sock.onmessage = function (e) {
    if (e.data) {
        var json = JSON.parse(e.data)
        socks.receiveMessage(json)
    }
}
socks.sock.onclose = function () {
    console.log("socket close")
}

socks.sendMessage = function (cmd, msg, confirm) {
    var json = {
        cmd: cmd,
        msg: JSON.stringify(msg),
        confirm: confirm
    }
    this.sock.send(JSON.stringify(json))
    console.log("send :", cmd, "body :", msg, "confirm :", confirm)
}

socks.receiveMessage = function (json) {
    console.log("receive", json.cmd, "message body :", json.msg)
    var cmd = json.cmd
    var info
    if (json.msg) {
        info = JSON.parse(json.msg)
    } else {
        info = {
            msg: "No message from server."
        }
    }
    if (json.confirm == true) {
        if (info.ok == false) {
            $scope.errorMsg = info.msg
            console.log("error message", info.msg)
            $interval(showErrorMsg(), 0, 1);
            if (cmd == this.REGISTER) {
                askForName()
            }
            return;
        }
    }

    switch (cmd) {
        case this.REGISTER:
        {
            //Save session & name to cookies
            Cookies.set("session", info.id)
            Cookies.set("name", info.name)
            break;
        }
        case this.GROUP_UPDATE:
        {
            socks.onGroupUpdate(info)
            break;
        }
        case this.START_GAME:
        {
            $interval($scope.loadGamePage("quoridor.html"), 0, 1)
            break;
        }
        case this.UPDATE_DATA:
        {
            $interval(function () {
                if (!$scope.gamePage) {
                    askForGameRestore()
                } else {
                    console.log("data received", info)
                    if ($scope.dataUpdateCallback) {
                        $scope.dataUpdateCallback(info)
                    }
                }
            }, 1000, 1)
            break;
        }
    }
}
socks.register = function (name) {
    var id = Cookies.get("session")
    this.sendMessage(this.REGISTER, {
        id: id,
        name: name
    }, false)
}
socks.getGroupList = function () {
    this.sendMessage(this.GROUP_UPDATE, "", false)
}
socks.createGroup = function (max, allowSpectator) {
    this.sendMessage(this.CREATE_GROUP, {
        max: parseInt(max),
        allowSpectator: allowSpectator
    }, false)
}
socks.joinGroup = function (id) {
    this.sendMessage(this.JOIN_GROUP, {
        groupId: id
    }, false)
}
socks.exitGroup = function (id) {
    console.log("exit from group", id)
    this.sendMessage(this.EXIT_GROUP, {
        groupId: id
    }, false)
}

socks.startGame = function (id) {
    this.sendMessage(this.START_GAME, {
        groupId: id
    }, false)
}

socks.onGroupUpdate = function (info) {
    $interval($scope.updateGroups(info), 0, 1);
}
socks.updateData = function (action, data) {
    this.sendMessage(this.JOIN_GROUP, {
        action: action,
        data: data
    }, false)
}




// Socket
var socks = {}
socks.REGISTER = "register"
socks.CREATE_GROUP = "create_group"
socks.JOIN_GROUP = "join_group"
socks.EXIT_GROUP = "exit_group"
socks.GROUP_UPDATE = "group_update"

socks.START_GAME = "start_game"
socks.UPDATE_DATA = "update_data"

socks.sock = new SockJS(':8081/grouplay')
socks.sock.onopen = function () {
    console.log("socket opened")
    var name = $scope.name
    if (name && name != '') {
        socks.register(name)
    } else {
        askForName()
    }
}

socks.sock.onmessage = function (e) {
    if (e.data) {
        var json = JSON.parse(e.data)
        socks.receiveMessage(json)
    }
}
socks.sock.onclose = function () {
    console.log("socket close")
}

socks.sendMessage = function (cmd, msg, confirm) {
    var json = {
        cmd: cmd,
        msg: JSON.stringify(msg),
        confirm: confirm
    }
    this.sock.send(JSON.stringify(json))
    console.log("send :", cmd, "body :", msg, "confirm :", confirm)
}

socks.receiveMessage = function (json) {
    console.log("receive", json.cmd, "message body :", json.msg)
    var cmd = json.cmd
    var info
    if (json.msg) {
        info = JSON.parse(json.msg)
    } else {
        info = {
            msg: "No message from server."
        }
    }
    if (json.confirm == true) {
        if (info.ok == false) {
            $scope.errorMsg = info.msg
            console.log("error message", info.msg)
            $interval(showErrorMsg(), 0, 1);
            if (cmd == this.REGISTER) {
                askForName()
            }
            return;
        }
    }

    switch (cmd) {
        case this.REGISTER:
        {
            //Save session & name to cookies
            Cookies.set("session", info.id)
            Cookies.set("name", info.name)
            break;
        }
        case this.GROUP_UPDATE:
        {
            socks.onGroupUpdate(info)
            break;
        }
        case this.START_GAME:
        {
            $interval($scope.loadGamePage("quoridor.html"), 0, 1)
            break;
        }
        case this.UPDATE_DATA:
        {
            $interval(function () {
                if (!$scope.gamePage) {
                    askForGameRestore()
                } else {
                    console.log("data received", info)
                    if ($scope.dataUpdateCallback) {
                        $scope.dataUpdateCallback(info)
                    }
                }
            }, 1000, 1)
            break;
        }
    }
}
socks.register = function (name) {
    var id = Cookies.get("session")
    this.sendMessage(this.REGISTER, {
        id: id,
        name: name
    }, false)
}
socks.getGroupList = function () {
    this.sendMessage(this.GROUP_UPDATE, "", false)
}
socks.createGroup = function (max, allowSpectator) {
    this.sendMessage(this.CREATE_GROUP, {
        max: parseInt(max),
        allowSpectator: allowSpectator
    }, false)
}
socks.joinGroup = function (id) {
    this.sendMessage(this.JOIN_GROUP, {
        groupId: id
    }, false)
}
socks.exitGroup = function (id) {
    console.log("exit from group", id)
    this.sendMessage(this.EXIT_GROUP, {
        groupId: id
    }, false)
}

socks.startGame = function (id) {
    this.sendMessage(this.START_GAME, {
        groupId: id
    }, false)
}

socks.onGroupUpdate = function (info) {
    $interval($scope.updateGroups(info), 0, 1);
}
socks.updateData = function (action, data) {
    this.sendMessage(this.JOIN_GROUP, {
        action: action,
        data: data
    }, false)
}
