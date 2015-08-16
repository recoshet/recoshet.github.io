"use strict";

if (b4w.module_check("network"))
    throw "Failed to register module: network";

b4w.register("network", function(exports, require) {

var m_scs   = require("scenes");
var m_trans = require("transform");
var m_obj   = require("objects");
var m_shoot = require("shoot");
var m_cons  = require("constraints");
var m_main  = require("main");

//Настройки сети
var FRAME_RATE_V_SEK = 20;
var TICK_REFRESH = 60;  // сетевых Кадров в секунду
var INFELICITY = 120;    //Пропускаем слишком частые кадры



//Переменные для реализации интерполяции
var _uptime;
//Объект сетевого фрейма
var _net_frame = {
    time_interpol:0,
    time_interpol_old:0,
    set_time:function(time){
        this.time_interpol_old = this.time_interpol;
        this.time_interpol = time;
    },
    uptime: 0,
    uptime_old: 0,
    buffer: [],
    buffer_old: [],
    drawBuffer: [],
    schet_allRefresh: 0,
    add:function(data){
        this.buffer.push(data);
    },
    new_frame:function(){
        //Проверяем на спам от сервера при плохом соединении
        if(Math.abs((_uptime - this.uptime) - TICK_REFRESH) < INFELICITY){

            this.uptime_old = this.uptime;
            this.uptime = _uptime;
            this.buffer_old = this.buffer;

            if(typeof this.buffer.translation == 'object' && this.schet_allRefresh <= TICK_REFRESH){
                this.buffer_old.translation = [];
                this.buffer_old.translation.push(this.drawBuffer.translation[0]);
                this.buffer_old.translation.push(this.drawBuffer.translation[1]);
                this.buffer_old.translation.push(this.drawBuffer.translation[2]);
                this.schet_allRefresh++;
            }
            else if(typeof this.buffer.translation == 'object' && this.schet_allRefresh >= TICK_REFRESH){
                this.schet_allRefresh = 0;
                this.buffer_old.translation = [];
                this.buffer_old.translation[0] = this.buffer.translation[0];
                this.buffer_old.translation[1] = this.buffer.translation[1];
                this.buffer_old.translation[2] = this.buffer.translation[2];
                
            }
            else{
                this.buffer_old.translation = [];
                this.buffer_old.translation[0] = 0;
                this.buffer_old.translation[1] = 0;
                this.buffer_old.translation[2] = 0; 
            }
            this.buffer = [];
        }
    }
};

var players = [];
var players_mesh = [];
exports.players = players;

exports.userId = Math.random() * (20000 - 1) + 1;
exports.SERVER_HOST = 'http://95.215.110.178:8091';
exports.FRAME_RATE = 1000 /FRAME_RATE_V_SEK; //30 фреймов в секунду

function socket_concstruct() {
    var socket = io.connect(exports.SERVER_HOST);
    //var socket = io.connect('http://127.0.0.1:8090');
    socket.on('requestPosition', function (packet) {
        //Переключаем буфер буфер
        _net_frame.new_frame();
        //Приняли от сервера текущую картину позиций игроков
        for (var key in packet.data){
            if (key.toString() != exports.userId.toString()){
                _net_frame.add(packet.data[key]);
                
                //drawDataServer(packet.data[key]);
            }
        }
        _net_frame.set_time();
    });
    socket.on('requestPula', function (data) {
        //console.log(data.data.data);
        var position = data.packet.position;
        var rotation = data.packet.rotation;

        if (exports.userId == data.packet.id)
          var is_strelok = true;
        else
          var is_strelok = false;

        //Отправляем нашу пулю

        m_shoot.add_pula(false, position, rotation, is_strelok);
        
    });
    socket.on('clearPlayer', function (data) {
        clearPlayers();
    });
    
    return socket;
}
exports.socket = socket_concstruct();

function netRefresh(){
    var character = m_scs.get_object_by_name('Player');
    //console.log(m_trans.get_translation(character));
    var packet = {};
    packet.id = exports.userId;
    packet.translation = m_trans.get_translation(character);
    packet.rotation = m_trans.get_rotation(character);
    exports.socket.emit('getMotion', packet);
}

exports.init_network = function(){
    setInterval(function(){netRefresh(exports.socket)}, exports.FRAME_RATE);
    m_main.set_render_callback(network_interpolation);
}

function drawDataServer(data){
    var sushestvuet = false;
    var objects = m_scs.get_all_objects("MESH");

    var rotation = data.rotation;
    var translation = data.translation;

    for(var i=0; i<objects.length; i++) {
        //console.log(data);
        if (m_scs.get_object_name(objects[i]) == 'PlayerNetworkColl' + data.id.toString()) sushestvuet = true;
    }

    if (sushestvuet){
        var PlayerNetworkColl = m_scs.get_object_by_name('PlayerNetworkColl' + data.id.toString());

        m_trans.set_translation(PlayerNetworkColl, translation[0], translation[1], translation[2]);
        m_trans.set_rotation(PlayerNetworkColl, rotation[0], rotation[1], rotation[2], rotation[3]);

        PlayerNetworkColl.date_create = new Date();
    }
    else{
        var PlayerNetworkColl = m_scs.get_object_by_name("PlayerNetworkColl");
        var PlayerNetworkColl_new = m_obj.copy(PlayerNetworkColl, 'PlayerNetworkColl' + data.id.toString(), true);

        var PlayerNetworkMesh = m_scs.get_object_by_name("PlayerNetworkMesh");
        var PlayerNetworkMesh_new = m_obj.copy(PlayerNetworkMesh, "PlayerNetworkMesh" + data.id.toString());

        var OFFSET = new Float32Array([0, 0, 0]);

        m_scs.append_object(PlayerNetworkColl_new);
        m_scs.append_object(PlayerNetworkMesh_new);

        m_cons.append_stiff(PlayerNetworkMesh_new, PlayerNetworkColl_new, OFFSET);

        m_trans.set_translation(PlayerNetworkColl_new, translation[0], translation[1], translation[2]);
        m_trans.set_rotation(PlayerNetworkColl_new, rotation[0], rotation[1], rotation[2], rotation[3]);

        PlayerNetworkColl_new.date_create = _uptime;

        players.push(PlayerNetworkColl_new);
        players_mesh.push(PlayerNetworkMesh_new);

    }
}

function clearPlayers(){

    console.log('clear');

    for(var i=0; i<players.length; i++) {

        m_scs.remove_object(players[i]);
        m_scs.remove_object(players_mesh[i]);
        players.splice(i,1);
        players_mesh.splice(i,1);

    }
}

exports.send_shoot = function(character, position, rotation, type){
  var packet = {};

  packet.id = exports.userId;
  packet.position = position;
  packet.rotation = rotation;

  exports.socket.emit('getPula', {packet:packet});
}



function network_interpolation(delta, time){
    _uptime = time;
    

    for (var i = _net_frame.buffer.length - 1; i >= 0; i--) {

        if(_net_frame.buffer_old.length == 0){
            _net_frame.drawBuffer[i] = _net_frame.buffer[i];
            break; //Отдаём данные без обработки Уходим если данные пустые
        }
        
        _net_frame.drawBuffer[i] = [];
        //анесём id игрока
        _net_frame.drawBuffer[i].id = _net_frame.buffer[i].id;

        //Вычисляем нужное нам время для показа
        var real_time = _uptime - (_net_frame.uptime - _net_frame.uptime_old);
        //console.log(real_time);
        //Повороты
        _net_frame.drawBuffer[i].rotation = _net_frame.buffer[i].rotation;

        //Интерполируем 3 координаты перемещения
        _net_frame.drawBuffer[i].translation = [];
        _net_frame.drawBuffer[i].translation[0] = exec_interpolation(
            _net_frame.uptime_old,
            _net_frame.uptime,
            _net_frame.buffer_old[i].translation[0],
            _net_frame.buffer[i].translation[0],
            real_time
        );
        
        _net_frame.drawBuffer[i].translation[1] = exec_interpolation(
            _net_frame.uptime_old,
            _net_frame.uptime,
            _net_frame.buffer_old[i].translation[1],
            _net_frame.buffer[i].translation[1],
            real_time
        );

        _net_frame.drawBuffer[i].translation[2] = exec_interpolation(
            _net_frame.uptime_old,
            _net_frame.uptime,
            _net_frame.buffer_old[i].translation[2],
            _net_frame.buffer[i].translation[2],
            real_time
        );



        var propusk = false;
        for (var k = _net_frame.drawBuffer[i].translation.length - 1; k >= 0; k--) {
            if (isNaN(_net_frame.drawBuffer[i].translation[k] && !propusk)){
                propusk = true;
                break;
            }
        };

        if(!propusk)
            if(real_time <= _net_frame.uptime_old || real_time >= _net_frame.uptime)
                propusk = true;


        //console.log(drawBuffer[i].translation);

        

        //_net_frame.buffer[i];

    };

    if (!propusk)
        for (var i = _net_frame.drawBuffer.length - 1; i >= 0; i--) {
            drawDataServer(_net_frame.drawBuffer[i]);
        };

}

function exec_interpolation(x0,x2,fx0,fx2,x1){
    var fx1 = fx0 + (fx2 - fx0) * (x1 - x0) / (x2 - x0);
    
    //console.log('formula x0=' + x0 +'   x1='+x1 +' x2='+x2 +' fx0='+fx0 +'   fx1='+fx1 +' fx2='+fx2);
    //console.log(fx1);
    return fx1;
}

});