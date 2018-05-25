sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History'
], function (MessageToast, jQuery, Controller, JSONModel, History) {
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
            // set explored app's demo model on this sample
            this.oModel = new JSONModel("./model/linee_new.json");
            this.oModel3 = new JSONModel("./model/operators.json");

            this.getView().setModel(this.oModel, 'linea');
            this.getView().setModel(this.oModel3, 'operatore');
            //this.getView().setModel(oModel2,"prodotto");
            
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePiano").attachPatternMatched(this._onObjectMatched, this);

        },
        
        _onObjectMatched: function(oEvent){
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            var oModelTurni = this.getOwnerComponent().getModel("turni");
            if (!oModelTurni){
                    this.buildNewModel();
                } else {
                    var oTitle = this.getView().byId("Title");
                    var oSubtitle = this.getView().byId("Subtitle");
                    this.piano = oModelTurni.getData()[this.turnoPath][this.pianoPath];
                    oTitle.setText(this.piano.data + "    ---    " + this.piano.turno);
                    oTitle.addStyleClass("customTextTitle");
                    if (parseInt(this.piano.area, 10) === -1 || parseInt(this.piano.area, 10)=== 2){
                        this.removeBar();
                        if (parseInt(this.piano.area, 10) === -1){
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
	},
        
        removeBar: function(){
            var oItems = this.getView().byId("managePianoTable").getItems();
            for (var i in oItems){
                var oHBox = oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0];
                var ProgressIndicator = oHBox.getItems()[0].getItems()[0];
                ProgressIndicator.setShowValue(false);
                var oButton = oHBox.getItems()[1].getItems()[0];
                oButton.setVisible(false);
                ProgressIndicator.getParent().setWidth("100%");
                
            }
        },
        showBar: function(){
            var oItems = this.getView().byId("managePianoTable").getItems();
            for (var i in oItems){
                var oHBox = oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0];
                var ProgressIndicator = oHBox.getItems()[0].getItems()[0];
                var oButton = oHBox.getItems()[1].getItems()[0];
                oButton.setVisible(true);
                ProgressIndicator.setShowValue(true);
                ProgressIndicator.getParent().setWidth("97%");
                
            }
        },

        onAfterRendering: function () {
                        
            

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
        onMenu: function(){
            
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("tmp");
        },
        buildNewModel: function(){
            var oModel = new JSONModel();
            var that = this;
            var oTitle = this.getView().byId("Title");
            var oSubtitle = this.getView().byId("Subtitle");
            $.ajax({
                        type: "GET",
                        url: "model/pianidiconf.json",
                        dataType: "json",
                        success: function(oData){
                            that.data_json.turniconclusi = [];
                            that.data_json.turnoincorso = [];
                            that.data_json.turniprogrammati = [];
                            that.data_json.turnodacreare = [];
                            that.groupTurni(oData, "turniconclusi", "turnoincorso", "turniprogrammati", "turnodacreare");
                            oModel.setData(that.data_json);
                            that.piano = that.data_json[that.turnoPath][that.pianoPath];
                            oTitle.setText(that.piano.data + "    ---    " + that.piano.turno);  
                            oTitle.addStyleClass("customTextTitle");


                            if (parseInt(that.piano.area, 10) === -1 || parseInt(that.piano.area, 10)=== 2){
                                that.removeBar();
                                if (parseInt(that.piano.area, 10) === -1){
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
                        }
            });            
            this.getOwnerComponent().setModel(oModel, "turni");
        },
        groupTurni: function(data, group0, group1, group2, group3) {
            for (var key in data){
                if (typeof data[key] === "object"){
                    this.groupTurni(data[key], group0, group1, group2, group3);
                } 
            }
            if (data.area){
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
        }        

    });

    return ManagePiano;

});