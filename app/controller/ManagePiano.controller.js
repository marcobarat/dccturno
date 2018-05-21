sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (MessageToast, jQuery, Controller, JSONModel) {
    "use strict";

    var ManagePiano = Controller.extend("myapp.controller.ManagePiano", {

        oModel: null,
        oModel3: null,
        prova: null,
        piano: null,
        pianoPath: null,
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
            var oPage = this.getView().byId("managePiano");
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            var num_confez = parseInt(oEvent.getParameter("arguments").pianoPath, 10);
            var oModelTurni = this.getOwnerComponent().getModel("turni");
            var that = this;
            if (!oModelTurni){
                    $.ajax({
                        type: "GET",
                        url: "model/pianidiconf.json",
                        dataType: "json",
                        success: function(oData){
                            that.piano = oData.pianidiconfezionamento[num_confez];
                            oPage.setTitle(that.piano.data + "    ---    " + that.piano.turno);  
                            if (parseInt(that.piano.area, 10) === -1 || parseInt(that.piano.area, 10)=== 2){
                                that.removeBar();
                            } else {
                                that.showBar();
                            }                            
                        }
                    });
                } else {
                    this.piano = oModelTurni.getData().pianidiconfezionamento[num_confez];
                    oPage.setTitle(this.piano.data + "    ---    " + this.piano.turno);
                    if (parseInt(this.piano.area, 10) === -1 || parseInt(this.piano.area, 10)=== 2){
                        this.removeBar();
                        } else {
                        this.showBar();
                        }
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
        }

    });

    return ManagePiano;

});