"use strict"

// register the application module
b4w.register("test_interpol", function(exports, require) {

// import modules used by the app
var m_app       = require("app");
var m_main      = require("main");
var m_data      = require("data");
var m_time      = require("time");
var m_scs       = require("scenes");
var m_trans     = require("transform");

var _obj;
var _anim_id_x;
var _anim_id_y;
var _x_anim;
var _y_anim;
/**
 * export the method to initialize the app (called at the bottom of this file)
 */
exports.init = function() {
    m_app.init({
        canvas_container_id: "main_canvas_container",
        callback: init_cb,
        show_fps: true,
        console_verbose: true,
        autoresize: true
    });
}

/**
 * callback executed when the app is initialized 
 */
function init_cb(canvas_elem, success) {

    if (!success) {
        console.log("b4w init failure");
        return;
    }

    load();
}

/**
 * load the scene data
 */
function load() {
    m_data.load("test_interpol.json", load_cb);
}

/**
 * callback executed when the scene is loaded
 */
function load_cb(data_id) {
    m_app.enable_controls();
    m_app.enable_camera_controls();

    // place your code here
    _obj = m_scs.get_object_by_name('Cube');

    m_main.append_loop_cb(set_pos_obj);

    go_to(0,0, 1000);

    document.getElementById('main_canvas_container').onclick = function(e) {
        console.log(e);
        go_to(e.clientX/200, e.clientY/200, 1000);
    }

}



function go_to(x,y, time){
    m_time.clear_animation(_anim_id_x);
    m_time.clear_animation(_anim_id_y);

    var position = m_trans.get_translation(_obj);
    _anim_id_x = m_time.animate(position[0],x,time,time_cb_x);
    _anim_id_y = m_time.animate(position[2],y,time,time_cb_y);
}

function time_cb_x(x){
    _x_anim = x;
}
function time_cb_y(y){
    _y_anim = y;
}

function set_pos_obj(){
    m_trans.set_translation(_obj, _x_anim, 0, _y_anim);
}

});

// import the app module and start the app by calling the init method
b4w.require("test_interpol").init();
