sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("myapp.controller.ManagePianoGrey", {
        oColumn: null,
        oModel: null,
        oContent: null,
        oVBox: null, 
        
        onInit: function () {
            this.oModel = new JSONModel("./model/linee.json");
            this.getView().setModel(this.oModel, 'linea');
        },
        
        onCausalizzazioneFermi: function(){
            this.getOwnerComponent().openCausalizzazioneFermo();
        },


        onReport: function() {
             this.getView().byId("reportButton").setVisible(true);
             this.getView().byId("confermaButton").setVisible(true);
             if (!this.oColumn){
                var oItems = this.getView().byId("ManagePianoTable").getAggregation("items");
                for (var i=0; i<oItems.length; i++) {
                    var oTable = oItems[i].getAggregation("cells")[0].getAggregation("items")[1].getAggregation("items")[0].getAggregation("items")[0];
                    var oLinea = oItems[i].getAggregation("cells")[0].getAggregation("items")[0].getAggregation("items")[1];
                    this.oContent = new sap.m.TextArea({value:"{linea>disp}", editable:false, growing:true, rows:1, cols:3, textAlign:"Center"});
                    oLinea.addItem(this.oContent);
                    this.oContent = new sap.m.TextArea({value:"{linea>prod}", editable:false, growing:true, rows:1, cols:3, textAlign:"Center"});
                    oLinea.addItem(this.oContent);
                    this.oContent = new sap.m.Button({text:"{linea>fermo}", press:this.onCausalizzazioneFermi.bind(this)});
                    oLinea.addItem(this.oContent);
                    this.oColumn = new sap.m.Column({
                        styleClass: "sapUiSmallMarginBegin",
                        header: new sap.m.Label({text: "Disp"}),
                        hAlign: "Center"});
                    oTable.addColumn(this.oColumn);
                    this.oColumn = new sap.m.Column({
                        header: new sap.m.Label({text: "Prod"}),
                        hAlign: "Center"});
                    oTable.addColumn(this.oColumn);
                    this.oColumn = new sap.m.Column({
                        styleClass: "sapUiMediumMarginBegin",
                        header: new sap.m.Label({text: ""}),
                        hAlign: "Center"});
                    oTable.addColumn(this.oColumn);
                    var oColumnListItems = oTable.getAggregation("items");
                    for (var j=0; j<oColumnListItems.length; j++) {
                        oColumnListItems[j].addCell(new sap.m.Text({text:"{linea>disp}"}));
                        oColumnListItems[j].addCell(new sap.m.Text({text:"{linea>prod}"}));
                        oColumnListItems[j].addCell(new sap.m.Text({text:"{linea>fermo}"}));
                        
                    }
                    
                }
                
             }
         }
             
//             var aColumnData = [{
//                 columnId: "prova1"
//             },{
//                 columnId: "prova2"
//             },{
//                 columnId: "prova3"
//             }];
//             var aData = [{
//                 prova1: "ciao",
//                 prova2: "ciao",
//                 prova3: "ciaone"
//                 
//             }];
//             var oTable = new sap.m.Table({});
//             var oModel = new JSONModel();
//             oModel.setData({columns: aColumnData,
//                             rows: aData});


//        }

    });


});


