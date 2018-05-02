sap.ui.define([
    'sap/ui/base/ManagedObject'
], function(ManagedObject){
    "use strict";
    return ManagedObject.extend("myapp.controller.CausalizzazioneFermo", {
        constructor: function(oView){
            this._oView = oView;
        },
        
        exit: function(){
            delete this._oView;
        },
        
        open: function(){
            var oView = this._oView;
            var oDialog = oView.byId("CausalizzazioneFermo");
            
            if (!oDialog){
                var oFragmentController = {
                    onCloseDialog: function(){
                        oDialog.close();
                    }
                };
                oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.CausalizzazioneFermo", oFragmentController);
                oView.addDependent(oDialog);
            }
            oDialog.open();
        }
        
    });
});


