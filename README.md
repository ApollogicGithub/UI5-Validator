# UI5 Validator
UI5 Validator created by Apollogic

## Description
Validation library for basic SAP UI5 user input controls.

List of supported controls: 
 - sap.m.Input
 - sap.m.DatePicker
 - sap.m.ComboBox
 - sap.m.TextArea
 - sap.m.DateRangeSelection
 - sap.m.DateTimePicker
 - sap.m.MaskInput
 - sap.m.TimePicker
 - sap.m.MultiComboBox
 - sap.m.MultiInput
 - sap.m.StepInput
 - sap.m.RadioButtonGroup - only with custom data
 - sap.m.CheckBox - only with custom data

## Installation
npm i @apollogic/ui5-validator --save-dev

## Sample use
To see simplified UI5 example online, visit https://jsfiddle.net/t97e8xfd/1/

To download sample UI5 application, visit https://github.com/ApollogicGithub/UI5-Validator-Sample-App

## Usage
1. Import validator in UI5 controller:

sap.ui.define([
    '@apollogic/ui5-validator'
],
    function (Validator) {
        "use strict";
    });

2. Validate

Validator.validate(oView, customControlNames) - validate all controls in specified view/part of the view. Optionally add custom control names if needed

Validator.validateControl(oControl) - check single control

## Supported UI5 versions
 - 1.121
 - 1.120
 - 1.117
 - 1.114
 - 1.108
 - 1.96
 - 1.84
 - 1.71



