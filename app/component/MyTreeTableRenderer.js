/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2016 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

//Provides default renderer for control sap.ui.table.MyTreeTable
sap.ui.define(['jquery.sap.global', 'sap/ui/core/Renderer', 'sap/ui/table/TableRenderer'],
	function(jQuery, Renderer, TableRenderer) {
	"use strict";


	/**
	 * MyTreeTable renderer.
	 * @namespace
	 */
	var MyTreeTableRenderer = Renderer.extend(TableRenderer);


	MyTreeTableRenderer.renderTableCellControl = function(rm, oTable, oCell, iCellIndex) {
		if (oTable.isTreeBinding("rows") && iCellIndex === 0 && !oTable.getUseGroupMode()) {
			var oRow = oCell.getParent();
			rm.write("<span");
			rm.addClass("sapUiTableTreeIcon");
			rm.addClass(oCell.getParent()._sTreeIconClass);
			rm.writeClasses();
			var aLevelIndentCSS = oTable._getLevelIndentCSS(oRow);
			if (aLevelIndentCSS) {
				rm.addStyle.apply(rm, aLevelIndentCSS);
				rm.writeStyles();
			}
			rm.writeAttribute("tabindex", -1);
			oTable._getAccRenderExtension().writeAriaAttributesFor(rm, oTable, "TREEICON", {row: oRow});
			rm.write(">&nbsp;</span>");
		}
		rm.renderControl(oCell);
	};


	return MyTreeTableRenderer;

}, /* bExport= */ true);
