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
//            var oModel_formati = new JSONModel();
            $.ajax({
                type: "GET",
                url: "model/linee_new.json",
                dataType: "json",
                success: function (oData) {
                    that.oModel.setData(oData);
                    that.addFieldsCreazione();
//                    oModel_formati(oData.Formati);
                }
            });            
            this.getView().setModel(this.oModel, 'linea');            
//            this.getView().setModel(oModel_formati, 'formati');
            
            
            // set explored app's demo model on this sample
//            this.oModel = new JSONModel("./model/linee_new.json");
            this.oModel3 = new JSONModel("./model/operators.json");

            
            this.getView().setModel(this.oModel3, 'operatore');
            //this.getView().setModel(oModel2,"prodotto");

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePiano").attachPatternMatched(this._onObjectMatched, this);

        },
        onBeforeRendering: function (oEvent) {
        },

        _onObjectMatched: function (oEvent) {
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            var oModelTurni = this.getOwnerComponent().getModel("turni");
//            var oTable = this.getView().byId("managePianoTable");
            if (!oModelTurni) {
                this.buildNewModel();
            } else {
                var oTitle = this.getView().byId("Title");
                var oSubtitle = this.getView().byId("Subtitle");
                this.piano = oModelTurni.getData()[this.turnoPath][this.pianoPath];
                oTitle.setText(this.piano.data + "    ---    " + this.piano.turno);
                oTitle.addStyleClass("customTextTitle");
                if (parseInt(this.piano.area, 10) === -1 || parseInt(this.piano.area, 10) === 2) {
                    this.removeBar();
                    if (parseInt(this.piano.area, 10) === -1) {
                        oSubtitle.setText("Turno in creazione");
//                        this.addFieldsCreazione();
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
// MODIFICA DELLA VIEW DELLA CREAZIONE TURNO
        addFieldsCreazione: function () {
            var j, oCell, oTable, oRows;
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i=0; i<oTables.length; i++){
                oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
                oRows = oTable.getItems();
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
                if (oRows[0].getCells().length < 8) {
                        this.addCellInput(oRows);
                } else {
                    for (j = 0; j < oRows.length; j++) {
                            oCell = oRows[j].removeCell(7);
                            oCell = oRows[j].removeCell(6);
                            oCell = oRows[j].removeCell(5);
                    }
                    this.addCellInput(oRows);
                    }

                }
        },
        addCellInput: function (oRows) {
            var oInput;
            for (var j=0; j<oRows.length; j++){
            oInput = new sap.m.Input({
                value: "{linea>qli}",
                width: "4rem",
                type: "Number",
                liveChange: this.ChangeValues.bind(this)
            });
            oRows[j].addCell(oInput);
            oInput = new sap.m.Input({
                value: "{linea>cart}",
                width: "4rem",
                type: "Number",
                liveChange: this.ChangeValues.bind(this)
            });
//            oInput.addStyleClass("sapUiSmallMarginTop");
            oRows[j].addCell(oInput);
            oInput = new sap.m.TimePicker({
                value: "{linea>ore}",
                valueFormat:"HH:mm",
                width: "7rem",
//                placeholder:"HH:mm",
                displayFormat:"HH:mm",
                change: this.ChangeValues.bind(this)

            });
            oRows[j].addCell(oInput);
            }
        },
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
//        var oModel = this.getView().getModel("linea");
//        var oData = oModel.getData();
//        var oLinea_path = oEvent.getSource().getBindingContext("linea").getPath().split("/");
//        var Prodotto = oData[oLinea_path[1]][oLinea_path[2]].ProductCollection[0]; 
//        var oModel2 = new JSONModel();
//        oModel2.setData(Prodotto);
//        this.getView().setModel(oModel2, "prodotto");
//        
//            var oTable = oEvent.getSource().getParent().getParent();
//            var oCell_0 = new CustomButt({
//                                text:"", 
//                                customType:"batch",
//                                state:"0",
//                                press:this.handlePressOpenMenu.bind(this)              
//            });
//            var oCell_1 = new sap.m.Text({
//                text: ""
//            });
//            oCell_1.addStyleClass("sapUiSmallMarginTop");
//            var oCell_2 = new sap.m.Select({});
//            var oItemSelectTemplate = new sap.ui.core.Item({
//                          key:"{prodotto>formato} {prodotto>materiale}",
//                          text: "{prodotto>formato} {prodotto>materiale}"
//                      });
//            oCell_2.bindAggregation("items", "prodotto>/Formati", oItemSelectTemplate);                      
//            oCell_2.setModel(this.getView().getModel("linea"));
//            var oCell_3 = new sap.m.Select({});
//            var oCell_4 = new CustomButt({
//                text:"",
//                customType: "confezionamento",
//                state: "0" 
//            });
//            var oCell_5 = new sap.m.Input({
//                width: "4rem",
//                value: "",
//                type: "Number",
//                liveChange: this.ChangeValues.bind(this)
//            });
//            var oCell_6 = new sap.m.Input({
//                width: "4rem",
//                value: "",
//                type: "Number",
//                liveChange: this.ChangeValues.bind(this)
//            });
//            var oCell_7 = new sap.m.TimePicker({
//                value: "",
//                valueFormat:"HH:mm",
//                width: "7rem",
//                displayFormat:"HH:mm",
//                change: this.ChangeValues.bind(this)
//
//            });            
//            var oListItem = new sap.m.ColumnListItem({
//                cells: [
//                    oCell_0,
//                    oCell_1,
//                    oCell_2,
//                    oCell_3,
//                    oCell_4,
//                    oCell_5,
//                    oCell_6,
//                    oCell_7
//                ]});
//            oTable.insertItem(oListItem, oTable.getItems().length-1);
        oEvent.getSource().getParent().getParent().removeItem(oEvent.getSource().getParent());
        var oModel = this.getView().getModel("linea");
        var oData = oModel.getData();
        var oLinea_path = oEvent.getSource().getBindingContext("linea").getPath().split("/");
        var Prodotti = oData[oLinea_path[1]][oLinea_path[2]].ProductCollection;
//        var Prodotto = oData[oLinea_path[1]][oLinea_path[2]].ProductCollection[0];
        var Prodotto = {seq: "", formato: "", tipo: "", materiale: "", confezionamento: "", button: "0", qli: "", cart:"", ore:"", disp: "", prod: "", fermo: "", Formati: oData[oLinea_path[1]][oLinea_path[2]].ProductCollection[0].Formati};
        Prodotti.push(Prodotto);
        oModel.setData(oData);
        this.getView().byId("managePianoTable").setModel(oModel, "linea");
//        var oButton = new sap.m.Button({
//                        icon: "sap-icon://add",
//                        press: this.onAddItem.bind(this)
//
//        });
//        oButton.addStyleClass("sapUiTinyMarginBegin");
//        this.getView().byId("managePianoTable").getItems()[oLinea_path[2]].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0].addItem(new sap.m.ColumnListItem({
//                cells: [
//                        oButton
//                        ]
//                    }));
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