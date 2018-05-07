sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/TreeTableFormatter'
], function (Controller, JSONModel, TreeTableFormatter) {
    "use strict";

    return Controller.extend("myapp.controller.Report", {
            formatter: TreeTableFormatter,
            onInit: function(){
                var oModel = new JSONModel();
                var that = this;
                $.ajax({
                   type: "GET",
                   url: "model/OEE.json",
                   dataType: "json",
                   success: function(oData){
                       oModel.setData(oData);
                       that.RecursivePropertyAdder(oModel.getData().ReportOEE.Confezionamenti[0], "hierarchy", 0);
                     }
                });
                
                this.getView().setModel(oModel, "ReportOEE");
//                this.RecursivePropertyAdder(oModel.getData(), "hierarchy", 0);

            },
            RecursivePropertyAdder: function(bck, prop_name, i){
            for (var key in bck) {
                if (typeof bck[key] === "object") {
                    if (typeof bck.length === "undefined"){
                            bck[key] = this.RecursivePropertyAdder(bck[key], prop_name, i+1);
                    } else {
                            bck[key] = this.RecursivePropertyAdder(bck[key], prop_name, i);
                    }
                } 
            }
            if (typeof bck.length === "undefined"){
                bck[prop_name] = i;
            }
            return bck;
                
            }

 


    });
});


