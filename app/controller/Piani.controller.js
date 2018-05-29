sap.ui.define([
    'jquery.sap.global',
    './Formatter',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (jQuery, Formatter, Controller, JSONModel) {
    "use strict";

    var PianiController = Controller.extend("myapp.controller.Piani", {
        data_json: {},
        onInit: function () {
            var params = jQuery.sap.getUriParameters(window.location.href);
            this.buildNewModel();
        },
        managePiano: function (oEvent) {
           var oTable = oEvent.getSource().getParent().getBindingContext("turni");
           var  Row = oTable.getModel().getProperty(oTable.sPath);
           var area = Row.area;
           var paths = oEvent.getSource().getBindingContext("turni").getPath().substr(1).split("/");
           var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
           if (area==="0") {
               oRouter.navTo("managePianoGrey", {turnoPath: paths[0], pianoPath: paths[1]});
            } else {
               oRouter.navTo("managePiano", {turnoPath: paths[0], pianoPath: paths[1]});
            }
        },
        GoToHome: function() {
            this.getOwnerComponent().getRouter().navTo("Main");
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
        },
        buildNewModel: function(){
            var oModel = new JSONModel();
            var that = this;
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
                            
                        }
            });            
            this.getOwnerComponent().setModel(oModel, "turni");
        },
        onCloseApp: function(){
            window.close();
        }

    });

    return PianiController;

});