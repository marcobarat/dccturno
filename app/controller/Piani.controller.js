sap.ui.define([
    'jquery.sap.global',
    './Formatter',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (jQuery, Formatter, Controller, JSONModel) {
    "use strict";

    var PianiController = Controller.extend("myapp.controller.Piani", {

        onInit: function () {

            var params = jQuery.sap.getUriParameters(window.location.href);
            // set explored app's demo model on this sample
            var oModel = new JSONModel("./model/pianidiconf.json");
            this.getOwnerComponent().setModel(oModel, "turni");
            this.getView().setModel(oModel);
        },

        onAfterRendering: function () {
            

        },

        onToTmpPage: function (oEvent) {
            this.getOwnerComponent().getRouter().navTo("tmp");

        },
        managePiano: function (oEvent) {
           var oPiano = oEvent.getSource();
           var area = oEvent.getSource().getParent().getAggregation("cells")[1].getProperty("area");
           var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
           if (area==="0") {
               oRouter.navTo("managePianoGrey", {pianoPath: oPiano.getBindingContext().getPath().substr(1).split("/")[1]});
            } else {
               oRouter.navTo("managePiano", {pianoPath: oPiano.getBindingContext().getPath().substr(1).split("/")[1]});
            }
        }

    });

    return PianiController;

});