sap.ui.define([
    'jquery.sap.global',
    './Formatter',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (jQuery, Formatter, Controller, JSONModel, Library) {
    "use strict";

    var PianiController = Controller.extend("myapp.controller.Piani", {
        data_json: {},
        ModelTurni: new JSONModel(),
        onInit: function () {
            var params = jQuery.sap.getUriParameters(window.location.href);
            Library.SyncAjaxCallerData("model/pianidiconf_new.json", Library.SUCCESSDatiTurni.bind(this));
            this.getOwnerComponent().setModel(this.ModelTurni, "turni");
        },
        managePiano: function (oEvent) {
            var oTable = oEvent.getSource().getParent().getBindingContext("turni");
            var Row = oTable.getModel().getProperty(oTable.sPath);
            var area = Row.area;
            var paths = oEvent.getSource().getBindingContext("turni").getPath().substr(1).split("/");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            if (area === "0") {
                oRouter.navTo("managePianoGrey", {turnoPath: paths[1], pianoPath: paths[2]});
            } else {
                oRouter.navTo("managePiano", {turnoPath: paths[1], pianoPath: paths[2]});
            }
        },
        GoToHome: function () {
            this.getOwnerComponent().getRouter().navTo("Main");
        },
        onCloseApp: function () {
            window.close();
        }

    });

    return PianiController;

});