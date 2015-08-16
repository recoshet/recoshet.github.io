if (b4w.module_check("html_hud"))
    throw "Failed to register module: html_hud";

b4w.register("html_hud", function(exports, require) {

exports.setHealth = function(health){
    $('#health_int').text(Math.round(health));
}



});