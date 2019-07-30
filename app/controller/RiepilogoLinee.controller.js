sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library',
    'sap/m/MessageToast'
], function (Controller, JSONModel, Library, MessageToast) {
    "use strict";
    return Controller.extend("myapp.controller.RiepilogoLinee", {
        ModelLinee: new JSONModel(),
        ModelElencoLinee: new JSONModel(),
        ModelSinottico: new JSONModel(),
        STOP: null,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,
        BusyDialog: new sap.m.BusyDialog(),
        CHECKFIRSTTIME: 0,
        StabilimentoID: 1,
        RepartoID: 1,
        TIMER: null,
        SPCDialog: null,
        SPCTimer: null,
        STOPSPC: null,
        SPCCounter: null,
        OEEDialog: null,
        STOPOEE: null,
        OEECounter: null,
        OEETimer: null,
        ModelSPCData: new JSONModel({}),
        ModelOEE: new JSONModel({}),
        ModelFermi: new JSONModel({}),
        indexSPC: null,
        IDSelected: null,
        batchID: null,
        oDialog: null,
//  FUNZIONI D'INIZIALIZZAZIONE      
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RiepilogoLinee").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function () {
            this.getView().byId("RiepilogoLineePage").setBusy(false);
            clearInterval(this.TIMER);
            this.STOP = 0;
            this.ModelLinee = sap.ui.getCore().getModel("linee");
            this.getView().setModel(this.ModelLinee, "linee");
            this.RefreshFunction(100);
            var that = this;
            this.TIMER = setInterval(function () {
                try {
                    that.RefreshCounter++;
                    if (that.STOP === 0 && that.RefreshCounter >= 10) {
                        that.RefreshFunction();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },

//        ------------------------------------------------------
//        --------------- FUNZIONI DI REFRESH ------------------
//        ------------------------------------------------------

        RefreshFunction: function (msec) {
            if (!msec) {
                msec = 0;
            }
            setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
            this.RefreshCounter = 0;
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/linee_riepilogo.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoSinottico&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.RefreshModelLinee.bind(this));
        },
        RefreshModelLinee: function (Jdata) {
            if (this.STOP === 0) {
                this.RefreshCounter = 0;
                for (var i = 0; i < Jdata.length; i++) {
                    for (var j = 0; j < Jdata[i].Linee.length; j++) {
                        Jdata[i].Linee[j].SPC = Jdata[i].Linee[j].SPC.reverse();
                        Jdata[i].Linee[j].avanzamento = (Number(Jdata[i].Linee[j].avanzamento) * 100 >= 100) ? 100 : Number(Jdata[i].Linee[j].avanzamento) * 100;
                        Jdata[i].Linee[j].perc_avanzamento = String(Math.round(Number(Jdata[i].Linee[j].avanzamento)));
                        Jdata[i].Linee[j].destinazione = (Jdata[i].Linee[j].destinazione === "---") ? "" : Jdata[i].Linee[j].destinazione;
                        Jdata[i].Linee[j].IMG = String(Number(Jdata[i].Linee[j].formato.replace(/\D/g, ""))) + ".jpg";
                        Jdata[i].Linee[j].cartoniProdotti = String(Math.round(Number(Jdata[i].Linee[j].cartoniProdotti)));
                        Jdata[i].Linee[j].cartoniResidui = String(Math.round(Number(Jdata[i].Linee[j].cartoniResidui)));
                        Jdata[i].Linee[j].disponibilita = String(Math.round(Number(Jdata[i].Linee[j].disponibilita.slice(0, Jdata[i].Linee[j].disponibilita.length - 1))));
                        Jdata[i].Linee[j].efficienza = String(Math.round(Number(Jdata[i].Linee[j].efficienza.slice(0, Jdata[i].Linee[j].efficienza.length - 1))));
                    }
                }
                this.ModelLinee.setData(Jdata);
                this.ModelLinee.refresh(true);
                this.getView().setModel(this.ModelLinee, "linee");
                sap.ui.getCore().setModel(this.ModelLinee, "linee");
                Library.RemoveClosingButtons.bind(this)("schemaLineeContainer");
                this.BarColorCT(this.ModelLinee.getData());
            }
        },

//        ------------------------------------------------------
//        ---------------- PULSANTE SINOTTICO ------------------
//        ------------------------------------------------------

        GoToSinottico: function (event) {
            this.getView().byId("RiepilogoLineePage").setBusy(true);
            this.BusyDialog.open();
            var path = event.getSource().getBindingContext("linee").getPath();
            this.IDSelected = this.ModelLinee.getProperty(path).lineaID;
            var link;
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/Sinottico/SinotticoByLineaID&Content-Type=text/json&LineaID=" + this.IDSelected + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.SUCCESSGoToSinottico.bind(this));
        },
        SUCCESSGoToSinottico: function (Jdata) {
            var j;
            Jdata.IMG = Jdata.Descrizione.toLowerCase().split(" ").join("_") + ".png";
            Jdata.IsSelected = (Jdata.LineaID === this.IDSelected) ? "1" : "0";
            this.SetNameMacchine(Jdata);
            for (j = 0; j < Jdata.Macchine.length; j++) {
                Jdata.Macchine[j].class = Jdata.Macchine[j].nome.split(" ").join("");
                if (Number(Jdata.LineaID) === 31) {
                    Jdata.Macchine[j].class += "_9";
                }
                if (Number(Jdata.LineaID) === 16) {
                    Jdata.Macchine[j].class += "_6";
                }
            }
            this.ModelSinottico.setData(Jdata);
            this.ModelSinottico.refresh(true);
            sap.ui.getCore().setModel(this.ModelSinottico, "ModelSinottico");
            this.getView().setModel(this.ModelSinottico, "ModelSinottico");
            clearInterval(this.TIMER);
            this.STOP = 1;
            this.BusyDialog.close();
            this.getOwnerComponent().getRouter().navTo("OverviewLinea");
        },

//        ------------------------------------------------------
//        ------------------- PROGRESS BAR ---------------------
//        ------------------------------------------------------

        ShowOEE: function (event) {
            this.STOPOEE = 0;
            clearInterval(this.OEETimer);
            this.OEECounter = 15;
            this.pathLinea = event.getSource().getBindingContext("linee").sPath;
            this.idLinea = this.ModelLinee.getProperty(this.pathLinea).lineaID;
            var stato = this.ModelLinee.getProperty(this.pathLinea).statoLinea;
            if (stato === "Disponibile.Lavorazione" || stato === "Disponibile.Fermo") {
                this.batchID = this.ModelLinee.getProperty(this.pathLinea).batchID;
                this.OEEDialog = this.getView().byId("oee");
                if (!this.OEEDialog) {
                    this.OEEDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.OEE", this);
                    this.getView().addDependent(this.OEEDialog);
                }
                this.OEEDialog.open();
                this.OEEDialog.setBusy(true);
                this.OEEDataCaller();
                var that = this;
                this.OEETimer = setInterval(function () {
                    try {
                        that.OEECounter++;
                        if (that.STOPOEE === 0 && that.OEECounter >= 15) {
                            that.OEERefresh();
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }, 1000);
            } else {
                MessageToast.show("Statistiche di linea disponibili solo in lavorazione", {duration: 3000});
            }
        },
        OEERefresh: function (msec) {
            this.OEECounter = 0;
            if (typeof msec === "undefined") {
                msec = 0;
            }
            setTimeout(this.OEEDataCaller.bind(this), msec);
        },
        OEEDataCaller: function () {
            if (this.OEEDialog) {
                if (this.OEEDialog.isOpen()) {
                    var link = "/XMII/Runner?Transaction=DeCecco/Transactions/OEE_SPCBatchInCorso&Content-Type=text/json&LineaID=" + this.idLinea + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSOEEDataLoad.bind(this), this.FAILUREOEEDataLoad.bind(this));
                }
            }
        },
        SUCCESSOEEDataLoad: function (Jdata) {
            var times = ["tempoAttrezzaggio", "tempoFermi", "tempoFermiAutomatici", "tempoFermoAttuale", "tempoTotaleFermiAutomatici"];
            var spl, i, temp;
            for (var key in Jdata.OEE) {
                if (times.indexOf(key) > -1) {
                    spl = Jdata.OEE[key].split(":");
                    temp = "";
                    for (i = 0; i < spl.length; i++) {
                        temp += Library.StringTime(Number(spl[i])) + ":";
                    }
                    Jdata.OEE[key] = temp.slice(0, -1);
                }
            }
            this.ModelOEE.setProperty("/", Jdata.OEE);
            this.getView().setModel(this.ModelOEE, "ModelOEE");
            sap.ui.getCore().setModel(this.ModelOEE, "ModelOEE");
            this.OEEDialog.setBusy(false);
        },
        FAILUREOEEDataLoad: function () {
            this.DestroyDialogOEE();
            MessageToast.show("Connessione a DB fallita, riprovare", {duration: 3000});
        },
        DestroyDialogOEE: function () {
            this.STOPOEE = 1;
            clearInterval(this.OEETimer);
            this.OEEDialog.destroy();
        },

//        --------------------------  POPUP FERMI  --------------------------

        ShowFermi: function () {
            this.oDialog = this.getView().byId("showFermi");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.ShowFermi", this);
                this.getView().addDependent(this.oDialog);
            }
            this.oDialog.open();
            this.oDialog.setBusy(true);

            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiFromBatchID&Content-Type=text/json&BatchID=" + this.batchID + "&OutputParameter=JSON";
            Library.AjaxCallerData(link, this.SUCCESSShowFermi.bind(this), this.FAILUREShowFermi.bind(this));
        },
        SUCCESSShowFermi: function (Jdata) {
            var data = Jdata.fermi;
            var i, msec_in, msec_fin;
            for (i = 0; i < data.length; i++) {
                data[i].inizio = data[i].inizio.split("T")[1];
                data[i].fine = data[i].fine.split("T")[1];
                msec_in = Library.StandardToMillisecs(data[i].inizio);
                msec_fin = Library.StandardToMillisecs(data[i].fine);
                data[i].durata = (msec_fin < msec_in) ? Library.MillisecsToStandard(msec_fin - msec_in + 86400000) : Library.MillisecsToStandard(msec_fin - msec_in);
            }
            this.ModelFermi.setData(data);
            this.getView().setModel(this.ModelFermi, "ModelFermi");
            sap.ui.getCore().setModel(this.ModelFermi, "ModelFermi");
            this.oDialog.setBusy(false);
        },
        FAILUREShowFermi: function () {
            this.oDialog.setBusy(false);
            this.DestroyDialogFermi();
            MessageToast.show("Comunicazione a DB fallita, riprovare", {duration: 3000});
        },
        DestroyDialogFermi: function () {
            this.oDialog.destroy();
        },

//        ------------------------------------------------------
//        ------------------- PULSANTI SPC ---------------------
//        ------------------------------------------------------


        SPCGraph: function (event) {
            this.STOPSPC = 0;
            clearInterval(this.SPCTimer);
            this.SPCCounter = 15;
            this.pathLinea = event.getSource().getBindingContext("linee").sPath;
            this.indexSPC = Number(event.getSource().data("mydata"));
            this.idLinea = this.ModelLinee.getProperty(this.pathLinea).lineaID;
            this.ParametroID = this.ModelLinee.getProperty(this.pathLinea).SPC[this.indexSPC].parametroId;
            this.DescrizioneParametro = this.FixDescription(this.ModelLinee.getProperty(this.pathLinea).SPC[this.indexSPC].descrizioneParametro);
            this.batchID = this.ModelLinee.getProperty(this.pathLinea).batchID;
            this.SPCDialog = this.getView().byId("SPCWindow");
            if (!this.SPCDialog) {
                this.SPCDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.SPCWindow", this);
                this.getView().addDependent(this.SPCDialog);
            }
            this.SPCDialog.open();
            this.SPCDialog.setBusy(true);
            this.SPCDataCaller();
            var that = this;
            this.SPCTimer = setInterval(function () {
                try {
                    that.SPCCounter++;
                    if (that.STOPSPC === 0 && that.SPCCounter >= 15) {
                        that.SPCRefresh();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },
        SPCRefresh: function (msec) {
            this.SPCCounter = 0;
            if (typeof msec === "undefined") {
                msec = 0;
            }
            setTimeout(this.SPCDataCaller.bind(this), msec);
        },
        SPCDataCaller: function () {
            if (this.SPCDialog) {
                if (this.SPCDialog.isOpen()) {
                    var link;
                    if (this.ISLOCAL === 1) {
                        link = "model/JSON_SPCData.json";
                    } else {
                        if (typeof this.ParametroID !== "undefined") {
                            link = "/XMII/Runner?Transaction=DeCecco/Transactions/SPCDataPlot&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.idLinea + "&ParametroID=" + this.ParametroID;
                        }
                    }
                    Library.AjaxCallerData(link, this.SUCCESSSPCDataLoad.bind(this));
                }
            }
        },
        SUCCESSSPCDataLoad: function (Jdata) {
            var isEmpty;
            this.Allarme = this.ModelLinee.getProperty(this.pathLinea).SPC[this.indexSPC].allarme;
            this.Fase = this.ModelLinee.getProperty(this.pathLinea).SPC[this.indexSPC].fase;
            this.Avanzamento = this.ModelLinee.getProperty(this.pathLinea).SPC[this.indexSPC].avanzamento;
            if (Jdata.valori === "") {
                isEmpty = 1;
            } else {
                isEmpty = 0;
                Jdata = this.ParseSPCData(Jdata, "#");
                if (this.Fase === "1") {
                    Jdata = this.Phase1(Jdata);
                }
                this.ModelSPCData.setProperty("/", Jdata);
            }
            this.SPCDialogFiller(isEmpty);
            if (this.STOPSPC === 0) {
                this.SPCCounter = 0;
            }
            this.SPCDialog.setBusy(false);
        },
        FixDescription: function (str) {
            var prefix = (this.indexSPC === 0) ? "SX" : "DX";
            return prefix + " - " + str.replace("[cg]", "[g]");
        },

//        ------------------------------------------------------
//        --------------- FUNZIONI DI SUPPORTO -----------------
//        ------------------------------------------------------

//        ******************** SINOTTICO *******************

        SetNameMacchine: function (data_linea) {
            var names = ["marcatore", "etichettatrice", "controllo peso", "scatolatrice", "confezionatrice", "dosatore"];
            for (var i = 0; i < data_linea.Macchine.length; i++) {
                for (var j = 0; j < names.length; j++) {
                    if (data_linea.Macchine[i].nome.toLowerCase().indexOf(names[j]) > -1) {
                        switch (names[j]) {
                            case "marcatore":
                                data_linea.Macchine[i].nome = (data_linea.Macchine[i].nome.indexOf("SX") > -1) ? "Marcatore SX" : "Marcatore DX";
                                break;
                            case "controllo peso":
                                data_linea.Macchine[i].nome = (data_linea.Macchine[i].nome.indexOf("SX") > -1) ? "PackItal SX" : "PackItal DX";
                                break;
                            case "etichettatrice":
                                data_linea.Macchine[i].nome = "Etichettatrice";
                                break;
                            case "scatolatrice":
                                data_linea.Macchine[i].nome = "Scatolatrice";
                                break;
                            case "confezionatrice":
                                data_linea.Macchine[i].nome = (data_linea.Macchine[i].nome.indexOf("SX") > -1) ? "Confezionatrice SX" : "Confezionatrice DX";
                                break;
                            case "dosatore":
                                data_linea.Macchine[i].nome = (data_linea.Macchine[i].nome.indexOf("SX") > -1) ? "Dosatore SX" : "Dosatore DX";
                                break;
                        }
                    }
                }
            }
        },
//        getRandom: function () {
//            var val = Math.floor(3 * Math.random());
//            switch (val) {
//                case 0:
//                    return "Good";
//                case 1:
//                    return "Warning";
//                default:
//                    return "Error";
//            }
//        },

//        ******************** SPC *******************

        SPCDialogFiller: function (discr) {
            var textHeader = this.getView().byId("headerSPCWindow");
            textHeader.setText(String(this.DescrizioneParametro));
            var samplingHeader = this.getView().byId("samplingSPC");
            if (Number(this.Fase) === 1) {
                samplingHeader.setText("Campionamento in corso: " + String(this.Avanzamento) + "/50");
            } else {
                samplingHeader.setText("");
            }
            if (discr !== 1) {
                var plotBox = this.getView().byId("plotBox");
                var alarmButton = this.getView().byId("alarmButton");
                if (Number(this.Fase) === 2 && Number(this.Allarme) === 1) {
                    alarmButton.setEnabled(true);
                    alarmButton.removeStyleClass("chiudiButton");
                    alarmButton.addStyleClass("allarmeButton");
                } else {
                    alarmButton.setEnabled(false);
                    alarmButton.removeStyleClass("allarmeButton");
                    alarmButton.addStyleClass("chiudiButton");
                }
                if (!((Number(this.Fase) === 1) && (this.ModelSPCData.getData().valori.length < 50))) {
                    var data = this.ModelSPCData.getData();
                    var result = this.PrepareDataToPlot(data, this.Fase);
                    var ID = jQuery.sap.byId(plotBox.getId()).get(0);
                    Plotly.newPlot(ID, result.dataPlot, result.layout);
                }
            }
        },
        RemoveAlarm: function () {
            this.STOPSPC = 1;
            clearInterval(this.SPCTimer);
            var alarmButton = this.getView().byId("alarmButton");
            alarmButton.setEnabled(false);
            alarmButton.removeStyleClass("allarmeButton");
            alarmButton.addStyleClass("chiudiButton");
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ResetSPCAlarm&Content-Type=text/json&BatchID=" + this.batchID + "&ParametroID=" + this.ParametroID;
            Library.AjaxCallerVoid(link, this.RefreshFunction.bind(this));
            this.CloseSPCDialog();
        },
        CloseSPCDialog: function () {
            this.STOPSPC = 1;
            clearInterval(this.SPCTimer);
            this.SPCDialog.close();
        },
        ParseSPCData: function (data, char) {
            for (var key in data) {
                data[key] = data[key].split(char);
                for (var i = data[key].length - 1; i >= 0; i--) {
                    if (data[key][i] === "") {
                        data[key].splice(i, 1);
                    } else {
                        if (key !== "time") {
                            data[key][i] = Number(data[key][i]);
                        }
                    }
                }
            }
            return data;
        },
        Phase1: function (data) {
            data.MR = [];
            var avg = 0;
            var i, temp;
            data.MR.push(0);
            for (i = 0; i < data.valori.length - 1; i++) {
                temp = Math.abs(data.valori[i + 1] - data.valori[i]);
                data.MR.push(temp);
                avg += temp;
            }
            avg /= (data.MR.length);
            data.MRBound = [];
            for (i = 0; i < data.MR.length; i++) {
                data.MRBound.push(3.267 * avg);
            }
            data.MRTime = JSON.parse(JSON.stringify(data.time));
            return data;
        },
        PrepareDataToPlot: function (Jdata, fase) {
            var dataPlot, layout;
            var valori = {
                x: Jdata.time,
                y: Jdata.valori,
                type: 'scatter',
                line: {color: 'rgb(0,58,107)', width: 1}
            };
            var limSup = {
                x: Jdata.time,
                y: Jdata.limSup,
                type: 'scatter',
                line: {color: 'rgb(167,25,48)', width: 1}
            };
            var limInf = {
                x: Jdata.time,
                y: Jdata.limInf,
                type: 'scatter',
                line: {color: 'rgb(167,25,48)', width: 1}
            };
            dataPlot = [valori, limSup, limInf];
            layout = {
                showlegend: false,
                autosize: true,
                xaxis: {
                    showgrid: true,
                    zeroline: false
                },
                yaxis: {
                    showgrid: true,
                    zeroline: false
                }
            };
            if (fase === "1") {
                var MR = {
                    x: Jdata.MRTime,
                    y: Jdata.MR,
                    xaxis: 'x2',
                    yaxis: 'y2',
                    type: 'scatter',
                    line: {color: 'rgb(0,58,107)', width: 1}
                };
                var MRBound = {
                    x: Jdata.MRTime,
                    y: Jdata.MRBound,
                    xaxis: 'x2',
                    yaxis: 'y2',
                    type: 'scatter',
                    line: {color: 'rgb(167,25,48)', width: 1}
                };
                dataPlot.push(MR);
                dataPlot.push(MRBound);
                layout.yaxis.domain = [0.6, 1];
                layout.xaxis2 = {};
                layout.yaxis2 = {};
                layout.xaxis2.anchor = "y2";
                layout.yaxis2.domain = [0, 0.4];
            } else {
                if (Number(this.Allarme) === 0) {
                    layout.xaxis.linecolor = "rgb(124,162,149)";
                    layout.yaxis.linecolor = "rgb(124,162,149)";
                } else {
                    layout.xaxis.linecolor = "rgb(255,211,0)";
                    layout.yaxis.linecolor = "rgb(255,211,0)";
                }
                layout.xaxis.linewidth = 4;
                layout.xaxis.mirror = true;
                layout.yaxis.linewidth = 4;
                layout.yaxis.mirror = true;
            }
            return {dataPlot: dataPlot, layout: layout};
        },

//        ************************ GESTIONE STILE PROGRESS INDICATOR ************************

        BarColorCT: function (data) {
            for (var j = 0; j < data.length; j++) {
                if (data[j].length > 0) {
                    for (var i = 0; i < data[j].length; i++) {
                        if (Number(data[j].Linee[i].avanzamento) >= 100) {
                            data[j].Linee[i].avanzamento = 100;
                        } else {
                            data[j].Linee[i].avanzamento = Number(data[j].Linee[i].avanzamento);
                        }
                    }
                }
            }
            return data;
        },

//        ------------------------------------------------------
//        ------------------- INTESTAZIONE ---------------------
//        ------------------------------------------------------

        BackToMain: function () {
            clearInterval(this.TIMER);
            this.getView().byId("RiepilogoLineePage").setBusy(true);
            this.BusyDialog.open();
            this.STOP = 1;
            this.getOwnerComponent().getRouter().navTo("Main");
            this.BusyDialog.close();
        }
    });
});