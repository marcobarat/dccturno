sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Input",
    'jquery.sap.global'
], function (Control, Input, jQuery) {
    "use strict";
    return Input.extend("myapp.control.CustomSequenceBatch", {

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
//                    this.setValue("ERR");
                    this.addStyleClass("BatchError");
                    break;
                case '2':
//                    this.setValue("WRN");
                    this.addStyleClass("BatchWarning");
                    break;
            }
        }
    });
});