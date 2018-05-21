sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/ProgressIndicator"],
        function (Control, ProgressIndicator) {
            "use strict";

            return ProgressIndicator.extend("myapp.control.NewProgressIndicator", {
                metadata: {

                    properties: {
                        NewPercentValue: {type: "string", defaultValue: "0%"}
                    }
                },
                renderer: {},

                onAfterRendering: function () {
                    var percent_value = parseInt(this.getNewPercentValue().split("%")[0], 10);
                    this.setPercentValue(percent_value);
                    
                    if (percent_value < 35){
                        this.setState("Error");
                    }
                    if (percent_value >= 35 && percent_value <70){
                        this.setState("Warning");
                    }
                    if (percent_value >= 70){
                        this.setState("Success");
                    }
                }
            
            
            });
            });


