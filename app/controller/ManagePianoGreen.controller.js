sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History',
    'myapp/controller/Library',
    'myapp/model/TimeFormatter',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
], function (MessageToast, jQuery, Controller, JSONModel, History, Library, TimeFormatter, Filter, FilterOperator) {
    "use strict";
    var ManagePianoGreen = Controller.extend("myapp.controller.ManagePianoGreen", {
        checkSingoloCausa: null,
        checkTotaleCausa: null,
        ModelGuastiLinea: null,
        ModelCausali: new JSONModel({}),
        StabilimentoID: null,
        pdcID: null,
        repartoID: null,
        linea_id: null,
        confezione: null,
        grammatura: null,
        row: null,
        linea: null,
        pezzi_cartone: 24, //ARRIVA DA BACKEND 
        tempo_ciclo: 4, //ARRIVA DA BACKEND
        TimeFormatter: TimeFormatter,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,
        data_json: {},
        ModelReparti: sap.ui.getCore().getModel("reparti"),
        ModelMenu: new JSONModel({}),
        ModelLinea: null,
        ModelOperatori: new JSONModel({}),
        ModelSKU: new JSONModel({}),
        ModelSPCData: new JSONModel({}),
        ModelTurni: null,
        ModelSKUstd: new JSONModel({}),
        ModelCause: new JSONModel({}),
        prova: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        oDialog: null,
        STOP: 0,
        oButton: null,
        SPCDialog: null,
        Allarme: null,
        Fase: null,
        ParametroID: null,
        DescrizioneParametro: null,
        Avanzamento: null,
        idLinea: null,
        idBatch: null,
        indexSPC: null,
        pathlinea: null,
        onInit: function () {
            this.getView().setModel(this.ModelReparti, "reparti");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePianoGreen").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function (oEvent) {
            this.StabilimentoID = sap.ui.getCore().getModel("stabilimento").getData().StabilimentoID;
            this.pdcID = sap.ui.getCore().getModel("ParametriPiano").getData().pdc;
            this.repartoID = sap.ui.getCore().getModel("ParametriPiano").getData().reparto;
            this.getView().setModel("ParametriPiano");
            this.ModelLinea = sap.ui.getCore().getModel("linee");
            this.ModelTurni = sap.ui.getCore().getModel("turni");
            if (Number(this.ISLOCAL) === 1) {
                Library.AjaxCallerData("model/operators.json", this.SUCCESSDatiOperatore.bind(this));
                this.getView().setModel(this.ModelOperatori, 'operatore');
                Library.AjaxCallerData("model/SKU_standard.json", this.SUCCESSSKUstd.bind(this));
                this.getView().setModel(this.ModelSKUstd, 'SKUstd');
                Library.AjaxCallerData("model/SKU_backend.json", this.SUCCESSSKU.bind(this));
                this.getView().setModel(this.ModelSKU, 'SKU');
            }
            if (typeof oEvent !== "undefined") {
                this.STOP = 0;
                this.turnoPath = oEvent.getParameter("arguments").turnoPath;
                this.pianoPath = oEvent.getParameter("arguments").pianoPath;
                this.piano = this.ModelTurni.getData().pianidiconfezionamento[this.turnoPath][this.pianoPath];
            }
            var oTitle = this.getView().byId("Title");
            oTitle.setText(this.piano.data + "    -    " + this.piano.turno);
            oTitle.addStyleClass("customTextTitle");
            this.getView().setModel(this.ModelLinea, 'linea');
            var oModel = new JSONModel({inizio: this.piano.turno.split("-")[0].trim(), fine: this.piano.turno.split("-")[1].trim()});
            this.getView().setModel(oModel, "orarioturno");
            if (this.ISLOCAL !== 1 && this.STOP === 0) {
                this.RefreshFunction(100);
            }
        },
        RefreshFunction: function (msec) {
            this.TIMER = setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            Library.SyncAjaxCallerData(link, this.RefreshDataSet.bind(this));
        },
        RefreshDataSet: function (Jdata) {
            if (this.ISLOCAL === 1) {
                Library.AjaxCallerData("model/operators.json", this.SUCCESSDatiOperatore.bind(this));
                this.getView().setModel(this.ModelOperatori, 'operatore');
                Library.AjaxCallerData("model/SKU_standard.json", this.SUCCESSSKUstd.bind(this));
                this.getView().setModel(this.ModelSKUstd, 'SKUstd');
                Library.AjaxCallerData("model/SKU_backend.json", this.SUCCESSSKU.bind(this));
                this.getView().setModel(this.ModelSKU, 'SKU');
            } else {
                if (this.STOP === 0) {
                    Jdata = this.BarColorCT(Jdata);
                    this.SPCColorCT(Jdata);
                    this.ModelLinea.setData(Jdata);
                    this.ModelLinea.refresh(true);
                    this.getView().setModel(this.ModelLinea, "linea");
                    sap.ui.getCore().setModel(this.ModelLinea, "linee");
                    this.SettingsButtonColor();
                    this.LineButtonStyle();
                }
            }
            this.RefreshFunction(5000);
        },
        LineButtonStyle: function () {
            var classes = ["LineaDispo", "LineaNonDispo", "LineaVuota", "LineaAttrezzaggio", "LineaLavorazione", "LineaFermo", "LineaSvuotamento"];
            var data = this.ModelLinea.getData();
            var button;
            var state;
            for (var i = 0; i < data.linee.length; i++) {
                button = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0].getItems()[0].getItems()[0];
                for (var k = 0; k < classes.length; k++) {
                    button.removeStyleClass(classes[k]);
                }
                state = data.linee[i].statolinea.split(".");
                switch (state[0]) {
                    case 'Disponibile':
                        button.addStyleClass("LineaDispo");
                        break;
                    case 'Nondisponibile':
                        button.addStyleClass("LineaNonDispo");
                        break;
                }
                switch (state[1]) {
                    case "Vuota":
                        button.addStyleClass("LineaVuota");
                        break;
                    case "Attrezzaggio":
                        button.addStyleClass("LineaAttrezzaggio");
                        break;
                    case "Lavorazione":
                        button.addStyleClass("LineaLavorazione");
                        break;
                    case "Fermo":
                        button.addStyleClass("LineaFermo");
                        break;
                    case "Svuotamento":
                        button.addStyleClass("LineaSvuotamento");
                        break;
                }
            }
        },
        SettingsButtonColor: function () {
            var classes = ["BatchInMacchina", "BatchInAttesa", "BatchTrasferito"];
            var data = this.ModelLinea.getData();
            var button;
            for (var i = 0; i < data.linee.length; i++) {
                for (var j = 0; j < data.linee[i].batchlist.length; j++) {
                    button = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0].getItems()[j].getCells()[7].getItems()[0].getItems()[0].getItems()[0];
                    for (var k = 0; k < classes.length; k++) {
                        button.removeStyleClass(classes[k]);
                    }
                    switch (data.linee[i].batchlist[j].statoBatch) {
                        case 'In lavorazione':
                        case 'Attrezzaggio':
                            button.addStyleClass("BatchInMacchina");
                            break;
                        case 'Attesa presa in carico':
                            button.addStyleClass("BatchTrasferito");
                            break;
                        default:
                            button.addStyleClass("BatchInAttesa");
                            break;
                    }
                }
            }
        },
        BarColorCT: function (data) {
            var progressBar;
            if (data.linee.length > 0) {
                for (var i = 0; i < data.linee.length; i++) {
                    if (Number(data.linee[i].avanzamento) >= 100) {
                        data.linee[i].avanzamento = 100;
                    } else {
                        data.linee[i].avanzamento = Number(data.linee[i].avanzamento);
                    }
                    progressBar = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].getItems()[0];
                    switch (data.linee[i].barColor) {
                        case "yellow":
                            progressBar.setState("Warning");
                            break;
                        case "green":
                            progressBar.setState("Success");
                            break;
                        case "orange":
                            progressBar.setState("Error");
                            break;
                    }
                    if (data.linee[i].statolinea === "Disponibile.Fermo") {
                        progressBar.setState("None");
                    }
                }
            }
            return data;
        },
        SPCColorCT: function (data) {
            var CSS_classesButton = ["SPCButtonColorGreen", "SPCButtonColorYellow", "SPCButtonPhase1", "SPCButtonContent", "DualSPCButtonContent"];
            var SPCButton;
            if (data.linee.length > 0) {
                for (var i = 0; i < data.linee.length; i++) {
                    for (var j = 0; j < data.linee[i].SPC.length; j++) {
                        SPCButton = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[j + 1].getItems()[0];
                        if (data.linee[i].SPC[j].fase !== "") {
                            SPCButton.setEnabled(true);
                        } else {
                            SPCButton.setEnabled(false);
                        }
                        for (var k = 0; k < CSS_classesButton.length; k++) {
                            SPCButton.removeStyleClass(CSS_classesButton[k]);
                        }
                        switch (data.linee[i].SPC[j].fase) {
                            case "1":
                                SPCButton.setIcon("img/triangolo_buco.png");
                                SPCButton.setText(data.linee[i].SPC[j].numeroCampionamenti);
                                SPCButton.addStyleClass("SPCButtonPhase1");
//                            if (data.length === 1) {
//                                SPCButton.addStyleClass("SPCButtonContent");
//                            } else {
//                                SPCButton.addStyleClass("DualSPCButtonContent");
//                            }
                                SPCButton.addStyleClass("SPCButtonColorYellow");
                                break;
                            case "2":
                                SPCButton.setIcon("");
                                SPCButton.setText("");
                                if (data.linee[i].SPC[j].allarme === "0") {
                                    SPCButton.addStyleClass("SPCButtonColorGreen");
                                } else if (data.linee[i].SPC[j].allarme === "1") {
                                    SPCButton.addStyleClass("SPCButtonColorYellow");
                                }
                                break;
                            default:
                                SPCButton.setIcon("img/triangolo_buco.png");
                                SPCButton.setText("0");
                                SPCButton.addStyleClass("SPCButtonPhase1");
//                            if (data.length === 1) {
//                                SPCButton.addStyleClass("SPCButtonContent");
//                            } else {
//                                SPCButton.addStyleClass("DualSPCButtonContent");
//                            }
                                SPCButton.addStyleClass("SPCButtonColorYellow");
                                break;
                        }
                        if (data.linee[i].statolinea === "Disponibile.Fermo") {
                            SPCButton.setText("0");
                            SPCButton.addStyleClass("SPCButtonPhase1");
                            SPCButton.addStyleClass("SPCButtonColorYellow");
                            SPCButton.setIcon("img/triangolo_buco.png");
                            SPCButton.setEnabled(false);
                        }
                    }
                }
            }
        },
        SPCGraph: function (event) {
            this.pathLinea = event.getSource().getBindingContext("linea").sPath;
            this.indexSPC = Number(event.getSource().data("mydata"));
            this.idBatch = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].IDbatchAttivo;
            this.idLinea = this.ModelLinea.getProperty(this.pathLinea).lineaID;
            this.ParametroID = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].parametroId;
            this.DescrizioneParametro = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].descrizioneParametro;
            this.SPCDialog = this.getView().byId("SPCWindow");
            if (!this.SPCDialog) {
                this.SPCDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.SPCWindow", this);
                this.getView().addDependent(this.SPCDialog);
            }
            this.SPCDialog.open();
            this.SPCDataCaller();
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
        SUCCESSSPCDataLoad: function (Jdata) {
            var isEmpty;
            this.Allarme = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].allarme;
            this.Fase = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].fase;
            this.Avanzamento = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].avanzamento;
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
            setTimeout(this.SPCDataCaller.bind(this), 1000);
        },
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
        RemoveAlarm: function () {
            var alarmButton = this.getView().byId("alarmButton");
            alarmButton.setEnabled(false);
            alarmButton.removeStyleClass("allarmeButton");
            alarmButton.addStyleClass("chiudiButton");
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ResetSPCAlarm&Content-Type=text/json&BatchID=" + this.idBatch + "&ParametroID=" + this.ParametroID;
            Library.AjaxCallerVoid(link, this.RefreshCall.bind(this));
            this.CloseSPCDialog();
        },
        CloseSPCDialog: function () {
            this.SPCDialog.close();
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
//                    showline: false
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
        SUCCESSCause: function (Jdata) {
            this.data_json = {};
            this.data_json.cause = [];
            this.takeAllCause(Jdata);
            this.ModelCause.setData(this.data_json);
        },
        SUCCESSDatiOperatore: function (Jdata) {
            this.ModelOperatori.setData(Jdata);
            this.getView().setModel(this.ModelOperatori, 'operatore');
        },
        SUCCESSSKU: function (Jdata) {
            var bck = Jdata.SKUattuale;
            var std = Jdata.SKUstandard;
//            var std = this.getView().getModel("SKUstd").getData();
            bck = Library.RecursiveJSONComparison(std, bck, "attributi");
            bck = Library.RecursiveParentExpansion(bck);
            this.ModelSKU.setData(bck);
            this.getView().setModel(this.ModelSKU, "SKU");
        },
        SUCCESSSKUstd: function (Jdata) {
            this.ModelSKUstd.setData(Jdata);
        },
        SUCCESSMenu: function (Jdata, oButton) {
            var oState = oButton.getState();
            if (oState === "Non trasferito") {
                Jdata.menu[0].attivo = false;
                Jdata.menu[1].attivo = true;
                Jdata.menu[2].attivo = true;
                Jdata.menu[3].attivo = true;
                Jdata.menu[4].attivo = true;
                Jdata.menu[5].attivo = false;
                Jdata.menu[6].attivo = true;
                Jdata.menu[7].attivo = false;
                Jdata.menu[8].attivo = false;
            }
            this.ModelMenu.setData(Jdata);
        },
        SUCCESSFormati: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{formati>ID}",
                    text: "{formati>formato}"
                });
                selectBox.setModel(oModel, "formati");
                selectBox.bindAggregation("items", "formati>/formati", oItemSelectTemplate);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        SUCCESSListaSKU: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                var selectBox = this.getView().byId("SKU");
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    text: "{SKUCodiciInterni>SKUCodiceInterno}"
                });
                selectBox.setModel(oModel, "SKUCodiciInterni");
                selectBox.bindAggregation("items", "SKUCodiciInterni>/SKUCodiciInterni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        SUCCESSConfezionamenti: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{confezionamenti>confezione} {confezionamenti>grammatura}gr",
                    text: "{confezionamenti>confezioneCodiceInterno}"
                });
                selectBox.setModel(oModel, "confezionamenti");
                selectBox.bindAggregation("items", "confezionamenti>/confezioni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        SUCCESSDestinazione: function (Jdata, oRow, row_binded) {
            if (Number(Jdata.error) === 0) {
                oRow.getCells()[4].setEnabled(true);
                oRow.getCells()[5].setEnabled(true);
                oRow.getCells()[6].setEnabled(true);
                oRow.getCells()[4].setValue("");
                oRow.getCells()[5].setValue("");
                oRow.getCells()[6].setValue("");
                oRow.getCells()[3].setText(Jdata.destinazione);
                oRow.getCells()[3].setEnabled(true);
                row_binded.pezziCartone = Number(Jdata.pezziCartone);
                row_binded.secondiPerPezzo = Number(Jdata.secondiPerPezzo);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        SUCCESSDestinazioni: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    text: "{destinazioni>destinazione}"
                });
                selectBox.setModel(oModel, "destinazioni");
                selectBox.bindAggregation("items", "destinazioni>/destinazioni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        SUCCESSQuantita: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                var rowPath = this.row.getBindingContext("linea").sPath;
                var row_binded = this.getView().getModel("linea").getProperty(rowPath);
                row_binded.pezziCartone = Jdata.pezziCartone;
                row_binded.secondiPerPezzo = Jdata.secondiPerPezzo;
                this.row.getCells()[1].setValue(this.getView().byId("formato_SKU").getValue());
                this.row.getCells()[2].destroyItems();
                this.row.getCells()[2].setValue(this.getView().byId("confezione_SKU").getValue());
                row_binded.confezione = this.confezione;
                row_binded.grammatura = this.grammatura;
                this.row.getCells()[3].setText(this.getView().byId("cliente_SKU").getValue());
                this.row.getCells()[4].setValue("");
                this.row.getCells()[5].setValue("");
                this.row.getCells()[6].setValue("");
//                this.row.getCells()[7].setVisible(true);
//                row_binded.SKUCodiceInterno = this.getView().byId("SKU").getValue();
                row_binded.SKUCodiceInterno = "";
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        SUCCESSOperatori: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{operatore>addettoID}",
                    text: "{operatore>cognome} {operatore>nome}"
                });
                selectBox.setModel(oModel, "operatore");
                selectBox.bindAggregation("items", "operatore>/operatori", oItemSelectTemplate);
                var aFilter = [];
