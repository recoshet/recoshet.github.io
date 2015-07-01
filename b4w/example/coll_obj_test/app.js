"use strict";
//Для отладки
var scene;
var phy;
var obj;
var trans;



if (b4w.module_check("shooter_gamme"))
    throw "Failed to register module: game_config";

b4w.register("shooter_gamme", function(exports, require) {

var m_app   = require("app");
var m_data  = require("data");
var m_main  = require("main");
var m_scs   = require("scenes");
var m_cons  = require("constraints");
var m_ctl   = require("controls");
var m_mouse = require("mouse");
var m_phy   = require("physics");
var m_trans = require("transform");
var m_obj   = require("objects");

var _coord;

var _is_pointerlock;


scene = m_scs;
phy = m_phy;
obj = m_obj;
trans = m_trans;

exports.init = function() {
    m_app.init({
        canvas_container_id: "canvas3d",
        callback: init_cb,
        show_fps:true,
        physics_uranium_path: "uranium.js",
        alpha: false
    });
}

function init_cb(canvas_elem, success) {

    if (!success) {
        console.log("b4w init failure");
        return;
    }

    m_app.enable_controls(canvas_elem);

    window.onresize = on_resize;
    on_resize();
    load();
}

function load() {
    m_data.load("scena1.json", load_cb);
}

function load_cb(data_id) {

    // enable rotation with mouse
    var canvas_elem = m_main.get_canvas_elem();
    canvas_elem.addEventListener("mouseup", function(e) {

        if (!_is_pointerlock)
            m_mouse.request_pointerlock(canvas_elem,
                function() {_is_pointerlock = true},
                function() {_is_pointerlock = false});
    }, false);


    //Ловим столкновения сферы и выводим в консоль
    var obj_sphere = m_scs.get_object_by_name('igrok');
    var sensor_collision = m_ctl.create_collision_sensor(obj_sphere, null, true);

    m_ctl.create_sensor_manifold(null, "COL", m_ctl.CT_SHOT, [sensor_collision], function(s){return s[0]},
        function(obj, id, pulse, param){
            //Получаем координаты столкновения, нормаль и пр.
            var collision_pt = m_ctl.get_sensor_payload(obj, id, 0);
            //Выводим в консоль объект, с которым столкнулись
            console.log(m_scs.get_object_name(collision_pt.coll_obj));

            //console.log({obj:obj, id:id, pulse:pulse, param:param});
        }
    );


    setup_movement();
}

function on_resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    m_main.resize(w, h);
};



function setup_movement() {

    var key_a = m_ctl.create_keyboard_sensor(m_ctl.KEY_A);
    var key_s = m_ctl.create_keyboard_sensor(m_ctl.KEY_S);
    var key_d = m_ctl.create_keyboard_sensor(m_ctl.KEY_D);
    var key_w = m_ctl.create_keyboard_sensor(m_ctl.KEY_W);
    var key_space = m_ctl.create_keyboard_sensor(m_ctl.KEY_SPACE);
    var key_shift = m_ctl.create_keyboard_sensor(m_ctl.KEY_SHIFT);

    var move_state = {
        left_right: 0,
        forw_back: 0
    }

    var move_array = [key_w, key_s, key_a, key_d, key_shift];

    // make camera follow the character
    var camobj = m_scs.get_active_camera();
    var character = m_scs.get_first_character();
    m_cons.append_stiff_trans(camobj, character, [0, 0.5, 0]);

    var move_cb = function(obj, id, pulse) {
        if (pulse == 1) {
            switch (id) {
            case "FORWARD":
                move_state.forw_back = 1;
                break;
            case "BACKWARD":
                move_state.forw_back = -1;
                break;
            case "LEFT":
                move_state.left_right = 1;
                break;
            case "RIGHT":
                move_state.left_right = -1;
                break;
            case "RUNNING":
                m_phy.set_character_move_type(obj, m_phy.CM_RUN);
                break;
            }
        } else {
            switch (id) {
            case "FORWARD":
            case "BACKWARD":
                move_state.forw_back = 0;
                break;
            case "LEFT":
            case "RIGHT":
                move_state.left_right = 0;
                break;
            case "RUNNING":
                m_phy.set_character_move_type(obj, m_phy.CM_WALK);
                break;
            }
        }

        m_phy.set_character_move_dir(obj, move_state.forw_back, move_state.left_right);
    };

    m_ctl.create_sensor_manifold(character, "FORWARD", m_ctl.CT_TRIGGER,
            move_array, function(s) {return s[0]}, move_cb);
    m_ctl.create_sensor_manifold(character, "BACKWARD", m_ctl.CT_TRIGGER,
            move_array, function(s) {return s[1]}, move_cb);
    m_ctl.create_sensor_manifold(character, "LEFT", m_ctl.CT_TRIGGER,
            move_array, function(s) {return s[2]}, move_cb);
    m_ctl.create_sensor_manifold(character, "RIGHT", m_ctl.CT_TRIGGER,
            move_array, function(s) {return s[3]}, move_cb);

    var running_logic = function(s) {
        return (s[0] || s[1] || s[2] || s[3]) && s[4];
    }
    m_ctl.create_sensor_manifold(character, "RUNNING", m_ctl.CT_TRIGGER,
            move_array, running_logic, move_cb);

    var jump_cb = function(obj, id, pulse) {
        m_phy.character_jump(obj);
    }
    m_ctl.create_sensor_manifold(character, "JUMP", m_ctl.CT_SHOT,
            [key_space], null, jump_cb);
}

});

b4w.require("shooter_gamme").init();
