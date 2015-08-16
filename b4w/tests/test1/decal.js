if (b4w.module_check("decal"))
    throw "Failed to register module: decal";

b4w.register("decal", function(exports, require) {

var m_scs   = require("scenes");
var m_util  = require("util");
var m_vec3  = require("vec3");
var m_tsr   = require("tsr");
var m_quat  = require("quat");
var m_obj   = require("objects");
var m_trans = require("transform");

var decal_num = 0;
var decal_src;
var decal_tsr = m_tsr.create();
var obj_tsr = m_tsr.create();
var decal_rot = m_quat.create();

exports.init_decal = function(){

}

exports.add_decal_by_sensor_payload = function(decal_name, collision_pt){
	decal_src = m_scs.get_object_by_name(decal_name);

	//Копируем декаль в место удара
    var decal = m_obj.copy(decal_src, "decal" + String(++decal_num), false);
    m_scs.append_object(decal);

    //m_vec3.normalize(collision_pt.coll_norm,collision_pt.coll_norm);
    m_vec3.scaleAndAdd(collision_pt.coll_pos, collision_pt.coll_norm, collision_pt.coll_dist, collision_pt.coll_pos);

    m_tsr.set_trans(collision_pt.coll_pos, decal_tsr);

    m_quat.rotationTo(m_util.AXIS_Y, collision_pt.coll_norm, decal_rot);
    m_trans.set_rotation_v(decal, decal_rot);
    m_tsr.set_quat(decal_rot, decal_tsr);

    m_trans.set_tsr(decal, decal_tsr);

    console.log({
        pos1:collision_pt.coll_pos[0],
        pos2:collision_pt.coll_pos[1],
        pos3:collision_pt.coll_pos[2],
        pos4:collision_pt.coll_pos[3],
        norm1:collision_pt.coll_norm[0],
        norm2:collision_pt.coll_norm[1],
        norm3:collision_pt.coll_norm[2],
        norm4:collision_pt.coll_norm[3],
        coll_dist:collision_pt.coll_dist,
        collision_pt:collision_pt
    });
}

});
