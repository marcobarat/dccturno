sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History',
    'myapp/control/CustomButt',
    'myapp/controller/Library',
    'myapp/model/TimeFormatter'
], function (MessageToast, jQuery, Controller, JSONModel, History, CustomButt, Library, TimeFormatter) {
    "       use strict";
    var ManagePiano = Controller.extend("myapp.controller.ManagePiano", {
        StabilimentoID: sap.ui.getCore().getModel("stabilimento").getData().StabilimentoID,
        pdcID: sap.ui.getCore().getModel("ParametriPiano").getData().pdc,
        repartoID: sap.ui.getCore().getModel("ParametriPiano").getData().reparto,
        TimeFormatter: TimeFormatter,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,
        data_json: {},
        ModelReparti: sap.ui.getCore().getModel("reparti"),
        ModelMenu: new JSONModel({}),
        ModelLinea: sap.ui.getCore().getModel("linee"),
        ModelOperatori: new JSONModel({}),
        ModelSKU: new JSONModel({}),
        ModelTurni: sap.ui.getCore().getModel("turni"),
        ModelSKUstd: new JSONModel({}),
        ModelCause: new JSONModel({}),
        prova: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        oDialog: null,
        STOP: 0,

        onInit: function () {
            this.getView().setModel(this.ModelReparti, "reparti");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePiano").attachPatternMatched(this.URLChangeCheck, this);
        },
        RefreshFunction: function () {
            this.TIMER = setTimeout(this.RefreshCall.bind(this), 5000);
        },
        RefreshCall: function () {
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            Library.AjaxCallerData(link, this.URLChangeCheck.bind(this));
        },
        SUCCESSCause: function (Jdata) {
            this.data_json = {};
            this.data_json.cause = [];
            this.takeAllCause(Jdata);
            this.ModelCause.setData(this.data_json);
        },
        SUCCESSDatiLinee: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            this.getView().setModel(this.ModelLinea, 'linea');
            this.addFieldsCreazione();
            if (Number(this.piano.area) === 1) {
                this.changeFields();
            }
        },
        SUCCESSDatiOperatore: function (Jdata) {
            this.ModelOperatori.setData(Jdata);
            this.getView().setModel(this.ModelOperatori, 'operatore');
        },
        SUCCESSSKU: function (Jdata) {
            this.ModelSKU.setData(Jdata);
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
        URLChangeCheck: function (oEvent, Jdata) {
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            this.piano = this.ModelTurni.getData().pianidiconfezionamento[this.turnoPath][this.pianoPath];
            this.addFieldsCreazione();
            if (Number(this.piano.area) === 1) {
                this.changeFields();
            }
            this.manageSPCButton();
            if (this.ISLOCAL === 1) {
                Library.AjaxCallerData("model/operators.json", this.SUCCESSDatiOperatore.bind(this));
                this.getView().setModel(this.ModelOperatori, 'operatore');
                Library.AjaxCallerData("model/SKU_standard.json", this.SUCCESSSKUstd.bind(this));
                this.getView().setModel(this.ModelSKUstd, 'SKUstd');
                Library.AjaxCallerData("model/SKU_backend.json", this.SUCCESSSKU.bind(this));
                this.getView().setModel(this.ModelSKU, 'SKU');
            } else {
                this.ModelLinea.setData(Jdata);
                sap.ui.getCore().setModel(this.ModelLinea, "linee");
            }
            var oTitle = this.getView().byId("Title");
            var oSubtitle = this.getView().byId("Subtitle");
            oTitle.setText(this.piano.data + "    ---    " + this.piano.turno);
            oTitle.addStyleClass("customTextTitle");
            if (Number(this.piano.area) === -1 || Number(this.piano.area) === 2) {
                if (Number(this.piano.area) === -1) {
                    oSubtitle.setText("Turno in creazione");
                } else {
                    oSubtitle.setText("Turno programmato");
                }
                oSubtitle.addStyleClass("customText");
            } else {
                oSubtitle.setText("Turno in corso");
                oSubtitle.addStyleClass("customText");
            }
            if (this.ISLOCAL !== 1 && this.STOP === 0) {
                this.RefreshFunction();
            }
            this.getView().setModel(this.ModelLinea, 'linea');
// MI SERVE PER LO STATO LINEA                
            var oModel = new JSONModel({inizio: this.piano.turno.split("-")[0].trim(), fine: this.piano.turno.split("-")[1].trim()});
            this.getView().setModel(oModel, "orarioturno");
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
            var oButton = oEvent.getSource();
            if (!this._menu) {
                this._menu = sap.ui.xmlfragment(
                        "myapp.view.MenuItemEventing",
                        this
                        );
                this.getView().addDependent(this._menu);
            }

            var eDock = sap.ui.core.Popup.Dock;
            this.callMenu(oButton);
            this.getView().setModel(this.ModelMenu);
            this._menu.setModel(this.prova);
            this._menu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
        },
        callMenu: function (oButton) {
            var that = this;
            Library.AjaxCallerData("./model/prova.json", function (Jdata) {
                that.SUCCESSMenu.bind(that)(Jdata, oButton);
            });
        },
// MODIFICA DELLA VIEW DELLA CREAZIONE TURNO (IN REALTA' DISTINGUO SOLO IL CASO IN CUI IL TURNO E' IN CORSO)
        addFieldsCreazione: function () {
            var j, oTable, oRows, oButton;
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
                oRows = oTable.getItems();
                if (oRows.length === 0) {
                    oButton = new sap.m.Button({
                        icon: "sap-icon://add",
                        press: this.onAddItem.bind(this)
                    });
                    oButton.addStyleClass("sapUiTinyMarginBegin");
                    oTable.addItem(new sap.m.ColumnListItem({
                        cells: [
                            oButton
                        ]
                    }));
                } else {
                    if (oRows[oRows.length - 1].getCells().length !== 1) {
                        oButton = new sap.m.Button({
                            icon: "sap-icon://add",
                            press: this.onAddItem.bind(this)
                        });
                        oButton.addStyleClass("sapUiTinyMarginBegin");
                        oTable.addItem(new sap.m.ColumnListItem({
                            cells: [
                                oButton
                            ]
                        }));
                    }
                    for (j = 0; j < oRows.length; j++) {
                        if (oRows[j].getCells().length >= 8) {
                            oRows[j].removeCell(7);
                            oRows[j].removeCell(6);
                            oRows[j].removeCell(5);
                            this.addCellInput(oRows[j]);
                        } else if (oRows[j].getCells().length < 8 && oRows[j].getCells().length > 1) {
                            this.addCellInput(oRows[j]);
                        }
                    }
                }
            }
        },
        addCellInput: function (oRow) {
            var oInput;
            oInput = new sap.m.Input({
                value: "{linea>qli}",
                width: "4rem",
                type: "Number",
                liveChange: this.ChangeValues.bind(this)
            });
            oRow.addCell(oInput);
            oInput = new sap.m.Input({
                value: "{linea>cartoni}",
                width: "4rem",
                type: "Number",
                liveChange: this.ChangeValues.bind(this)
            });
            oRow.addCell(oInput);
            oInput = new sap.m.TimePicker({
                value: "{linea>ore}",
                valueFormat: "HH:mm",
                width: "7rem",
                displayFormat: "HH:mm",
                change: this.ChangeValues.bind(this)

            });
            oRow.addCell(oInput);
        },
        ChangeValues: function (oEvent) {
            var oValueChanged = oEvent.getParameter("value");
            var oCellChanged = oEvent.getSource();
            var oRow = oEvent.getSource().getParent();
            if (oCellChanged === oRow.getCells()[5]) {
                oRow.getCells()[6].setValue(oValueChanged * 2);
                oRow.getCells()[7].setValue(Library.minutesToStandard(oValueChanged * 12));
            }
            if (oCellChanged === oRow.getCells()[6]) {
                oRow.getCells()[5].setValue(oValueChanged / 2);
                oRow.getCells()[7].setValue(Library.minutesToStandard(oValueChanged * 6));
            }
            if (oCellChanged === oRow.getCells()[7]) {
                oRow.getCells()[5].setValue(Library.standardToMinutes(oValueChanged) / 12);
                oRow.getCells()[6].setValue(Library.standardToMinutes(oValueChanged) / 6);
            }

        },
        changeFields: function () {
            var j, oTable, oRows, oText;
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
                oRows = oTable.getItems();
                oTable.removeItem(oRows[oRows.length - 1]);
                for (j = 0; j < oRows.length; j++) {
                    if (oRows[j].getCells().length >= 8) {
                        oRows[j].removeCell(7);
                        oRows[j].removeCell(6);
                        oRows[j].removeCell(5);
                    }
                    oText = new sap.m.Text({text: "{linea>qli}"});
                    oText.addStyleClass("sapUiSmallMarginTop");
                    oRows[j].addCell(oText);
                    oText = new sap.m.Text({text: "{linea>cartoni}"});
                    oText.addStyleClass("sapUiSmallMarginTop");
                    oRows[j].addCell(oText);
                    oText = new sap.m.Text().bindText({path: 'linea>ore', formatter: this.TimeFormatter.TimeText});
                    oText.addStyleClass("sapUiSmallMarginTop sapUiMediumMarginBegin");
                    oRows[j].addCell(oText);
                }
            }
        },
// AGGIUNGO UNA RIGA QUANDO PREMO SU AGGIUNGI RIGA
        onAddItem: function (oEvent) {
            oEvent.getSource().getParent().getParent().removeItem(oEvent.getSource().getParent());
            var ModelLinea = this.getView().getModel("linea");
            var oData = ModelLinea.getData();
            var oLinea_path = oEvent.getSource().getBindingContext("linea").getPath().split("/");
            var Prodotti = oData[oLinea_path[1]][oLinea_path[2]].batchlist;
            var Prodotto = {seq: "", formato: "", tipo: "", materiale: "", confezionamento: "", button: "0", qli: "", cart: "", ore: "", disp: "", prod: "", fermo: "", Formati: oData[oLinea_path[1]][oLinea_path[2]].batchlist[0]};
            Prodotti.push(Prodotto);
            ModelLinea.setData(oData);
            this.getView().byId("managePianoTable").setModel(ModelLinea, "linea");
            this.addFieldsCreazione();
        },
//GESTIONE VISUALIZZA ATTRIBUTI BATCH
        azioneBatch: function (oEvent) {
            var oText = oEvent.getParameter("item").getText();
            switch (oText) {
                case "Visualizza Attributi Batch":
                    this.visuBatch();
                    break;
            }

        },
        visuBatch: function () {
            var oView = this.getView();
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
            Library.RemoveClosingButtons.bind(this)("attributiContainer");


            this.oDialog.open();
        },
        closeDialog: function () {
            this.oDialog.close();
        },
// GESTIONE POPUP STATO LINEA
        onOpenStatoLinea: function () {
            var oView = this.getView();
            this.getView().setModel(this.ModelSKU, "SKU");
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
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("main", true);
        },
        manageSPCButton: function(){
            var oItems = this.getView().byId("managePianoTable").getItems();
            for (var i=0; i<oItems.length; i++){
                var SPCButton = oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[1].getItems()[0];
                if (Number(this.piano.area) === 1 ) {
                    SPCButton.setVisible(true);
                } else {
                    SPCButton.setVisible(false);
                }
            }
        }

    });
    return ManagePiano;
});