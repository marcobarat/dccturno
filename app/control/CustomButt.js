sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    var CustomButt = Button.extend("myapp.control.CustomButt", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                customType: {type: "string", defaultValue: ""},
                state: {type: "string", defaultValue: "0"},
                text: {type: "string", defaultValue: ""}
            }
        },
        renderer: function (oRm, oControl) {
            //Funzione che renderizza il testo 
            sap.m.ButtonRenderer.render(oRm, oControl);
        },
        onAfterRendering: function () {
            var oType = this.getCustomType();
            var oState = this.getState();
            if (oType === "linea"){
                switch (oState) {
                    case "0":
                        jQuery.sap.byId(this.getId()).addClass("startLineaButtonVerde");
                        break;
                    case "1":
                        jQuery.sap.byId(this.getId()).addClass("startLineaButtonOutside");
                        break;
                    default:
                        jQuery.sap.byId(this.getId()).addClass("startLineaButtonOutside");

                }
            }
            if (oType === "confezionamento"){
                switch (oState) {
                    case "0":
//                        jQuery.sap.byId(this.getId()).addClass("bianconco");
                        break;
                    case "1":
//                        jQuery.sap.byId(this.getId()).addClass("bianconco");
                        this.setText("***");
                        break;
                    case "2":
                        jQuery.sap.byId(this.getId()).addClass("rossorso");
                        this.setText("***");  
                        break;
                        
                }
            }
            if (oType === "batch"){
                switch (oState) {
                    case "0":
//                        jQuery.sap.byId(this.getId()).addClass("bianconco");
                        break;
                    case "1":
                        jQuery.sap.byId(this.getId()).addClass("neroreno");
                        break;
                    case "2":
                        jQuery.sap.byId(this.getId()).addClass("rossorso"); 
                        break;
                    case "3":
                        jQuery.sap.byId(this.getId()).addClass("giallogallo"); 
                        break;
                        
                }
            }
            if (oType === "graficoSPC"){
                switch (oState) {
                    case "0":
                        jQuery.sap.byId(this.getId()).addClass("giallogallo");
                        break;
                    case "1":
                        jQuery.sap.byId(this.getId()).addClass("verderde"); 
                        break;
                }
            }

////            if (this.getDiff() === "1") {
//                this.addStyleClass('diffRed');
//            } else {
//                this.removeStyleClass('diffRed');
//                this.removeStyleClass('diffLink');
//            }
        }
    });
    return CustomButt;
});