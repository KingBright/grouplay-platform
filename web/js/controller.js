var grouplay = angular.module('grouplay', []);

grouplay.controller('grouplay-ctrl', ['$scope', 'grouplay-socks', function ($scope, socks) {
    socks.setScope($scope)

    $scope.groups = {}
    $scope.joined
    $scope.myInfo
    $scope.name = Cookies.get("name")
    $scope.errorMsg = ""

    $scope.gameList
    $scope.game
    $scope.playerNumber
    $scope.allowSpectator = true

    $scope.updateGroups = function (info) {
        if (info.joined && info.joined != 'null') {
            $scope.joined = info.joined
            $scope.game = info.joined.game
        } else {
            $scope.joined = null
        }
        $scope.myInfo = info.myInfo
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
        console.log("createGroup")
        socks.createGroup($scope.game.name, parseInt($scope.playerNumber), $scope.allowSpectator)
    }

    $scope.couldCreate = function () {
        if (!$scope.game) {
            console.log("game not set")
            return false
        }
        console.log("game", $scope.game)
        if (!$scope.game.name) {
            console.log("game name not set")
            return false
        }
        console.log("game name", $scope.game.name)
        if (!$scope.playerNumber) {
            console.log("number empty")
            return false
        }
        console.log("playerNumber", $scope.playerNumber)
        if (parseInt($scope.playerNumber) < 2) {
            console.log("player number not valid")
            return false
        }
        console.log("playerNumber", parseInt($scope.playerNumber))
        return true
    }

    $scope.exitGroup = function () {
        var joined = $scope.groups.joined
        socks.exitGroup(joined.id)
    }

    $scope.joinGroup = function (id) {
        socks.joinGroup(id)
    }

    $scope.spectateGroup = function (id) {
        console.log("spectate group", id)
    }

    $scope.dataUpdateCallback
    // For game to register a callback
    $scope.setDataUpdateCallback = function () {
        if (onUpdateData) {
            console.log("Callback found in game")
            $scope.dataUpdateCallback = onUpdateData
        } else {
            console.log("No callback found in game")
        }

        if (setDataSender) {
            console.log("Set data sender for game")
            setDataSender($scope.doGameAction)
        } else {
            console.log("Data sender can not be set")
        }
        socks.getGameData()
    }
    // For game to transact with server
    $scope.doGameAction = function (action, data) {
        socks.playerAction(action, data)
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

    $scope.loadGamePage = function () {
        if ($scope.joined) {
            $scope.joined.playing = true
            if ($scope.game && $scope.game.url) {
                $scope.gamePage = $scope.game.url
                console.log("load page", $scope.game.url)
            }
        }
    }

    $scope.canShowGamePage = function () {
        return $scope.joined && $scope.joined.playing == true && $scope.myInfo.ingame == true && $scope.gamePage
    }

    $scope.refreshGameData = function () {
        socks.getGameData()
    }

    $scope.quitGame = function () {
        socks.quitGame()
    }

    $scope.getGameList = function () {
        socks.getGameList()
    }

    $scope.log = function (msg) {
        console.log(msg)
    }
}]);


grouplay.factory('grouplay-socks', ['$interval', function ($interval) {
    // Socket
    var socks = {}
    socks.REGISTER = "register"
    socks.CREATE_GROUP = "create_group"
    socks.JOIN_GROUP = "join_group"
    socks.EXIT_GROUP = "exit_group"
    socks.GROUP_UPDATE = "group_update"

    socks.START_GAME = "start_game"
    socks.UPDATE_DATA = "update_data"
    socks.GET_DATA = "get_data"
    socks.PLAYING = "playing"
    socks.PLAYER_ACTION = "player_action"
    socks.QUIT_GAME = "quit_game"
    socks.GAME_FINISH = "game_finish"
    socks.HOST_STOP = "host_stop"

    socks.GET_GAME_LIST = "get_game_list"

    socks.init = function () {
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
                $interval(socks.receiveMessage(json), 0, 1)
            }
        }
        socks.sock.onclose = function () {
            console.log("socket close")
        }
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
                showErrorMsg()
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
            case this.PLAYING:
            {
                askForGameRestore()
                break;
            }
            case this.START_GAME:
            {
                $scope.myInfo.ingame = true
                $scope.loadGamePage()
                break;
            }
            case this.UPDATE_DATA:
            {
                console.log("data received", info)
                if ($scope.dataUpdateCallback) {
                    $scope.dataUpdateCallback(info)
                }
                break;
            }
            case this.GAME_FINISH:
            {
                showGameFinish()
                break;
            }
            case this.HOST_STOP:
            {
                hostStop()
                break;
            }
            case this.GET_GAME_LIST:
            {
                $scope.gameList = info
                showCreate()
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
    socks.createGroup = function (game, max, allowSpectator) {
        this.sendMessage(this.CREATE_GROUP, {
            game: game,
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

    socks.getGameData = function () {
        this.sendMessage(this.GET_DATA, {}, false)
    }

    socks.getGameList = function () {
        this.sendMessage(this.GET_GAME_LIST, {}, false)
    }

    socks.onGroupUpdate = function (info) {
        $scope.updateGroups(info)
    }
    socks.playerAction = function (action, data) {
        this.sendMessage(this.PLAYER_ACTION, {
            action: action,
            data: JSON.stringify(data)
        }, false)
    }

    socks.quitGame = function () {
        this.sendMessage(this.QUIT_GAME, {}, false)
    }

    var $scope
    socks.setScope = function (scope) {
        $scope = scope
        socks.init()
    }

    return socks
}]);