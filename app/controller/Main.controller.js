sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (MessageToast, jQuery, Controller, JSONModel, Library) {
    "use strict";
    var MainController = Controller.extend("myapp.controller.Main", {

        ISLOCALModel: new JSONModel({}),
        ModelReparti: new JSONModel({}),
        ISLOCAL: null,
        ModelLinee: new JSONModel({}),
        ModelTiles: new JSONModel({}),
        onInit: function () {
            this.ISLOCALModel.setSizeLimit("1000");
            this.ModelReparti.setSizeLimit("1000");
            this.ModelLinee.setSizeLimit("1000");
            this.ModelTiles.setSizeLimit("1000");
            this.ISLOCAL = Number(jQuery.sap.getUriParameters().get("ISLOCAL"));
            this.ISLOCALModel.setData({"ISLOCAL": this.ISLOCAL});
            sap.ui.getCore().setModel(this.ISLOCALModel, "ISLOCAL");
            Library.SyncAjaxCallerData("/XMII/Runner?Transaction=DeCecco/Transactions/GetAllReparti&Content-Type=text/json&OutputParameter=JSON", this.DoNothing.bind(this), this.RefreshPage.bind(this));
        },
        onToPianiPage: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_Reparti.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllReparti&Content-Type=text/json&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.SUCCESSReparti.bind(this));
        },
        DoNothing: function () {
            console.log("");
        },
        RefreshPage: function () {
            location.reload(true);
        },
        SUCCESSReparti: function (Jdata) {
            this.ModelReparti.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelReparti, "reparti");
            this.getOwnerComponent().getRouter().navTo("piani");
        },
        onSinotticiPage: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/linee_riepilogo.json";
            } else {
                MessageToast.show("Non ancora disponibile", {duration: 3000});
            }
            Library.AjaxCallerData(link, this.SUCCESSModelLinee.bind(this));
            sap.ui.getCore().setModel(this.ModelLinee, "linee");
        },
        SUCCESSModelLinee: function (Jdata) {
            this.ModelLinee.setData(Jdata);
            this.getOwnerComponent().getRouter().navTo("RiepilogoLinee");
        }
    });
    return MainController;
});