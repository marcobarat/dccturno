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
        SPCDialogFiller: null,
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
                for (var i = 0;i < Jdata.corta.length; i++) {
                    Jdata.corta[i].avanzamento = (Number(Jdata.corta[i].avanzamento)*100 >= 100) ? 100 : Number(Jdata.corta[i].avanzamento)*100;
                    Jdata.corta[i].perc_avanzamento = String(Math.round(Jdata.corta[i].avanzamento * 100)/100) + "%";
                }
                this.ModelLinee.setData(Jdata);
                this.ModelLinee.refresh(true);
                this.getView().setModel(this.ModelLinee, "linee");
                this.LineButtonStyle();
                this.BarColorCT(this.ModelLinee.getData());
                this.SPCColorCT(this.ModelLinee.getData());
                this.CheckCells();
                this.RefreshFunction(10000);
            }
        },
        GoToSinottico: function (event) {
            var path = event.getSource().getBindingContext("linee").getPath();
            this.IDSelected = this.ModelLinee.getProperty(path).lineaID;
            var link;
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllLinee&Content-Type=text/json&OutputParameter=JSON";
            }
            Library.SyncAjaxCallerData(link, this.SUCCESSGoToSinottico.bind(this));
            this.getOwnerComponent().getRouter().navTo("OverviewLinea");
        },
        SUCCESSGoToSinottico: function (Jdata) {
            var i, j, temp;
            var Macchine = ["Marcatore SX", "Marcatore DX", "PackItal SX", "PackItal DX", "Scatolatrice", "Etichettatrice"];
            for (i = 0;i < Jdata.length; i++) {
                Jdata[i].IMG = Jdata[i].Descrizione.toLowerCase().split(" ").join("_") + ".png";
                Jdata[i].IsSelected = (Jdata[i].LineaID === this.IDSelected) ? "1" : "0";
                Jdata[i].Macchine = [];
                //Jdata[i].Classes = [];
                for (j = 0;j < Macchine.length; j++) {
                    temp = {};
                    temp.nome = Macchine[j];
                    temp.stato = "Good";
                    temp.class = Macchine[j].split(" ").join("");
                    Jdata[i].Macchine.push(temp);
                    //Jdata[i].Classes.push(Jdata[i].Macchine[j].split(" ").join(""));
                }
            }
            this.ModelSinottico.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelSinottico, "ModelSinottico");
            this.getView().setModel(this.ModelSinottico, "ModelSinottico");
            this.getOwnerComponent().getRouter().navTo("OverviewLinea");
        },
        //         -> PULSANTI SPC CON REFRESH
        SPCGraph: function (event) {
            this.STOPSPC = 0;
            clearInterval(this.SPCTimer);
            this.SPCCounter = 5;
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

        //        ************************ GESTIONE STILE PULSANTE DI LINEA ************************    
        LineButtonStyle: function () {
            var classes = ["LineaDispo", "LineaNonDispo", "LineaVuota", "LineaAttrezzaggio", "LineaLavorazione", "LineaFermo", "LineaSvuotamento"];
            var data = this.ModelLinee.getData().corta;
            var button;
            var state;
            for (var i = 0; i < data.length; i++) {
                button = this.getView().byId("linee").getItems()[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0];
                for (var k = 0; k < classes.length; k++) {
                    button.removeStyleClass(classes[k]);
                }
                state = data[i].statoLinea.split(".");
                switch (state[0]) {
                    case "Disponibile":
                        button.addStyleClass("LineaDispo");
                        break;
                    case "Nondisponibile":
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
//        ************************ GESTIONE STILE PROGRESS INDICATOR ************************     
        BarColorCT: function (data) {
            var progressBar;
            if (data.corta.length > 0) {
                for (var i = 0; i < data.corta.length; i++) {
                    if (Number(data.corta[i].avanzamento) >= 100) {
                        data.corta[i].avanzamento = 100;
                    } else {
                        data.corta[i].avanzamento = Number(data.corta[i].avanzamento);
                    }
                    progressBar = this.getView().byId("linee").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0];
                    switch (data.corta[i].barColor) {
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
                    if (data.corta[i].statolinea === "Disponibile.Fermo") {
                        progressBar.setState("None");
                    }
                }
            }
            return data;
        },
        //      GESTIONE STILE SPC
        SPCColorCT: function (data) {
            var CSS_classesButton = ["SPCButtonColorGreen", "SPCButtonColorYellow", "SPCButtonPhase1", "SPCButtonContent", "DualSPCButtonContent", "SPCButtonEmpty"];
            var SPCButton;
            if (data.corta.length > 0) {
                for (var i = 0; i < data.corta.length; i++) {
                    for (var j = 0; j < data.corta[i].SPC.length; j++) {
                        SPCButton = this.getView().byId("linee").getItems()[0].getCells()[0].getItems()[0].getItems()[j+2].getItems()[0];
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
                                SPCButton.addStyleClass("SPCButtonPhase1");
                                SPCButton.addStyleClass("SPCButtonColorYellow");
                                break;
                            case "2":
                                SPCButton.setEnabled(true);
                                SPCButton.setIcon("");
                                SPCButton.setText("");
                                if (data.corta[i].SPC[j].allarme === "0") {
                                    SPCButton.addStyleClass("SPCButtonColorGreen");
                                } else if (data.corta[i].SPC[j].allarme === "1") {
                                    SPCButton.addStyleClass("SPCButtonColorYellow");
                                }
                                break;
                            default:
                                SPCButton.setText("");
                                SPCButton.addStyleClass("SPCButtonEmpty");
                                SPCButton.setIcon("");
                                SPCButton.setEnabled(false);
                                break;
                        }
                    }
                }
            }
        },
        CheckCells: function () {
            var oItems = this.getView().byId("linee").getItems();
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