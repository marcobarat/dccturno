sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/control/CustomTextAlarms',
    'myapp/control/CustomButtonSin',
    'myapp/controller/Library',
    'sap/m/MessageToast'
], function (jQuery, Controller, JSONModel, CustomTextAlarms, CustomButtonSin, Library, MessageToast) {
    "use strict";
    return Controller.extend("myapp.controller.OverviewLinea", {
        ModelSinottico: sap.ui.getCore().getModel("ModelSinottico"),
        ModelAllarmi: new JSONModel(),
        ModelParametri: new JSONModel(),
        AlarmSTOP: null,
        BusyDialog: new sap.m.BusyDialog(),
        AlarmTIMER: null,
        AlarmDialog: null,
        AlarmCounter: null,
        macchinaId: null,
        macchina: null,
        STOP: null,
        TIMER: null,
        Counter: null,
        idLinea: null,

//  FUNZIONI D'INIZIALIZZAZIONE      
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("OverviewLinea").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function () {
            clearInterval(this.TIMER);
            this.STOP = 0;
            var j, vbox, button;
            this.getView().setModel(this.ModelSinottico, "ModelSinottico");
            vbox = this.getView().byId("sinotticoVbox");
            this.idLinea = this.ModelSinottico.getData().LineaID;
            if (!sap.ui.getCore().byId(this.ModelSinottico.getData().Macchine[0].nome.split(" ").join("") + "_" + this.ModelSinottico.getData().LineaID)) {
                for (j = 0; j < this.ModelSinottico.getData().Macchine.length; j++) {
                    button = new CustomButtonSin({
                        id: this.ModelSinottico.getData().Macchine[j].nome.split(" ").join("") + "_" + this.ModelSinottico.getData().LineaID,
                        text: "{ModelSinottico>/Macchine/" + j + "/nome}",
                        stato: "{ModelSinottico>/Macchine/" + j + "/stato}",
                        press: [this.ShowParameters, this]});
                    button.addStyleClass("buttonSinottico");
                    button.addStyleClass(this.ModelSinottico.getData().Macchine[j].class);
                    vbox.addItem(button);
                }
            }
            this.Counter = 10;
            var that = this;
            this.TIMER = setInterval(function () {
                try {
                    that.Counter++;
                    if (that.STOP === 0 && that.Counter >= 10) {
                        that.RefreshFunction();
//                        that.BusyDialog.open();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },

//        ------------------------------------------------------
//        ---------------- FUNZIONI DI REFRESH -----------------
//        ------------------------------------------------------

        RefreshFunction: function (msec) {
            this.TIMER = setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
            var link;
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/Sinottico/SinotticoByLineaID&Content-Type=text/json&LineaID=" + this.idLinea + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.RefreshModelSinottico.bind(this));
        },
        RefreshModelSinottico: function (Jdata) {
            var j;
            if (this.STOP === 0) {
                this.Counter = 0;
                Jdata.IMG = Jdata.Descrizione.toLowerCase().split(" ").join("_") + ".png";
                this.SetNameMacchine(Jdata);
                for (j = 0; j < Jdata.Macchine.length; j++) {
                    Jdata.Macchine[j].class = Jdata.Macchine[j].nome.split(" ").join("");
                }
                this.ModelSinottico.setData(Jdata);
                this.ModelSinottico.refresh(true);
                this.getView().setModel(this.ModelSinottico, "ModelSinottico");
            }
        },

//        ------------------------------------------------------
//        ------------------ POPUP PARAMETRI -------------------
//        ------------------------------------------------------

        ShowParameters: function (event) {
            var path = event.getSource().getBindingContext("ModelSinottico").getPath();
            this.macchina = event.getSource().getProperty("text");
            var stato;
            for (var i = 0; i < this.ModelSinottico.getProperty(path).Macchine.length; i++) {
                if (this.ModelSinottico.getProperty(path).Macchine[i].nome === this.macchina) {
                    this.macchinaID = this.ModelSinottico.getProperty(path).Macchine[i].risorsaid;
                    stato = this.ModelSinottico.getProperty(path).Macchine[i].stato;
                }
            }
            if (stato !== "") {
                this.STOP = 1;
                clearInterval(this.AlarmTIMER);
                this.AlarmSTOP = 0;
                this.AlarmCounter = 10;
                this.AlarmDialog = this.getView().byId("allarmiMacchina");
                if (!this.AlarmDialog) {
                    this.AlarmDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.AllarmiMacchina", this);
                    this.getView().addDependent(this.AlarmDialog);
                }
                this.AlarmDialog.open();
                this.AlarmDialog.setBusy(true);
                this.AlarmDataCaller();
                var that = this;
                this.AlarmTIMER = setInterval(function () {
                    try {
                        that.AlarmCounter++;
                        if (that.AlarmSTOP === 0 && that.AlarmCounter >= 10) {
                            that.AlarmRefresh();
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }, 1000);
            } else {
                MessageToast.show("La macchina è spenta o non raggiungibile", {width: "25em"});
            }
        },
        AlarmRefresh: function (msec) {
            this.AlarmCounter = 0;
            if (typeof msec === "undefined") {
                msec = 0;
            }
            setTimeout(this.AlarmDataCaller.bind(this), msec);
        },
        AlarmDataCaller: function () {
            var link;
            if (this.AlarmDialog) {
                if (this.AlarmDialog.isOpen()) {
                    if (this.ISLOCAL !== 1) {
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAlarmsFromMacchinaLineaID&Content-Type=text/json&MacchinaID=" + this.macchinaID + "&OutputParameter=JSON";
                    }
                    Library.AjaxCallerData(link, this.SUCCESSParametersReceived.bind(this), this.FAILUREParametersReceived.bind(this));
                }
            }
        },
        FAILUREParametersReceived: function () {
            this.CloseDialog();
            MessageToast.show("La macchina è spenta o non raggiungibile", {width: "25em"});
        },
        SUCCESSParametersReceived: function (Jdata) {
            this.AlarmDialog.setBusy(false);
            if (Jdata.error === "0") {
                var parametri = [];
                var allarmi = [];
                var causale = Jdata.causaleAllarme;
                var i;
                for (i = 0; i < Jdata.parametri.length; i++) {
                    if (Jdata.parametri[i].isAllarme === "0") {
                        parametri.push(Jdata.parametri[i]);
                    } else {
                        Jdata.parametri[i].isActive = "";
                        if (Jdata.parametri[i].valore === "1") {
                            Jdata.parametri[i].isActive = "1";
                        }
                        allarmi.push(Jdata.parametri[i]);
                    }
                }
                allarmi = this.SortAlarms(allarmi);
                this.ModelAllarmi.setData({"causale": causale, "allarmi": allarmi});
                this.ModelParametri.setData(parametri);
                this.TabsIntelligence();
                this.getView().setModel(this.ModelAllarmi, "allarmi");
                this.getView().setModel(this.ModelParametri, "parametri");
                if (this.AlarmSTOP === 0) {
                    this.AlarmCounter = 0;
                }
                Library.RemoveClosingButtons.bind(this)("allarmiContainer");
            } else {
                this.AlarmDialog.setBusy(false);
                this.CloseDialog();
                MessageToast.show(Jdata.errorMessage, {width: "25em", duration: "3000"});
            }
        },
        CloseDialog: function () {
            this.STOP = 0;
            this.ModelAllarmi.setData({});
            this.ModelParametri.setData({});
            this.RefreshFunction();
            this.AlarmSTOP = 1;
            clearInterval(this.Timer);
            this.AlarmDialog.setBusy(false);
            this.AlarmDialog.close();
            this.getView().setModel(new JSONModel(), "allarmi");
        },

//        ------------------------------------------------------
//        --------------- FUNZIONI DI SUPPORTO -----------------
//        ------------------------------------------------------

//        ********************** SINOTTICO ***********************

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

//        ********************** PARAMETRI ***********************

        SortAlarms: function (arr) {
            var res = [];
            var i;
            for (i = 0; i < arr.length; i++) {
                if (arr[i].valore === "1" && arr[i].isBloccante === "1") {
                    res.push(arr[i]);
                }
            }
            for (i = 0; i < arr.length; i++) {
                if (arr[i].valore === "1" && arr[i].isBloccante === "0") {
                    res.push(arr[i]);
                }
            }
            for (i = 0; i < arr.length; i++) {
                if (arr[i].valore === "0") {
                    res.push(arr[i]);
                }
            }
            return res;
        },
        TabsIntelligence: function () {
            var container = this.getView().byId("allarmiContainer");
            var causale = this.ModelAllarmi.getData().causale;
            var allarmi = this.ModelAllarmi.getData().allarmi;
            if (allarmi.length > 0) {
                if (!sap.ui.getCore().byId("allarmiTab")) {
                    var Item = new sap.m.TabContainerItem({id: "allarmiTab"});
                    Item.setName("Allarmi");
                    var Table = new sap.ui.table.Table({
                        id: "allarmiTable",
                        rows: "{path:'allarmi>/allarmi'}",
                        selectionMode: "None",
                        enableColumnReordering: false,
                        enableSelectAll: false,
                        ariaLabelledBy: "title",
                        visibleRowCount: 14,
                        columns: [
                            new sap.ui.table.Column({
                                label: "Allarme",
                                hAlign: "Left",
                                vAlign: "Middle",
                                width: "70%",
                                resizable: false,
                                template: new CustomTextAlarms({
                                    text: "{allarmi>parametro}",
                                    tooltip: "{allarmi>parametro}",
                                    maxLines: 1,
                                    isAlarm: "{allarmi>isAllarme}",
                                    isBlock: "{allarmi>isBloccante}",
                                    isActive: "{allarmi>isActive}"})}),
                            new sap.ui.table.Column({
                                label: "Valore",
                                hAlign: "Center",
                                vAlign: "Middle",
                                width: "15%",
                                resizable: false,
                                template: new CustomTextAlarms({
                                    text: "{allarmi>valore}",
                                    tooltip: "{allarmi>valore}",
                                    maxLines: 1,
                                    isAlarm: "{allarmi>isAllarme}",
                                    isBlock: "{allarmi>isBloccante}",
                                    isActive: "{allarmi>isActive}"})}),
                            new sap.ui.table.Column({
                                label: "Tag Kepware",
                                hAlign: "Center",
                                vAlign: "Middle",
                                width: "15%",
                                resizable: false,
                                template: new CustomTextAlarms({
                                    text: "{allarmi>tag}",
                                    tooltip: "{allarmi>tag}",
                                    maxLines: 1,
                                    isAlarm: "{allarmi>isAllarme}",
                                    isBlock: "{allarmi>isBloccante}",
                                    isActive: "{allarmi>isActive}"})})
                        ]
                    });
                    Table.addStyleClass("fontTable");
                    Table.addStyleClass("labelTable");
                    Item.addContent(Table);
                    container.addItem(Item);
                    container.setSelectedItem(Item);
                }
            } else {
                if (sap.ui.getCore().byId("allarmiTab")) {
                    container.removeItem(sap.ui.getCore().byId("allarmiTab"));
                    sap.ui.getCore().byId("allarmiTable").destroy();
                    sap.ui.getCore().byId("allarmiTab").destroy();
                }
            }
            var text;
            if (causale !== "") {
                if (!sap.ui.getCore().byId("textCausale")) {
                    text = new sap.m.Text({
                        id: "textCausale",
                        text: "Causale Allarme: {allarmi>/causale}",
                        maxLines: 1
                    });
                } else {
                    text = sap.ui.getCore().byId("textCausale");
                }
                text.addStyleClass("causale");
                if (sap.ui.getCore().byId("allarmiTab")) {
                    sap.ui.getCore().byId("allarmiTab").addContent(text);
                }
            } else {
                text = sap.ui.getCore().byId("textCausale");
                if (text) {
                    sap.ui.getCore().byId("allarmiTab").removeContent(text);
                }
            }
        },
        getRandom: function () {
            var val = Math.floor(4 * Math.random());
            switch (val) {
                case 0:
                    return "9";
                case 1:
                    return "10";
                case 2:
                    return "13";
                default:
                    return "32";
            }
        },

//        ------------------------------------------------------
//        ------------------- INTESTAZIONE ---------------------
//        ------------------------------------------------------

        BackToRiepilogo: function () {
            var j, button;
            for (j = 0; j < this.ModelSinottico.getData().Macchine.length; j++) {
                button = sap.ui.getCore().byId(this.ModelSinottico.getData().Macchine[j].nome.split(" ").join("") + "_" + this.ModelSinottico.getData().LineaID);
                if (button) {
                    button.destroy();
                }
            }
            clearInterval(this.TIMER);
            this.BusyDialog.open();
            this.STOP = 1;
            this.getOwnerComponent().getRouter().navTo("RiepilogoLinee");
            this.BusyDialog.close();
        }
    });
});