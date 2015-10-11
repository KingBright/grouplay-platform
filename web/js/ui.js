/**
 * Created by jinliang on 15/9/28.
 */

showCreate = function () {
    $('#create_group').modal('show')
}

showExit = function () {
    $('#exit_group').modal('show')
}

checkCreateOptions = function () {
    var value = $('#player_number').dropdown('get value')
    var checked = $('#allow_spectators').checkbox('is checked')
    console.log("value set", value, "checked", checked)
    return {
        max: value,
        allowSpectator: checked
    }
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

test = function () {
    console.log("test")
}