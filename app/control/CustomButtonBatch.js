sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    return Button.extend("myapp.control.CustomButtonBatch", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                stato: {type: "string", defaultValue: "0"}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var classes = ["BatchError", "BatchWarning"];
            var stato = this.getStato();
            for (var k = 0; k < classes.length; k++) {
                this.removeStyleClass(classes[k]);
            }
            switch (stato) {
                case '1':
                    this.addStyleClass("BatchError");
                    break;
                case '2':
                    this.addStyleClass("BatchWarning");
                    break;
            }
        }
    });
});