//                var query = selectBox.getPlaceholder();
                var query = this.getView().getModel("linea").getProperty(selectBox.getBindingContext("linea").sPath).sezione;
                if (query) {
                    aFilter.push(new Filter("sezione", FilterOperator.Contains, query));
                }
                selectBox.getBinding("items").filter(aFilter);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        SUCCESSGuasti: function (Jdata) {
            this.CheckSingoloCausa = [];
            Jdata = Library.AddTimeGaps(Jdata);
            this.ModelGuastiLinea = new JSONModel({});
            this.ModelGuastiLinea.setData(Jdata);
            for (var j in Jdata.fermi) {
                this.CheckSingoloCausa.push(0);
                Jdata.fermi[j].selected = false;
            }
            this.ModelGuastiLinea = new JSONModel({});
            this.ModelGuastiLinea.setData(Jdata);
            var oView = this.getView();
            oView.setModel(this.ModelGuastiLinea, "guastilinea");
            this.oDialog = oView.byId("CausalizzazioneFermo");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.CausalizzazioneFermo", this);
                oView.addDependent(this.oDialog);
            }
            var oTable = this.getView().byId("TotaleTable");
            oTable.setVisible(true);
            oTable.getItems()[0].getCells()[3].setSelected(false);
            this.CheckTotaleCausa = 0;
            this.getView().byId("NoFermiDaCausalizzare").setVisible(false);
            this.oDialog.open();
        },
        SUCCESSFermo: function (Jdata) {
            this.ModelCausali.setData(Jdata);
            this.getView().setModel(this.ModelCausali, "CausaliFermo");
            var oView = this.getView();
            this.onCloseDialog();
            //PULIZIA DELLA PAGINA -DESELEZIONO UN'EVENTUALE CASELLA SELEZIONATA 
            var old_id = this.GetActiveCB();
            if (old_id !== 0) {
                var old_CB = sap.ui.getCore().byId(old_id);
                old_CB.setSelected(false);
                this.CheckFermo[old_id] = 0;
            }

            var dialog = oView.byId("CausalizzazioneFermoPanel");
            if (!dialog) {
                dialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.CausalizzazioneFermoPanel", this);
                oView.addDependent(dialog);
            }
            this.oDialog = dialog;
//            dialog.open();
            var data = this.ModelCausali.getData().gerarchie;
            var num_gerarchie = data.length;
            var ID, CB;
            var cols = 2;
            var rows = Math.ceil(num_gerarchie / cols);
            var outerVBox = this.getView().byId("CausalizzazioneFermoPanelBox");
            if (outerVBox.getItems().length > 0) {
                outerVBox.destroyItems();
            }
            var vvbb1 = new sap.m.VBox({height: "90%", width: "100%"});
            var vvbb3 = new sap.m.VBox({height: "10%", width: "100%"});
            vvbb3.addStyleClass("sapUiMediumMarginTop");
            var hbox = new sap.m.HBox({height: "100%"});
            var vb1 = new sap.m.VBox({width: "15%"});
            var VB1 = new sap.m.VBox({width: "85%"});
            var L1_vbox, L2_hbox, L3_vbox, title, subdata;
            var L3_width = String(Math.round(100 / cols)) + "%";
            var index = 0;
            this.CheckFermo = [];
            for (var i = 0; i < rows; i++) {
                L2_hbox = new sap.m.HBox();
                L2_hbox.addStyleClass("sapUiSmallMarginBottom");
                for (var j = 0; j < cols; j++) {
                    title = new sap.m.Text({text: data[index].gerarchia});
                    title.addStyleClass("customText");
                    L3_vbox = new sap.m.VBox({width: L3_width});
                    L3_vbox.addItem(title);
                    subdata = data[index].attributi;
                    for (var k = 0; k < subdata.length; k++) {
                        ID = "CBFermo" + subdata[k].id;
                        this.CheckFermo[ID] = 0;
                        CB = new sap.m.CheckBox({
                            id: ID,
                            text: subdata[k].fermo,
                            select: this.ChangeCheckedFermo.bind(this),
                            selected: false});
                        L3_vbox.addItem(CB);
                    }
                    L2_hbox.addItem(L3_vbox);
                    index++;
                    if (index === data.length) {
                        break;
                    }
                }
                L1_vbox = new sap.m.VBox({});
                L1_vbox.addItem(L2_hbox);
                VB1.addItem(L1_vbox);
            }
            hbox.addItem(vb1);
            hbox.addItem(VB1);
            vvbb1.addItem(hbox);
            outerVBox.addItem(vvbb1);
            var hbox1 = new sap.m.HBox({});
            var vb0 = new sap.m.VBox({width: "10%"});
            var vb01 = new sap.m.VBox({width: "37%"});
            var vb2 = new sap.m.VBox({width: "6%"});
            var vb3 = new sap.m.VBox({width: "37%"});
            var vb4 = new sap.m.VBox({width: "10%"});
            var bt1 = new sap.m.Button({
                id: "AnnullaFermo",
                text: "ANNULLA",
                width: "100%",
                enabled: true,
                press: this.onCloseDialog.bind(this)});
            bt1.addStyleClass("annullaButton");
            var bt2 = new sap.m.Button({
                id: "ConfermaFermo",
                text: "CONFERMA",
                width: "100%",
                enabled: false,
                press: this.onConfermaFermoCausalizzato.bind(this)});
            bt2.addStyleClass("confermaButton");
            vb3.addItem(bt2);
            vb01.addItem(bt1);
            vb0.addItem(new sap.m.Text({}));
            vb2.addItem(new sap.m.Text({}));
            vb4.addItem(new sap.m.Text({}));
            hbox1.addItem(vb0);
            hbox1.addItem(vb01);
            hbox1.addItem(vb2);
            hbox1.addItem(vb3);
            hbox1.addItem(vb4);
            vvbb3.addItem(hbox1);
            outerVBox.addItem(vvbb3);
            dialog.open();
        },
        SUCCESSModificaCausale: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            this.getView().setModel(this.ModelLinea, "linea");
            this.ModelLinea.refresh(true);
            this.onCloseDialog();
        },
        changeReparto: function (oEvent) {
            var link;
            var that = this;
            var area = this.piano.area;
            this.repartoID = oEvent.getParameters().key;
            if (this.ISLOCAL !== 1) {
                if (area === "0") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDpassato&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                } else if (area === "1") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                } else if (area === "2") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                }
                Library.AjaxCallerData(link, function (Jdata) {
                    that.ModelLinea.setData(Jdata);
                });
                this.getView().setModel(this.ModelLinea, "linea");
            }
        },
        takeAllCause: function (bck) {
            for (var key in bck) {
                if (typeof bck[key] === "object") {
                    bck[key] = this.takeAllCause(bck[key]);
                }
            }
            if (bck.fermo !== undefined) {
                this.data_json.cause.push(bck);
            }
            return bck;
        },
        onNavBack: function () {
            var AddButton;
            for (var i = 0; i < this.ModelLinea.getData().linee.length; i++) {
                AddButton = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[3].getItems()[0];
                AddButton.setEnabled(true);
            }
            this.STOP = 1;
            this.getView().byId("ManageIconTabBar").setSelectedKey("1");
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("overview", true);
            }
        },
        handlePressOpenMenu: function (oEvent) {
            this.oButton = oEvent.getSource();
            var Path = this.oButton.getBindingContext("linea").sPath;
            var PathArray = Path.split("/");
            var indexLinea = Number(PathArray[PathArray.indexOf("linee") + 1]);
            this.linea_id = this.ModelLinea.getData().linee[indexLinea].lineaID;
            this.batch_id = this.ModelLinea.getProperty(Path).batchID;
            this.row = oEvent.getSource().getParent().getParent().getParent().getParent();
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/prova.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetMenuFromBatchID&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.SUCCESSMenuOpened.bind(this));
        },
        UndoBatchCreation: function (oEvent) {
            var path = oEvent.getSource().getBindingContext("linea").sPath.split("/");
            var index = Number(path[path.indexOf("linee") + 1]);
            var AddButton = this.getView().byId("managePianoTable").getItems()[index].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[3].getItems()[0];
            AddButton.setEnabled(true);
            this.STOP = 0;
            this.RefreshCall();
//            var Model = this.getView().getModel("linea");
//            var oData = Model.getData();
//            var oLinea_path = oEvent.getSource().getBindingContext("linea").getPath().split("/");
//            var linea = oData[oLinea_path[1]][oLinea_path[2]];
//            linea.batchlist.pop();
//            Model.setData(oData);
//            this.getView().setModel(Model, "linea");
        },
        SUCCESSMenuOpened: function (Jdata) {
            this.ModelMenu.setData(Jdata);
            this.getView().setModel(this.ModelMenu);
            if (!this._menu) {
                this._menu = sap.ui.xmlfragment(
                        "myapp.view.MenuItemEventing",
                        this
                        );
                this.getView().addDependent(this._menu);
            }
            var eDock = sap.ui.core.Popup.Dock;
//            this.callMenu(this.oButton);
//            this.getView().setModel(this.ModelMenu);
            this._menu.setModel(this.prova);
            this._menu.open(this._bKeyboard, this.oButton, eDock.BeginTop, eDock.BeginBottom, this.oButton);
        },
        ChangeValues: function (oEvent) {
//            this.STOP = 1;
            this.showUpdateButton(oEvent);
            var row_path = oEvent.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(row_path);
            this.pezzi_cartone = row_binded.pezziCartone;
            this.tempo_ciclo = row_binded.secondiPerPezzo;
            var grammatura, numero_pezzi, cartoni, ore, quintali;
            var oValueChanged = oEvent.getParameter("value");
            var oCellChanged = oEvent.getSource();
            var oRow = oEvent.getSource().getParent();
//            var oValue = oRow.getCells()[2].getValue();
            grammatura = row_binded.grammatura;
            if (oCellChanged === oRow.getCells()[4]) {
                numero_pezzi = (oValueChanged * 100) / (grammatura / 1000);
                cartoni = Math.ceil(numero_pezzi / this.pezzi_cartone);
                oRow.getCells()[5].setValue(cartoni);
                ore = Math.ceil((numero_pezzi * this.tempo_ciclo) / 60);
                oRow.getCells()[6].setValue(Library.minutesToStandard(ore));
            }
            if (oCellChanged === oRow.getCells()[5]) {
                numero_pezzi = oValueChanged * this.pezzi_cartone;
                quintali = (numero_pezzi * grammatura) / 100000;
                oRow.getCells()[4].setValue(Library.roundTo(quintali, 2));
                ore = Math.ceil((numero_pezzi * this.tempo_ciclo) / 60);
                oRow.getCells()[6].setValue(Library.minutesToStandard(ore));
            }
            if (oCellChanged === oRow.getCells()[6]) {
                numero_pezzi = Library.standardToMinutes(oValueChanged) / (this.tempo_ciclo / 60);
                cartoni = Math.ceil(numero_pezzi / this.pezzi_cartone);
                quintali = (numero_pezzi * grammatura) / 100000;
                oRow.getCells()[4].setValue(Library.roundTo(quintali, 2));
                oRow.getCells()[5].setValue(cartoni);
            }
//            oRow.getCells()[7].setVisible(true);
        },
