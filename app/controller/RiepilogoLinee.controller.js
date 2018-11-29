sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
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
        STOPSPC: null,
        SPCCounter: null,
        ModelSPCData: new JSONModel({}),
        indexSPC: null,
        IDSelected: null,
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
//  FUNZIONI DI REFRESH
        RefreshFunction: function (msec) {
            this.TIMER = setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/linee_riepilogo.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoSinottico&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            }
            Library.SyncAjaxCallerData(link, this.RefreshModelLinee.bind(this));
        },
        RefreshModelLinee: function (Jdata) {
            if (this.STOP === 0) {
                this.RefreshCounter = 0;
                for (var i = 0; i < Jdata.length; i++) {
                    for (var j = 0; j < Jdata[i].Linee.length; j++) {
                        Jdata[i].Linee[j].avanzamento = (Number(Jdata[i].Linee[j].avanzamento) * 100 >= 100) ? 100 : Number(Jdata[i].Linee[j].avanzamento) * 100;
                        Jdata[i].Linee[j].perc_avanzamento = String(Math.round(Number(Jdata[i].Linee[j].avanzamento)));
                        Jdata[i].Linee[j].destinazione = (Jdata[i].Linee[j].destinazione === "---") ? "" : Jdata[i].Linee[j].destinazione;
                        Jdata[i].Linee[j].IMG = String(Number(Jdata[i].Linee[j].formato.replace(/\D/g, ""))) + ".jpg";
                        Jdata[i].Linee[j].cartoniProdotti = String(Math.round(Number(Jdata[i].Linee[j].cartoniProdotti)));
                        Jdata[i].Linee[j].cartoniResidui = String(Math.round(Number(Jdata[i].Linee[j].cartoniResidui)));
                        Jdata[i].Linee[j].disponibilita = String(Math.round(Number(Jdata[i].Linee[j].disponibilita.slice(0,Jdata[i].Linee[j].disponibilita.length-1))));
                        Jdata[i].Linee[j].efficienza = String(Math.round(Number(Jdata[i].Linee[j].efficienza.slice(0,Jdata[i].Linee[j].efficienza.length-1))));
                    }
                }
                this.ModelLinee.setData(Jdata);
                this.ModelLinee.refresh(true);
                this.getView().setModel(this.ModelLinee, "linee");
                sap.ui.getCore().setModel(this.ModelLinee, "linee");
                Library.RemoveClosingButtons.bind(this)("schemaLineeContainer");
//                this.LineButtonStyle();
                this.BarColorCT(this.ModelLinee.getData());
//                this.SPCColorCT(this.ModelLinee.getData());
//                this.CheckCells();
//                this.RefreshFunction(10000);
            }
        },
        GoToSinottico: function (event) {
            this.getView().byId("RiepilogoLineePage").setBusy(true);
            this.BusyDialog.open();
            var path = event.getSource().getBindingContext("linee").getPath();
            this.IDSelected = this.ModelLinee.getProperty(path).lineaID;
            var link;
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/Sinottico/SinotticoLineeGood&Content-Type=text/json&OutputParameter=JSON";
            }
            Library.SyncAjaxCallerData(link, this.SUCCESSGoToSinottico.bind(this));
        },
        SUCCESSGoToSinottico: function (Jdata) {
            var i, j, temp;
//            var Macchine = ["Marcatore SX", "Marcatore DX", "PackItal SX", "PackItal DX", "Scatolatrice", "Etichettatrice"];
            for (i = 0; i < Jdata.length; i++) {
                Jdata[i].IMG = Jdata[i].Descrizione.toLowerCase().split(" ").join("_") + ".png";
                Jdata[i].IsSelected = (Jdata[i].LineaID === this.IDSelected) ? "1" : "0";
//                Jdata[i].Macchine = [];
                this.SetNameMacchine(Jdata[i]);
//                for (j = 0; j < Macchine.length; j++) {
                for (j = 0; j < Jdata[i].Macchine.length; j++) {
//                    temp = {};
//                    temp.nome = Macchine[j];
//                    temp.stato = this.getRandom();
//                    temp.class = Macchine[j].split(" ").join("");
//                    Jdata[i].Macchine.push(temp);
                    Jdata[i].Macchine[j].class = Jdata[i].Macchine[j].nome.split(" ").join("");
                }
            }
            this.ModelSinottico.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelSinottico, "ModelSinottico");
            this.getView().setModel(this.ModelSinottico, "ModelSinottico");
            clearInterval(this.TIMER);
            this.STOP = 1;
            this.BusyDialog.close();
            this.getOwnerComponent().getRouter().navTo("OverviewLinea");
        },
        SetNameMacchine: function (data_linea) {
            var names = ["marcatore", "etichettatrice", "controllo peso", "scatolatrice"];
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
                        }
                    }
                }
            }
        },
        getRandom: function () {
            var val = Math.floor(3 * Math.random());
            switch (val) {
                case 0:
                    return "Good";
                case 1:
                    return "Warning";
                default:
                    return "Error";
            }
        },
        //         -> PULSANTI SPC CON REFRESH
        SPCGraph: function (event) {
            this.STOPSPC = 0;
            clearInterval(this.SPCTimer);
            this.SPCCounter = 5;
            this.pathLinea = event.getSource().getBindingContext("linee").sPath;
            this.indexSPC = Number(event.getSource().data("mydata"));
            this.idLinea = this.ModelLinee.getProperty(this.pathLinea).lineaID;
            this.ParametroID = this.ModelLinee.getProperty(this.pathLinea).SPC[this.indexSPC].parametroId;
            this.DescrizioneParametro = this.ModelLinee.getProperty(this.pathLinea).SPC[this.indexSPC].descrizioneParametro;
            this.SPCDialog = this.getView().byId("SPCWindow");
            if (!this.SPCDialog) {
                this.SPCDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.SPCWindow", this);
                this.getView().addDependent(this.SPCDialog);
            }
            this.SPCDialog.open();
            this.SPCDataCaller();
            var that = this;
            this.SPCTimer = setInterval(function () {
                try {
                    that.SPCCounter++;
                    if (that.STOPSPC === 0 && that.SPCCounter >= 5) {
                        that.SPCRefresh();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
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
                    Library.SyncAjaxCallerData(link, this.SUCCESSSPCDataLoad.bind(this));
                }
            }
        },
        //      FUNZIONI SPC    
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
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ResetSPCAlarm&Content-Type=text/json&BatchID=" + this.idBatch + "&ParametroID=" + this.ParametroID;
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
        //        ************************ GESTIONE STILE PULSANTE DI LINEA ************************    
        LineButtonStyle: function () {
            var classes = ["LineaDispoSin", "LineaNonDispoSin", "LineaVuotaSin", "LineaAttrezzaggioSin", "LineaLavorazioneSin", "LineaFermoSin", "LineaSvuotamentoSin"];
            var data = this.ModelLinee.getData().corta;
            var button;
            var state;
            for (var i = 0; i < data.length; i++) {
                button = this.getView().byId("lineeCorta").getItems()[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0];
                for (var k = 0; k < classes.length; k++) {
                    button.removeStyleClass(classes[k]);
                }
                state = data[i].statoLinea.split(".");
                switch (state[0]) {
                    case "Disponibile":
                        button.addStyleClass("LineaDispoSin");
                        break;
                    case "Nondisponibile":
                        button.addStyleClass("LineaNonDispoSin");
                        break;
                }
                switch (state[1]) {
                    case "Vuota":
                        button.addStyleClass("LineaVuotaSin");
                        break;
                    case "Attrezzaggio":
                        button.addStyleClass("LineaAttrezzaggioSin");
                        break;
                    case "Lavorazione":
                        button.addStyleClass("LineaLavorazioneSin");
                        break;
                    case "Fermo":
                        button.addStyleClass("LineaFermoSin");
                        break;
                    case "Svuotamento":
                        button.addStyleClass("LineaSvuotamentoSin");
                        break;
                }
            }
        },
//        ************************ GESTIONE STILE PROGRESS INDICATOR ************************     
        BarColorCT: function (data) {
//            var progressBar;
            for (var j = 0; j < data.length; j++) {
                if (data[j].length > 0) {
                    for (var i = 0; i < data[j].length; i++) {
                        if (Number(data[j].Linee[i].avanzamento) >= 100) {
                            data[j].Linee[i].avanzamento = 100;
                        } else {
                            data[j].Linee[i].avanzamento = Number(data[j].Linee[i].avanzamento);
                        }
//                    progressBar = this.getView().byId("lineeCorta").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0];
//                    switch (data.corta[i].barColor) {
//                        case "yellow":
//                            progressBar.setState("Warning");
//                            break;
//                        case "green":
//                            progressBar.setState("Success");
//                            break;
//                        case "orange":
//                            progressBar.setState("Error");
//                            break;
//                    }
//                    if (data.corta[i].statolinea === "Disponibile.Fermo") {
//                        progressBar.setState("None");
//                    }
                    }
                }
            }
            return data;
        },
        //      GESTIONE STILE SPC
        SPCColorCT: function (data) {
            var CSS_classesButton = ["SPCButtonColorGreenSin", "SPCButtonColorYellowSin", "SPCButtonPhase1Sin", "SPCButtonContentSin", "DualSPCButtonContentSin", "SPCButtonEmptySin"];
            var SPCButton;
            if (data.corta.length > 0) {
                for (var i = 0; i < data.corta.length; i++) {
                    for (var j = 0; j < data.corta[i].SPC.length; j++) {
                        SPCButton = this.getView().byId("lineeCorta").getItems()[i].getCells()[0].getItems()[0].getItems()[j + 2].getItems()[0];
                        for (var k = 0; k < CSS_classesButton.length; k++) {
                            SPCButton.removeStyleClass(CSS_classesButton[k]);
                        }
                        var discr = "";
                        if (data.corta[i].statoLinea === "Disponibile.Lavorazione") {
                            if (data.corta[i].SPC[j].fase === "1") {
                                discr = "1";
                            } else if (data.corta[i].SPC[j].fase === "2") {
                                discr = "2";
                            }
                        }
                        switch (discr) {
                            case "1":
                                SPCButton.setEnabled(true);
                                if (SPCButton.getIcon() !== "img/triangolo_buco.png") {
                                    SPCButton.setIcon("img/triangolo_buco.png");
                                }
                                SPCButton.setText(data.corta[i].SPC[j].numeroCampionamenti);
                                SPCButton.addStyleClass("SPCButtonPhase1Sin");
                                SPCButton.addStyleClass("SPCButtonColorYellowSin");
                                break;
                            case "2":
                                SPCButton.setEnabled(true);
                                SPCButton.setIcon("");
                                SPCButton.setText("");
                                if (data.corta[i].SPC[j].allarme === "0") {
                                    SPCButton.addStyleClass("SPCButtonColorGreenSin");
                                } else if (data.corta[i].SPC[j].allarme === "1") {
                                    SPCButton.addStyleClass("SPCButtonColorYellowSin");
                                }
                                break;
                            default:
                                SPCButton.setText("");
                                SPCButton.addStyleClass("SPCButtonEmptySin");
                                SPCButton.setIcon("");
                                SPCButton.setEnabled(false);
                                break;
                        }
                    }
                }
            }
        },
        CheckCells: function () {
            var oItems = this.getView().byId("lineeCorta").getItems();
            for (var i = 0; i < oItems.length; i++) {
                var cellText = oItems[i].getCells()[0].getItems()[1].getItems()[3];
                var cellBugged = oItems[i].getCells()[0].getItems()[1].getItems()[2];
                if (cellBugged.getHeight() !== cellText.getHeight()) {
                    cellBugged.setHeight(cellText.getHeight());
                }
            }
        },
        BackToMain: function () {
            clearInterval(this.TIMER);
            this.STOP = 1;
            this.getOwnerComponent().getRouter().navTo("Main");
        }
    });
});