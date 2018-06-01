sap.ui.define([
        'sap/m/MessageToast',
        'jquery.sap.global',
        'sap/ui/core/mvc/Controller',
        'sap/ui/model/json/JSONModel',
        'sap/ui/core/routing/History',
        'myapp/control/CustomButt',
        'myapp/controller/Library'
        ], function (MessageToast, jQuery, Controller, JSONModel, History, CustomButt, Library) {
"       use strict";
        var ManagePiano = Controller.extend("myapp.controller.ManagePiano", {

        ISLOCAL: 0,
        data_json: {},
        ModelMenu: new JSONModel({}),
        ModelLinea: new JSONModel({}),
        ModelOperatori: new JSONModel({}),
        ModelSKU: new JSONModel({}),
        ModelTurni: new JSONModel({}),
        ModelSKUstd : new JSONModel({}),
        ModelCause: new JSONModel({}),
        prova: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        oDialog: null,
        onInit: function () {
            this.ISLOCAL = jQuery.sap.getUriParameters().get("ISLOCAL");
            Library.RemoveClosingButtons.bind(this)("TabContainer");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePiano").attachPatternMatched(this.URLChangeCheck, this);
        },
        SUCCESSCause: function(Jdata){
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
        SUCCESSSKUstd: function(Jdata) {
            this.ModelSKUstd.setData(Jdata);
        },
        SUCCESSMenu: function(Jdata, oButton){
            var oState = oButton.getState();
            if (oState === "Non trasferito"){
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
        URLChangeCheck: function (oEvent) {
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            this.ModelTurni = this.getOwnerComponent().getModel("turni");
            if (!this.ModelTurni) {
                Library.SyncAjaxCallerData("model/pianidiconf.json", Library.SUCCESSDatiTurni.bind(this));
                this.getOwnerComponent().setModel(this.ModelTurni, "turni");
            }
            this.piano = this.ModelTurni.getData()[this.turnoPath][this.pianoPath];
            if (Number(this.ISLOCAL) === 1) {
                    Library.AjaxCallerData("model/linee_new.json", this.SUCCESSDatiLinee.bind(this));
                    this.getView().setModel(this.ModelLinea, 'linea');
                    Library.AjaxCallerData("model/operators.json", this.SUCCESSDatiOperatore.bind(this));
                    this.getView().setModel(this.ModelOperatori, 'operatore');
                    Library.AjaxCallerData("model/SKU_standard.json", this.SUCCESSSKUstd.bind(this));
                    this.getView().setModel(this.ModelSKUstd, 'SKUstd');
                    Library.AjaxCallerData("model/SKU_backend.json", this.SUCCESSSKU.bind(this));
                    this.getView().setModel(this.ModelSKU, 'SKU');                    
                } else {
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
        },
        takeAllCause: function(bck){
                            for (var key in bck){
                                if (typeof bck[key] === "object"){
                                    bck[key] = this.takeAllCause(bck[key]);
                                }
                            }
                            if (bck.fermo !== undefined){
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
        callMenu: function(oButton){
            var that = this;
            Library.AjaxCallerData("./model/prova.json", function(Jdata){that.SUCCESSMenu.bind(that)(Jdata, oButton);});
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
            var j, oTable, oRows;
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
                    oRows[j].addCell(new sap.m.Text({text: "{linea>qli}"}));
                    oRows[j].addCell(new sap.m.Text({text: "{linea>cartoni}"}));
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
                switch (oText){
                    case "Visualizza Attributi Batch":
                        this.visuBatch();
                        break;
                }

        },
        visuBatch: function(){
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
        closeDialog: function(){
            this.oDialog.destroy();
        },
// GESTIONE POPUP STATO LINEA
        onOpenStatoLinea: function(){
            var oView = this.getView();
            this.getView().setModel(this.ModelSKU, "SKU");
            this.oDialog = oView.byId("statoLinea");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.statoLinea", this);
                oView.addDependent(this.oDialog);
            }
            this.oDialog.open();
        },
        onGestioneStato: function(oEvent){
            var oText = oEvent.getSource().getText();
            if (oText === "Disponibile per la produzione"){
                this.getView().byId("disponibile").setSelected(true);
                this.getView().byId("nondisponibile").setSelected(false);
                this.removeMotivi();
            } else {
                this.getView().byId("nondisponibile").setSelected(true);
                this.getView().byId("disponibile").setSelected(false);
                this.addMotivi();
            }
        },
        addMotivi: function () {
            var OuterBox = this.getView().byId("statoLineaBox");
            var VBox = sap.ui.getCore().byId("nondisponibileBox");
            if (!VBox) {
                VBox = new sap.m.VBox({id: "nondisponibileBox"});
                VBox.addStyleClass("sapUiLargeMarginBegin");
                var VBox_intervallo = new sap.m.VBox({});
                VBox_intervallo.addStyleClass("sapUiSmallMargin");
                var VBox_causale = new sap.m.VBox({});
                VBox_causale.addStyleClass("sapUiSmallMargin");
                var turno_split = this.piano.turno.split("-");
                var inizio = turno_split[0].trim();
                var fine = turno_split[1].trim();
                var picker_inizio = new sap.m.TimePicker({
                    width: "7rem",
                    valueFormat: "HH:mm",
                    value: inizio,
                    id: "Inizio",
                    displayFormat: "HH:mm"
                });
                picker_inizio.addStyleClass("sapUiSmallMarginBegin");
                var picker_fine = new sap.m.TimePicker({
                    width: "7rem",
                    valueFormat: "HH:mm",
                    value: fine,
                    id: "Fine",
                    displayFormat: "HH:mm"
                });
                picker_fine.addStyleClass("sapUiSmallMarginBegin");
                var selector = new sap.m.Select({
                    id: "Causale",
                    autoAdjustWidth: true
                });
                selector.addStyleClass("sapUiSmallMarginBegin");
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{cause>id}",
                    text: "{cause>fermo}"
                });
                if (Number(this.ISLOCAL) === 1) {
                    Library.AjaxCallerData("./model/JSON_FermoTestiNew.json", this.SUCCESSCause.bind(this));
                    this.getView().setModel(this.ModelCause, "cause");
                }
                selector.setModel(this.getView().getModel("cause"));
                selector.bindAggregation("items", "cause>/cause", oItemSelectTemplate);
                VBox_intervallo.addItem(new sap.m.Text({text: "Intervallo"}));
                VBox_intervallo.addItem(picker_inizio);
                VBox_intervallo.addItem(picker_fine);
                VBox_causale.addItem(new sap.m.Text({text: "Causale"}));
                VBox_causale.addItem(selector);
                VBox.addItem(VBox_intervallo);
                VBox.addItem(VBox_causale);
                OuterBox.addItem(VBox);
            }
        },
        removeMotivi: function(){
            var VBox = sap.ui.getCore().byId("nondisponibileBox");
            if (VBox){
                VBox.destroyItems();
                VBox.destroy();
            }
        }       
    });
    return ManagePiano;
});