// AGGIUNGO UNA RIGA QUANDO PREMO SU AGGIUNGI RIGA
        onAddItem: function (oEvent) {
            var path = oEvent.getSource().getBindingContext("linea").sPath.split("/");
            var index = Number(path[path.indexOf("linee") + 1]);
            var AddButton = this.getView().byId("managePianoTable").getItems()[index].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[3].getItems()[0];
            AddButton.setEnabled(false);
            this.STOP = 1;
            var Model = this.getView().getModel("linea");
            var oData = Model.getData();
            var oLinea_path = oEvent.getSource().getBindingContext("linea").getPath().split("/");
            var obj = {};
            var linea = oData[oLinea_path[1]][oLinea_path[2]];
            var last_batch = linea.lastbatch[0];
            obj.sequenza = last_batch.sequenza;
            obj.formatoProduttivo = last_batch.formatoProduttivo;
            obj.confezione = last_batch.confezione;
            obj.grammatura = last_batch.grammatura;
            obj.confezioneCodiceInterno = last_batch.confezioneCodiceInterno;
            obj.destinazione = last_batch.destinazione;
            obj.secondiPerPezzo = last_batch.secondiPerPezzo;
            obj.pezziCartone = last_batch.pezziCartone;
            obj.showButton = 0;
            obj.SKUCodiceInterno = last_batch.SKUCodiceInterno;
            linea.batchlist.push(obj);
//            linea.batchlist.splice(linea.batchlist.length - 1, 0, obj);
            Model.setData(oData);
            this.getView().setModel(Model, "linea");
        },
        InsertNewBatch: function (oEvent) {
            var PathLinea = oEvent.getSource().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            var oRow = oEvent.getSource().getParent().getParent().getParent().getParent().getParent().getParent();
            var rowPath = oEvent.getSource().getParent().getParent().getParent().getParent().getParent().getParent().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
//            var array_confezione = oRow.getCells()[2].getSelectedItem().getKey().split(" ");
            var that = this;
            var link;
            var obj = {};
            if (row_binded.batchID) {
                obj.batchId = row_binded.batchID;
            } else {
                obj.batchId = "";
            }
//            if (row_binded.SKUCodiceInterno) {
//                obj.SKUCodiceInterno = row_binded.SKUCodiceInterno;
//            } else {
//                obj.SKUCodiceInterno = "";
//            }
            obj.SKUCodiceInterno = "";
            obj.pianodiconfezionamento = this.pdcID;
            obj.lineaId = this.linea_id;
            obj.formatoProduttivo = oRow.getCells()[1].getValue();
//            obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
//            obj.tipologia = array_confezione[0];
            obj.grammatura = row_binded.grammatura;
            obj.tipologia = row_binded.confezione;
            obj.sequenza = oRow.getCells()[0].getValue();
            obj.destinazione = oRow.getCells()[3].getText();
            obj.quintali = oRow.getCells()[4].getValue();
            obj.cartoni = oRow.getCells()[5].getValue();
            obj.ore = oRow.getCells()[6].getValue();
            if (((Number(obj.quintali) !== 0) && (Number(obj.cartoni) !== 0))) {
                var doc_xml = Library.createXMLBatch(obj);
                if (Number(this.ISLOCAL) === 1) {
                    oRow.getCells()[7].setVisible(false);
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/InsertUpdateBatch&Content-Type=text/json&xml=" + doc_xml + "&OutputParameter=JSON";
                    Library.SyncAjaxCallerData(link, function (Jdata) {
                        if (Number(Jdata.error) === 0) {
                            that.STOP = 0;
                            that.RefreshCall();
                        } else {
                            MessageToast.show(Jdata.errorMessage, {duration: 2000});
                        }
                    });
                    if (this.STOP === 0) {
                        var path = oEvent.getSource().getBindingContext("linea").sPath.split("/");
                        var index = Number(path[path.indexOf("linee") + 1]);
                        var AddButton = this.getView().byId("managePianoTable").getItems()[index].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[3].getItems()[0];
                        AddButton.setEnabled(true);
                    }
                }
            } else {
                MessageToast.show("Non si possono inserire batch con zero quintali", {duration: 2000});
            }
        },
