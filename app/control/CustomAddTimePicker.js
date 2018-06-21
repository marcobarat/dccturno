sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/TimePicker",
    'jquery.sap.global'
], function (Control, TimePicker, jQuery) {
    "use strict";
    var CustomAddTimePicker = TimePicker.extend("myapp.control.CustomAddTimePicker", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {}
        },
        renderer: {},
        onAfterRendering: function () {
            if (this.getValue() === "#ADD#") {
                this.setVisible(false);
            }
        }
    });
    return CustomAddTimePicker;
});