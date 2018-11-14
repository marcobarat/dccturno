sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (jQuery, Controller, JSONModel, Library) {
    "use strict";
    return Controller.extend("myapp.controller.OverviewLinea", {
        ModelSinottico: sap.ui.getCore().getModel("ModelSinottico"),
        STOP: null,
        BusyDialog: new sap.m.BusyDialog(),
        TIMER: null,
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
                            press: "ciao"});
                        button.addStyleClass("buttonSinottico");
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

//            clearInterval(this.TIMER);
//            this.STOP = 0;
//            this.ModelLinee = sap.ui.getCore().getModel("linee");
//            this.getView().setModel(this.ModelLinee, "linee");
//            this.RefreshFunction(100);
//            var that = this;
//            this.TIMER = setInterval(function () {
//                try {
//                    that.RefreshCounter++;
//                    if (that.STOP === 0 && that.RefreshCounter >= 10) {
//                        that.RefreshFunction();
//                    }
//                } catch (e) {
//                    console.log(e);
//                }
//            }, 1000);
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
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/InCombo/GetOverviewPdcAttualeForTiles&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&RepartoID=" + this.RepartoID + "&OutputParameter=JSON";
            }
            Library.SyncAjaxCallerData(link, this.RefreshModelLinee.bind(this));
        },
        RefreshModelLinee: function (Jdata) {
            if (this.STOP === 0) {
                this.ModelLinee.setData(Jdata);
                this.ModelLinee.refresh(true);
                this.getView().setModel(this.ModelLinee, "linee");
                this.LineButtonStyle();
                this.BarColorCT(this.ModelLinee.getData());
                this.checkCells();
                this.RefreshFunction(10000);
            }
        },

        UpdateButtons: function () {
            var i, j, tab, button;
            var TabContainer = this.getView().byId("schemaLineeContainer");
            for (i = 0; i < TabContainer.getItems().length; i++) {
                tab = TabContainer.getItems()[i];
                for (j = 0; j < this.ModelSinottico.getData()[i].Macchine.length; j++) {
                    button = sap.ui.getCore().byId(this.ModelSinottico.getData()[i].Macchine[j].nome.split(" ").join("") + "_" + this.ModelSinottico.getData()[i].LineaID);
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