//GESTIONE VISUALIZZA ATTRIBUTI BATCH
        azioneBatch: function (oEvent) {
            var oText = oEvent.getParameter("item").getText();
            var link;
            switch (oText) {
                case "Visualizza Attributi Batch":
                    this.visuBatch();
                    break;
                case "Trasferimento Batch a Linea":
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboTrasferimento&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTrasferimentoBatch.bind(this));
                    break;
                case "Trasferimento Batch a Linea (solo attrezzaggio)":
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboTrasferimentoPredisposizione&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTrasferimentoBatchAttrezzaggio.bind(this));
                    break;
                case "Richiamo Batch":
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchRichiamo&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSRichiamoBatch.bind(this));
                    break;
                case "Cancellazione Batch":
                    this.STOP = 1;
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/CancellazioneBatch&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSCancellazioneBatch.bind(this));
                    break;
                case "Gestione Intervalli di Fermo":
                    break;
                case "Causalizzazione Fermi Automatici":
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiAutoSenzaCausaFromBatchID&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSGuasti.bind(this));
                    break;
            }

        },
        visuBatch: function (oEvent) {
            var oRow;
            if (oEvent) {
                this.STOP = 1;
                this.ModelLinea.getProperty(oEvent.getSource().getBindingContext("linea").getPath()).showButton = 0;
                this.getView().setModel(this.ModelLinea, "linea");
//            var oLinea_path = oEvent.getSource().getBindingContext("linea").getPath().split("/");
//            var obj = {};
//            var linea = oData[oLinea_path[1]][oLinea_path[2]];
//            var linea_path = oEvent.getSource().getParent().getParent().getBindingContext("linea").sPath;
//            this.linea = this.getView().getModel("linea").getProperty(linea_path);
                oRow = oEvent.getSource().getParent();
            }
            if (!oRow) {
                oRow = this.row;
            }
            var linea_path = oRow.getParent().getBindingContext("linea").sPath;
            this.linea = this.getView().getModel("linea").getProperty(linea_path);
            this.linea_id = this.linea.lineaID;
            this.row = oRow;
            var oView;
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            this.confezione = row_binded.confezione;
            this.grammatura = row_binded.grammatura;
            if (this.ISLOCAL === 1) {
                oView = this.getView();
                var std = this.getView().getModel("SKUstd").getData();
                var bck = this.getView().getModel("SKU").getData();
                bck = Library.RecursiveJSONComparison(std, bck, "attributi");
                bck = Library.RecursiveParentExpansion(bck);
                this.ModelSKU.setData(bck);
                this.getView().setModel(this.ModelSKU, "SKU");
                this.oDialog = oView.byId("modificaAttributi");
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaAttributi", this);
                    oView.addDependent(this.oDialog);
                }
                this.getView().byId("formato_SKU").setValue(oRow.getCells()[1].getValue());
                this.getView().byId("confezione_SKU").setValue(oRow.getCells()[2].getValue());
                this.getView().byId("cliente_SKU").setValue(oRow.getCells()[3].getText());
//                this.getView().byId("SKU").setValue(row_binded.SKUCodiceInterno);
                Library.RemoveClosingButtons.bind(this)("attributiContainer");
                this.oDialog.open();
            } else {
                oView = this.getView();
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.lineaId = "";
                obj.batchId = "";
                obj.sequenza = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
//                if (row_binded.SKUCodiceInterno) {
//                    obj.SKUCodiceInterno = row_binded.SKUCodiceInterno;
//                } else {
//                    obj.SKUCodiceInterno = "";
//                }
                obj.SKUCodiceInterno = "";
                obj.formatoProduttivo = row_binded.formatoProduttivo;
                obj.tipologia = row_binded.confezione;
                obj.grammatura = row_binded.grammatura;
                obj.destinazione = row_binded.destinazione;
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
//                Library.SyncAjaxCallerData(link, this.SUCCESSSKU());
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU.bind(this), function (error) {
                    console.log(error);
                });
                this.oDialog = oView.byId("modificaAttributi");
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaAttributi", this);
                    oView.addDependent(this.oDialog);
                }
                this.getView().byId("formato_SKU").setValue(oRow.getCells()[1].getValue());
                this.getView().byId("confezione_SKU").setValue(oRow.getCells()[2].getValue());
                this.getView().byId("cliente_SKU").setValue(oRow.getCells()[3].getText());
                if (!oEvent) {
                    this.getView().byId("formato_SKU").setEnabled(false);
                    this.getView().byId("confezione_SKU").setEnabled(false);
                    this.getView().byId("cliente_SKU").setEnabled(false);
                }
                //                this.getView().byId("SKU").setValue(row_binded.SKUCodiceInterno);
                Library.RemoveClosingButtons.bind(this)("attributiContainer");
                this.oDialog.open();
            }
        },
        SUCCESSTrasferimentoBatch: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            this.getView().setModel(this.ModelLinea, "linea");
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
        },
        SUCCESSTrasferimentoBatchAttrezzaggio: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            this.getView().setModel(this.ModelLinea, "linea");
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
        },
        SUCCESSRichiamoBatch: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                this.RefreshCall();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 120});
            }
        },
        SUCCESSCancellazioneBatch: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                this.STOP = 0;
                this.RefreshCall();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 120});
            }
        },
        closeDialog: function () {
            this.oDialog.close();
        },
        destroyDialog: function () {
            this.STOP = 0;
            this.oDialog.destroy();
        },
