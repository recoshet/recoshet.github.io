"use strict";




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
var m_conf   = require("config");

var m_net   = require("network");
var m_shoot = require("shoot");
var m_decal  = require("decal");
var m_char  = require("character");
var m_chat  = require("chat");

var _is_pointerlock;

var keyPresed = {
    keyForward:false,
    keyBackward:false,
    triggerForwardBackward:0,
    keyLeft:false,
    keyRight:false,
    triggerLeftRight:0,
    setKeyForward : function(stat){this.keyForward = stat; this.triggerForwardBackward = 1},
    setKeyBackward : function(stat){this.keyBackward = stat; this.triggerForwardBackward = -1},
    setKeyLeft : function(stat){this.keyLeft = stat; this.triggerLeftRight = 1},
    setKeyRight : function(stat){this.keyRight = stat; this.triggerLeftRight = -1},
    getForwardBackward : function(){
        if (this.keyForward && !this.keyBackward && this.triggerForwardBackward == 1) return 1;
        else if (this.keyForward && this.keyBackward && this.triggerForwardBackward == -1) return -1;
        else if (this.keyForward && !this.keyBackward && this.triggerForwardBackward == -1) return 1;

        else if (!this.keyForward && this.keyBackward && this.triggerForwardBackward == -1) return -1;
        else if (this.keyForward && this.keyBackward && this.triggerForwardBackward == 1) return 1;
        else if (!this.keyForward && this.keyBackward && this.triggerForwardBackward == 1) return -1;

        else if (!this.keyForward && !this.keyBackward) return 0;
    },
    getLeftRight : function(){
        if (this.keyLeft && !this.keyRight && this.triggerLeftRight == 1) return 1;
        else if (this.keyLeft && this.keyRight && this.triggerLeftRight == -1) return -1;
        else if (this.keyLeft && !this.keyRight && this.triggerLeftRight == -1) return 1;

        else if (!this.keyLeft && this.keyRight && this.triggerLeftRight == -1) return -1;
        else if (this.keyLeft && this.keyRight && this.triggerLeftRight == 1) return 1;
        else if (!this.keyLeft && this.keyRight && this.triggerLeftRight == 1) return -1;

        else if (!this.keyLeft && !this.keyRight) return 0;
    }
}

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
    load_logick();
}

function load_logick() {
    //m_data.load("level_de_dust2.json", load_cb);
    m_data.load("logik.json", load_level);
}

function load_level(data_id) {
    //m_data.load("logik.json", load_level);
    m_data.load("level_de_dust2.json", load_cb, null, true);
}


function load_cb(data_id) {
    init_overlay();

    //console.log(data_id);
    // make camera follow the character
    var camobj = m_scs.get_active_camera();
    var character = m_scs.get_first_character();
    m_cons.append_stiff_trans(camobj, character, [0, 0.2, 0]);

    // enable rotation with mouse
    var canvas_elem = m_main.get_canvas_elem();
    canvas_elem.addEventListener("mouseup", function(e) {

        m_chat.ubratFocus();

        if (!_is_pointerlock)
            m_mouse.request_pointerlock(canvas_elem,
                function() {_is_pointerlock = true},
                function() {_is_pointerlock = false});
    }, false);

    setup_movement();

    m_net.init_network();
    m_shoot.init_shoot();
    m_decal.init_decal();
    m_char.init_character();
    m_chat.init_chat();

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

    document.addEventListener("click", function(e) {
        m_shoot.shoot();
    }, false);

    var move_state = {
        left_right: 0,
        forw_back: 0
    }

    var move_array = [key_w, key_s, key_a, key_d, key_shift];
    var character = m_scs.get_first_character();

    var move_cb = function(obj, id, pulse) {

        //Устанавливаем состояние кнопок
        if (pulse == 1) {
            switch (id) {
            case "FORWARD":
                keyPresed.setKeyForward(true);
                break;
            case "BACKWARD":
                keyPresed.setKeyBackward(true);
                break;
            case "LEFT":
                keyPresed.setKeyLeft(true);
                break;
            case "RIGHT":
                keyPresed.setKeyRight(true);
                break;
            }
        } else {
            switch (id) {
            case "FORWARD":
                keyPresed.setKeyForward(false);
                break;
            case "BACKWARD":
                keyPresed.setKeyBackward(false);
                break;
            case "LEFT":
                keyPresed.setKeyLeft(false);
                break;
            case "RIGHT":
                keyPresed.setKeyRight(false);
                break;
            }
        }

        move_state.forw_back = keyPresed.getForwardBackward();
        move_state.left_right = keyPresed.getLeftRight();

        if (pulse == 1 && id == 'RUNNING')
            m_phy.set_character_move_type(obj, m_phy.CM_RUN);
        else if(pulse != 1 && id == 'RUNNING')
            m_phy.set_character_move_type(obj, m_phy.CM_WALK);

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



function init_overlay(){
  var log = function (msg) {
    console.log(msg);
  };

    $('#config input,#config select').each(function(){
      var value = m_conf.get($(this).attr('class')).toString();
      $(this).val(value);
    });

    $('#config select').change(function(){
      var prop = $(this).attr('class');
      var value = JSON.parse($(this).val());
      m_conf.set(prop,value);
      console.log(prop+'='+value);
    });

    $('.menu .item[data-func=config]').click(function(){
        $('#config').toggle();
    });
}



});

b4w.require("shooter_gamme").init();
