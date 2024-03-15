const supportedControlsNames = [
  "sap.m.Input",
  "sap.m.DatePicker",
  "sap.m.ComboBox",
  "sap.m.TextArea",
  "sap.m.DateRangeSelection", 
  "sap.m.DateTimePicker",
  "sap.m.MaskInput",
  "sap.m.TimePicker",
  "sap.m.MultiComboBox", 
  "sap.m.MultiInput", 
  "sap.m.StepInput",
  "sap.m.RadioButtonGroup", // sap.m.RadioButtonGroup doesn't have property 'required' - as a workaround use custom data (see README)
  "sap.m.CheckBox", // sap.m.CheckBox doesn't have property 'required' - as a workaround use custom data (see README)
];

/**
 * @typedef {Object} validationError information about validation error
 * @property {string} id id of control that has validation error
 * @property {bindingInformation[]} bindings list of binding informations for control
 */

/**
 * @typedef {Object} bindingInformation information about binding
 * @property {string} name name of property bound
 * @property {string} modelName name of model
 * @property {string} bindingPath binding path of property
 */

/**
 *
 * @param {sap.ui.core.Control} view View, part of view, container or a control needs to be validated along with all its children
 * @param {string[]} customControlNames array of names of custom controls that needs to be treated as validatable
 * @returns {validationError[]} returns array of validationError object
 */
const validate = (view, customControlNames = []) => {
  const validatableControls = _getValidatableControls(view, customControlNames);
  const validationErrors = [];

  validatableControls.forEach((control) => {
    const validationError = validateControl(control);
    if (validationError) {
      validationErrors.push(validationError);
    }
  });

  return validationErrors;
};

/**
 *
 * @param {sap.ui.core.Control} control control that needs to be validate
 * @returns {validationError | undefined} returns validationError object or undefined if control is valid or not required
 */
const validateControl = (control) => {
  const valid = _isValid(control);
  const valueState = valid ? "None" : "Error";

  if (!_isRequired(control)) {
    return;
  }

  control.setValueState(valueState);

  _handleChangeEvents(control);

  if (valid) {
    return;
  }

  return _getValidationError(control);
};

/**
 * 
 * @param {sap.ui.core.Control} control control that needs to be checked if it's valid
 * @param {sap.ui.base.Event | undefined} event optional event object for handling removed getTokens on tokenUpdate
 * @returns {boolean} returns true/false if valid/not valid
 */
const _isValid = (control, event) => {
  const value = control.getValue?.();
  const selected = control.getSelected?.();
  const selectedKeys = control.getSelectedKeys?.();
  const selectedIndex = control.getSelectedIndex?.();
  const removedTokens = event?.getParameter("removedTokens") || [];
  const tokens = control.getTokens?.().filter(token => !removedTokens.includes(token));
  const min = control.getMin?.();
  const max = control.getMax?.();
  const isValueValid = (!(typeof value === 'number') && value) || (typeof value === 'number' && _isValueInRange(value, min, max));
  return isValueValid || selected || tokens?.length > 0 || selectedKeys?.length > 0 || (selectedIndex !== undefined && selectedIndex !== -1);
}

/**
 * 
 * @param {float} value value that needs to be checked
 * @param {float | undefined} min min value or undefined 
 * @param {float | undefined} max max value or undefined
 * @returns {boolean} returns true if value in range or no range defined, returns false if value not in range
 */
const _isValueInRange = (value, min, max) => {
  let inRange = true;

  if(min !== undefined) {
    inRange = value >= min;
  }

  if(max !== undefined) {
    inRange = inRange && value <= max;
  }

  return inRange;
}

/**
 * 
 * @param {sap.ui.core.Control} control control that needs to be checked if it's required
 * @returns  {boolean} returns true/false if required/not required
 */
const _isRequired = (control) => {
  const required = control.getRequired?.();
  const customDataRequired = Boolean(control.data("required"));
  return required || customDataRequired;
}

/**
 * 
 * @param {sap.ui.core.Control} control control that needs validation on change
 */
const _handleChangeEvents = (control) => {
  const eventRegistry = control?.mEventRegistry;

  const checkEventRegistry = eventHandler => eventHandler?.fFunction === _changeEvent;

  if (!eventRegistry.liveChange?.some(checkEventRegistry)) {
    control.attachLiveChange?.(_changeEvent);
  } 
  if (!eventRegistry.change?.some(checkEventRegistry)) {
    control.attachChange?.(_changeEvent);
  } 
  if (!eventRegistry.select?.some(checkEventRegistry)) {
    control.attachSelect?.(_changeEvent);
  }
  if (!eventRegistry.selectionChange?.some(checkEventRegistry)) {
    control.attachSelectionChange?.(_changeEvent);
  }
  if(!eventRegistry.tokenUpdate?.some(checkEventRegistry)) {
    control.attachTokenUpdate?.(_changeEvent);
  }
};

/**
 * 
 * @param {sap.ui.base.Event} event event object
 */
const _changeEvent = (event) => {
  const control = event.getSource();
  const valid = _isValid(control, event);
  control.setValueState(valid ? "None" : "Error");
}

/**
 *
 * @param {sap.ui.core.Control} control control to get validation error from
 * @returns {validationError} returns validationError object
 */
const _getValidationError = (control) => {
  const id = control?.getId();
  const bindingInfo = control.getBindingInfo("value");
  const bindingInfoParts = bindingInfo?.parts;

  const validationError = {
    id: id,
    bindings: [],
  };

  if (bindingInfo) {
    validationError.bindings.push(
      ...bindingInfoParts.map((bindingInfoPart) => {
        const bindingContext = control.getBindingContext(bindingInfoPart.model);
        let bindingPath = bindingContext ? bindingContext.sPath + "/" : "";
        bindingPath += bindingInfoPart.path;
        return {
          name: bindingPath.slice(bindingPath.lastIndexOf("/") + 1),
          modelName: bindingInfoPart.model,
          bindingPath: bindingPath,
        };
      })
    );
  }

  return validationError;
};

/**
 *
 * @param {sap.ui.core.Control} object UI5 Controls that needs to be checked with all his children for validatable controls
 * @param {string[]} customControlNames array of names of custom controls that needs to be treated as validatable
 * @returns {sap.ui.core.Control[]} array of controls that are validatable
 */
const _getValidatableControls = (object, customControlNames) => {
  const controls = [];
  const objectAggregations = object?.mAggregations || {};
  const aggregationsKeys = Object.keys(objectAggregations);
  const flattenedAggregations = [];

  aggregationsKeys.forEach((key) => {
    const currentAggregation = objectAggregations[key];
    flattenedAggregations.push(
      ...(Array.isArray(currentAggregation)
        ? currentAggregation
        : currentAggregation
        ? [currentAggregation]
        : [])
    );
  });

  flattenedAggregations.forEach((aggregation) => {
    if (
      aggregation.getMetadata &&
      (supportedControlsNames.indexOf(aggregation.getMetadata().getName()) >=
        0 ||
        customControlNames.indexOf(aggregation.getMetadata().getName()) >= 0)
    ) {
      controls.push(aggregation);
    } else {
      controls.push(..._getValidatableControls(aggregation, customControlNames));
    }
  });

  return controls;
};

export { validate, validateControl };
