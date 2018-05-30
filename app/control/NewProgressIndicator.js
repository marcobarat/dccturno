sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/ProgressIndicator"],
        function (Control, ProgressIndicator) {
            "use strict";

            return ProgressIndicator.extend("myapp.control.NewProgressIndicator", {
                metadata: {

                    properties: {
                        barColor: {type: "string", defaultValue: "orange"}
                    }
                },
                renderer: {},

                onAfterRendering: function () {
                    var barColor = this.getBarColor();
                    
                    switch (barColor){
                        case "orange":
                            if (this.getPercentValue() === 0){
                                jQuery.sap.byId(this.getId()).addClass("progressBarButtonEmpty");
                            } else {
                                jQuery.sap.byId(this.getId()).addClass("progressBarButtonOrange");
                            }
                            break;
                    }
                }
            
            
            });
            });


