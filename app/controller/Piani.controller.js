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
        StabilimentoID: 1,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,

        onInit: function () {
            var params = jQuery.sap.getUriParameters(window.location.href);
            sap.ui.getCore().setModel(this.ModelTurni, "turni");
            this.RefreshCall();
        },
        RefreshFunction: function () {
            this.TIMER = setTimeout(this.RefreshCall.bind(this), 5000);
        },
        RefreshCall: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/pianidiconf_new.json";
            } else {
//                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllPianiDiConfezionamento&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllPianiDiConfezionamento&Content-Type=text/json&OutputParameter=JSON";
            }
            Library.SyncAjaxCallerData(link, this.SUCCESSDatiTurni.bind(this));
        },
        SUCCESSDatiTurni: function (Jdata) {
            this.ModelTurni = new JSONModel({});
            this.ModelTurni.setData(Jdata);
            this.getView().setModel(this.ModelTurni, "turni");
            sap.ui.getCore().setModel(this.ModelTurni, "turni");
            if (this.ISLOCAL !== 1) {
                this.RefreshFunction();
            }
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