sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (jQuery, Controller, JSONModel, Library) {
    "use strict";
    return Controller.extend("myapp.controller.OverviewLinea", {
        ModelSinottico: sap.ui.getCore().getModel("ModelSinottico"),
        ModelAllarmi: new JSONModel(),
        STOP: null,
        BusyDialog: new sap.m.BusyDialog(),
        TIMER: null,
        AlarmDialog: null,
        Counter: null,
        macchinaId: null,
//  FUNZIONI D'INIZIALIZZAZIONE      
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("OverviewLinea").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function () {
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
        },
        ShowParameters: function (event) {
            this.BusyDialog.open();
            clearInterval(this.TIMER);
            this.STOP = 0;
            this.Counter = 10;
            this.AlarmDialog = this.getView().byId("allarmiMacchina");
            if (!this.AlarmDialog) {
                this.AlarmDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.AllarmiMacchina", this);
                this.getView().addDependent(this.AlarmDialog);
            }
            this.macchinaID = this.getRandom();
            this.AlarmDataCaller();
            this.AlarmDialog.open();
            var that = this;
            this.TIMER = setInterval(function () {
                try {
                    that.Counter++;
                    if (that.STOP === 0 && that.Counter >= 10) {
                        that.AlarmRefresh();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },
        AlarmRefresh: function (msec) {
            this.Counter = 0;
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
                }
                Library.SyncAjaxCallerData(link, this.SUCCESSParametersReceived.bind(this));
            }
        },
        SUCCESSParametersReceived: function (Jdata) {
            this.ModelAllarmi.setData(Jdata);
            this.getView().setModel(this.ModelAllarmi, "allarmi");
            if (this.STOP === 0) {
                this.Counter = 0;
            }
            this.BusyDialog.close();
        },
        //  FUNZIONI DI REFRESH
        CloseDialog: function () {
            this.STOP = 1;
            clearInterval(this.Timer);
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