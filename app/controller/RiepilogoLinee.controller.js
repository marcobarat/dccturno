sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
    "use strict";

    return Controller.extend("myapp.controller.RiepilogoLinee", {
        ModelLinee: new JSONModel(),
        onInit: function () {
            var that = this; 
            Library.AjaxCallerData("model/linee_riepilogo.json", function(Jdata){that.ModelLinee.setData(Jdata);});
            this.getView().setModel(this.ModelLinee, "linee"); 
        }





    });
});


