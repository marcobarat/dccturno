sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History',
    'myapp/controller/Library',
    'myapp/model/TimeFormatter'
], function (MessageToast, jQuery, Controller, JSONModel, History, Library, TimeFormatter) {
    "use strict";
    var ManagePianoGreen = Controller.extend("myapp.controller.ManagePianoGreen", {
        StabilimentoID: null,
        pdcID: null,
        repartoID: null,
        linea_id: null,
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

        onInit: function () {
            this.getView().setModel(this.ModelReparti, "reparti");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePianoGreen").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function (oEvent) {
            this.StabilimentoID = sap.ui.getCore().getModel("stabilimento").getData().StabilimentoID;
            this.pdcID = sap.ui.getCore().getModel("ParametriPiano").pdc;
            this.repartoID = sap.ui.getCore().getModel("ParametriPiano").reparto;
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
            if (this.ISLOCAL !== 1 && this.STOP === 0) {
                this.RefreshFunction();
            }
            this.manageSPCButton();
// MI SERVE PER LO STATO LINEA                
            var oModel = new JSONModel({inizio: this.piano.turno.split("-")[0].trim(), fine: this.piano.turno.split("-")[1].trim()});
            this.getView().setModel(oModel, "orarioturno");
        },
        RefreshFunction: function () {
            this.TIMER = setTimeout(this.RefreshCall.bind(this), 5000);
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
                }
            }
            this.URLChangeCheck();
        },
        BarColorCT: function (data) {
            var progressBar;
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
            }
            return data;
        },
        SPCColorCT: function (data) {
            var CSS_classesButton = ["SPCButtonColorGreen", "SPCButtonColorYellow", "SPCButtonPhase1", "SPCButtonContent", "DualSPCButtonContent"];
            var SPCButton;
            for (var i = 0; i < data.linee.length; i++) {
                for (var j = 0; j < data.linee[i].SPC.length; j++) {
                    SPCButton = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[j + 1].getItems()[0];
                    if (data.linee[i].SPC[j].fase !== "") {
                        SPCButton.setEnabled(true);
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
                            SPCButton.setText(0);
                            SPCButton.addStyleClass("SPCButtonPhase1");
//                            if (data.length === 1) {
//                                SPCButton.addStyleClass("SPCButtonContent");
//                            } else {
//                                SPCButton.addStyleClass("DualSPCButtonContent");
//                            }
                            SPCButton.addStyleClass("SPCButtonColorYellow");
                            break;
                    }
                }
            }
        },
        SPCGraph: function (event) {
            var pathLinea = event.getSource().getBindingContext("linea").sPath;
            var indexSPC = Number(event.getSource().data("mydata"));
            this.idBatch = this.ModelLinea.getProperty(pathLinea).SPC[indexSPC].IDbatchAttivo;
            this.idLinea = this.ModelLinea.getProperty(pathLinea).lineaID;
            this.Allarme = this.ModelLinea.getProperty(pathLinea).SPC[indexSPC].allarme;
            this.Fase = this.ModelLinea.getProperty(pathLinea).SPC[indexSPC].fase;
            this.Avanzamento = this.ModelLinea.getProperty(pathLinea).SPC[indexSPC].avanzamento;
            this.ParametroID = this.ModelLinea.getProperty(pathLinea).SPC[indexSPC].parametroId;
            this.DescrizioneParametro = this.ModelLinea.getProperty(pathLinea).SPC[indexSPC].descrizioneParametro;
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
            setTimeout(this.SPCDataCaller.bind(this), 5000);
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
                var data = this.ModelSPCData.getData();
                var result = this.PrepareDataToPlot(data, this.Fase);
                var ID = jQuery.sap.byId(plotBox.getId()).get(0);
                Plotly.newPlot(ID, result.dataPlot, result.layout);
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
                MessageToast.show(Jdata.errorMessage, {duration: 60});
            }
        },
        SUCCESSListaSKU: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                var selectBox = this.getView().byId("SKU");
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    text: "{SKUCodiciInterni>SKUCodiciInterno}"
                });
                selectBox.setModel(oModel, "SKUCodiciInterni");
                selectBox.bindAggregation("items", "SKUCodiciInterni>/SKUCodiciInterni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 60});
            }
        },
        SUCCESSConfezionamenti: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{confezionamenti>ID}",
                    text: "{confezionamenti>confezione} {confezionamenti>grammatura}gr"
                });
                selectBox.setModel(oModel, "confezionamenti");
                selectBox.bindAggregation("items", "confezionamenti>/confezioni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 60});
            }
        },
        SUCCESSDestinazione: function (Jdata, oRow, row_binded) {
            if (Number(Jdata.error) === 0) {
                oRow.getCells()[5].setEnabled(true);
                oRow.getCells()[6].setEnabled(true);
                oRow.getCells()[7].setEnabled(true);
                oRow.getCells()[5].setValue("");
                oRow.getCells()[6].setValue("");
                oRow.getCells()[7].setValue("");
                oRow.getCells()[4].setText(Jdata.destinazione);
                oRow.getCells()[4].setEnabled(true);
                row_binded.pezzi_cartone = Number(Jdata.pezziCartone);
                row_binded.tempo_ciclo = Number(Jdata.secondiPerPezzo);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 60});
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
                MessageToast.show(Jdata.errorMessage, {duration: 60});
            }
        },
        SUCCESSQuantita: function (Jdata) {
            if (Jdata.error === 0) {
                var rowPath = this.row.getBindingContext("linea").sPath;
                var row_binded = this.getView().getModel("linea").getProperty(rowPath);
                row_binded.pezziCartone = Jdata.pezziCartone;
                row_binded.secondiPerPezzo = Jdata.secondiPerPezzo;
                this.row.getCells()[2].setValue(this.getView().byId("formato_SKU").getValue());
                this.row.getCells()[3].setValue(this.getView().byId("confezione_SKU").getValue());
                this.row.getCells()[4].setValue(this.getView().byId("cliente_SKU").getValue());
                this.row.getCells()[5].setValue("");
                this.row.getCells()[6].setValue("");
                this.row.getCells()[7].setValue("");
                this.row.getCells()[8].setVisible(true);
                row_binded.SKUCodiceInterno = this.getView().byId("SKU").getValue();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 60});
            }
        },
        SUCCESSOperatori: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    text: "{operatore>cognome} {operatore>nome}"
                });
                selectBox.setModel(oModel, "operatore");
                selectBox.bindAggregation("items", "operatore>/operatori", oItemSelectTemplate);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 60});
            }
        },
        changeReparto: function (oEvent) {
            var link;
            var that = this;
            var area = this.piano.area;
            this.repartoID = oEvent.getParameters().key;
            if (this.ISLOCAL === 0) {
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
                this.getView().setModel(this.ModelLinea, "linee");
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
            this.STOP = 1;
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
            this.row = oEvent.getSource().getParent();
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
            var Model = this.getView().getModel("linea");
            var oData = Model.getData();
            var oLinea_path = oEvent.getSource().getBindingContext("linea").getPath().split("/");
            var linea = oData[oLinea_path[1]][oLinea_path[2]];
            linea.batchlist.pop();
            Model.setData(oData);
            this.getView().setModel(Model, "linea");
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
            this.STOP = 1;
            var row_path = oEvent.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(row_path);
            this.pezzi_cartone = row_binded.pezziCartone;
            this.tempo_ciclo = row_binded.secondiPerPezzo;
            var grammatura, numero_pezzi, cartoni, ore, quintali;
            var oValueChanged = oEvent.getParameter("value");
            var oCellChanged = oEvent.getSource();
            var oRow = oEvent.getSource().getParent();
            var oValue = oRow.getCells()[3].getValue();
            grammatura = Number(oValue.split(" ")[1].slice(0, oValue.split(" ")[1].length - 2));
            if (oCellChanged === oRow.getCells()[5]) {
                numero_pezzi = (oValueChanged * 100) / (grammatura / 1000);
                cartoni = Math.ceil(numero_pezzi / this.pezzi_cartone);
                oRow.getCells()[6].setValue(cartoni);
                ore = Math.ceil((numero_pezzi * this.tempo_ciclo) / 60);
                oRow.getCells()[7].setValue(Library.minutesToStandard(ore));
            }
            if (oCellChanged === oRow.getCells()[6]) {
                numero_pezzi = oValueChanged * this.pezzi_cartone;
                quintali = (numero_pezzi * grammatura) / 100000;
                oRow.getCells()[5].setValue(Library.roundTo(quintali, 2));
                ore = Math.ceil((numero_pezzi * this.tempo_ciclo) / 60);
                oRow.getCells()[7].setValue(Library.minutesToStandard(ore));
            }
            if (oCellChanged === oRow.getCells()[7]) {
                numero_pezzi = Library.standardToMinutes(oValueChanged) / (this.tempo_ciclo / 60);
                cartoni = Math.ceil(numero_pezzi / this.pezzi_cartone);
                quintali = (numero_pezzi * grammatura) / 100000;
                oRow.getCells()[5].setValue(Library.roundTo(quintali, 2));
                oRow.getCells()[6].setValue(cartoni);
            }
            oRow.getCells()[8].setVisible(true);
        },
        changeFields: function () {
            var j, oTable, oRows, oText;
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
                oRows = oTable.getItems();
//                oTable.removeItem(oRows[oRows.length - 1]);
                for (j = 0; j < oRows.length - 1; j++) {
                    if (oRows[j].getCells().length >= 8) {
                        oRows[j].removeCell(7);
                        oRows[j].removeCell(6);
                        oRows[j].removeCell(5);
                    }
                    oText = new sap.m.Text({text: "{linea>qli}"});
                    oRows[j].insertCell(oText, 5);
                    oText = new sap.m.Text({text: "{linea>cartoni}"});
                    oRows[j].insertCell(oText, 6);
                    oText = new sap.m.Text().bindText({path: 'linea>ore', formatter: this.TimeFormatter.TimeText});
                    oRows[j].insertCell(oText, 7);
                    oRows[j].removeCell(1);
                    oText = new sap.m.Text({
                        text: "{linea>sequenza}",
                        width: "4rem"
                    });
                    oRows[j].insertCell(oText, 1);
                }
            }
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
            obj.destinazione = last_batch.destinazione;
            obj.secondiPerPezzo = last_batch.secondiPerPezzo;
            obj.pezziCartone = last_batch.pezziCartone;
            obj.showButton = 0;
            linea.batchlist.push(obj);
//            linea.batchlist.splice(linea.batchlist.length - 1, 0, obj);
            Model.setData(oData);
            this.getView().setModel(Model, "linea");
        },
        InsertNewBatch: function (oEvent) {
            var PathLinea = oEvent.getSource().getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            var oRow = oEvent.getSource().getParent();
            var rowPath = oEvent.getSource().getParent().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            var array_confezione = oRow.getCells()[2].getValue().split(" ");
            var that = this;
            var link;
            var obj = {};
            if (row_binded.batchID) {
                obj.batchId = row_binded.batchID;
            } else {
                obj.batchId = "";
            }
            if (row_binded.SKUCodiceInterno) {
                obj.SKUCodiceInterno = row_binded.SKUCodiceInterno;
            } else {
                obj.SKUCodiceInterno = "";
            }
            obj.pianodiconfezionamento = this.pdcID;
            obj.lineaId = this.linea_id;
            obj.formatoProduttivo = oRow.getCells()[1].getValue();
            obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
            obj.tipologia = array_confezione[0];
            obj.sequenza = oRow.getCells()[0].getValue();
            obj.destinazione = oRow.getCells()[3].getText();
            obj.quintali = oRow.getCells()[4].getValue();
            obj.cartoni = oRow.getCells()[5].getValue();
            obj.ore = oRow.getCells()[6].getValue();
            var doc_xml = Library.createXMLBatch(obj);
            if (Number(this.ISLOCAL) === 1) {
                oRow.getCells()[8].setVisible(false);
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/InsertUpdateBatch&Content-Type=text/json&xml=" + doc_xml + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, function (Jdata) {
                    if (Number(Jdata.error) === 0) {
                        oRow.getCells()[8].setVisible(false);
                        that.STOP = 0;
                        var path = oEvent.getSource().getBindingContext("linea").sPath.split("/");
                        var index = Number(path[path.indexOf("linee") + 1]);
                        var AddButton = this.getView().byId("managePianoTable").getItems()[index].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[3].getItems()[0];
                        AddButton.setEnabled(true);
                    } else {
                        MessageToast.show(Jdata.errorMessage, {duration: 30});
                    }
                });
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
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/CancellazioneBatch&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSCancellazioneBatch.bind(this));
                    break;
            }

        },
        visuBatch: function (oEvent) {
            this.STOP = 1;
//            var linea_path = oEvent.getSource().getParent().getParent().getBindingContext("linea").sPath;
//            this.linea = this.getView().getModel("linea").getProperty(linea_path);
            var oRow = oEvent.getSource().getParent();
            if (!oRow.getCells) {
                oRow = this.row;
            }
            var linea_path = oEvent.getSource().getParent().getParent().getBindingContext("linea").sPath;
            this.linea = this.getView().getModel("linea").getProperty(linea_path);
            this.row = oRow;
            var oView;
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
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
                this.getView().byId("formato_SKU").setValue(oRow.getCells()[2].getValue());
                this.getView().byId("confezione_SKU").setValue(oRow.getCells()[3].getValue());
                this.getView().byId("cliente_SKU").setValue(oRow.getCells()[4].getText());
                this.getView().byId("SKU").setValue(row_binded.SKUCodiceInterno);
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
                if (row_binded.SKUCodiceInterno) {
                    obj.SKUCodiceInterno = row_binded.SKUCodiceInterno;
                } else {
                    obj.SKUCodiceInterno = "";
                }
                obj.formatoProduttivo = row_binded.formatoProduttivo;
                obj.tipologia = row_binded.confezione;
                obj.grammatura = row_binded.grammatura;
                obj.destinazione = row_binded.destinazione;
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
//                Library.SyncAjaxCallerData(link, this.SUCCESSSKU());
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU.bind(this));
                this.oDialog = oView.byId("modificaAttributi");
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaAttributi", this);
                    oView.addDependent(this.oDialog);
                }
                this.getView().byId("formato_SKU").setValue(oRow.getCells()[2].getValue());
                this.getView().byId("confezione_SKU").setValue(oRow.getCells()[3].getValue());
                this.getView().byId("cliente_SKU").setValue(oRow.getCells()[4].getText());
                this.getView().byId("SKU").setValue(row_binded.SKUCodiceInterno);
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
                MessageToast.show(Jdata.errorMessage, {duration: 30});
            }
        },
        SUCCESSCancellazioneBatch: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                this.RefreshCall();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 30});
            }
        },
        closeDialog: function () {
            this.oDialog.close();
        },
        destroyDialog: function () {
            this.oDialog.destroy();
        },
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
            var oRow = oEvent.getSource().getParent();
            oRow.getCells()[8].setVisible(true);
        },
        enableSKU: function () {
            this.getView().byId("SKU").destroyItems();
            this.getView().byId("SKU").setValue("");
            this.getView().byId("SKU").setEnabled(true);
        },
        changeSKU: function () {
            if (this.ISLOCAL !== 1) {
                var array_confezione = this.getView().byId("confezione_SKU").getValue();
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.lineaId = "";
                obj.batchId = "";
                obj.sequenza = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.SKUCodiceInterno = this.getView().byId("SKU").getValue();
                obj.formatoProduttivo = this.getView().byId("formato_SKU").getValue();
                obj.tipologia = array_confezione[0];
                obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch() + "&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU());
            }
        },
        enableDestinazioni: function () {
            this.getView().byId("cliente_SKU").destroyItems();
            this.getView().byId("cliente_SKU").setValue("");
            this.getView().byId("cliente_SKU").setEnabled(true);
            this.getView().byId("SKU").destroyItems();
            this.getView().byId("SKU").setValue("");
            this.getView().byId("SKU").setEnabled(false);
        },
        confermaModifiche: function () {
            var lineaPath = this.row.getParent().getBindingContext("linea").sPath;
//            var rowPath = this.row.getBindingContext("linea").sPath;
//            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            var linea_binded = this.getView().getModel("linea").getProperty(lineaPath);
            if (this.ISLOCAL !== 1) {
                var array_confezione = this.getView().byId("confezione_SKU").getValue().split(" ");
                var obj = {};
                obj.lineaId = linea_binded.lineaID;
                obj.formatoProduttivo = this.getView().byId("formato_SKU").getValue();
                obj.tipologia = array_confezione[0];
                obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                obj.destinazione = this.getView().byId("cliente_SKU").getValue();
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoNewBatch&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
                Library.AjaxCallerData(link,
                        this.SUCCESSQuantita.bind(this));
            }
        },
        CaricaSKU: function () {
            var link;
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            this.getView().byId("SKU");
            if (this.ISLOCAL !== 1) {
                var array_confezione = this.getView().byId("confezione_SKU").getValue().split(" ");
                var obj = {};
                obj.SKUCodiceInterno = row_binded.SKUCodiceInterno;
                obj.pianodiconfezionamento = this.pdcID;
                obj.lineaId = this.linea.lineaID;
                obj.formatoProduttivo = this.row.getCells()[2].getValue();
                obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                obj.tipologia = array_confezione[0];
                obj.sequenza = this.row.getCells()[1].getValue();
                obj.destinazione = this.getView().byId("cliente_SKU").getValue();
                obj.quintali = this.row.getCells()[5].getValue();
                obj.cartoni = this.row.getCells()[6].getValue();
                obj.ore = this.row.getCells()[7].getValue();
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
                formato = oEvent.getSource().getParent().getCells()[2].getValue();
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
            this.STOP = 1;
            var oRow = oEvent.getSource().getParent();
            var selectBox = oRow.getCells()[3];
            selectBox.destroyItems();
            selectBox.setValue("");
            var Button = oRow.getCells()[4];
            Button.setText("");
            Button.setEnabled(false);
            oRow.getCells()[5].setValue("");
            oRow.getCells()[6].setValue("");
            oRow.getCells()[7].setValue("");
            oRow.getCells()[5].setEnabled(false);
            oRow.getCells()[6].setEnabled(false);
            oRow.getCells()[7].setEnabled(false);
            oRow.getCells()[8].setVisible(true);
        },
        loadDestinazione: function (oEvent) {
            this.STOP = 1;
            var that = this;
            var PathLinea = oEvent.getSource().getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            var link;
            var oRow = oEvent.getSource().getParent();
            var row_path = oEvent.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(row_path);
            var Button = oRow.getCells()[4];
            if (this.ISLOCAL === 1) {
                row_binded.pezziCartone = 10;
                Button.setText("ITALIA + ESTERO");
                Button.setEnabled(true);
                oRow.getCells()[5].setEnabled(true);
                oRow.getCells()[6].setEnabled(true);
                oRow.getCells()[7].setEnabled(true);
            } else {
                var array_confezione = oRow.getCells()[3].getValue().split(" ");
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.SKUCodiceInterno = "";
                obj.sequenza = "";
                obj.destinazione = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.lineaId = this.linea_id;
                obj.formatoProduttivo = oRow.getCells()[2].getValue();
                obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                obj.tipologia = array_confezione[0];
                var doc_xml = Library.createXMLBatch(obj);
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoNewBatchStandard&Content-Type=text/json&xml=" + doc_xml + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, function (Jdata) {
                    that.SUCCESSDestinazione.bind(that)(Jdata, oRow, row_binded);
                });
            }
            oRow.getCells()[8].setVisible(true);
        },
        CaricaDestinazioni: function () {
            var link;
            var that = this;
            var array_confezione = this.getView().byId("confezione_SKU").getValue().split(" ");
            var selectBox = this.getView().byId("cliente_SKU");
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllDestinazioniFiltered&Content-Type=text/json&LineaID=" + this.linea.lineaID + "&FormatoProduttivo=" + this.getView().byId("formato_SKU").getValue() + "&Tipologia=" + array_confezione[0] + "&Grammatura=" + array_confezione[1].slice(0, array_confezione[1].length - 2) + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSDestinazioni.bind(that)(Jdata, selectBox);
            });
        },
// CARICARE OPERATORI
        loadOperatori: function (oEvent) {
            var that = this;
            var selectBox = oEvent.getSource();
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllOperatori&OutputParameter=JSON";
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSOperatori(Jdata, selectBox);
            }
            );
        },
        checkOperatore: function (oEvent) {
            var check = 0;
            var selectBoxValue = oEvent.getSource().getValue();
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                var table_operatore = oTables[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[0].getContent()[0].getItems();
                for (var j = 0; j < table_operatore.length; j++) {
                    if (table_operatore[i].getCells()[0].getValue() === selectBoxValue) {
                        table_operatore[i].getCells()[0].clearSelection();
                        check = 1;
                        break;
                    }
                }
                if (check === 1) {
                    break;
                }
            }
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