//        TabSelection: function (event) {
//            var tabName = event.getParameters().item.getProperty("name");
//            if (tabName === "Parametri") {
//                var link;
//                Library.AjaxCallerData(link, this.SUCCESSGetParametri.bind(this));
//            }
//        },
//        SUCCESSGetParametri: function(Jdata) {
//            
//        },
// GESTIONE POPUP STATO LINEA
        onOpenStatoLinea: function () {
            var oView = this.getView();
//            this.getView().setModel(this.ModelSKU, "SKU");
            this.oDialog = oView.byId("statoLinea");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.statoLinea", this);
                oView.addDependent(this.oDialog);
            }
            if (Number(this.ISLOCAL) === 1) {
                Library.AjaxCallerData("./model/JSON_FermoTestiNew.json", this.SUCCESSCause.bind(this));
                this.getView().setModel(this.ModelCause, "cause");
            }
            oView.byId("disponibile").setSelected(true);
            oView.byId("nondisponibile").setSelected(false);
            this.collapse();
            this.oDialog.open();
        },
        onGestioneStato: function (oEvent) {
            var oText = oEvent.getSource().getText();
            if (oText === "Disponibile per la produzione") {
                this.getView().byId("disponibile").setSelected(true);
                this.getView().byId("nondisponibile").setSelected(false);
                this.collapse();
            } else {
                this.getView().byId("nondisponibile").setSelected(true);
                this.getView().byId("disponibile").setSelected(false);
                this.expand();
            }
        },
        expand: function () {
            var VBox = this.getView().byId("nondisponibileBox");
            for (var i = 0; i < VBox.getItems().length; i++) {
                VBox.getItems()[i].getItems()[1].setEnabled(true);
                VBox.getItems()[i].getItems()[0].removeStyleClass("textNotEnabled");
            }
        },
        collapse: function () {
            var VBox = this.getView().byId("nondisponibileBox");
            for (var i = 0; i < VBox.getItems().length; i++) {
                VBox.getItems()[i].getItems()[1].setEnabled(false);
                VBox.getItems()[i].getItems()[0].addStyleClass("textNotEnabled");
            }
        },
