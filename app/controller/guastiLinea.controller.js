sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("myapp.controller.guastiLinea", {
            onInit: function(){
                var oModel = new JSONModel();
                $.ajax({
                   type: "GET",
                   url: "model/guasti_linee.json",
                   dataType: "json",
                   success: function(oData){
                       oModel.setData(oData);
                     }
                   });
                
                

            }          
        
            

 


    });
});

