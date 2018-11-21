sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/control/CustomTextAlarms',
    'myapp/controller/Library',
    'sap/m/MessageToast'
], function (jQuery, Controller, JSONModel, CustomTextAlarms, Library, MessageToast) {
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
//  FUNZIONI D'INIZIALIZZAZIONE      
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("OverviewLinea").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function () {
            clearInterval(this.TIMER);
            this.STOP = 0;
            var i, j, tab, button;
            this.getView().setModel(this.ModelSinottico, "ModelSinottico");
            var TabContainer = this.getView().byId("schemaLineeContainer");
            for (i = 0; i < TabContainer.getItems().length; i++) {
                tab = TabContainer.getItems()[i];
                if (!sap.ui.getCore().byId(this.ModelSinottico.getData()[i].Macchine[0].nome.split(" ").join("") + "_" + this.ModelSinottico.getData()[i].LineaID)) {
                    for (j = 0; j < this.ModelSinottico.getData()[i].Macchine.length; j++) {
                        button = new sap.m.Button({
                            id: this.ModelSinottico.getData()[i].Macchine[j].nome.split(" ").join("") + "_" + this.ModelSinottico.getData()[i].LineaID,
                            text: this.ModelSinottico.getData()[i].Macchine[j].nome,
                            press: [this.ShowParameters, this]});
                        button.addStyleClass("buttonSinottico");
                        button.addStyleClass(this.ModelSinottico.getData()[i].Macchine[j].class);
                        tab.addContent(button);
                    }
                }
            }
            this.UpdateButtons();
            for (i = 0; i < TabContainer.getItems().length; i++) {
                if (this.ModelSinottico.getData()[i].IsSelected === "1") {
                    tab = TabContainer.getItems()[i];
                }
            }
            TabContainer.setSelectedItem(tab);
            Library.RemoveClosingButtons.bind(this)("schemaLineeContainer");

            this.RefreshFunction(100);
            var that = this;
            this.TIMER = setInterval(function () {
                try {
                    that.Counter++;
                    if (that.STOP === 0 && that.Counter >= 20) {
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
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/Sinottico/SinotticoLineeGood&Content-Type=text/json&OutputParameter=JSON";
            }
            Library.SyncAjaxCallerData(link, this.RefreshModelSinottico.bind(this));
        },
        RefreshModelSinottico: function (Jdata) {
            var i, j;
            if (this.STOP === 0) {
                this.Counter = 0;
                for (i = 0; i < Jdata.length; i++) {
                    Jdata[i].IMG = Jdata[i].Descrizione.toLowerCase().split(" ").join("_") + ".png";
                    Jdata[i].IsSelected = (Jdata[i].LineaID === this.IDSelected) ? "1" : "0";
                    this.SetNameMacchine(Jdata[i]);
                    for (j = 0; j < Jdata[i].Macchine.length; j++) {
                        Jdata[i].Macchine[j].class = Jdata[i].Macchine[j].nome.split(" ").join("");
                    }
                }
                this.ModelSinottico.setData(Jdata);
                this.ModelSinottico.refresh(true);
                this.getView().setModel(this.ModelSinottico, "ModelSinottico");
                this.UpdateButtons();
//                this.RefreshFunction(10000);
            }
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
                clearInterval(this.AlarmTIMER);
                this.AlarmSTOP = 0;
                this.AlarmCounter = 10;
                this.AlarmDialog = this.getView().byId("allarmiMacchina");
                if (!this.AlarmDialog) {
                    this.AlarmDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.AllarmiMacchina", this);
                    this.getView().addDependent(this.AlarmDialog);
                }
                this.AlarmDataCaller();
                this.AlarmDialog.open();
                this.AlarmDialog.setBusy(true);
                var that = this;
                this.AlarmTIMER = setInterval(function () {
                    try {
                        that.AlarmCounter++;
                        if (that.AlarmSTOP === 0 && that.AlarmCounter >= 5) {
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
                    Library.SyncAjaxCallerData(link, this.SUCCESSParametersReceived.bind(this), this.FAILUREParametersReceived.bind(this));
                }
            }
        },
        FAILUREParametersReceived: function () {
            this.CloseDialog();
            MessageToast.show("La macchina è spenta o non raggiungibile", {width: "25em"});
        },
        SUCCESSParametersReceived: function (Jdata) {
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
                this.ModelAllarmi.setData({"causale": causale, "allarmi": allarmi});
                this.ModelParametri.setData(parametri);
                this.TabsIntelligence();
                this.getView().setModel(this.ModelAllarmi, "allarmi");
                this.getView().setModel(this.ModelParametri, "parametri");
                if (this.AlarmSTOP === 0) {
                    this.AlarmCounter = 0;
                }
                this.AlarmDialog.setBusy(false);
                Library.RemoveClosingButtons.bind(this)("allarmiContainer");
            } else {
                this.AlarmDialog.setBusy(false);
                this.CloseDialog();
                MessageToast.show(Jdata.errorMessage, {width: "25em", duration: "3000"});
            }
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
                        visibleRowCount: 12,
                        columns: [
                            new sap.ui.table.Column({
                                label: "Allarme",
                                hAlign: "Center",
                                vAlign: "Middle",
                                resizable: false,
                                template: new CustomTextAlarms({
                                    text: "{allarmi>parametro}",
                                    maxLines: 1,
                                    isAlarm: "{allarmi>isAllarme}",
                                    isBlock: "{allarmi>isBloccante}",
                                    isActive: "{allarmi>isActive}"})}),
                            new sap.ui.table.Column({
                                label: "Valore",
                                hAlign: "Center",
                                vAlign: "Middle",
                                resizable: false,
                                template: new CustomTextAlarms({
                                    text: "{allarmi>valore}",
                                    maxLines: 1,
                                    isAlarm: "{allarmi>isAllarme}",
                                    isBlock: "{allarmi>isBloccante}",
                                    isActive: "{allarmi>isActive}"})})
                        ]
                    });
                    Item.addContent(Table);
                    container.addItem(Item);
                    container.setSelectedItem(Item);
                }
                if (this.macchina === "Scatolatrice") {
                    if (!sap.ui.getCore().byId("scatoTab")) {
                        var ItemScato = new sap.m.TabContainerItem({id: "scatoTab"});
                        var name_linea = sap.ui.getCore().byId(this.getView().byId("schemaLineeContainer").getSelectedItem()).getName();
                        ItemScato.setName("Sinottico");
                        var flexy = (!sap.ui.getCore().byId("sinotticoFlex")) ? new sap.m.FlexBox({id: "sinotticoFlex", alignItems: "Start", justifyContent: "Center"}) : sap.ui.getCore().byId("sinotticoFlex");
                        var img = (!sap.ui.getCore().byId("sinotticoScat")) ? new sap.m.Image({id: "sinotticoScat", height: "30rem"}) : sap.ui.getCore().byId("sinotticoScat");
                        img.setSrc("img/" + name_linea.toLowerCase().split(" ").join("_") + "_scatolatrice.png");
                        flexy.addItem(img);
                        ItemScato.addContent(flexy);
                        container.addItem(ItemScato);
                        container.setSelectedItem(ItemScato);
                    }
                } else {
                    if (sap.ui.getCore().byId("scatoTab")) {
                        container.removeItem(sap.ui.getCore().byId("scatoTab"));
                        sap.ui.getCore().byId("sinotticoScat").destroy();
                        sap.ui.getCore().byId("sinotticoFlex").destroy();
                        sap.ui.getCore().byId("scatoTab").destroy();
                    }
                }
            } else {
                if (sap.ui.getCore().byId("allarmiTab")) {
                    container.removeItem(sap.ui.getCore().byId("allarmiTab"));
                    sap.ui.getCore().byId("allarmiTable").destroy();
                    sap.ui.getCore().byId("allarmiTab").destroy();
                }
                if (sap.ui.getCore().byId("scatoTab")) {
                    container.removeItem(sap.ui.getCore().byId("scatoTab"));
                    sap.ui.getCore().byId("sinotticoScat").destroy();
                    sap.ui.getCore().byId("sinotticoFlex").destroy();
                    sap.ui.getCore().byId("scatoTab").destroy();
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
                sap.ui.getCore().byId("allarmiTab").addContent(text);
            } else {
                text = sap.ui.getCore().byId("textCausale");
                if (text) {
                    sap.ui.getCore().byId("allarmiTab").removeContent(text);
                }
            }
        },
        //  FUNZIONI DI REFRESH
        CloseDialog: function () {
            this.AlarmSTOP = 1;
            clearInterval(this.Timer);
            this.AlarmDialog.setBusy(false);
            this.AlarmDialog.close();
            this.getView().setModel(new JSONModel(), "allarmi");
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
        UpdateButtons: function () {
            var i, j, k, button;
            var classes = ["buttonGood", "buttonWarning", "buttonError"];
            var TabContainer = this.getView().byId("schemaLineeContainer");
            for (i = 0; i < TabContainer.getItems().length; i++) {
                for (j = 0; j < this.ModelSinottico.getData()[i].Macchine.length; j++) {
                    button = sap.ui.getCore().byId(this.ModelSinottico.getData()[i].Macchine[j].nome.split(" ").join("") + "_" + this.ModelSinottico.getData()[i].LineaID);
                    for (k = 0; k < classes.length; k++) {
                        button.removeStyleClass(classes[k]);
                    }
                    switch (this.ModelSinottico.getData()[i].Macchine[j].stato) {
                        case "Good":
                            button.addStyleClass("buttonGood");
                            break;
                        case "Warning":
                            button.addStyleClass("buttonWarning");
                            break;
                        case "Error":
                            button.addStyleClass("buttonError");
                            break;
                    }
                }
            }
        },

        BackToRiepilogo: function () {
            clearInterval(this.TIMER);
            this.STOP = 1;
            this.getOwnerComponent().getRouter().navTo("RiepilogoLinee");
        }
    });
});