// RITORNARE ALLA VIEW MAIN
        onMenu: function () {
            var AddButton;
            for (var i = 0; i < this.ModelLinea.getData().linee.length; i++) {
                AddButton = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[3].getItems()[0];
                AddButton.setEnabled(true);
            }
            this.STOP = 1;
            this.getView().setModel(null, "linea");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("main", true);
        },
        manageSPCButton: function () {
            var oItems = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oItems.length; i++) {
                var SPCButton = oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[1].getItems()[0];
                if (Number(this.piano.area) === 1) {
                    SPCButton.getParent().setVisible(true);
                    SPCButton.getParent().setWidth("10%");
                    oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].setWidth("90%");
                    SPCButton.setVisible(true);
//                    oItems[i].getCells()[0].getItems()[0].getI    tems()[1].getItems()[0].getItems()[0].removeStyleClass("prova");
                } else {
                    SPCButton.getParent().setVisible(false);
                    SPCButton.getParent().setWidth("0%");
                    oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].setWidth("100%");
                    SPCButton.setVisible(false);
//                    oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].addStyleClass("prova");
                }
            }
        },
//GESTIONE DEI FORMATI E CONFEZIONAMENTI
        showUpdateButton: function (oEvent) {
            this.STOP = 1;
            var rowPath = oEvent.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            row_binded.showButton = 0;
            this.getView().getModel("linea").refresh();
        },
        enableSKU: function () {
//            this.getView().byId("SKU").destroyItems();
//            this.getView().byId("SKU").setValue("");
//            this.getView().byId("SKU").setEnabled(true);
            this.changeSKU();
        },
        changeSKU: function () {
            var array_confezione;
            if (this.ISLOCAL !== 1) {
//                var rowPath = this.row.getBindingContext("linea").sPath;
//                var row_binded = this.getView().getModel("linea").getProperty(rowPath);
                if (this.getView().byId("confezione_SKU").getSelectedItem() !== null) {
                    array_confezione = this.getView().byId("confezione_SKU").getSelectedItem().getKey().split(" ");
                    this.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                    this.confezione = array_confezione[0];
                }
//                var array_confezione = this.getView().byId("confezione_SKU").getValue().split(" ");
                var obj = {};
                obj.destinazione = this.getView().byId("cliente_SKU").getValue();
                obj.pianodiconfezionamento = "";
                obj.lineaId = "";
                obj.batchId = "";
                obj.sequenza = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.SKUCodiceInterno = "";
//                obj.SKUCodiceInterno = this.getView().byId("SKU").getValue();
                obj.formatoProduttivo = this.getView().byId("formato_SKU").getValue();
                obj.tipologia = this.confezione;
                obj.grammatura = this.grammatura;
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU.bind(this));
            }
        },
        enableDestinazioni: function () {
            var array_confezione;
//            var rowPath = this.row.getBindingContext("linea").sPath;
//            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            if (this.getView().byId("confezione_SKU").getSelectedItem() !== null) {
                array_confezione = this.getView().byId("confezione_SKU").getSelectedItem().getKey().split(" ");
                this.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                this.confezione = array_confezione[0];
            }
            this.getView().byId("cliente_SKU").destroyItems();
            this.getView().byId("cliente_SKU").setValue("");
            this.getView().byId("cliente_SKU").setEnabled(true);
