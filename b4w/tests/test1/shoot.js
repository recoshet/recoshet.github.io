if (b4w.module_check("shoot"))
    throw "Failed to register module: shoot";

b4w.register("shoot", function(exports, require) {

var m_scs   = require("scenes");
var m_trans = require("transform");
var m_obj   = require("objects");
var m_phy   = require("physics");
var m_net   = require("network");
var m_ctl   = require("controls");
var m_decal  = require("decal");



var m_char  = require("character");




exports.init_shoot = function(){
    
}

exports.shoot = function (){
    var character = m_scs.get_object_by_name('Camera');

    position = m_trans.get_translation(character);
    rotation = m_trans.get_rotation(character);

    m_net.send_shoot(false, position, rotation);
    //exports.add_pula(character);
}

exports.add_pula = function (character,position,rotation,is_strelok){

    var date = new Date();
    if (is_strelok)
        var pula = m_scs.get_object_by_name("Pula");
    else
        var pula = m_scs.get_object_by_name("Pula_set");

    var new_name =  "pula"+date.getTime().toString();
    var pula_new = m_obj.copy(pula, new_name, true);
    
    if (character){
        position = m_trans.get_translation(character);
        rotation = m_trans.get_rotation(character);
    }

    m_trans.set_translation(pula_new, position[0], position[1], position[2]);
    m_trans.set_rotation(pula_new, rotation[0], rotation[1], rotation[2], rotation[3]);
    m_trans.move_local(pula_new, 0, -1, 0);
    m_scs.append_object(pula_new);

    

    m_phy.apply_velocity(pula_new, 0, -50, 0);

    var _player_id = 82939;
    var impulse;

    var obrabotchik_PuliVColl = function(s) {
        impulse = s[0];
        return s[1];
    }


    function sobitie_popadaniePuliVColl(obj, id, pulse, param) {
        var collision_pt = m_ctl.get_sensor_payload(obj, id, 1);
        //console.log({obj:obj, id:id, pulse:pulse, param:param, collision_pt:collision_pt, impulse:impulse});
        

        if (impulse >= 0 && !collision_pt.coll_obj){
            m_decal.add_decal_by_sensor_payload('dec_sled',collision_pt);
            
        }

        remove_pula(pula_new, 100);
    }

    var obrabotchik_PuliVPlayer = function(s) {
        _impulse = s[0];
        return s[1];
    }

    function sobitie_popadaniePuliVPlayer(obj, id, pulse, param) {
        var collision_pt = m_ctl.get_sensor_payload(obj, id, 1);
        //console.log({obj:obj, id:id, pulse:pulse, param:param, collision_pt:collision_pt, impulse:impulse});

        m_char.heath_izm(-impulse);

        remove_pula(pula_new, 1);
    }

    var sensor_impulse = m_ctl.create_collision_impulse_sensor(pula_new);
    var sensor_collision_coll = m_ctl.create_collision_sensor(pula_new, null, true);
    var sensor_collision_player = m_ctl.create_collision_sensor(pula_new, 'PLAYER');
    //var sensor_collision = m_ctl.create_collision_sensor(pula_new, null, true);

    m_ctl.create_sensor_manifold(pula_new, "PULA_IN_COLL", m_ctl.CT_SHOT, [sensor_impulse, sensor_collision_coll],
        obrabotchik_PuliVColl, sobitie_popadaniePuliVColl, _player_id);
    
    m_ctl.create_sensor_manifold(pula_new, "PULA_IN_PLAYER", m_ctl.CT_SHOT, [sensor_impulse, sensor_collision_player],
        obrabotchik_PuliVPlayer, sobitie_popadaniePuliVPlayer, _player_id);

    /*m_ctl.create_sensor_manifold(pula_new, "PULA_IN_COLL", m_ctl.CT_CONTINUOUS, [sensor_collision],
        null, sobitie_popadaniePuliVColl, _player_id);*/

    remove_pula(pula_new, 30000);
}

function remove_pula(pula,delay){

    setTimeout(function(){
        if (!m_scs.check_object(pula)) return;

        if (m_ctl.check_sensor_manifold(pula, "COLLISION"))
            m_ctl.remove_sensor_manifold(pula, "COLLISION");

        m_scs.remove_object(pula);

    }, delay);

}

});