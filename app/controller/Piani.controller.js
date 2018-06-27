sap.ui.define([
    'jquery.sap.global',
    './Formatter',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (jQuery, Formatter, Controller, JSONModel, Library) {
    "use strict";

    var PianiController = Controller.extend("myapp.controller.Piani", {
        AddButtonObject: {
            batchID: "#ADD#",
            sequenza: "#ADD#",
            statoBatch: "#ADD#",
            erroreBatch: "#ADD#",
            formatoProduttivo: "#ADD#",
            confezione: "#ADD#",
            grammatura: "#ADD#",
            destinazione: "#ADD#",
            qli: "#ADD#",
            cartoni: "#ADD#",
            ore: "#ADD#",
            disponibilita: "#ADD#",
            produttivita: "#ADD#",
            qualita: "#ADD#",
            fermo: "#ADD#",
            pezziCartone: "#ADD#",
            secondiPerPezzo: "#ADD#"},
        data_json: {},
        ModelLinea: new JSONModel(),
        ModelTurni: new JSONModel(),
        ModelReparti: sap.ui.getCore().getModel("reparti"),
        StabilimentoID: 1,
        paths: null,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,

        onInit: function () {
            var oModel = new JSONModel({StabilimentoID: this.StabilimentoID});
            sap.ui.getCore().setModel(oModel, "stabilimento");
            var params = jQuery.sap.getUriParameters(window.location.href);
            sap.ui.getCore().setModel(this.ModelTurni, "turni");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("piani").attachPatternMatched(this.URLChangeCheck, this);
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
            }
            Library.SyncAjaxCallerData(link, this.SUCCESSDatiTurni.bind(this));
        },
        SUCCESSDatiTurni: function (Jdata) {
            this.ModelTurni.setData(Library.RecursiveJSONTimeConversion(Jdata));
            this.getView().setModel(this.ModelTurni, "turni");
            sap.ui.getCore().setModel(this.ModelTurni, "turni");
            var oScroll = this.getView().byId("scrollTurniConclusi");
            this.setScrollHeight(oScroll);
            oScroll = this.getView().byId("scrollTurniProgrammati");
            this.setScrollHeight(oScroll);
            if (this.ISLOCAL !== 1) {
                this.RefreshFunction();
            }
        },
        URLChangeCheck: function (oEvent) {
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            this.getView().setModel(this.ModelLinea, 'linea');
            this.RefreshCall();
        },
        setScrollHeight: function (oScroll) {
            var items_num = this.ModelTurni.getProperty(oScroll.getContent()[0].getBindingInfo("items").path).length;
            switch (items_num) {
                case 1:
                    oScroll.setHeight("61.67px");
                    oScroll.removeStyleClass("scrollingbar");
                    oScroll.addStyleClass("scrollingbarTransparent");
                    break;
                case 2:
                    oScroll.setHeight("123.34px");
                    oScroll.removeStyleClass("scrollingbar");
                    oScroll.addStyleClass("scrollingbarTransparent");
                    break;
                case 3:
                    oScroll.setHeight("187px");
                    oScroll.removeStyleClass("scrollingbar");
                    oScroll.addStyleClass("scrollingbarTransparent");
                    break;
                default:
                    oScroll.setHeight("187px");
                    oScroll.addStyleClass("scrollingbar");
                    oScroll.removeStyleClass("scrollingbarTransparent");
            }
        },
        managePiano: function (oEvent) {
            var oTable = oEvent.getSource().getParent().getBindingContext("turni");
            var Row = oTable.getModel().getProperty(oTable.sPath);
            var area = Row.area;
            this.paths = oEvent.getSource().getBindingContext("turni").getPath().substr(1).split("/");
            var pdcId = Row.PdcID;
            var link;
            var repartoId = this.ModelReparti.getData().ListaReparti[0].RepartoID;
            var PDCParameters = {pdc: pdcId, stabilimento: this.StabilimentoID, reparto: repartoId};
            sap.ui.getCore().setModel(new JSONModel(PDCParameters), "ParametriPiano");
            if (this.ISLOCAL === 1) {
                if (area === "0") {
                    link = "model/linee.json";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoChiuso.bind(this));
                } else {
                    link = "model/linee_prova.json";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoApertoInCorso.bind(this));
                }
            } else {
                if (area === "0") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDpassato&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoChiuso.bind(this));
                } else if (area === "1") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoApertoInCorso.bind(this));
                } else if (area === "2") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoApertoFuturo.bind(this));
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/InsertPdcManuale&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoApertoFuturo.bind(this));
                }
            }
        },
        SUCCESSTurnoChiuso: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("managePianoGrey", {turnoPath: this.paths[1], pianoPath: this.paths[2]});
            this.ModelLinea.refresh(true);
        },
        SUCCESSTurnoApertoInCorso: function (Jdata) {
            for (var i = 0; i < Jdata.linee.length; i++) {
                Jdata.linee[i].operatori = [];
                for (var j = 0; j < Jdata.linee[i].nOperatori; j++) {
                    Jdata.linee[i].operatori.push({nome: "", cognome: ""});
                }
            }
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("managePianoGreen", {turnoPath: this.paths[1], pianoPath: this.paths[2]});
            this.ModelLinea.refresh(true);
        },
        SUCCESSTurnoApertoFuturo: function (Jdata) {
//            var data = Jdata.linee;
//            for (var l = 0; l < data.length; l++) {
//                data[l].batchlist.push(this.AddButtonObject);
//            }
            for (var i = 0; i < Jdata.linee.length; i++) {
                Jdata.linee[i].operatori = [];
                for (var j = 0; j < Jdata.linee[i].nOperatori; j++) {
                    Jdata.linee[i].operatori.push({nome: "", cognome: ""});
                }
            }
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("managePianoYellow", {turnoPath: this.paths[1], pianoPath: this.paths[2]});
            this.ModelLinea.refresh(true);
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