//            this.getView().byId("SKU").destroyItems();
//            this.getView().byId("SKU").setValue("");
//            this.getView().byId("SKU").setEnabled(false);
        },
        confermaModifiche: function () {
//            var array_confezione;
            var lineaPath = this.row.getParent().getBindingContext("linea").sPath;
//            var rowPath = this.row.getBindingContext("linea").sPath;
//            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
//            if (this.getView().byId("confezione_SKU").getSelectedItem() !== null) {
//                array_confezione = this.getView().byId("confezione_SKU").getSelectedItem().getKey().split(" ");
//                row_binded.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
//                row_binded.confezione = array_confezione[0];
//            }
            var linea_binded = this.getView().getModel("linea").getProperty(lineaPath);
            if (this.ISLOCAL !== 1) {
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.SKUCodiceInterno = "";
//                obj.SKUCodiceInterno = this.getView().byId("SKU").getValue();
                obj.lineaId = linea_binded.lineaID;
                obj.formatoProduttivo = this.getView().byId("formato_SKU").getValue();
                obj.tipologia = this.confezione;
                obj.grammatura = this.grammatura;
                obj.destinazione = this.getView().byId("cliente_SKU").getValue();
                obj.sequenza = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoNewBatch&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, this.SUCCESSQuantita.bind(this));
            }
            this.oDialog.destroy();
        },
        annullaModifiche: function () {
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            if (Number(row_binded.showButton) === 0) {
                this.oDialog.destroy();
            } else {
                this.STOP = 0;
                this.oDialog.destroy();
            }
        },
        CaricaSKU: function () {
            var link;
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            this.getView().byId("SKU");
            if (this.ISLOCAL !== 1) {
//                var array_confezione = this.getView().byId("confezione_SKU").getValue().split(" ");
                var obj = {};
                obj.SKUCodiceInterno = row_binded.SKUCodiceInterno;
                obj.pianodiconfezionamento = this.pdcID;
                obj.lineaId = this.linea.lineaID;
                obj.formatoProduttivo = this.row.getCells()[1].getValue();
                obj.grammatura = row_binded.grammatura;
                obj.tipologia = row_binded.confezione;
                obj.sequenza = this.row.getCells()[0].getValue();
                obj.destinazione = this.getView().byId("cliente_SKU").getValue();
                obj.quintali = this.row.getCells()[4].getValue();
                obj.cartoni = this.row.getCells()[5].getValue();
                obj.ore = this.row.getCells()[6].getValue();
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllSKUCodiceInternoFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, this.SUCCESSListaSKU.bind(this));
            }
        },
        CaricaFormati: function (oEvent) {
            var link;
            var that = this;
            var SelectBox = oEvent.getSource();
            if (this.ISLOCAL === 1) {
                link = "model/formati.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFormatiFilteredByLineID&Content-Type=text/json&LineaID=" + this.linea_id + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSFormati.bind(that)(Jdata, SelectBox);
            });
        },
        CaricaConfezionamenti: function (oEvent) {
            var link, formato;
            var that = this;
            var SelectBox = oEvent.getSource();
            if (this.getView().byId("formato_SKU")) {
                formato = this.getView().byId("formato_SKU").getValue();
            } else {
                formato = oEvent.getSource().getParent().getCells()[1].getValue();
            }
            if (Number(this.ISLOCAL) === 1) {
                link = "model/confezionamenti.json";
            }
            if (Number(this.ISLOCAL) !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllConfezioniFilteredByLineIDAndFormatoProduttivo&Content-Type=text/json&LineaID=" + this.linea_id + "&FormatoProduttivo=" + formato + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSConfezionamenti.bind(that)(Jdata, SelectBox);
            });
        },
        ResetConfezionamentiDialog: function () {
            var selectBox = this.getView().byId("confezione_SKU");
            selectBox.destroyItems();
            selectBox.setValue("");
            var destinazione = this.getView().byId("cliente_SKU");
            var SKU = this.getView().byId("SKU");
            destinazione.destroyItems();
            destinazione.setValue("");
            destinazione.setEnabled(false);
            SKU.destroyItems();
            SKU.setValue("");
            SKU.setEnabled(false);
        },
        ResetConfezionamenti: function (oEvent) {
//            this.STOP = 1;
            this.showUpdateButton(oEvent);
            var oRow = oEvent.getSource().getParent();
            var selectBox = oRow.getCells()[2];
            selectBox.destroyItems();
            selectBox.setValue("");
            var Button = oRow.getCells()[3];
            Button.setText("");
            Button.setEnabled(false);
            oRow.getCells()[4].setValue("");
            oRow.getCells()[5].setValue("");
            oRow.getCells()[6].setValue("");
            oRow.getCells()[4].setEnabled(false);
            oRow.getCells()[5].setEnabled(false);
            oRow.getCells()[6].setEnabled(false);
            oRow.getCells()[7].setVisible(true);
        },
        loadDestinazione: function (oEvent) {
//            this.STOP = 1;
            this.showUpdateButton(oEvent);
            var that = this;
            var PathLinea = oEvent.getSource().getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            var link;
            var oRow = oEvent.getSource().getParent();
            var row_path = oEvent.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(row_path);
            if (oRow.getCells()[2].getSelectedItem().getKey()) {
                var array_confezione = oRow.getCells()[2].getSelectedItem().getKey().split(" ");
                row_binded.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                row_binded.confezione = array_confezione[0];
            }
            var Button = oRow.getCells()[3];
            if (this.ISLOCAL === 1) {
                row_binded.pezziCartone = 10;
                Button.setText("ITALIA + ESTERO");
                Button.setEnabled(true);
                oRow.getCells()[4].setEnabled(true);
                oRow.getCells()[5].setEnabled(true);
                oRow.getCells()[6].setEnabled(true);
            } else {
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.SKUCodiceInterno = "";
                obj.sequenza = "";
                obj.destinazione = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.lineaId = this.linea_id;
                obj.formatoProduttivo = oRow.getCells()[1].getValue();
                obj.grammatura = row_binded.grammatura;
                obj.tipologia = row_binded.confezione;
                var doc_xml = Library.createXMLBatch(obj);
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoNewBatchStandard&Content-Type=text/json&xml=" + doc_xml + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, function (Jdata) {
                    that.SUCCESSDestinazione.bind(that)(Jdata, oRow, row_binded);
                });
            }
            oRow.getCells()[7].setVisible(true);
        },
        CaricaDestinazioni: function () {
            var link;
            var that = this;
//            var row_path = this.row.getBindingContext("linea").sPath;
//            var row_binded = this.getView().getModel("linea").getProperty(row_path);
//            var array_confezione = this.getView().byId("confezione_SKU").getValue().split(" ");
            var selectBox = this.getView().byId("cliente_SKU");
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllDestinazioniFiltered&Content-Type=text/json&LineaID=" + this.linea_id + "&FormatoProduttivo=" + this.getView().byId("formato_SKU").getValue() + "&Tipologia=" + this.confezione + "&Grammatura=" + this.grammatura + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSDestinazioni.bind(that)(Jdata, selectBox);
            });
        },
