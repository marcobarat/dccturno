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
        StabilimentoID: 1,
        RepartoID: 1,
        BusyDialog: new sap.m.BusyDialog(),
        
        onInit: function () {


            this.ISLOCALModel.setSizeLimit("1000");
            this.ModelReparti.setSizeLimit("1000");
            this.ModelLinee.setSizeLimit("1000");
            this.ModelTiles.setSizeLimit("1000");
            this.ISLOCAL = Number(jQuery.sap.getUriParameters().get("ISLOCAL"));
            this.ISLOCALModel.setData({"ISLOCAL": this.ISLOCAL});
            sap.ui.getCore().setModel(this.ISLOCALModel, "ISLOCAL");
            if (this.ISLOCAL !== 1) {
                Library.SyncAjaxCallerData("/XMII/Runner?Transaction=DeCecco/Transactions/GetAllReparti&Content-Type=text/json&OutputParameter=JSON", this.DoNothing.bind(this), this.RefreshPage.bind(this));
            }
        },
        onToPianiPage: function () {
            this.BusyDialog.open();
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
            this.BusyDialog.open();
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/linee_riepilogo1.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoSinottico&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
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