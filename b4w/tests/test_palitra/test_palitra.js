"use strict"

// register the application module
b4w.register("test_palitra", function(exports, require) {

// import modules used by the app
var m_app       = require("app");
var m_data      = require("data");
var m_objects   = require("objects");
var m_scenes    = require("scenes");

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
    m_data.load("test_palitra.json", load_cb);
}

/**
 * callback executed when the scene is loaded
 */
function load_cb(data_id) {
    m_app.enable_controls();
    m_app.enable_camera_controls();

    // place your code here
    var obj = m_scenes.get_object_by_name('Cube');
    var nodes = new Array('Mat', 'RGB1');

  //меняем цвет в ноде RGB
    $('#color_input').change(function(){
        var rgb = hexToRgb($(this).val());
        $('#vivod_rgb').text(rgb.r+', '+rgb.g+', '+rgb.b);
        m_objects.set_nodemat_rgb(obj, nodes, rgb.r, rgb.g, rgb.b);
    });

    m_objects.set_nodemat_rgb(obj, ['Mat', 'RGB1'], 0, 0, 0);

}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


});

// import the app module and start the app by calling the init method
b4w.require("test_palitra").init();
