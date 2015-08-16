if (b4w.module_check("chat"))
    throw "Failed to register module: chat";

b4w.register("chat", function(exports, require) {

var m_net   = require("network");
var html_h  = require("html_hud");

var userId = m_net.userId;
var socket = m_net.socket;

exports.init_chat = function(){

    $('#chat_input').keypress(function(e){
        var code = e.keyCode || e.which;
        if(code == 13) {
            sendText($(this).val());
            $(this).val('');
        }
    });

    socket.on('requestChatText', function (packet) {
        exports.addTextChat(packet.text, packet.userId);
    });
    socket.on('requestChatTextSystem', function (packet) {
        exports.addTextChat(packet, null, true);
    });

}

exports.addTextChat = function(text, userId, system){
    text = htmlEncode(text); //Защита от XSS
    if (system)
        $('#chat_text').append('<p class="system">'+text+'</p>');
    else
        $('#chat_text').append('<p><strong>> '+parseFloat(userId).toFixed(2)+'...:</strong> '+text+'</p>');
}

function sendText(text){
    var packet = {text:text, userId:userId};
    socket.emit('sendChatText', packet);
}

exports.ubratFocus = function(){
    $('#chat_input').blur();
}

function htmlEncode(value){
    if (value) {
        return jQuery('<div />').text(value).html();
    } else {
        return '';
    }
}

});