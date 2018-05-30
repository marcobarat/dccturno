sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History',
    'myapp/control/CustomButt',
    'myapp/controller/Library'
], function (MessageToast, jQuery, Controller, JSONModel, History, CustomButt, Library) {
    "use strict";
    var ManagePiano = Controller.extend("myapp.controller.ManagePiano", {
        data_json: {},
        ModelLinea: new JSONModel({}),
        ModelOperatori: new JSONModel({}),
        ModelSKU: new JSONModel({}),
        prova: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        onInit: function () {
            Library.RemoveClosingButtons.bind(this)("TabContainer");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePiano").attachPatternMatched(this._onObjectMatched, this);
        },
        SUCCESSDatiLinee: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            this.addFieldsCreazione();
            if (Number(this.piano.area) === 1) {
                this.changeFields();
            }
        },
        SUCCESSDatiOperatore: function (Jdata) {
            this.ModelOperatori.setData(Jdata);
        },
        SUCCESSSKU: function (Jdata) {
            this.ModelSKU.setData(Jdata);
        },
        _onObjectMatched: function (oEvent) {
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            var oModelTurni = this.getOwnerComponent().getModel("turni");
            if (!oModelTurni) {
                this.buildNewModel();
            } else {
                Library.AjaxCallerData("model/linee_new.json", this.SUCCESSDatiLinee.bind(this));
                this.getView().setModel(this.ModelLinea, 'linea');
                Library.AjaxCallerData("model/operators.json", this.SUCCESSDatiOperatore.bind(this));
                this.getView().setModel(this.ModelOperatori, 'operatore');
                Library.AjaxCallerData("model/SKU.json", this.SUCCESSSKU.bind(this));
                this.getView().setModel(this.ModelSKU, 'SKU');
                var oTitle = this.getView().byId("Title");
                var oSubtitle = this.getView().byId("Subtitle");
                this.piano = oModelTurni.getData()[this.turnoPath][this.pianoPath];
                oTitle.setText(this.piano.data + "    ---    " + this.piano.turno);
                oTitle.addStyleClass("customTextTitle");
                if (Number(this.piano.area) === -1 || Number(this.piano.area) === 2) {
                    this.removeBar();
                    if (Number(this.piano.area) === -1) {
                        oSubtitle.setText("Turno in creazione");
                    } else {
                        oSubtitle.setText("Turno programmato");
                    }
                    oSubtitle.addStyleClass("customText");
                } else {
                    this.showBar();
                    oSubtitle.setText("Turno in corso");
                    oSubtitle.addStyleClass("customText");
                }
            }
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
        removeBar: function () {
            var oItems = this.getView().byId("managePianoTable").getItems();
            for (var i in oItems) {
                var oHBox = oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0];
                var ProgressIndicator = oHBox.getItems()[0].getItems()[0];
                ProgressIndicator.setShowValue(false);
                var oButton = oHBox.getItems()[1].getItems()[0];
                oButton.setVisible(false);
                ProgressIndicator.getParent().setWidth("100%");
            }
        },
        showBar: function () {
            var oItems = this.getView().byId("managePianoTable").getItems();
            for (var i in oItems) {
                var oHBox = oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0];
                var ProgressIndicator = oHBox.getItems()[0].getItems()[0];
                var oButton = oHBox.getItems()[1].getItems()[0];
                oButton.setVisible(true);
                ProgressIndicator.setShowValue(true);
                ProgressIndicator.getParent().setWidth("97%");
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
            this.prova = new JSONModel("./model/prova.json");
            this._menu.setModel(this.prova);
            this._menu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
        },
        handleMenuItemPress: function (oEvent) {
            var msg = "'" + oEvent.getParameter("item").getText() + "' pressed";
            MessageToast.show(msg);
        },
        handleTextFieldItemPress: function (oEvent) {
            var msg = "'" + oEvent.getParameter("item").getValue() + "' entered";
            MessageToast.show(msg);
        },
        onMenu: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("tmp");
        },
        buildNewModel: function () {
            var ModelLinea = new JSONModel();
            var that = this;
            var oTitle = this.getView().byId("Title");
            var oSubtitle = this.getView().byId("Subtitle");
            $.ajax({
                type: "GET",
                url: "model/pianidiconf.json",
                dataType: "json",
                success: function (oData) {
                    that.data_json.turniconclusi = [];
                    that.data_json.turnoincorso = [];
                    that.data_json.turniprogrammati = [];
                    that.data_json.turnodacreare = [];
                    that.groupTurni(oData, "turniconclusi", "turnoincorso", "turniprogrammati", "turnodacreare");
                    ModelLinea.setData(that.data_json);
                    that.piano = that.data_json[that.turnoPath][that.pianoPath];
                    oTitle.setText(that.piano.data + "    ---    " + that.piano.turno);
                    oTitle.addStyleClass("customTextTitle");
                    if (parseInt(that.piano.area, 10) === -1 || parseInt(that.piano.area, 10) === 2) {
                        that.removeBar();
                        if (parseInt(that.piano.area, 10) === -1) {
                            oSubtitle.setText("Turno in creazione");
                        } else {
                            oSubtitle.setText("Turno programmato");
                        }
                        oSubtitle.addStyleClass("customText");
                    } else {
                        that.showBar();
                        oSubtitle.setText("Turno in corso");
                        oSubtitle.addStyleClass("customText");
                    }

                    Library.AjaxCallerData("model/linee_new.json", that.SUCCESSDatiLinee.bind(that));
                }


            });
            this.getOwnerComponent().setModel(ModelLinea, "turni");
            this.getView().setModel(this.ModelLinea, 'linea');
        },
        groupTurni: function (data, group0, group1, group2, group3) {
            for (var key in data) {
                if (typeof data[key] === "object") {
                    this.groupTurni(data[key], group0, group1, group2, group3);
                }
            }
            if (data.area) {
                switch (data.area) {
                    case "0":
                        this.data_json[group0].push(data);
                        break;
                    case "1":
                        this.data_json[group1].push(data);
                        break;
                    case "2":
                        this.data_json[group2].push(data);
                        break;
                    case "-1":
                        this.data_json[group3].push(data);
                }
            }
            return;
        },
// MODIFICA DELLA VIEW DELLA CREAZIONE TURNO (IN REALTA' DISTINGUO SOLO IL CASO IN CUI IL TURNO E' IN CORSO)
        addFieldsCreazione: function () {
            var j, oTable, oRows;
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
                oRows = oTable.getItems();
                if (oRows[oRows.length - 1].getCells().length !== 1) {
                    var oButton = new sap.m.Button({
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
                value: "{linea>cart}",
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
                oRow.getCells()[7].setValue(this.minutesToStandard(oValueChanged * 12));
            }
            if (oCellChanged === oRow.getCells()[6]) {
                oRow.getCells()[5].setValue(oValueChanged / 2);
                oRow.getCells()[7].setValue(this.minutesToStandard(oValueChanged * 6));
            }
            if (oCellChanged === oRow.getCells()[7]) {
                oRow.getCells()[5].setValue(this.standardToMinutes(oValueChanged) / 12);
                oRow.getCells()[6].setValue(this.standardToMinutes(oValueChanged) / 6);
            }

        },
        changeFields: function () {
            var j, oTable, oRows;
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
                oRows = oTable.getItems();
                oTable.removeItem(oRows[oRows.length - 1]);
                for (j = 0; j < oRows.length; j++) {
                    if (oRows[0].getCells().length >= 8) {
                        oRows[j].removeCell(7);
                        oRows[j].removeCell(6);
                        oRows[j].removeCell(5);
                    }
                    oRows[j].addCell(new sap.m.Text({text: "{linea>qli}"}));
                    oRows[j].addCell(new sap.m.Text({text: "{linea>cart}"}));
                    oRows[j].addCell(new sap.m.Text({text: "{linea>ore}"}));
                }
            }
        },
// AGGIUNGO UNA RIGA QUANDO PREMO SU AGGIUNGI RIGA
        onAddItem: function (oEvent) {
            oEvent.getSource().getParent().getParent().removeItem(oEvent.getSource().getParent());
            var ModelLinea = this.getView().getModel("linea");
            var oData = ModelLinea.getData();
            var oLinea_path = oEvent.getSource().getBindingContext("linea").getPath().split("/");
            var Prodotti = oData[oLinea_path[1]][oLinea_path[2]].ProductCollection;
            var Prodotto = {seq: "", formato: "", tipo: "", materiale: "", confezionamento: "", button: "0", qli: "", cart: "", ore: "", disp: "", prod: "", fermo: "", Formati: oData[oLinea_path[1]][oLinea_path[2]].ProductCollection[0].Formati};
            Prodotti.push(Prodotto);
            ModelLinea.setData(oData);
            this.getView().byId("managePianoTable").setModel(ModelLinea, "linea");
            this.addFieldsCreazione();
        },
//GESTIONE VISUALIZZA ATTRIBUTI BATCH
        visuBatch: function () {
            var oView = this.getView();
            var oDialog = oView.byId("modificaAttributi");
            if (!oDialog) {
                oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaAttributi", this);
                oView.addDependent(oDialog);
            }
            Library.RemoveClosingButtons.bind(this)("attributiContainer");


            oDialog.open();
        }
    });
    return ManagePiano;
});