// CARICARE OPERATORI
        loadOperatori: function (oEvent) {
            var that = this;
            var selectBox = oEvent.getSource();
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllOperatori&Content-Type=text/json&OutputParameter=JSON";
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSOperatori.bind(that)(Jdata, selectBox);
            });
        },
        checkOperatore: function (oEvent) {
            var that = this;
            var check = 0;
            var selectBoxValue = oEvent.getSource().getValue();
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                var table_operatore = oTables[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[0].getContent()[0].getItems();
                for (var j = 0; j < table_operatore.length; j++) {
                    if (table_operatore[j].getCells()[0].getValue() === selectBoxValue && table_operatore[j].getCells()[0] !== oEvent.getSource()) {
                        table_operatore[j].getCells()[0].setValue("");
                        table_operatore[j].getCells()[0].clearSelection();
                        check = 1;
                        break;
                    }
                }
                if (check === 1) {
                    break;
                }
            }
            var addetto_ID = oEvent.getParameter("selectedItem").getKey();
            var posizione_ID = this.getView().getModel("linea").getProperty(oEvent.getSource().getBindingContext("linea").sPath).posizioneId;
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/UpdatePosizioneAddetto&Content-Type=text/json&AddettoID=" + addetto_ID + "&PosizioneAddettoID=" + posizione_ID + "&OutputParameter=JSON";
            Library.AjaxCallerVoid(link, function () {
                that.refreshCall.bind(that);
            }, function (error) {
                console.log(error);
            });
        },
// GESTIONE FERMI AUTOMATICI
//GESTIONE DELLE CHECKBOX DEL DIALOG CAUSALIZZAZIONE FERMO    
        ChangeCheckedCausa: function (event) {
            var id = event.getSource().getId();
            var CB = this.getView().byId(id);
            var root_name_totale = "CBTotaleCausa";
            var i, temp_id;
            if (id.indexOf(root_name_totale) > -1) {
                if (CB.getSelected()) {
                    this.CheckTotaleCausa = 1;
                    for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                        this.ModelGuastiLinea.getData().fermi[i].selected = true;
                        this.CheckSingoloCausa[i] = 1;
                    }
                    this.ModelGuastiLinea.refresh();
                } else {
                    this.CheckTotaleCausa = 0;
                    for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                        this.ModelGuastiLinea.getData().fermi[i].selected = false;
                        this.CheckSingoloCausa[i] = 0;
                    }
                    this.ModelGuastiLinea.refresh();
                }


            } else {
                var discr_id = event.getSource().getParent().getId();
                for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                    temp_id = event.getSource().getParent().getParent().getAggregation("rows")[i].getId();
                    if (discr_id === temp_id) {
                        break;
                    }
                }
                if (CB.getSelected()) {
                    this.CheckSingoloCausa[i] = 1;
                } else {
                    this.CheckSingoloCausa[i] = 0;
                }
            }
            temp_id = 0;
            for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                temp_id += this.CheckSingoloCausa[i];
            }
            if (temp_id > 0) {
                this.oDialog.getAggregation("content")[0].getAggregation("items")[3].getAggregation("items")[0].setEnabled(true);
            } else {
                this.oDialog.getAggregation("content")[0].getAggregation("items")[3].getAggregation("items")[0].setEnabled(false);
            }
        },
//CHIUDO IL DIALOG CAUSALIZZAZIONE FERMO E APRO IL CAUSALIZZAZIONE FERMO PANEL                        
        onCausalizzaButton: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_FermoTestiNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetListaCausaleFermo&Content-Type=text/json&OutputParameter=JSON&IsManuale=0";
            }
            Library.AjaxCallerData(link, this.SUCCESSFermo.bind(this));
        },
// GESTISCO LA SELEZIONE E LA CONFERMA DELLE CAUSE NEL CAUSALIZZAZIONEFERMOPANEL
        ChangeCheckedFermo: function (event) {
            var id = event.getSource().getId();
            var root_name = "CBFermo";
            this.id_split = this.SplitId(id, root_name);
            var old_id = this.GetActiveCB();
            if (typeof old_id === "string") {
                var old_CB = sap.ui.getCore().byId(old_id);
                old_CB.setSelected(false);
                this.CheckFermo[old_id] = 0;
            }
            if (old_id !== this.id_split[1]) {
                this.CheckFermo[this.id_split[1]] = 1;
            }
            var selected_index = this.GetActiveCB();
            var button = sap.ui.getCore().byId("ConfermaFermo");
            if (typeof selected_index === "string") {
                button.setEnabled(true);
            } else {
                button.setEnabled(false);
            }
        },
        GetActiveCB: function () {
            var res = 0;
            for (var key in this.CheckFermo) {
                if (this.CheckFermo[key] === 1) {
                    res = key;
                    break;
                }
            }
            return res;
        },
        onConfermaFermoCausalizzato: function () {
            var i, link;
            var data = this.ModelGuastiLinea.getData();
            var list_log = "";
            for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                if (this.CheckSingoloCausa[i] > 0) {
                    if (list_log === "") {
                        list_log += data.fermi[i].LogID;
                    } else {
                        list_log = list_log + "#" + data.fermi[i].LogID;
                    }
                }
            }
            link = "/XMII/Runner?Transaction=DeCecco/Transactions/UpdateLogCausale&Content-Type=text/json&ListLogID=" + list_log + "&CausaleID=" + this.id_split[2];
            Library.SyncAjaxCallerVoid(link);
            link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            Library.AjaxCallerData(link, this.SUCCESSModificaCausale.bind(this));
        },
//FUNZIONE PER SPLITTARE L'ID DA XML
        SplitId: function (id, string) {
            var splitter = id.indexOf(string);
            var root = id.substring(0, splitter);
            var real_id = id.substring(splitter, id.length);
            var index = id.substring(splitter + string.length, id.length);
            return [root, real_id, index];
        },
        //CHIUDO IL DIALOG (SIA CAUSALIZZAZIONE FERMO CHE CAUSALIZZAZIONE FERMO PANEL)	
        onCloseDialog: function () {
            var id_dialog = this.oDialog.getId().split("--")[1];
            this.getView().byId(id_dialog).close();
            this.oDialog = null;
        },
// FUNZIONI LOCALI
        LOCALTakeLineaById: function (id, obj) {
            for (var j = 0; j < this.ModelLinea.getData().linee.length; j++) {
                if (Number(this.ModelLinea.getData().linee[j].id) === Number(id)) {
                    this.ModelLinea.getData().linee[j].batchlist.push(obj);
                    return;
                }
            }
            return;
        }
    });
    return ManagePianoGreen;
});