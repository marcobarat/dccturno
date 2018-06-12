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
        ModelLinea: new JSONModel(),
        ModelTurni: new JSONModel(),
        ModelReparti: sap.ui.getCore().getModel("reparti"),
        StabilimentoID: 1,
        paths: null,
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
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllPianiDiConfezionamento&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
//                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllPianiDiConfezionamento&Content-Type=text/json&OutputParameter=JSON";
            }
            Library.SyncAjaxCallerData(link, this.SUCCESSDatiTurni.bind(this));
        },
        SUCCESSDatiTurni: function (Jdata) {
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
            this.paths = oEvent.getSource().getBindingContext("turni").getPath().substr(1).split("/");
            var pdcId = Row.PdcID;
            var link;
            if (this.ISLOCAL === 1) {
                if (area === "0") {
                    link = "model/linee.json";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoChiuso.bind(this));
                } else {
                    link = "model/linee_new.json";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoAperto.bind(this));
                }
            } else {
                var repartoId = this.ModelReparti.getData().ListaReparti[0].RepartoID;
                if (area === "0") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDpassato&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoChiuso.bind(this));
                } else if (area === "1") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoAperto.bind(this));
                } else if (area === "2") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoAperto.bind(this));
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoAperto.bind(this));
                }
            }
        },
        SUCCESSTurnoChiuso: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("managePianoGrey", {turnoPath: this.paths[1], pianoPath: this.paths[2]});
        },
        SUCCESSTurnoAperto: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("managePiano", {turnoPath: this.paths[1], pianoPath: this.paths[2]});
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