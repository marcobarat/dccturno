sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History',
    'myapp/control/CustomButt'
], function (MessageToast, jQuery, Controller, JSONModel, History, CustomButt) {
    "use strict";

    var ManagePiano = Controller.extend("myapp.controller.ManagePiano", {
        data_json: {},
        oModel: null,
        oModel3: null,
        prova: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        onInit: function () {

            var params = jQuery.sap.getUriParameters(window.location.href);
            this.oModel = new JSONModel();
            var that = this;
            this.oModel3 = new JSONModel("./model/operators.json");

            
            this.getView().setModel(this.oModel3, 'operatore');

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePiano").attachPatternMatched(this._onObjectMatched, this);

        },

        _onObjectMatched: function (oEvent) {
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            var oModelTurni = this.getOwnerComponent().getModel("turni");
            if (!oModelTurni) {
                this.buildNewModel();
            } else {
                this.initLinea();
                var oTitle = this.getView().byId("Title");
                var oSubtitle = this.getView().byId("Subtitle");
                this.piano = oModelTurni.getData()[this.turnoPath][this.pianoPath];
                oTitle.setText(this.piano.data + "    ---    " + this.piano.turno);
                oTitle.addStyleClass("customTextTitle");
                if (parseInt(this.piano.area, 10) === -1 || parseInt(this.piano.area, 10) === 2) {
                    this.removeBar();
                    if (parseInt(this.piano.area, 10) === -1) {
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
        initLinea: function(){
            var that = this;
            $.ajax({
                type: "GET",
                url: "model/linee_new.json",
                dataType: "json",
                success: function (oData) {
                    that.oModel.setData(oData);
                    that.addFieldsCreazione();
                    if (parseInt(that.piano.area, 10)===1){
                        that.changeFields();
                    }
                }
            });            
            this.getView().setModel(this.oModel, 'linea');   
        },        
//BUTTON NAVBACK        
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("overview", true);
            }
//                this.getView().destroy();
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
        pressami: function () {
            alert("pressssss");
            this.getView().getModel("piano");

        },
        onToTmpPage: function (event) {

            this.getOwnerComponent().getRouter().navTo("tmp");

        },
        managePiano: function (evt) {
            alert("miao anche a te");
        },
        handlePressOpenMenu: function (oEvent) {
            var oButton = oEvent.getSource();

            // create menu only once
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
        onPress: function (evt) {
            alert("ho cliccato");
        },
        onMenu: function () {

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("tmp");
        },
        buildNewModel: function () {
            var oModel = new JSONModel();
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
                    oModel.setData(that.data_json);
                    that.piano = that.data_json[that.turnoPath][that.pianoPath];
                    oTitle.setText(that.piano.data + "    ---    " + that.piano.turno);
                    oTitle.addStyleClass("customTextTitle");


                    if (parseInt(that.piano.area, 10) === -1 || parseInt(that.piano.area, 10) === 2) {
                        that.removeBar();
                        if (parseInt(that.piano.area, 10) === -1) {
                            oSubtitle.setText("Turno in creazione");
//                            that.addFieldsCreazione();
                        } else {
                            oSubtitle.setText("Turno programmato");
                        }
                        oSubtitle.addStyleClass("customText");
                    } else {
                        that.showBar();
                        oSubtitle.setText("Turno in corso");
                        oSubtitle.addStyleClass("customText");
                    }
                    
                    that.initLinea();
                }


            });
            this.getOwnerComponent().setModel(oModel, "turni");
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
            var j, oCell, oTable, oRows;
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i=0; i<oTables.length; i++){
                oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
                oRows = oTable.getItems();
                if (oRows[oRows.length-1].getCells().length !==1){
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
                    } else if (oRows[j].getCells().length < 8 && oRows[j].getCells().length > 1){
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
                valueFormat:"HH:mm",
                width: "7rem",
//                placeholder:"HH:mm",
                displayFormat:"HH:mm",
                change: this.ChangeValues.bind(this)

            });
            oRow.addCell(oInput);
        },
// CASO IN CUI LA VIEW APERTA E' DEL TURNO IN CORSO
        changeFields: function(){
            var j, oCell, oTable, oRows;
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i=0; i<oTables.length; i++){
                oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
                oRows = oTable.getItems();
                oTable.removeItem(oRows[oRows.length-1]);
                for (j = 0; j < oRows.length; j++) {
                        if (oRows[0].getCells().length>=8){
                            oRows[j].removeCell(7);
                            oRows[j].removeCell(6);
                            oRows[j].removeCell(5);
                        }
                        oRows[j].addCell(new sap.m.Text({text:"{linea>qli}"}));
                        oRows[j].addCell(new sap.m.Text({text:"{linea>cart}"}));
                        oRows[j].addCell(new sap.m.Text({text:"{linea>ore}"}));

                }


                }            
        },
// VIENE LANCIATO QUANDO CAMBIO UN VALORE DI INPUT PER MODIFICARE GLI ALTRI DUE        
        ChangeValues: function(oEvent){
            var oValueChanged = oEvent.getParameter("value");
            var oCellChanged = oEvent.getSource();
            var oRow = oEvent.getSource().getParent();
            if (oCellChanged === oRow.getCells()[5]){
                oRow.getCells()[6].setValue(oValueChanged * 2);
                oRow.getCells()[7].setValue(this.minutesToStandard(oValueChanged*12));
            }
            if (oCellChanged === oRow.getCells()[6]){
                oRow.getCells()[5].setValue(oValueChanged / 2);
                oRow.getCells()[7].setValue(this.minutesToStandard(oValueChanged*6));
            }
            if (oCellChanged === oRow.getCells()[7]){
                oRow.getCells()[5].setValue(this.standardToMinutes(oValueChanged)/12);
                oRow.getCells()[6].setValue(this.standardToMinutes(oValueChanged)/6);
            } 
            
        },
// AGGIUNGO UNA RIGA QUANDO PREMO SU AGGIUNGI RIGA
        onAddItem: function(oEvent){            
        oEvent.getSource().getParent().getParent().removeItem(oEvent.getSource().getParent());
        var oModel = this.getView().getModel("linea");
        var oData = oModel.getData();
        var oLinea_path = oEvent.getSource().getBindingContext("linea").getPath().split("/");
        var Prodotti = oData[oLinea_path[1]][oLinea_path[2]].ProductCollection;
        var Prodotto = {seq: "", formato: "", tipo: "", materiale: "", confezionamento: "", button: "0", qli: "", cart:"", ore:"", disp: "", prod: "", fermo: "", Formati: oData[oLinea_path[1]][oLinea_path[2]].ProductCollection[0].Formati};
        Prodotti.push(Prodotto);
        oModel.setData(oData);
        this.getView().byId("managePianoTable").setModel(oModel, "linea");
        this.addFieldsCreazione();
        },
        minutesToStandard: function (val) {
                        var hours = Math.floor(val / 60);
                        val -= hours * 60;
                        var mins = val;
                        var string_hours, string_mins;
                        string_hours = this.stringTime(hours);
                        string_mins = this.stringTime(mins);
                        return (string_hours + ":" + string_mins );
                    },
        
        stringTime: function (val) {
                        if (val < 10) {
                            return  ('0' + String(val));
                        } else {
                            return  String(val);
                        }
                    },
        standardToMinutes: function (string){
            return parseInt(string.split(":")[1], 10) + parseInt(string.split(":")[0], 10) * 60;
        }

    });

    return ManagePiano;

});