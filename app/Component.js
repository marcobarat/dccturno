sap.ui.define([
    'sap/ui/core/UIComponent', 
    './utils/ResConfigManager',
    './controller/CausalizzazioneFermo'
], function(UIComponent, ResConfigManager, CausalizzazioneFermo) {
    "use strict";
    return UIComponent.extend("myapp.Component", {

        metadata: {
            manifest: "json"
        },

        localeManager: new ResConfigManager(),

        init: function() {

            UIComponent.prototype.init.apply(this, arguments);

            //var logLevel = jQuery.sap.log.Level.INFO;
            //jQuery.sap.log.setLevel(logLevel);
            //initialize resources

            // Parse the current url and display the targets of the route that matches the hash
            this.getRouter().initialize();
            this._CausalizzazioneFermo = new CausalizzazioneFermo(this.getAggregation("rootControl"));
        },
        
        exit: function(){
            this._CausalizzazioneFermo.destroy();
            delete this._CausalizzazioneFermo;
        },
        
        openCausalizzazioneFermo: function(){
            this._CausalizzazioneFermo.open();
        },
        
        closeCausalizzazioneFermo: function(){
            this._CausalizzazioneFermo.close();
        }

    });
}, /* bExport= */ true);