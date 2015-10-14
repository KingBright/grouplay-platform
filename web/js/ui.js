/**
 * Created by jinliang on 15/9/28.
 */

showCreate = function () {
    $('#create_group').modal('show')
}

showExit = function () {
    $('#exit_group').modal('show')
}

showErrorMsg = function () {
    $('#error_msg').modal('show')
}

askForName = function () {
    $('#set_name').modal('setting', {closable: false}).modal('show')
}

askForGameRestore = function () {
    $('#restore_game').modal('setting', {closable: false}).modal('show')
}

askForStop = function () {
    $('#stop_game').modal('setting', {closable: false}).modal('show')
}

showGameFinish = function() {
    $('#game_finish').modal('setting', {closable: false}).modal('show')
}
hostStop = function() {
    $('#host_stop').modal('setting', {closable: false}).modal('show')
}

test = function () {
    console.log("test")
}