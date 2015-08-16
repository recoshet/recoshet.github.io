if (b4w.module_check("character"))
    throw "Failed to register module: character";

b4w.register("character", function(exports, require) {

var m_scs   = require("scenes");
var m_trans = require("transform");
var m_obj   = require("objects");
var m_phy   = require("physics");
var m_trans = require("transform");

var m_net   = require("network");
var m_ctl   = require("controls");
var html_h  = require("html_hud");

var _player;
var _health = 100;

exports.init_character = function(){

    _player = m_scs.get_object_by_name('Player');

    spawn_player();

    check_Character();

// Событие столкновения с персонажем

    var sensor_impulse = m_ctl.create_collision_impulse_sensor(_player);
    var sensor_collision_player = m_ctl.create_collision_sensor(_player, null, true);
    var impulse = 0;
    var obrabotchik_PuliVPlayer = function(s) {
        impulse = s[0];
        return s[1];
    }

    function sobitie_popadaniePuliVPlayer(obj, id, pulse, param) {

    //    console.log({obj:obj, id:id, pulse:pulse, param:param});
        var collision_pt = m_ctl.get_sensor_payload(obj, id, 1);
        console.log({obj:obj, id:id, pulse:pulse, param:param, collision_pt:collision_pt, impulse:impulse});

    }

    m_ctl.create_sensor_manifold(_player, "COLL_IN_PLAYER", m_ctl.CT_SHOT, [sensor_impulse, sensor_collision_player],
        obrabotchik_PuliVPlayer, sobitie_popadaniePuliVPlayer, 98);

/*
    var sensor_col = m_ctl.create_collision_impulse_sensor(player);
    var sensors = [sensor_col];

    var sila_udara;
    var logic_func = function(s) {
        if (s[0] > 0){
            sila_udara = s[0];
            return 1;
        }
        else
            return 0;
    }
*/
}

exports.heath_izm = function(izm){

    _health += izm * 1.5;

    html_h.setHealth(_health);

    if (_health <= 0) 
        spawn_player();
}



function spawn_player(){
    var PlayerSpawns_array = m_scs.get_object_children(m_scs.get_object_by_name('PlayerSpawns',1));
    
    var spawn = PlayerSpawns_array[getRandomInt(0,PlayerSpawns_array.length-1)];
    var position = m_trans.get_translation(spawn);
    var rotation = m_trans.get_rotation(spawn);

    position[1] += 1;

    m_trans.set_translation(_player, position[0], position[1], position[2]);
    m_trans.set_rotation(_player, rotation[0], rotation[1], rotation[2], rotation[3]);

    m_phy.apply_velocity(_player, 0, 0, 0);
    m_phy.set_transform(_player,position,rotation);

    _health = 100;
    sila_udara = 0;
    
    html_h.setHealth(_health);
}

// использование Math.round() даст неравномерное распределение!
function getRandomInt(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function check_Character(){
    var trans = m_trans.get_translation(_player);

    if (trans[1] < -20)
        spawn_player();
    //console.log(trans[1]);

    setTimeout(function(){check_Character()},1000);
}


});